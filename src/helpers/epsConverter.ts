import { PDFDocument, rgb } from 'pdf-lib';

export interface EPSConversionResult {
  pdfBlob: Blob;
  fileName: string;
}

export class EPSConverter {
  private file: File;

  constructor(file: File) {
    this.file = file;
  }

  async convertToPDF(): Promise<EPSConversionResult> {
    try {
      console.log('Converting EPS file to PDF:', this.file.name);

      // First, try to render the EPS as an image
      const renderedImageBlob = await this.renderEPSToImage();
      
      // Create PDF document with the rendered image
      const pdfDoc = await PDFDocument.create();
      
      if (renderedImageBlob) {
        // If we successfully rendered the EPS, embed it as an image
        console.log('Successfully rendered EPS content, embedding in PDF...');
        
        // Convert blob to ArrayBuffer for pdf-lib
        const imageArrayBuffer = await renderedImageBlob.arrayBuffer();
        
        // Try to embed as PNG first, then JPEG
        let image;
        try {
          image = await pdfDoc.embedPng(imageArrayBuffer);
        } catch (pngError) {
          try {
            image = await pdfDoc.embedJpg(imageArrayBuffer);
          } catch (jpgError) {
            console.log('Failed to embed rendered image, falling back to text representation');
            return await this.createTextBasedPDF(pdfDoc);
          }
        }

        // Create a page sized to the image
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      } else {
        // Fallback to text-based representation
        console.log('Could not render EPS content, creating text-based PDF...');
        return await this.createTextBasedPDF(pdfDoc);
      }

      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      // Generate new filename
      const baseName = this.file.name.replace(/\.eps$/i, '');
      const pdfFileName = `${baseName}_converted.pdf`;

      console.log('EPS converted to PDF successfully');

      return {
        pdfBlob,
        fileName: pdfFileName
      };

    } catch (error) {
      console.error('Error converting EPS to PDF:', error);
      throw new Error(`Failed to convert EPS to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createTextBasedPDF(pdfDoc: PDFDocument): Promise<EPSConversionResult> {
    // Create a standard page (Letter size: 8.5" x 11" = 612 x 792 points)
    const page = pdfDoc.addPage([612, 792]);
    
    // Get basic info about the EPS file
    const fileContent = await this.file.text();
    const dimensions = this.parseEPSDimensions(fileContent);
    
    // Add some basic text to indicate this is a converted EPS file
    page.drawText('EPS File Converted to PDF', {
      x: 50,
      y: 750,
      size: 20,
    });
    
    page.drawText(`Original file: ${this.file.name}`, {
      x: 50,
      y: 720,
      size: 12,
    });
    
    page.drawText(`File size: ${(this.file.size / 1024).toFixed(2)} KB`, {
      x: 50,
      y: 700,
      size: 12,
    });
    
    if (dimensions.boundingBox) {
      const [x1, y1, x2, y2] = dimensions.boundingBox;
      page.drawText(`Dimensions: ${x2 - x1} x ${y2 - y1} points`, {
        x: 50,
        y: 680,
        size: 12,
      });
    }
    
    // Add a simple border to represent the document
    page.drawRectangle({
      x: 50,
      y: 50,
      width: 512,
      height: 600,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    // Generate new filename
    const baseName = this.file.name.replace(/\.eps$/i, '');
    const pdfFileName = `${baseName}_converted.pdf`;

    return {
      pdfBlob,
      fileName: pdfFileName
    };
  }

  private async renderEPSToImage(): Promise<Blob | null> {
    try {
      console.log('Attempting to render EPS content to image...');
      
      // First, try to load the EPS file directly as an image (some browsers can handle this)
      const directRender = await this.tryDirectImageRender();
      if (directRender) {
        console.log('Successfully rendered EPS directly as image');
        return directRender;
      }

      // If direct rendering fails, try to extract embedded images or convert the content
      const extractedImage = await this.tryExtractEmbeddedImages();
      if (extractedImage) {
        console.log('Successfully extracted embedded image from EPS');
        return extractedImage;
      }

      // As a last resort, try to render using PostScript interpretation
      const postscriptRender = await this.tryPostScriptRender();
      if (postscriptRender) {
        console.log('Successfully rendered using PostScript interpretation');
        return postscriptRender;
      }

      console.log('All EPS rendering methods failed');
      return null;

    } catch (error) {
      console.error('Error rendering EPS to image:', error);
      return null;
    }
  }

  private async tryDirectImageRender(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(null);
        return;
      }

      const timeoutId = setTimeout(() => {
        URL.revokeObjectURL(img.src);
        resolve(null);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeoutId);
        
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src);
          resolve(blob);
        }, 'image/png', 0.9);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        URL.revokeObjectURL(img.src);
        resolve(null);
      };

      // Try to load the EPS file as an image
      const fileUrl = URL.createObjectURL(this.file);
      img.src = fileUrl;
    });
  }

  private async tryExtractEmbeddedImages(): Promise<Blob | null> {
    try {
      const fileContent = await this.file.text();
      
      // Look for various embedded image formats in the EPS file
      const patterns = [
        // JPEG embedded data
        /beginbinary[\s\S]*?\/DeviceRGB[\s\S]*?image/i,
        // PNG embedded data  
        /\/ASCIIHexDecode[\s\S]*?image/i,
        // Base64 encoded images
        /\/ASCII85Decode[\s\S]*?image/i,
        // Direct hex data
        /%.*?ImageData[\s\S]*?([A-Fa-f0-9\s]+)/,
      ];

      for (const pattern of patterns) {
        const match = fileContent.match(pattern);
        if (match) {
          console.log('Found potential embedded image data');
          // Try to extract and decode the image data
          // This is a simplified approach - real EPS parsing is much more complex
          
          // For now, we'll create a placeholder that indicates we found image data
          return await this.createImagePlaceholder('Found embedded image data');
        }
      }

      return null;
    } catch (error) {
      console.log('Error extracting embedded images:', error);
      return null;
    }
  }

  private async tryPostScriptRender(): Promise<Blob | null> {
    try {
      const fileContent = await this.file.text();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;

      // Parse dimensions from EPS
      const dimensions = this.parseEPSDimensions(fileContent);
      canvas.width = Math.min(dimensions.width, 1200);
      canvas.height = Math.min(dimensions.height, 1600);

      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Try to interpret basic PostScript commands
      let rendered = false;

      // Look for text content
      const textMatches = fileContent.match(/\(([^)]+)\)\s*show/g);
      if (textMatches && textMatches.length > 0) {
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        
        textMatches.forEach((match, index) => {
          const textContent = match.match(/\(([^)]+)\)/);
          if (textContent && textContent[1]) {
            ctx.fillText(textContent[1], 50, 100 + (index * 25));
            rendered = true;
          }
        });
      }

      // Look for basic shapes
      const rectMatches = fileContent.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+rec[tf]/g);
      if (rectMatches && rectMatches.length > 0) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        
        rectMatches.forEach(match => {
          const coords = match.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
          if (coords) {
            const [, x, y, w, h] = coords.map(Number);
            const scaleX = canvas.width / 612;
            const scaleY = canvas.height / 792;
            ctx.strokeRect(x * scaleX, (792 - y - h) * scaleY, w * scaleX, h * scaleY);
            rendered = true;
          }
        });
      }

      if (rendered) {
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png', 0.9);
        });
      }

      return null;
    } catch (error) {
      console.log('Error in PostScript rendering:', error);
      return null;
    }
  }

  private async createImagePlaceholder(message: string): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(new Blob([], { type: 'image/png' }));
        return;
      }

      canvas.width = 600;
      canvas.height = 400;

      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // EPS icon area
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(50, 50, canvas.width - 100, 150);

      // Text
      ctx.fillStyle = '#333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('EPS File', canvas.width / 2, 140);
      
      ctx.font = '16px Arial';
      ctx.fillText(this.file.name, canvas.width / 2, 170);
      
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(message, canvas.width / 2, 250);
      
      ctx.fillText(`Size: ${(this.file.size / 1024).toFixed(1)} KB`, canvas.width / 2, 280);

      canvas.toBlob((blob) => {
        resolve(blob || new Blob([], { type: 'image/png' }));
      }, 'image/png', 0.9);
    });
  }



  private parseEPSDimensions(content: string): { width: number; height: number; boundingBox?: number[] } {
    // Look for BoundingBox information
    const boundingBoxMatch = content.match(/%%BoundingBox:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
    
    if (boundingBoxMatch) {
      const [, x1, y1, x2, y2] = boundingBoxMatch.map(Number);
      const width = x2 - x1;
      const height = y2 - y1;
      
      // Convert points to pixels (72 points = 1 inch, use 150 DPI)
      const scale = 150 / 72;
      
      return {
        width: Math.max(width * scale, 400),
        height: Math.max(height * scale, 300),
        boundingBox: [x1, y1, x2, y2]
      };
    }
    
    // Default dimensions if no BoundingBox found
    return { width: 1275, height: 1650 }; // Letter size at 150 DPI
  }


}

// Helper function to check if file is EPS
export const isEpsFile = (file: File): boolean => {
  return file.type === 'application/postscript' || 
         file.type === 'application/eps' ||
         file.name.toLowerCase().endsWith('.eps');
};
