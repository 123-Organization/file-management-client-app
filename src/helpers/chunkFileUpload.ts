import axios from "axios";

export const backendUrl = process.env.BASE_URL;
const IMAGE_PROCESSOR_BASE_URL = "https://lightsail.image.processor.finerworks.com/api";
//In main file 

//in my code startUpload was called by another file with useImperativeHandle(ref, () => ({
  let fileName = 'fileName.jpg';
  let fileType = 'jpg';

export const startUpload = async (data:any) => {
   
    // setFileName(fileName)

    const params = {
      fileName,
      fileType,
      "librarySessionId": "81de5dba-0300-4988-a1cb-df97dfa4e3721",
      "libraryAccountKey": "kqdzaai2xyzppcxuhgsjorv21",
      "librarySiteId": "2",
      
    }

    if (fileName.length > 1) {
            const resp = await axios.get(`${backendUrl}/start-upload`, { params })
            const { uploadId } = resp.data
            // setuploadId(uploadId)
    } else {
            // setSubmitSuccess(99)
    }
}
const progressArray = [];
export const uploadProgressHandler = async (progressEvent:string, blob:string, index:number) => {
  //@ts-ignore
  if (progressEvent.loaded >= progressEvent.total) return

  const currentProgress = Math.round(
  //@ts-ignore
    (progressEvent.loaded * 100) / progressEvent.total
  )
  // setProgressArray(progressArray => {
          // progressArray[index - 1] = currentProgress
          // const sum = progressArray.reduce((acc, curr) => acc + curr)
          // setUploadProgress(Math.round(sum / CHUNKS_COUNT))

          // return progressArray
  // })
  // console.log(progressArray)
}
export const uploadMultipartFile = async (
  fileSelected:any,uploadId:string,basecampProjectID:string,
  progressEvent:string,blob:Blob,index:number,
) => {
try {
    const fileSize = fileSelected.size
    const CHUNK_SIZE = 10000000 // 10MB
    const CHUNKS_COUNT = Math.floor(fileSize / CHUNK_SIZE) + 1
    const promisesArray = []
    let start
    let end
    let blob
    for (let index = 1; index < CHUNKS_COUNT + 1; index++) {
            start = (index - 1) * CHUNK_SIZE
            end = index * CHUNK_SIZE
            blob = index < CHUNKS_COUNT ? fileSelected.slice(start, end) : fileSelected.slice(start)

            // Get presigned URL for each part
            const getUploadUrlResp = await axios.get(`${backendUrl}/get-upload-url`, {
                    params: {
                            fileName,
                            partNumber: index,
                            uploadId,
                            Tagging: `basecamp_project_id=${basecampProjectID}`,
                    },
            })

  

            const { presignedUrl } = getUploadUrlResp.data
            console.log(`Presigned URL ${index}: ${presignedUrl} filetype ${fileSelected.type}`)

            // Send part to aws server
            const uploadResp = axios.put(presignedUrl, blob, {
                    //@ts-ignore
                    onUploadProgress: e => uploadProgressHandler(e, CHUNKS_COUNT, index),
                    headers: {
                            'Content-Type': fileSelected.type,
                    },
            })
            promisesArray.push(uploadResp)
    }

    const resolvedArray = await Promise.all(promisesArray)
    console.log(resolvedArray, ' resolvedArray')

    const uploadPartsArray:any = []
    resolvedArray.forEach((resolvedPromise, index) => {
            uploadPartsArray.push({
                    ETag: resolvedPromise.headers.etag,
                    PartNumber: index + 1,
            })
    })

    // CompleteMultipartUpload in the backend server - use new image processor URL  
    // Note: This is used for legacy chunked uploads, new uploads use fileUploader.ts
    const completeUploadResp = await axios.post(`${IMAGE_PROCESSOR_BASE_URL}/complete-upload`, {
            params: {
                    fileName,
                    parts: uploadPartsArray,
                    uploadId,
            },
    })
    // setUploadProgress(100)
    // setUploadSuccess(1)
    // // setSubmitSuccess(2)
    // setSubmitStatus(oldArray => [...oldArray, fileattach])
    // put a delay in here for 2 seconds
    // also clear down uploadProgress
    console.log(completeUploadResp.data, 'upload response complete ')
  } catch (err) {
      console.log(err)

  }
}  