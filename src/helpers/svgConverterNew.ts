import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
   * Convert SVG file to PDF using jsPDF (more reliable)
   */
  async convertToPDF(file: File): Promise<SVGConversionResult> {
    try {
      console.log('🎨 Converting SVG to PDF using jsPDF:', file.name);
      console.log(`📏 Original file size: ${(file.size / 1024).toFixed(2)} KB`);
      
      // Read SVG content
      const svgContent = await this.readFileAsText(file);
      console.log(`📝 SVG content length: ${svgContent.length} characters`);
      
      // Parse SVG dimensions
      const dimensions = this.parseSVGDimensions(svgContent);
      console.log(`📐 Parsed dimensions: ${dimensions.width} x ${dimensions.height} points`);
      
      // Try Method 1: Direct SVG rendering to canvas and then PDF
      try {
        const result = await this.convertSvgViaDOMAndCanvas(svgContent, dimensions, file.name, file.size);
        console.log('✅ Successfully converted SVG to PDF using DOM + Canvas method');
        console.log(`📦 Output file size: ${(result.convertedSize / 1024).toFixed(2)} KB`);
        
        // Test PDF validity
        await this.testPdfValidity(result.pdfBlob);
        
        return result;
      } catch (domError) {
        console.warn('⚠️ DOM+Canvas method failed, trying image-based method:', domError);
        
        try {
          // Fallback Method 2: Convert SVG to image first, then to PDF
          const result = await this.convertSvgViaImageToCanvas(svgContent, dimensions, file.name, file.size);
          console.log('✅ Successfully converted SVG to PDF using Image + Canvas method');
          console.log(`📦 Output file size: ${(result.convertedSize / 1024).toFixed(2)} KB`);
          
          // Test PDF validity
          await this.testPdfValidity(result.pdfBlob);
          
          return result;
        } catch (imageError) {
          console.warn('⚠️ Image+Canvas method failed, trying direct PDF creation:', imageError);
          
          // Fallback Method 3: Create simple PDF with SVG info
          const result = await this.convertSvgToSimplePdf(svgContent, dimensions, file.name, file.size);
          console.log('✅ Successfully created PDF with SVG information');
          console.log(`📦 Output file size: ${(result.convertedSize / 1024).toFixed(2)} KB`);
          
          // Test PDF validity
          await this.testPdfValidity(result.pdfBlob);
          
          return result;
        }
      }
      
    } catch (error) {
      console.error('❌ SVG to PDF conversion error:', error);
      throw new Error(`Failed to convert SVG to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Method 1: Convert SVG via DOM rendering and html2canvas
   */
  private async convertSvgViaDOMAndCanvas(
    svgContent: string, 
    dimensions: { width: number; height: number }, 
    originalFileName: string,
    originalSize: number
  ): Promise<SVGConversionResult> {
    
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = `${dimensions.width}px`;
    container.style.height = `${dimensions.height}px`;
    container.style.backgroundColor = 'white';
    
    // Add SVG to container
    container.innerHTML = svgContent;
    document.body.appendChild(container);
    
    try {
      // Use html2canvas to render the container
      const canvas = await html2canvas(container, {
        width: dimensions.width,
        height: dimensions.height,
        scale: 2, // High resolution
        backgroundColor: 'white',
        useCORS: true,
        allowTaint: true
      });
      
      // Create PDF with jsPDF
      const pdf = new jsPDF({
        orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [dimensions.width, dimensions.height]
      });
      
      // Get image data from canvas
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, dimensions.width, dimensions.height);
      
      // Generate PDF blob
      const pdfBytes = pdf.output('arraybuffer');
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Generate filename
      const baseName = originalFileName.replace(/\.svg$/i, '');
      const pdfFileName = `${baseName}.pdf`;
      
      return {
        pdfBlob,
        fileName: pdfFileName,
        originalSize,
        convertedSize: pdfBlob.size
      };
      
    } finally {
      // Cleanup
      document.body.removeChild(container);
    }
  }

  /**
   * Method 2: Convert SVG via Image element and canvas
   */
  private async convertSvgViaImageToCanvas(
    svgContent: string, 
    dimensions: { width: number; height: number }, 
    originalFileName: string,
    originalSize: number
  ): Promise<SVGConversionResult> {
    
    return new Promise((resolve, reject) => {
      // Create canvas
      const canvas = document.createElement('canvas');
      const scale = 2; // High resolution
      canvas.width = dimensions.width * scale;
      canvas.height = dimensions.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create image from SVG
      const img = new Image();
      
      img.onload = () => {
        try {
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Create PDF with jsPDF
          const pdf = new jsPDF({
            orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [dimensions.width, dimensions.height]
          });
          
          // Get image data from canvas
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          
          // Add image to PDF
          pdf.addImage(imgData, 'JPEG', 0, 0, dimensions.width, dimensions.height);
          
          // Generate PDF blob
          const pdfBytes = pdf.output('arraybuffer');
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          
          // Generate filename
          const baseName = originalFileName.replace(/\.svg$/i, '');
          const pdfFileName = `${baseName}.pdf`;
          
          resolve({
            pdfBlob,
            fileName: pdfFileName,
            originalSize,
            convertedSize: pdfBlob.size
          });
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load SVG as image'));
      };
      
      // Convert SVG to data URL (try both blob URL and data URL)
      let url: string | null = null;
      try {
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
        url = URL.createObjectURL(svgBlob);
        img.src = url;
      } catch (blobError) {
        // Fallback to data URL
        const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgContent);
        img.src = dataUrl;
      }
      
      // Cleanup after 10 seconds
      setTimeout(() => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      }, 10000);
    });
  }

  /**
   * Method 3: Create a simple PDF with SVG information (ultimate fallback)
   */
  private async convertSvgToSimplePdf(
    svgContent: string, 
    dimensions: { width: number; height: number }, 
    originalFileName: string,
    originalSize: number
  ): Promise<SVGConversionResult> {
    
    // Create PDF with jsPDF
    const pdf = new jsPDF({
      orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [dimensions.width, dimensions.height]
    });
    
    // Set up the page
    pdf.setFillColor(255, 255, 255); // White background
    pdf.rect(0, 0, dimensions.width, dimensions.height, 'F');
    
    // Add title
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.text('SVG File Converted to PDF', dimensions.width / 2, 40, { align: 'center' });
    
    // Add file info
    pdf.setFontSize(16);
    pdf.text(`Original file: ${originalFileName}`, 20, 80);
    pdf.text(`File size: ${(originalSize / 1024).toFixed(2)} KB`, 20, 110);
    pdf.text(`Dimensions: ${dimensions.width} x ${dimensions.height} points`, 20, 140);
    pdf.text(`Content length: ${svgContent.length} characters`, 20, 170);
    
    // Add a note
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const noteText = 'Note: This is a simplified PDF representation of the SVG file.';
    pdf.text(noteText, 20, 220);
    
    // Add border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(2);
    pdf.rect(10, 10, dimensions.width - 20, dimensions.height - 20, 'S');
    
    // Try to extract some SVG info for display
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const elements = svgDoc.querySelectorAll('rect, circle, ellipse, line, path, polygon, text');
      
      if (elements.length > 0) {
        pdf.text(`Contains ${elements.length} SVG elements`, 20, 250);
        
        // List first few elements
        let yPos = 280;
        for (let i = 0; i < Math.min(5, elements.length); i++) {
          const element = elements[i];
          const tagName = element.tagName;
          pdf.text(`- ${tagName} element`, 30, yPos);
          yPos += 20;
        }
        
        if (elements.length > 5) {
          pdf.text(`... and ${elements.length - 5} more elements`, 30, yPos);
        }
      }
    } catch (parseError) {
      console.warn('Could not parse SVG for element info:', parseError);
    }
    
    // Generate PDF blob
    const pdfBytes = pdf.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Generate filename
    const baseName = originalFileName.replace(/\.svg$/i, '');
    const pdfFileName = `${baseName}_info.pdf`;
    
    return {
      pdfBlob,
      fileName: pdfFileName,
      originalSize,
      convertedSize: pdfBlob.size
    };
  }

  /**
   * Read file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse SVG dimensions from content
   */
  private parseSVGDimensions(svgContent: string): { width: number; height: number } {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    if (!svgElement) {
      return { width: 800, height: 600 }; // Default size
    }
    
    // Try to get width and height attributes
    let width = 800;
    let height = 600;
    
    const widthAttr = svgElement.getAttribute('width');
    const heightAttr = svgElement.getAttribute('height');
    
    if (widthAttr && heightAttr) {
      width = this.parseUnit(widthAttr);
      height = this.parseUnit(heightAttr);
    } else {
      // Try viewBox
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/\s+/);
        if (parts.length >= 4) {
          width = parseFloat(parts[2]) || 800;
          height = parseFloat(parts[3]) || 600;
        }
      }
    }
    
    return { width, height };
  }

  /**
   * Parse unit values (px, pt, mm, cm, in, %)
   */
  private parseUnit(value: string): number {
    if (!value) return 0;
    
    const numMatch = value.match(/^([0-9.]+)/);
    if (!numMatch) return 0;
    
    const num = parseFloat(numMatch[1]);
    const unit = value.replace(/^[0-9.]+/, '').toLowerCase();
    
    switch (unit) {
      case 'px': return num;
      case 'pt': return num * 1.333; // 1 pt = 1.333 px
      case 'mm': return num * 3.779; // 1 mm = 3.779 px
      case 'cm': return num * 37.79; // 1 cm = 37.79 px
      case 'in': return num * 96; // 1 in = 96 px
      case '%': return num * 8; // Assume 800px as 100%
      default: return num;
    }
  }

  /**
   * Test PDF validity by checking PDF headers and structure
   */
  private async testPdfValidity(pdfBlob: Blob): Promise<void> {
    try {
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Check PDF header
      const headerBytes = uint8Array.slice(0, 8);
      let header = '';
      for (let i = 0; i < headerBytes.length; i++) {
        header += String.fromCharCode(headerBytes[i]);
      }
      if (!header.startsWith('%PDF-')) {
        throw new Error('Invalid PDF header');
      }
      
      // Check for PDF trailer (check last 1024 bytes for performance)
      const tailStart = Math.max(0, uint8Array.length - 1024);
      const tailBytes = uint8Array.slice(tailStart);
      let content = '';
      for (let i = 0; i < tailBytes.length; i++) {
        content += String.fromCharCode(tailBytes[i]);
      }
      if (!content.includes('%%EOF')) {
        throw new Error('Invalid PDF structure: missing EOF marker');
      }
      
      console.log('🔍 PDF Validation Results:');
      console.log(`   ✅ Valid PDF header: ${header.substring(0, 8)}`);
      console.log(`   ✅ Valid PDF structure: EOF marker found`);
      console.log(`   📊 PDF size: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`);
      
      // Optional: Create download link for manual inspection
      this.createDownloadLink(pdfBlob, 'converted-svg-jspdf.pdf');
      
    } catch (error) {
      console.error('❌ PDF validation failed:', error);
      throw new Error('Generated PDF is invalid');
    }
  }

  /**
   * Create a download link for manual PDF inspection (development/testing only)
   */
  private createDownloadLink(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      console.log('💾 Download link created for manual inspection:');
      console.log(`   📁 File: ${filename}`);
      console.log(`   🔗 Click to download:`, link);
      console.log('   💡 To test: Right-click in console above and "Store as global variable", then run: temp1.click()');
      
      // Auto-cleanup after 30 seconds
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 30000);
      
    } catch (error) {
      console.warn('Could not create download link:', error);
    }
  }
}

// Helper function to check if file is SVG (exported for compatibility)
export const isSvgFile = (file: File): boolean => {
  return SVGConverter.isSvgFile(file);
};
