import axios from "axios"
import config  from "../config/configs";

const SERVER_BASE_URL = config.SERVER_BASE_URL;

// initializing axios
const api = axios.create({
  baseURL: SERVER_BASE_URL,
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  config.params = config.params || {};
  config.params['libraryAccountKey'] = localStorage.getItem('libraryAccountKey');
  return config;
});

// original source: https://github.com/pilovm/multithreaded-uploader/blob/master/frontend/uploader.js
export class Uploader {
  chunkSize: any
  threadsQuantity: number
  file: any
  fileName: any
  fileType: any
  userInfo: object
  aborted: boolean
  uploadedSize: number
  progressCache: any
  completeResponse: any
  activeConnections: any
  basecampProjectID:number
  fileLibrary:string
  parts: any[]
  uploadedParts: any[]
  fileId: null | string
  fileKey: null | string
  isSvg: boolean
  onProgressFn: (err: any) => void
  onErrorFn: (err: any) => void
  onSuccessFn: (err: any) => void
  constructor(options: any) {
    // this must be bigger than or equal to 5MB,
    // otherwise AWS will respond with:
    // "Your proposed upload is smaller than the minimum allowed size"
    this.chunkSize = options.chunkSize || 1024 * 1024 * 100 // 100 MB
    // number of parallel uploads
    this.threadsQuantity = Math.min(options.threadsQuantity || 20, 30)
    this.file = options.file
    this.fileName = options.fileName
    this.fileType = options.fileType
    this.userInfo = options.userInfo
    this.aborted = false
    this.uploadedSize = 0
    this.basecampProjectID = options.basecampProjectID
    this.fileLibrary = options.fileLibrary
    this.isSvg = options.isSvg || false
    this.progressCache = {}
    this.completeResponse = {}
    this.activeConnections = {}
    this.parts = []
    this.uploadedParts = []
    this.fileId = null
    this.fileKey = null
    this.onProgressFn = () => {}
    this.onErrorFn = () => {}
    this.onSuccessFn = () => {}
  }

 
  // starting the multipart upload request
  async start() {
    await this.initialize()
  }

  async initialize() {
    try {
      // adding the the file extension (if present) to fileName
      let fileName = this.fileName
      // const ext = this.file.name.split(".").pop()
      // if (ext) {
      //   fileName += `.${ext}`
      // }

      // initializing the multipart request
      const videoInitializationUploadInput: any = {
        fileName:this.fileName,
        fileType:this.fileType,
        basecampProjectID:this.basecampProjectID,
        fileLibrary:this.fileLibrary
      }

      // Add libraryAccountKey for SVG uploads (required based on backend curl example)
      if (this.isSvg) {
        // Get libraryAccountKey from localStorage (same as in api interceptor)
        const libraryAccountKey = localStorage.getItem('libraryAccountKey');
        if (libraryAccountKey) {
          videoInitializationUploadInput.libraryAccountKey = libraryAccountKey;
        }
      }
      
      // Use different endpoint for SVG files
      const uploadUrl = this.isSvg ? "/start-upload-vector-image" : "/start-upload";
      
      const initializeReponse = await api.request({
        url: uploadUrl,
        method: "GET",
        params: videoInitializationUploadInput,
      })

      const AWSFileDataOutput = initializeReponse.data

      // Debug logging for SVG uploads
      if (this.isSvg) {
        console.log('SVG Upload - start-upload-vector-image response:', AWSFileDataOutput);
        console.log('SVG Upload - endpoint used:', uploadUrl);
        console.log('SVG Upload - request params:', videoInitializationUploadInput);
      }

      // Handle different response structure for SVG files
      if (this.isSvg) {
        this.fileId = AWSFileDataOutput.svgUploadId;
        // Check if SVG response has a Key, otherwise use a default format
        this.fileKey = AWSFileDataOutput.Key || AWSFileDataOutput.key || 'Keyewe094410';
        console.log('SVG Upload - extracted fileId:', this.fileId);
        console.log('SVG Upload - extracted fileKey:', this.fileKey);
      } else {
        console.log('Regular Upload - start-upload response:', AWSFileDataOutput);
        this.fileId = AWSFileDataOutput.uploadId;
        this.fileKey = AWSFileDataOutput.Key;
        console.log('Regular Upload - extracted fileId:', this.fileId);
        console.log('Regular Upload - extracted fileKey:', this.fileKey);
      }

      const numberOfparts = Math.ceil(this.file.size / this.chunkSize)
      const newParts: any[] = [];
      for (let i = 1; i <= numberOfparts; i++) {

        // retrieving the pre-signed URLs
        const AWSMultipartFileDataInput: any = {
          uploadId: this.fileId,
          fileName,
          partNumber: i,
          Tagging: `basecamp_project_id=${this.basecampProjectID}`
        }
        
        // Add parameters based on file type
        if (this.isSvg) {
          // SVG uploads need complete payload for correct S3 bucket
          AWSMultipartFileDataInput.name = this.fileKey;
          AWSMultipartFileDataInput.fileLibrary = this.fileLibrary;
        } else {
          // Regular uploads - only add parameters if they exist
          if (this.fileKey) {
            AWSMultipartFileDataInput.name = this.fileKey;
          }
          AWSMultipartFileDataInput.fileLibrary = this.fileLibrary;
        }

        // Debug logging for both upload types
        if (this.isSvg) {
          console.log('SVG Upload - get-upload-url params:', AWSMultipartFileDataInput);
          console.log('SVG Upload - fileId:', this.fileId);
        } else {
          console.log('Regular Upload - get-upload-url params:', AWSMultipartFileDataInput);
          console.log('Regular Upload - fileId:', this.fileId);
        }

        const urlsResponse = await api.request({
          url: "/get-upload-url",
          method: "GET",
          params: AWSMultipartFileDataInput,
        })

        // Debug logging for SVG upload response
        if (this.isSvg) {
          console.log('SVG Upload - get-upload-url response:', urlsResponse.data);
        }
      

        newParts.push({
          signedUrl: urlsResponse.data.presignedUrl,
          PartNumber: i 
        })
      }
      this.parts.push(...newParts)

      console.log(`Upload - Added ${newParts.length} parts to queue. Total parts: ${this.parts.length}`);
      console.log('Upload - About to call sendNext()');
      this.sendNext()
    } catch (error) {
      await this.complete(error)
    }
  }

