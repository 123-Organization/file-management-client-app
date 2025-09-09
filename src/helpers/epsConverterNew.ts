import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface EPSConversionResult {
  pdfBlob: Blob;
  fileName: string;
  originalSize: number;
  convertedSize: number;
  conversionMethod: string;
}

export class EPSConverter {
  
  /**
   * Check if file is EPS
   */
  static isEpsFile(file: File): boolean {
    return file.type === 'application/postscript' || 
           file.type === 'application/eps' ||
           file.name.toLowerCase().endsWith('.eps');
  }

  /**
   * Convert EPS file to PDF using multiple methods
   */
  async convertToPDF(file: File): Promise<EPSConversionResult> {
    try {
      console.log('🎨 Converting EPS to PDF using multiple methods:', file.name);
      console.log(`📏 Original file size: ${(file.size / 1024).toFixed(2)} KB`);
      
      // Read EPS content
      const epsContent = await this.readFileAsText(file);
      console.log(`📝 EPS content length: ${epsContent.length} characters`);
      
      // Parse EPS dimensions and info
      const epsInfo = this.parseEPSInfo(epsContent);
      console.log(`📐 Parsed EPS info:`, epsInfo);
      
      // Try Method 1: Direct image rendering (if browser supports EPS as image)
      try {
        const result = await this.convertEpsViaDirectImage(file, epsInfo, epsContent);
        console.log('✅ Successfully converted EPS to PDF using Direct Image method');
        return result;
      } catch (directError) {
        console.warn('⚠️ Direct image method failed:', directError);
        
        try {
          // Method 2: Canvas-based PostScript interpreter
          const result = await this.convertEpsViaCanvasRendering(file, epsInfo, epsContent);
          console.log('✅ Successfully converted EPS to PDF using Canvas Rendering method');
          return result;
        } catch (canvasError) {
          console.warn('⚠️ Canvas rendering method failed:', canvasError);
          
          try {
            // Method 3: Extract embedded preview image (many EPS files have TIFF previews)
            const result = await this.convertEpsViaPreviewExtraction(file, epsInfo, epsContent);
            console.log('✅ Successfully converted EPS to PDF using Preview Extraction method');
            return result;
          } catch (previewError) {
            console.warn('⚠️ Preview extraction method failed:', previewError);
            
            // Method 4: Create informational PDF with EPS details
            const result = await this.convertEpsToInfoPdf(file, epsInfo, epsContent);
            console.log('✅ Successfully created PDF with EPS information');
            return result;
          }
        }
      }
      
    } catch (error) {
      console.error('❌ EPS to PDF conversion error:', error);
      throw new Error(`Failed to convert EPS to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Method 1: Try to load EPS directly as an image (some browsers support this)
   */
  private async convertEpsViaDirectImage(
    file: File, 
    epsInfo: any, 
    epsContent: string
  ): Promise<EPSConversionResult> {
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.processLoadedImage(img, file, resolve);
      };
      
      img.onerror = () => {
        // Try alternative approaches
        this.tryAlternativeImageLoad(file, resolve, reject);
      };
      
      // Try to load EPS as image
      const url = URL.createObjectURL(file);
      img.src = url;
      
      // Cleanup after timeout
      setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error('Direct image loading timeout'));
      }, 5000);
    });
  }

  /**
   * Try alternative ways to load EPS as image
   */
  private tryAlternativeImageLoad(file: File, resolve: Function, reject: Function): void {
    // Try data URL approach
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Success with data URL
        this.processLoadedImage(img, file, resolve);
      };
      img.onerror = () => {
        reject(new Error('EPS file cannot be loaded as image (tried blob URL and data URL)'));
      };
      
      try {
        // Convert to data URL
        const dataUrl = `data:application/postscript;base64,${btoa(reader.result as string)}`;
        img.src = dataUrl;
      } catch (error) {
        reject(new Error('Failed to create data URL from EPS'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read EPS file'));
    };
    reader.readAsBinaryString(file);
  }

  /**
   * Process successfully loaded image
   */
  private async processLoadedImage(img: HTMLImageElement, file: File, resolve: Function): Promise<void> {
    try {
      // Create canvas and draw the image
      const canvas = document.createElement('canvas');
      const scale = 2; // High resolution
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the EPS image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });
      
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Add image to PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, img.width, img.height);
      
      // Generate PDF blob
      const pdfBytes = pdf.output('arraybuffer');
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Generate filename
      const baseName = file.name.replace(/\.eps$/i, '');
      const pdfFileName = `${baseName}.pdf`;
      
      resolve({
        pdfBlob,
        fileName: pdfFileName,
        originalSize: file.size,
        convertedSize: pdfBlob.size,
        conversionMethod: 'Direct Image'
      });
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Method 2: Canvas-based PostScript interpreter (simplified)
   */
  private async convertEpsViaCanvasRendering(
    file: File, 
    epsInfo: any, 
    epsContent: string
  ): Promise<EPSConversionResult> {
    
    const canvas = document.createElement('canvas');
    const scale = 2; // High resolution
    canvas.width = (epsInfo.width || 800) * scale;
    canvas.height = (epsInfo.height || 600) * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Scale the context
    ctx.scale(scale, scale);
    
    // Try to render the EPS content using a simple PostScript interpreter
    await this.renderPostScriptToCanvas(ctx, epsContent, epsInfo, file);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: (epsInfo.width || 800) > (epsInfo.height || 600) ? 'landscape' : 'portrait',
      unit: 'px',
      format: [epsInfo.width || 800, epsInfo.height || 600]
    });
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Add image to PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, epsInfo.width || 800, epsInfo.height || 600);
    
    // Generate PDF blob
    const pdfBytes = pdf.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Generate filename
    const baseName = file.name.replace(/\.eps$/i, '');
    const pdfFileName = `${baseName}_rendered.pdf`;
    
    return {
      pdfBlob,
      fileName: pdfFileName,
      originalSize: file.size,
      convertedSize: pdfBlob.size,
      conversionMethod: 'Canvas Rendering'
    };
  }

  /**
   * Simple PostScript interpreter for basic commands
   */
  private async renderPostScriptToCanvas(ctx: CanvasRenderingContext2D, epsContent: string, epsInfo: any, file: File): Promise<void> {
    const lines = epsContent.split('\n');
    let currentPath: any[] = [];
    let currentX = 0, currentY = 0;
    let stack: number[] = [];
    
    // Get actual canvas dimensions (already scaled)
    const canvasWidth = ctx.canvas.width / 2; // Divide by scale factor
    const canvasHeight = ctx.canvas.height / 2; // Divide by scale factor
    
    // EPS bounding box
    const epsWidth = epsInfo.width || 400;
    const epsHeight = epsInfo.height || 300;
    
    // Calculate scaling to fit EPS into canvas while maintaining aspect ratio
    const scaleX = canvasWidth / epsWidth;
    const scaleY = canvasHeight / epsHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Center the EPS content
    const offsetX = (canvasWidth - epsWidth * scale) / 2;
    const offsetY = (canvasHeight - epsHeight * scale) / 2;
    
    // Transform coordinates from PostScript (origin bottom-left) to Canvas (origin top-left)
    const transformX = (x: number) => offsetX + x * scale;
    const transformY = (y: number) => offsetY + (epsHeight - y) * scale;
    
    // Set initial graphics state
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.lineWidth = 1;
    
    console.log('🎨 Rendering PostScript commands to canvas...');
    console.log(`📐 Canvas: ${canvasWidth}x${canvasHeight}, EPS: ${epsWidth}x${epsHeight}`);
    console.log(`📏 Scale: ${scale}, Offset: (${offsetX}, ${offsetY})`);
    
    // Debug: Print first few lines of EPS content
    console.log('📄 First 10 lines of EPS:');
    lines.slice(0, 10).forEach((line, i) => {
      console.log(`  ${i}: ${line}`);
    });
    
    let commandsProcessed = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('%')) continue;
      
      const tokens = trimmed.split(/\s+/);
      
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        // Numbers go on the stack
        if (!isNaN(parseFloat(token))) {
          stack.push(parseFloat(token));
          continue;
        }
        
        // Debug: Log each command we're about to process (but not the noise)
        const isNoiseCommand = ['setoverprint', 'current_spot_alias', 'set_spot_alias', 'findcmykcustomcolor', 'setcustomcolor', 'roll', 'ne', 'eq', 'true', 'false', 'currentgray', 'currentrgbcolor'].includes(token.toLowerCase());
        if (commandsProcessed < 10 && !isNoiseCommand) { // Only log first 10 meaningful commands
          console.log(`🔧 Processing command: ${token}, Stack: [${stack.slice(-5).join(', ')}...]`);
        }
        
        // Process PostScript commands
        switch (token.toLowerCase()) {
          // === Drawing Commands ===
          case 'moveto':
            if (stack.length >= 2) {
              currentY = stack.pop()!;
              currentX = stack.pop()!;
              const newX = transformX(currentX);
              const newY = transformY(currentY);
              ctx.moveTo(newX, newY);
              if (commandsProcessed < 10) {
                console.log(`✅ moveto: (${currentX}, ${currentY}) -> (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
              }
              commandsProcessed++;
            } else {
              console.log(`❌ moveto: insufficient stack (${stack.length})`);
            }
            break;
            
          case 'lineto':
            if (stack.length >= 2) {
              currentY = stack.pop()!;
              currentX = stack.pop()!;
              ctx.lineTo(transformX(currentX), transformY(currentY));
              commandsProcessed++;
            }
            break;
            
          case 'curveto':
            if (stack.length >= 6) {
              const y3 = stack.pop()!;
              const x3 = stack.pop()!;
              const y2 = stack.pop()!;
              const x2 = stack.pop()!;
              const y1 = stack.pop()!;
              const x1 = stack.pop()!;
              ctx.bezierCurveTo(
                transformX(x1), transformY(y1), 
                transformX(x2), transformY(y2), 
                transformX(x3), transformY(y3)
              );
              currentX = x3;
              currentY = y3;
              commandsProcessed++;
            }
            break;
            
          case 'closepath':
            ctx.closePath();
            commandsProcessed++;
            break;
            
          case 'stroke':
            ctx.stroke();
            ctx.beginPath();
            commandsProcessed++;
            break;
            
          case 'fill':
            ctx.fill();
            ctx.beginPath();
            commandsProcessed++;
            break;
            
          case 'rectfill':
            if (stack.length >= 4) {
              const h = stack.pop()!;
              const w = stack.pop()!;
              const y = stack.pop()!;
              const x = stack.pop()!;
              const rectX = transformX(x);
              const rectY = transformY(y + h);
              const rectW = w * scale;
              const rectH = h * scale;
              ctx.fillRect(rectX, rectY, rectW, rectH);
              if (commandsProcessed < 10) {
                console.log(`✅ rectfill: (${x}, ${y}, ${w}, ${h}) -> (${rectX.toFixed(1)}, ${rectY.toFixed(1)}, ${rectW.toFixed(1)}, ${rectH.toFixed(1)})`);
              }
              commandsProcessed++;
            } else {
              console.log(`❌ rectfill: insufficient stack (${stack.length})`);
            }
            break;
            
          case 'setrgbcolor':
            if (stack.length >= 3) {
              const b = Math.round(stack.pop()! * 255);
              const g = Math.round(stack.pop()! * 255);
              const r = Math.round(stack.pop()! * 255);
              const color = `rgb(${r},${g},${b})`;
              ctx.strokeStyle = color;
              ctx.fillStyle = color;
              if (commandsProcessed < 10) {
                console.log(`✅ setrgbcolor: ${color}`);
              }
              commandsProcessed++;
            } else {
              console.log(`❌ setrgbcolor: insufficient stack (${stack.length})`);
            }
            break;
            
          case 'setlinewidth':
            if (stack.length >= 1) {
              ctx.lineWidth = stack.pop()!;
              commandsProcessed++;
            }
            break;
            
          case 'arc':
            if (stack.length >= 5) {
              const angle2 = (stack.pop()! * Math.PI) / 180;
              const angle1 = (stack.pop()! * Math.PI) / 180;
              const radius = stack.pop()!;
              const centerY = stack.pop()!;
              const centerX = stack.pop()!;
              ctx.arc(
                transformX(centerX), 
                transformY(centerY), 
                radius * scale, 
                angle1, 
                angle2
              );
              commandsProcessed++;
            }
            break;
            
          case 'newpath':
            ctx.beginPath();
            commandsProcessed++;
            break;
            
          case 'gsave':
            ctx.save();
            commandsProcessed++;
            break;
            
          case 'grestore':
            ctx.restore();
            commandsProcessed++;
            break;
            
          case 'translate':
            if (stack.length >= 2) {
              const y = stack.pop()!;
              const x = stack.pop()!;
              ctx.translate(x, -y); // Flip Y for PostScript coordinate system
              commandsProcessed++;
            }
            break;
            
          case 'scale':
            if (stack.length >= 2) {
              const sy = stack.pop()!;
              const sx = stack.pop()!;
              ctx.scale(sx, sy);
              commandsProcessed++;
            }
            break;
            
          case 'rotate':
            if (stack.length >= 1) {
              const angle = (stack.pop()! * Math.PI) / 180;
              ctx.rotate(-angle); // Flip rotation for PostScript coordinate system
              commandsProcessed++;
            }
            break;
            
          case 'show':
            // Text rendering is complex in PostScript, skip for now
            stack = []; // Clear stack
            break;
            
          // === Advanced PostScript Commands ===
          
          // Stack manipulation commands
          case 'roll':
            if (stack.length >= 2) {
              const j = stack.pop()!; // shift amount
              const n = stack.pop()!; // number of elements
              if (stack.length >= n && n > 0) {
                const elements = stack.splice(stack.length - n, n);
                // Rotate the elements
                const normalizedJ = ((j % n) + n) % n;
                for (let i = 0; i < normalizedJ; i++) {
                  elements.unshift(elements.pop()!);
                }
                stack.push(...elements);
              }
            }
            break;
            
          // Boolean and comparison operators
          case 'ne':
            if (stack.length >= 2) {
              const b = stack.pop()!;
              const a = stack.pop()!;
              stack.push(a !== b ? 1 : 0);
            }
            break;
            
          case 'eq':
            if (stack.length >= 2) {
              const b = stack.pop()!;
              const a = stack.pop()!;
              stack.push(a === b ? 1 : 0);
            }
            break;
            
          // Color and graphics state commands (handle but ignore advanced features)
          case 'setoverprint':
            // Ignore overprint settings - not supported in canvas
            if (stack.length >= 1) {
              stack.pop(); // remove the boolean value
            }
            break;
            
          case 'current_spot_alias':
          case 'set_spot_alias':
          case 'findcmykcustomcolor':
          case 'setcustomcolor':
            // Handle spot color commands by ignoring them
            // These are advanced printing features not applicable to canvas
            break;
            
          case 'currentgray':
            // Push current gray value (approximation)
            const currentColor = ctx.fillStyle;
            if (typeof currentColor === 'string') {
              // Try to extract gray value from color
              if (currentColor.startsWith('rgb(')) {
                const match = currentColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (match) {
                  const [, r, g, b] = match.map(Number);
                  const gray = (r + g + b) / (3 * 255); // Simple gray conversion
                  stack.push(gray);
                } else {
                  stack.push(0);
                }
              } else {
                stack.push(0); // Default to black
              }
            } else {
              stack.push(0);
            }
            break;
            
          case 'currentrgbcolor':
            // Push current RGB values
            const currentRGB = ctx.fillStyle;
            if (typeof currentRGB === 'string' && currentRGB.startsWith('rgb(')) {
              const match = currentRGB.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
              if (match) {
                const [, r, g, b] = match.map(Number);
                stack.push(r / 255, g / 255, b / 255);
              } else {
                stack.push(0, 0, 0);
              }
            } else {
              stack.push(0, 0, 0); // Default to black
            }
            break;
            
          // Boolean constants
          case 'true':
            stack.push(1);
            break;
            
          case 'false':
            stack.push(0);
            break;

          default:
            // Log unknown commands for debugging
            if (commandsProcessed < 50) {
              console.log(`⚠️ Unknown command: ${token}`);
            }
            break;
        }
      }
    }
    
    console.log(`📊 Processed ${commandsProcessed} PostScript commands`);
    
    // Summary of what was processed
    const summaryLines = [];
    if (commandsProcessed > 0) {
      summaryLines.push(`✅ Successfully processed ${commandsProcessed} commands`);
    } else {
      summaryLines.push(`⚠️ No PostScript commands were processed`);
    }
    
    console.log(summaryLines.join('\n'));
    
    // If no commands were processed, draw a placeholder
    if (commandsProcessed === 0) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(offsetX, offsetY, epsWidth * scale, epsHeight * scale);
      
      ctx.fillStyle = '#666';
      ctx.font = `${16 * scale}px Arial`;
      ctx.textAlign = 'center';
      const centerX = offsetX + (epsWidth * scale) / 2;
      const centerY = offsetY + (epsHeight * scale) / 2;
      ctx.fillText('EPS File', centerX, centerY - 10 * scale);
      ctx.fillText(file.name, centerX, centerY + 10 * scale);
      
      // Draw a border
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.strokeRect(offsetX + 5, offsetY + 5, epsWidth * scale - 10, epsHeight * scale - 10);
      
      console.log('⚠️ No PostScript commands found, showing placeholder');
    } else {
      console.log(`✅ Successfully rendered ${commandsProcessed} PostScript commands`);
    }
  }

  /**
   * Method 3: Extract embedded TIFF/JPEG preview from EPS file
   */
  private async convertEpsViaPreviewExtraction(
    file: File, 
    epsInfo: any, 
    epsContent: string
  ): Promise<EPSConversionResult> {
    
    // Look for embedded TIFF or JPEG preview
    const previewImage = await this.extractPreviewImage(epsContent);
    
    if (!previewImage) {
      throw new Error('No preview image found in EPS file');
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          // Create PDF with the extracted preview image
          const pdf = new jsPDF({
            orientation: img.width > img.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [img.width, img.height]
          });
          
          // Add the preview image to PDF
          pdf.addImage(previewImage, 'JPEG', 0, 0, img.width, img.height);
          
          // Generate PDF blob
          const pdfBytes = pdf.output('arraybuffer');
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          
          // Generate filename
          const baseName = file.name.replace(/\.eps$/i, '');
          const pdfFileName = `${baseName}_preview.pdf`;
          
          resolve({
            pdfBlob,
            fileName: pdfFileName,
            originalSize: file.size,
            convertedSize: pdfBlob.size,
            conversionMethod: 'Preview Extraction'
          });
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load extracted preview image'));
      };
      
      img.src = previewImage;
    });
  }

  /**
   * Method 4: Create informational PDF with EPS details (ultimate fallback)
   */
  private async convertEpsToInfoPdf(
    file: File, 
    epsInfo: any, 
    epsContent: string
  ): Promise<EPSConversionResult> {
    
    // Create PDF with jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Set up the page
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Add title
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.text('EPS File Converted to PDF', pageWidth / 2, 40, { align: 'center' });
    
    // Add file info
    pdf.setFontSize(16);
    pdf.text(`Original file: ${file.name}`, 20, 80);
    pdf.text(`File size: ${(file.size / 1024).toFixed(2)} KB`, 20, 110);
    
    if (epsInfo.width && epsInfo.height) {
      pdf.text(`Dimensions: ${epsInfo.width} x ${epsInfo.height} points`, 20, 140);
    }
    
    if (epsInfo.boundingBox) {
      pdf.text(`Bounding Box: ${epsInfo.boundingBox.join(', ')}`, 20, 170);
    }
    
    if (epsInfo.creator) {
      pdf.text(`Creator: ${epsInfo.creator}`, 20, 200);
    }
    
    if (epsInfo.title) {
      pdf.text(`Title: ${epsInfo.title}`, 20, 230);
    }
    
    pdf.text(`Content length: ${epsContent.length} characters`, 20, 260);
    
    // Add PostScript info
    pdf.setFontSize(14);
    pdf.text('PostScript Commands Found:', 20, 300);
    
    // Extract some PostScript commands
    const commands = this.extractPostScriptCommands(epsContent);
    let yPos = 330;
    
    pdf.setFontSize(12);
    commands.slice(0, 10).forEach((cmd, index) => {
      if (yPos < pageHeight - 50) {
        pdf.text(`• ${cmd}`, 30, yPos);
        yPos += 20;
      }
    });
    
    if (commands.length > 10) {
      pdf.text(`... and ${commands.length - 10} more commands`, 30, yPos);
    }
    
    // Add note
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const noteText = 'Note: This is an informational PDF representation of the EPS file.';
    pdf.text(noteText, 20, pageHeight - 60);
    
    const noteText2 = 'For full vector graphics, consider server-side conversion.';
    pdf.text(noteText2, 20, pageHeight - 40);
    
    // Add border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(2);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');
    
    // Generate PDF blob
    const pdfBytes = pdf.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Generate filename
    const baseName = file.name.replace(/\.eps$/i, '');
    const pdfFileName = `${baseName}_info.pdf`;
    
    return {
      pdfBlob,
      fileName: pdfFileName,
      originalSize: file.size,
      convertedSize: pdfBlob.size,
      conversionMethod: 'Informational PDF'
    };
  }

  /**
   * Extract preview image from EPS file (TIFF or JPEG)
   */
  private async extractPreviewImage(epsContent: string): Promise<string | null> {
    try {
      // Look for TIFF preview marker
      const tiffStart = epsContent.indexOf('%%BeginPreview:');
      if (tiffStart !== -1) {
        const tiffEnd = epsContent.indexOf('%%EndPreview', tiffStart);
        if (tiffEnd !== -1) {
          const previewSection = epsContent.substring(tiffStart, tiffEnd);
          
          // Extract hex data and convert to binary
          const hexData = previewSection.replace(/%%BeginPreview:.*?\n/, '').replace(/\s/g, '');
          
          if (hexData.length > 0) {
            // Convert hex to binary data
            const binaryData = hexData.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '';
            
            // Create data URL for TIFF
            const base64Data = btoa(binaryData);
            return `data:image/tiff;base64,${base64Data}`;
          }
        }
      }
      
      // Look for embedded JPEG
      const jpegStart = epsContent.indexOf('/DeviceRGB setcolorspace');
      if (jpegStart !== -1) {
        // This is a simplified approach - real JPEG extraction would be more complex
        console.log('Found potential JPEG data in EPS');
      }
      
      return null;
    } catch (error) {
      console.warn('Error extracting preview image:', error);
      return null;
    }
  }

  /**
   * Extract PostScript commands for informational display
   */
  private extractPostScriptCommands(epsContent: string): string[] {
    const commands: string[] = [];
    const lines = epsContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('%') && !trimmed.startsWith('%%')) {
        // Look for common PostScript commands
        if (/\b(moveto|lineto|curveto|closepath|fill|stroke|setrgbcolor|setlinewidth|gsave|grestore|translate|scale|rotate)\b/.test(trimmed)) {
          commands.push(trimmed.length > 60 ? trimmed.substring(0, 60) + '...' : trimmed);
        }
      }
      if (commands.length >= 20) break; // Limit for display
    }
    
    return commands;
  }

  /**
   * Parse EPS file information
   */
  private parseEPSInfo(epsContent: string): any {
    const info: any = {};
    
    // Parse bounding box
    const boundingBoxMatch = epsContent.match(/%%BoundingBox:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
    if (boundingBoxMatch) {
      const [, x1, y1, x2, y2] = boundingBoxMatch.map(Number);
      info.boundingBox = [x1, y1, x2, y2];
      info.width = x2 - x1;
      info.height = y2 - y1;
    }
    
    // Parse creator
    const creatorMatch = epsContent.match(/%%Creator:\s*(.+)/);
    if (creatorMatch) {
      info.creator = creatorMatch[1].trim();
    }
    
    // Parse title
    const titleMatch = epsContent.match(/%%Title:\s*(.+)/);
    if (titleMatch) {
      info.title = titleMatch[1].trim();
    }
    
    // Parse creation date
    const dateMatch = epsContent.match(/%%CreationDate:\s*(.+)/);
    if (dateMatch) {
      info.creationDate = dateMatch[1].trim();
    }
    
    // Default dimensions if not found
    if (!info.width) info.width = 612; // Letter width in points
    if (!info.height) info.height = 792; // Letter height in points
    
    return info;
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
}

// Helper function to check if file is EPS (exported for compatibility)
export const isEpsFile = (file: File): boolean => {
  return EPSConverter.isEpsFile(file);
};
