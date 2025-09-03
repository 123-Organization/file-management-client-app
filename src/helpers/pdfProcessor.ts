import * as pdfjsLib from 'pdfjs-dist';
import { makeUniqueFileName } from './fileHelper';

// Configure PDF.js worker with the correct ES module format
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.mjs';

export interface PDFPageInfo {
  fileName: string;
  fileType: string;
  basecampProjectID: string;
  fileLibrary: string;
  libraryAccountKey: string;
  pageNumber: number;
  totalPages: number;
  imageBlob: Blob;
  userInfo: any;
}

export class PDFProcessor {
  private file: File;
  private userInfo: any;
  private basecampProjectID: string;
  private fileLibrary: string;

  constructor(file: File, userInfo: any, basecampProjectID: string, fileLibrary: string) {
    this.file = file;
    this.userInfo = userInfo;
    this.basecampProjectID = basecampProjectID;
    this.fileLibrary = fileLibrary;
  }

  async extractPages(): Promise<PDFPageInfo[]> {
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await this.file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      
      console.log(`PDF has ${totalPages} pages`);
      
      const pages: PDFPageInfo[] = [];
      
      // Process each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const imageBlob = await this.renderPageToImage(page);
        
        // Generate unique filename for each page
        const baseFileName = this.file.name.replace('.pdf', '');
        const pageFileName = makeUniqueFileName(`${baseFileName}_page${pageNum}.pdf`);
        
        // Get libraryAccountKey from localStorage
        const libraryAccountKey = localStorage.getItem('libraryAccountKey') || '';
        
        // Generate unique basecampProjectID for each page
        const pageBasecampProjectID = (Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000) + pageNum).toString();
        
        pages.push({
          fileName: pageFileName,
          fileType: 'application/pdf',
          basecampProjectID: pageBasecampProjectID,
          fileLibrary: this.fileLibrary,
          libraryAccountKey: libraryAccountKey,
          pageNumber: pageNum,
          totalPages: totalPages,
          imageBlob: imageBlob,
          userInfo: this.userInfo
        });
      }
      
      return pages;
    } catch (error) {
      console.error('Error extracting PDF pages:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async renderPageToImage(page: any): Promise<Blob> {
    // Get page viewport
    const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 for better quality
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not create canvas context');
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png', 0.95); // High quality PNG
    });
  }
}

// Helper function to check if file is PDF
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};
