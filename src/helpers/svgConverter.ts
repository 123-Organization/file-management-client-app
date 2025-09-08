import { PDFDocument, rgb } from 'pdf-lib';

export interface SVGConversionResult {
  pdfBlob: Blob;
  fileName: string;
  originalSize: number;
  convertedSize: number;
}

export class SVGConverter {
  
  /**
   * Check if file is SVG
   */
  static isSvgFile(file: File): boolean {
    return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  }

  /**
   * Convert SVG file to PDF
   */
  async convertToPDF(file: File): Promise<SVGConversionResult> {
    try {
      console.log('Converting SVG to PDF:', file.name);
      
      // Read SVG content
      const svgContent = await this.readFileAsText(file);
      
      // Parse SVG dimensions
      const dimensions = this.parseSVGDimensions(svgContent);
      
      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Add a page with SVG dimensions
      const page = pdfDoc.addPage([dimensions.width, dimensions.height]);
      
      // Convert SVG to image and embed in PDF
      const imageBlob = await this.svgToImageBlob(svgContent, dimensions);
      const imageArrayBuffer = await imageBlob.arrayBuffer();
      
      // Embed image in PDF
      let image;
      try {
        // Try PNG first
        image = await pdfDoc.embedPng(imageArrayBuffer);
      } catch (pngError) {
        try {
          // Fallback to JPEG
          image = await pdfDoc.embedJpg(imageArrayBuffer);
        } catch (jpgError) {
          throw new Error('Failed to embed converted image in PDF');
        }
      }
      
      // Draw image on page
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
      });
      
      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Generate filename
      const baseName = file.name.replace(/\.svg$/i, '');
      const pdfFileName = `${baseName}.pdf`;
      
      return {
        pdfBlob,
        fileName: pdfFileName,
        originalSize: file.size,
        convertedSize: pdfBlob.size
      };
      
    } catch (error) {
      console.error('SVG to PDF conversion error:', error);
      throw new Error(`Failed to convert SVG to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read SVG file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse SVG dimensions
   */
  private parseSVGDimensions(svgContent: string): { width: number; height: number } {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    let width = 595; // A4 width in points (default)
    let height = 842; // A4 height in points (default)
    
    try {
      // Try to get width and height attributes
      const widthAttr = svgElement.getAttribute('width');
      const heightAttr = svgElement.getAttribute('height');
      
      if (widthAttr && heightAttr) {
        width = this.parseLength(widthAttr);
        height = this.parseLength(heightAttr);
      } else {
        // Try to get from viewBox
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
          const values = viewBox.split(/\s+|,/).map(v => parseFloat(v));
          if (values.length >= 4) {
            width = values[2];
            height = values[3];
          }
        }
      }
      
      // Ensure reasonable dimensions (convert very small values)
      if (width < 100) width *= 3.78; // Convert mm to points
      if (height < 100) height *= 3.78;
      
      // Ensure maximum reasonable size
      if (width > 2000) width = 595;
      if (height > 2000) height = 842;
      
    } catch (error) {
      console.warn('Could not parse SVG dimensions, using defaults');
    }
    
    return { width, height };
  }

  /**
   * Parse length values (handles px, pt, mm, cm, in, etc.)
   */
  private parseLength(length: string): number {
    const match = length.match(/^([\d.]+)(.*)$/);
    if (!match) return 100;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'px': return value * 0.75; // 96 DPI to 72 DPI
      case 'pt': return value;
      case 'mm': return value * 2.83465;
      case 'cm': return value * 28.3465;
      case 'in': return value * 72;
      case 'em': return value * 12;
      case '%': return value;
      default: return value;
    }
  }

  /**
   * Convert SVG to image blob using canvas
   */
  private svgToImageBlob(svgContent: string, dimensions: { width: number; height: number }): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Set canvas size (use higher resolution for better quality)
      const scale = 2;
      canvas.width = dimensions.width * scale;
      canvas.height = dimensions.height * scale;
      
      // Scale context for high resolution
      ctx.scale(scale, scale);
      
      // Create image from SVG
      const img = new Image();
      
      img.onload = () => {
        try {
          // Fill with white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
          
          // Draw SVG image
          ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                URL.revokeObjectURL(url); // Cleanup URL
                resolve(blob);
              } else {
                URL.revokeObjectURL(url); // Cleanup URL
                reject(new Error('Failed to create image blob'));
              }
            },
            'image/png',
            1.0
          );
        } catch (error) {
          URL.revokeObjectURL(url); // Cleanup URL
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url); // Cleanup URL
        reject(new Error('Failed to load SVG as image'));
      };
      
      // Create data URL from SVG
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    });
  }
}

// Helper function for external use
export const isSvgFile = (file: File): boolean => {
  return SVGConverter.isSvgFile(file);
};