  sendNext() {
    const activeConnections = Object.keys(this.activeConnections).length
    console.log('sendNext() called - Parts available:', this.parts.length);
    console.log('sendNext() - Active connections:', activeConnections);
    console.log('sendNext() - Thread limit:', this.threadsQuantity);
    

    if (activeConnections >= this.threadsQuantity) {
      console.log('sendNext() - Reached thread limit, returning');
      return
    }

    if (!this.parts.length) {
      console.log('sendNext() - No parts left');
      if (!activeConnections) {
        console.log('sendNext() - No active connections, calling complete()');
        this.complete()
      }

      return
    }

    const part: any = this.parts.pop()
    console.log('sendNext() - Popped part:', part);
    
    if (this.file && part) {
      console.log('sendNext() - Processing part', part.PartNumber);
      const sentSize = (part.PartNumber - 1) * this.chunkSize
      const chunk = this.file.slice(sentSize, sentSize + this.chunkSize)
      console.log('sendNext() - Chunk size:', chunk.size);

      const sendChunkStarted = () => {
        this.sendNext()
      }

      console.log('sendNext() - Calling sendChunk()');
      this.sendChunk(chunk, part, sendChunkStarted)
        .then(() => {
          this.sendNext()
        })
        .catch((error) => {
          this.parts.push(part)

          this.complete(error)
        })
    }
  }

  // terminating the multipart upload request on success or failure
  async complete(error?: any) {
    console.log('complete() called with error:', error);
    console.log('complete() - aborted status:', this.aborted);
    
    if (error || this.aborted) {
      console.log('complete() - Error or aborted, calling onErrorFn');
      this.onErrorFn(error)
      return
    }

    console.log('complete() - No error, calling sendCompleteRequest()');
    try {
      await this.sendCompleteRequest()
    } catch (error) {
      console.log('complete() - sendCompleteRequest failed:', error);
      this.onErrorFn(error)
    }
  }

  // finalizing the multipart upload request on success by calling
  // the finalization API
  async sendCompleteRequest() {
    console.log('sendCompleteRequest() called');
    console.log('sendCompleteRequest() - uploadedParts:', this.uploadedParts);
    console.log('sendCompleteRequest() - fileId:', this.fileId);
    console.log('sendCompleteRequest() - fileKey:', this.fileKey);
    
    this.uploadedParts.sort((a, b) => parseFloat(a.PartNumber) - parseFloat(b.PartNumber));
    if (this.fileId && (this.fileKey || !this.isSvg)) {
      console.log('sendCompleteRequest() - Conditions met, proceeding with complete upload');
      const videoFinalizationMultiPartInput = {
        "params": {
          uploadId: this.fileId,
          Key: this.fileKey,
          parts: this.uploadedParts,
          fileName: this.fileName,
          userInfo: this.userInfo,
          fileSize: this.file.size,
          fileLibrary: this.fileLibrary
        }
      }
      
      if (this.aborted) {
        console.log('sendCompleteRequest aborted', videoFinalizationMultiPartInput)
        return
      }

      // Use different API endpoint for SVG files
      const apiEndpoint = this.isSvg ? "/complete-upload-v2" : "/complete-upload";
      console.log(`sendCompleteRequest() - Using API endpoint: ${apiEndpoint}`);
      console.log('sendCompleteRequest() - Calling complete-upload API with:', videoFinalizationMultiPartInput);
      
      const res = await api.request({
        url: apiEndpoint,
        method: "POST",
        data: videoFinalizationMultiPartInput,
      })

      console.log('sendCompleteRequest() - Complete upload API response:', res.data);

      this.completeResponse[this.basecampProjectID] = res;
      
      // Update the userInfo to trigger a gallery refresh
      const currentUserInfo = this.userInfo as any;
      if (currentUserInfo && typeof currentUserInfo === 'object') {
        currentUserInfo.filterUpdate = Date.now().toString();
      }

      console.log('sendCompleteRequest() - Calling onSuccessFn');
      this.onSuccessFn({
        response: res,
        userInfo: currentUserInfo
      })
    } else {
      console.log('sendCompleteRequest() - Conditions not met! fileId:', this.fileId, 'fileKey:', this.fileKey);
    }
  }

