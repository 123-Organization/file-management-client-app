import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
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
  imageBlob: Blob; // PDF blob - each page as individual PDF
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
        
        // Create individual PDF for this page
        const pagePdfBlob = await this.extractPageAsPdf(page, pageNum);
        
        // Generate unique filename for each page
        const baseFileName = this.file.name.replace('.pdf', '');
        const pageFileName = makeUniqueFileName(`${baseFileName}_page${pageNum}.pdf`);
        
        // Get libraryAccountKey from localStorage
        const libraryAccountKey = localStorage.getItem('libraryAccountKey') || '';
        
        // Generate unique basecampProjectID for each page
        const pageBasecampProjectID = (Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000) + pageNum).toString();
        
        // Verify this is a real PDF by checking the header
        const pdfBytes = await pagePdfBlob.slice(0, 10).arrayBuffer();
        const pdfHeader = new TextDecoder().decode(pdfBytes);
        const isRealPdf = pdfHeader.startsWith('%PDF-');
        
        console.log(`📄 Extracted page ${pageNum} as PDF: ${pageFileName}`);
        console.log(`   📊 Size: ${pagePdfBlob.size} bytes`);
        console.log(`   📋 Type: ${pagePdfBlob.type}`);
        console.log(`   ✅ Real PDF: ${isRealPdf ? 'YES' : 'NO'} (header: ${pdfHeader.substring(0, 5)})`);
        
        if (!isRealPdf) {
          console.error(`❌ Page ${pageNum} is NOT a real PDF! Header: ${pdfHeader}`);
        }
        
        // Download each page for verification before upload
        console.log(`💾 Downloading page ${pageNum} for verification...`);
        this.downloadPdfPage(pagePdfBlob, pageFileName, pageNum);
        
        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
        
        pages.push({
          fileName: pageFileName,
          fileType: 'application/pdf',
          basecampProjectID: pageBasecampProjectID,
          fileLibrary: this.fileLibrary,
          libraryAccountKey: libraryAccountKey,
          pageNumber: pageNum,
          totalPages: totalPages,
          imageBlob: pagePdfBlob, // Individual PDF page - REAL PDF, not PNG
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

  /**
   * Extract a single page as a separate PDF file
   */
  private async extractPageAsPdf(page: any, pageNumber: number): Promise<Blob> {
    try {
      console.log(`📄 Extracting page ${pageNumber} as PDF...`);
      
      // Load the original PDF with pdf-lib
      const originalPdfBytes = await this.file.arrayBuffer();
      const originalPdf = await PDFDocument.load(originalPdfBytes);
      
      // Create a new PDF document
      const newPdf = await PDFDocument.create();
      
      // Copy the specific page to the new document
      const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNumber - 1]); // pdf-lib uses 0-based indexing
      newPdf.addPage(copiedPage);
      
      // Serialize the new PDF
      const pdfBytes = await newPdf.save();
      
      // Create a blob with the correct PDF MIME type
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      console.log(`✅ Page ${pageNumber} extracted as PDF: ${pdfBlob.size} bytes`);
      
      return pdfBlob;
      
    } catch (error) {
      console.error(`❌ Failed to extract page ${pageNumber} as PDF:`, error);
      // Fallback to PNG if PDF extraction fails
      console.log(`🔄 Falling back to PNG for page ${pageNumber}...`);
      return await this.renderPageToImage(page);
    }
  }

  /**
   * Download PDF page for testing purposes
   */
  private downloadPdfPage(pdfBlob: Blob, fileName: string, pageNumber: number): void {
    try {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      // Add to DOM and trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
      
            console.log(`💾 Downloaded PDF page ${pageNumber}: ${fileName}`);
            console.log(`   📁 Check your Downloads folder for: ${fileName}`);
            console.log(`   📊 File size: ${(pdfBlob.size / 1024).toFixed(2)} KB`);
            console.log(`   🔍 You can open this file to verify it's a real PDF before upload`);
      
    } catch (error) {
      console.error(`❌ Failed to download PDF page ${pageNumber}:`, error);
    }
  }
}

// Helper function to check if file is PDF
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};
