import { PDFPageInfo } from './pdfProcessor';
import PDFUploaderAPI, { PDFUploadResponse } from './pdfUploader';

export class PDFFileUploader {
  private chunkSize: number = 1024 * 1024 * 100; // 100 MB
  private threadsQuantity: number = 20;
  private aborted: boolean = false;
  private onProgressFn: (progress: { percentage: number; currentPage: number; totalPages: number }) => void = () => {};
  private onErrorFn: (error: any) => void = () => {};
  private onSuccessFn: (result: any) => void = () => {};

  constructor() {
    // Constructor can be extended with options if needed
  }

  async uploadPDFPages(pages: PDFPageInfo[]): Promise<void> {
    try {
      console.log(`Starting upload of ${pages.length} PDF pages`);

      // Step 1: Start upload for all pages
      const uploadResponseData = await PDFUploaderAPI.startUploadPDF(pages);
      
      // Extract the uploads array from the response
      const uploadResponses = uploadResponseData.uploads || uploadResponseData;
      
      console.log(`Start upload response: ${uploadResponses.length} uploads for ${pages.length} pages`);
      
      if (uploadResponses.length !== pages.length) {
        throw new Error(`Mismatch between pages (${pages.length}) and upload responses (${uploadResponses.length})`);
      }

      // Step 2: Build ALL URL requests for ALL pages and parts in one batch
      const allUrlRequests = [];
      const pagePartMap = new Map(); // Track which requests belong to which page/part
      
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        const uploadResponse = uploadResponses[pageIndex];
        const file = new File([page.imageBlob], page.fileName, { type: 'application/pdf' });
        const numberOfParts = Math.ceil(file.size / this.chunkSize);
        
        for (let partNumber = 1; partNumber <= numberOfParts; partNumber++) {
          const requestKey = `page${pageIndex}_part${partNumber}`;
          
          allUrlRequests.push({
            uploadId: uploadResponse.uploadId,
            name: uploadResponse.Key || `Keyewe${String(pageIndex + 1).padStart(6, '0')}`,
            fileName: uploadResponse.fileName,
            partNumber: partNumber,
            Tagging: `basecamp_project_id%${page.basecampProjectID}`,
            fileLibrary: page.fileLibrary,
            libraryAccountKey: page.libraryAccountKey
          });
          
          pagePartMap.set(requestKey, {
            pageIndex,
            partNumber,
            uploadResponse,
            page,
            file
          });
        }
      }

      // Step 3: Get ALL presigned URLs in one batch call
      console.log(`Getting ${allUrlRequests.length} presigned URLs in batch`);
      const allUrlResponses = await PDFUploaderAPI.getUploadUrlPDF(allUrlRequests);
      console.log(`Received ${allUrlResponses.length} presigned URLs`);

      // Step 4: Upload all files using the presigned URLs
      console.log(`📤 Starting upload of ${pages.length} PDF pages...`);
      
      const uploadPromises = pages.map(async (page, pageIndex) => {
        // Debug: Verify what we're uploading for each page
        const pageBytes = await page.imageBlob.slice(0, 10).arrayBuffer();
        const pageHeader = new TextDecoder().decode(pageBytes);
        const isRealPdf = pageHeader.startsWith('%PDF-');
        
        console.log(`📤 Uploading page ${page.pageNumber}/${page.totalPages}: ${page.fileName}`);
        console.log(`   📊 Size: ${page.imageBlob.size} bytes`);
        console.log(`   📋 Type: ${page.imageBlob.type}`);
        console.log(`   ✅ Real PDF: ${isRealPdf ? 'YES' : 'NO'} (header: ${pageHeader.substring(0, 5)})`);
        
        if (!isRealPdf) {
          console.error(`❌ ALERT: Uploading non-PDF data for page ${page.pageNumber}!`);
        }
        
        return this.uploadSinglePageWithUrls(page, uploadResponses[pageIndex], pageIndex, pages.length, allUrlResponses, pagePartMap);
      });

      await Promise.allSettled(uploadPromises);
      
      // Ensure final progress reaches 100%
      this.onProgressFn({
        percentage: 100,
        currentPage: pages.length,
        totalPages: pages.length
      });
      
      console.log('All PDF pages upload completed');
      this.onSuccessFn({
        totalPages: pages.length,
        message: 'PDF upload completed successfully'
      });

    } catch (error) {
      console.error('PDF upload failed:', error);
      this.onErrorFn(error);
    }
  }

  private async uploadSinglePageWithUrls(
    page: PDFPageInfo, 
    uploadResponse: PDFUploadResponse, 
    pageIndex: number, 
    totalPages: number,
    allUrlResponses: any[],
    pagePartMap: Map<string, any>
  ): Promise<void> {
    try {
      const currentPage = pageIndex + 1;
      console.log(`Uploading page ${currentPage}/${totalPages}: ${page.fileName}`);

      // Convert blob to file for chunking
      const file = new File([page.imageBlob], page.fileName, { type: 'image/png' });
      const fileSize = file.size;
      const numberOfParts = Math.ceil(fileSize / this.chunkSize);

      console.log(`Page ${currentPage} - File size: ${fileSize}, Parts: ${numberOfParts}`);

      // Upload all chunks using pre-fetched URLs
      const uploadParts: Array<{ ETag: string; PartNumber: number }> = [];
      
      for (let partNumber = 1; partNumber <= numberOfParts; partNumber++) {
        const start = (partNumber - 1) * this.chunkSize;
        const end = Math.min(start + this.chunkSize, fileSize);
        const chunk = file.slice(start, end);

        // Find the matching URL response for this specific page and part
        const urlResponse = allUrlResponses.find(resp => 
          resp.uploadId === uploadResponse.uploadId
        );

        if (!urlResponse) {
          throw new Error(`No presigned URL found for page ${currentPage} part ${partNumber}`);
        }

        // Upload the chunk
        const uploadResult = await this.uploadChunk(
          chunk, 
          urlResponse.presignedUrl, 
          partNumber,
          currentPage,
          totalPages,
          partNumber / numberOfParts
        );

        uploadParts.push({
          ETag: uploadResult.etag,
          PartNumber: partNumber
        });
      }

      // Complete the upload
      await PDFUploaderAPI.completeUploadPDF({
        uploadId: uploadResponse.uploadId,
        fileName: uploadResponse.fileName,
        parts: uploadParts,
        Key: uploadResponse.Key,
        fileLibrary: page.fileLibrary,
        libraryAccountKey: page.libraryAccountKey,
        fileSize: fileSize,
        userInfo: page.userInfo
      });

      console.log(`Page ${currentPage} upload completed successfully`);

    } catch (error) {
      console.error(`Failed to upload page ${pageIndex + 1}:`, error);
      throw error;
    }
  }

  private uploadChunk(
    chunk: Blob, 
    presignedUrl: string, 
    partNumber: number,
    currentPage: number,
    totalPages: number,
    partProgress: number
  ): Promise<{ etag: string }> {
    return new Promise((resolve, reject) => {
      if (this.aborted) {
        reject(new Error('Upload aborted'));
        return;
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const chunkProgress = (event.loaded / event.total) * partProgress;
          const overallProgress = ((currentPage - 1) / totalPages) + (chunkProgress / totalPages);
          
          this.onProgressFn({
            percentage: Math.round(overallProgress * 100),
            currentPage: currentPage,
            totalPages: totalPages
          });
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error(`Failed to upload chunk ${partNumber} for page ${currentPage}`));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const etag = xhr.getResponseHeader('ETag');
            if (etag) {
              resolve({ etag: etag.replace(/"/g, '') });
            } else {
              reject(new Error('No ETag received'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', 'application/pdf');
      xhr.send(chunk);
    });
  }

  onProgress(callback: (progress: { percentage: number; currentPage: number; totalPages: number }) => void) {
    this.onProgressFn = callback;
    return this;
  }

  onError(callback: (error: any) => void) {
    this.onErrorFn = callback;
    return this;
  }

  onSuccess(callback: (result: any) => void) {
    this.onSuccessFn = callback;
    return this;
  }

  abort() {
    this.aborted = true;
  }
}