  sendChunk(chunk: any, part: any, sendChunkStarted: any) {
    console.log('sendChunk() called for part', part.PartNumber);
    return new Promise((resolve, reject) => {
      console.log('sendChunk() - Calling upload() method');
      this.upload(chunk, part, sendChunkStarted)
        .then((status) => {
          console.log('sendChunk() - Upload completed with status:', status);
          
          if (status !== 200) {
            console.log('sendChunk() - Upload failed with status:', status);
            reject(new Error("Failed chunk upload"))
            return
          }

          console.log('sendChunk() - Resolving successfully');
          resolve(1)
        })
        .catch((error) => {
          console.log('sendChunk() - Upload failed with error:', error);
          reject(error)
        })
    })
  }

  // calculating the current progress of the multipart upload request
  handleProgress(part: any, event: any) {
    if (this.file) {
      if (event.type === "progress" || event.type === "error" || event.type === "abort") {
        this.progressCache[part] = event.loaded
      }

      if (event.type === "uploaded") {
        this.uploadedSize += this.progressCache[part] || 0
        delete this.progressCache[part]
      }

      const inProgress = Object.keys(this.progressCache)
        .map(Number)
        .reduce((memo, id) => (memo += this.progressCache[id]), 0)

      const sent = Math.min(this.uploadedSize + inProgress, this.file.size)

      const total = this.file.size

      const percentage = Math.round((sent / total) * 100)

      this.onProgressFn({
        sent: sent,
        total: total,
        percentage: percentage,
      })
    }
  }

  // uploading a part through its pre-signed URL
  upload(file: any, part: any, sendChunkStarted: any) {
    // uploading each part with its pre-signed URL
    console.log('upload() called for part', part.PartNumber);
    console.log('upload() - fileId:', this.fileId);
    console.log('upload() - fileKey:', this.fileKey);
    console.log('upload() - signedUrl:', part.signedUrl);
    return new Promise((resolve, reject) => {
      if (this.fileId && (this.fileKey || !this.isSvg)) {
        console.log('upload() - Conditions met, proceeding with upload');
        // - 1 because PartNumber is an index starting from 1 and not 0
        const xhr = (this.activeConnections[part.PartNumber - 1] = new XMLHttpRequest())

        sendChunkStarted()

        const progressListener = this.handleProgress.bind(this, part.PartNumber - 1)

        xhr.upload.addEventListener("progress", progressListener)

        xhr.addEventListener("error", progressListener)
        xhr.addEventListener("abort", progressListener)
        xhr.addEventListener("loadend", progressListener)

        xhr.open("PUT", part.signedUrl)

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4 && xhr.status === 200) {
            // retrieving the ETag parameter from the HTTP headers
            const ETag = xhr.getResponseHeader("ETag")

            if (ETag) {
              const uploadedPart = {
                PartNumber: part.PartNumber,
                // removing the " enclosing carachters from
                // the raw ETag
                ETag: ETag.replaceAll('"', ""),
              }

              this.uploadedParts.push(uploadedPart)

              resolve(xhr.status)
              delete this.activeConnections[part.PartNumber - 1]
            }
          }
        }

        xhr.onerror = (error) => {
          this.aborted = true
          reject(error)
          delete this.activeConnections[part.PartNumber - 1]
          console.log('xhr.onerror', error);
        }

        xhr.onabort = () => {
          this.aborted = true
          reject(new Error("Upload canceled by user"))
          delete this.activeConnections[part.PartNumber - 1]
        }

        xhr.send(file)
      } else {
        console.log('upload() - Conditions not met! fileId:', this.fileId, 'fileKey:', this.fileKey);
        reject(new Error('Missing fileId or fileKey for upload'));
      }
    })
  }

  onSuccess(onSuccess: any) {
    this.onSuccessFn = onSuccess
    return this
  }
  
  onProgress(onProgress: any) {
    this.onProgressFn = onProgress
    return this
  }

  onError(onError: any) {
    this.onErrorFn = onError
    return this
  }

  abort() {
    this.aborted = true
    // Object.keys(this.activeConnections)
    //   .map(Number)
    //   .forEach((id) => {
    //     this.activeConnections[id].abort()
    //   })

  }
}