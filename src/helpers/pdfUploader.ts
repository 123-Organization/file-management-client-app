import axios from "axios";
import { PDFPageInfo } from './pdfProcessor';
import config from "../config/configs";

// PDF-specific API endpoints
const PDF_API_BASE_URL = "https://lightsail.image.processor.finerworks.com/api";

export interface PDFUploadRequest {
  fileName: string;
  fileType: string;
  basecampProjectID: string;
  fileLibrary: string;
  libraryAccountKey: string;
}

export interface PDFUploadResponse {
  uploadId: string;
  Key?: string;
  fileName: string;
  basecampProjectID?: string;
}

export interface PDFStartUploadResponse {
  uploads: PDFUploadResponse[];
}

export interface PDFUploadUrlRequest {
  uploadId: string;
  name: string;
  fileName: string;
  partNumber: number;
  Tagging: string;
  fileLibrary: string;
  libraryAccountKey: string;
}

export interface PDFUploadUrlResponse {
  uploadId: string;
  presignedUrl: string;
}

export class PDFUploaderAPI {
  
  /**
   * Start PDF upload - Send individual GET requests for each PDF page (like SVG vector upload)
   */
  static async startUploadPDF(pages: PDFPageInfo[]): Promise<PDFStartUploadResponse> {
    try {
      const requestPayload: PDFUploadRequest[] = pages.map(page => ({
        fileName: page.fileName,
        fileType: page.fileType,
        basecampProjectID: page.basecampProjectID,
        fileLibrary: page.fileLibrary,
        libraryAccountKey: page.libraryAccountKey
      }));

      console.log('PDF Upload - start-upload-pdf request:', requestPayload);

      const response = await axios.post(
        `${PDF_API_BASE_URL}/start-upload-pdf`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('PDF Upload - start-upload-pdf response:', response.data);
      return response.data;
    } catch (error) {
      console.error('PDF Upload - start-upload-pdf error:', error);
      throw new Error(`Failed to start PDF upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get upload URLs for PDF parts - Batch request
   */
  static async getUploadUrlPDF(requests: PDFUploadUrlRequest[]): Promise<PDFUploadUrlResponse[]> {
    try {
      console.log('PDF Upload - get-upload-url-pdf batch request:', requests);

      const response = await axios.post(
        `${PDF_API_BASE_URL}/get-upload-url-pdf`,
        requests,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('PDF Upload - get-upload-url-pdf response:', response.data);
      
      // The API returns { presignedUrls: [...] }
      return response.data.presignedUrls || response.data;
    } catch (error) {
      console.error('PDF Upload - get-upload-url-pdf error:', error);
      throw new Error(`Failed to get PDF upload URLs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete PDF upload
   */
  static async completeUploadPDF(uploadData: {
    uploadId: string;
    fileName: string;
    parts: Array<{ ETag: string; PartNumber: number }>;
    Key?: string;
    fileLibrary: string;
    libraryAccountKey: string;
    fileSize: number;
    userInfo: any;
  }) {
    try {
      // Create the params payload structure like SVG uploads
      const payload = {
        params: {
          uploadId: uploadData.uploadId,
          fileName: uploadData.fileName,
          parts: uploadData.parts,
          Key: uploadData.Key,
          fileLibrary: uploadData.fileLibrary,
          fileSize: uploadData.fileSize,
          userInfo: uploadData.userInfo
        }
      };

      console.log('PDF Upload - complete-upload-v2-pdf request:', payload);

      const response = await axios.post(
        `${PDF_API_BASE_URL}/complete-upload-v2-pdf`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('PDF Upload - complete-upload-v2-pdf response:', response.data);
      return response.data;
    } catch (error) {
      console.error('PDF Upload - complete-upload-v2-pdf error:', error);
      throw new Error(`Failed to complete PDF upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default PDFUploaderAPI;
