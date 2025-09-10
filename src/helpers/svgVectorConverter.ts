import { jsPDF } from 'jspdf';

export interface SVGVectorConversionResult {
  pdfBlob: Blob;
  fileName: string;
  originalSize: number;
  convertedSize: number;
  conversionMethod: string;
}

export class SVGVectorConverter {
  
  /**
   * Convert SVG to PDF preserving vector graphics
   */
  async convertToPDF(file: File): Promise<SVGVectorConversionResult> {
    try {
      console.log('🔄 Starting vector-to-vector SVG to PDF conversion:', file.name);
      
      // Read SVG content
      const svgContent = await this.readFileAsText(file);
      
      // Parse SVG dimensions
      const dimensions = this.parseSVGDimensions(svgContent);
      console.log('📐 SVG dimensions:', dimensions);
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
        unit: 'pt', // Use points for better precision
        format: [dimensions.width, dimensions.height]
      });
      
      // Parse SVG and convert to PDF vector commands
      await this.convertSvgElementsToPdf(svgContent, pdf, dimensions);
      
      // Generate PDF blob
      const pdfBytes = pdf.output('arraybuffer');
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Generate filename
      const baseName = file.name.replace(/\.svg$/i, '');
      const pdfFileName = `${baseName}_vector.pdf`;
      
      console.log('✅ Vector SVG to PDF conversion completed');
      
      return {
        pdfBlob,
        fileName: pdfFileName,
        originalSize: file.size,
        convertedSize: pdfBlob.size,
        conversionMethod: 'Vector-to-Vector'
      };
      
    } catch (error) {
      console.error('❌ Vector SVG to PDF conversion error:', error);
      throw new Error(`Failed to convert SVG to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Parse SVG content and convert elements to PDF vector commands
   */
  private async convertSvgElementsToPdf(svgContent: string, pdf: jsPDF, dimensions: any): Promise<void> {
    // Create a temporary DOM element to parse SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    if (svgElement.nodeName !== 'svg') {
      throw new Error('Invalid SVG content');
    }
    
    console.log('🔍 Parsing SVG elements...');
    
    // Set coordinate system (SVG uses top-left origin like PDF)
    const viewBox = this.parseViewBox(svgElement);
    const transform = this.calculateTransform(viewBox, dimensions);
    
    // Process all SVG elements
    await this.processSvgElement(svgElement, pdf, transform);
    
    console.log('✅ Finished processing SVG elements');
  }
  
  /**
   * Process individual SVG element and convert to PDF commands
   */
  private async processSvgElement(element: Element, pdf: jsPDF, transform: any): Promise<void> {
    const tagName = element.tagName.toLowerCase();
    
    console.log(`🔍 Processing SVG element: ${tagName}`);
    
    // Extract common style properties for logging
    const style = this.extractStyleProperties(element);
    console.log(`🎨 Element style:`, style);
    
    // Note: Each shape method will apply its own styles to avoid conflicts
    
    switch (tagName) {
      case 'svg':
        // Process child elements
        for (let i = 0; i < element.children.length; i++) {
          await this.processSvgElement(element.children[i], pdf, transform);
        }
        break;
        
      case 'g':
        // Group element - process children
        for (let i = 0; i < element.children.length; i++) {
          await this.processSvgElement(element.children[i], pdf, transform);
        }
        break;
        
      case 'path':
        this.convertPathToPdf(element, pdf, transform);
        break;
        
      case 'rect':
        this.convertRectToPdf(element, pdf, transform);
        break;
        
      case 'circle':
        this.convertCircleToPdf(element, pdf, transform);
        break;
        
      case 'ellipse':
        this.convertEllipseToPdf(element, pdf, transform);
        break;
        
      case 'line':
        this.convertLineToPdf(element, pdf, transform);
        break;
        
      case 'polyline':
      case 'polygon':
        this.convertPolyToPdf(element, pdf, transform);
        break;
        
      case 'text':
        this.convertTextToPdf(element, pdf, transform);
        break;
        
      default:
        console.log(`⚠️ Unsupported SVG element: ${tagName}`);
        console.log(`📄 Element attributes:`, element.getAttributeNames().map(name => `${name}="${element.getAttribute(name)}"`));
        break;
    }
  }
  
  /**
   * Convert SVG path element to PDF
   */
  private convertPathToPdf(element: Element, pdf: jsPDF, transform: any): void {
    const d = element.getAttribute('d');
    if (!d) {
      console.log('⚠️ Path element missing "d" attribute');
      return;
    }
    
    console.log(`🔄 Converting path element with d="${d}"`);
    
    // Parse path data and convert to PDF drawing commands
    const pathCommands = this.parsePathData(d);
    console.log(`📊 Parsed ${pathCommands.length} path commands:`, pathCommands);
    
    let currentX = 0;
    let currentY = 0;
    let pathStarted = false;
    
    // Start a new path (some jsPDF versions have different APIs)
    if (pdf.moveTo) {
      pdf.moveTo(0, 0);
    }
    
    for (const cmd of pathCommands) {
      const transformedCoords = this.transformCoordinates(cmd.x || 0, cmd.y || 0, transform);
      
      console.log(`📐 Processing path command: ${cmd.command} to (${transformedCoords.x}, ${transformedCoords.y})`);
      
      switch (cmd.command.toLowerCase()) {
        case 'm': // moveTo
          currentX = transformedCoords.x;
          currentY = transformedCoords.y;
          pathStarted = true;
          break;
          
        case 'l': // lineTo
          if (pathStarted) {
            // Draw line from current position to new position
            pdf.line(currentX, currentY, transformedCoords.x, transformedCoords.y);
          }
          currentX = transformedCoords.x;
          currentY = transformedCoords.y;
          break;
          
        case 'c': // curveTo (cubic bezier)
          if (pathStarted && cmd.x1 !== undefined && cmd.y1 !== undefined && 
              cmd.x2 !== undefined && cmd.y2 !== undefined) {
            const cp1 = this.transformCoordinates(cmd.x1, cmd.y1, transform);
            const cp2 = this.transformCoordinates(cmd.x2, cmd.y2, transform);
            
            console.log(`🔵 Drawing bezier curve from (${currentX},${currentY}) to (${transformedCoords.x},${transformedCoords.y})`);
            
            // jsPDF doesn't have direct bezier, approximate with lines
            const points = this.approximateBezier(
              currentX, currentY,
              cp1.x, cp1.y,
              cp2.x, cp2.y,
              transformedCoords.x, transformedCoords.y
            );
            
            // Draw lines between consecutive points
            for (let i = 1; i < points.length; i++) {
              pdf.line(points[i-1].x, points[i-1].y, points[i].x, points[i].y);
            }
          }
          currentX = transformedCoords.x;
          currentY = transformedCoords.y;
          break;
          
        case 'z': // closePath
          pathStarted = false;
          break;
      }
    }
  }
  
  /**
   * Convert SVG rect element to PDF
   */
  private convertRectToPdf(element: Element, pdf: jsPDF, transform: any): void {
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    const width = parseFloat(element.getAttribute('width') || '0');
    const height = parseFloat(element.getAttribute('height') || '0');
    
    const topLeft = this.transformCoordinates(x, y, transform);
    const transformedWidth = width * transform.scaleX;
    const transformedHeight = height * transform.scaleY;
    
    console.log(`🔄 Converting rect: ${x},${y} ${width}x${height}`);
    
    // Get fill and stroke from style
    const style = this.extractStyleProperties(element);
    this.applyStyleToPdf(pdf, style);
    
    // Determine draw mode
    const hasFill = style.fill && style.fill !== 'none';
    const hasStroke = style.stroke && style.stroke !== 'none';
    
    let drawMode = 'S'; // Default to stroke
    if (hasFill && hasStroke) {
      drawMode = 'FD'; // Fill and stroke
    } else if (hasFill) {
      drawMode = 'F'; // Fill only
    } else if (hasStroke) {
      drawMode = 'S'; // Stroke only
    }
    
    console.log(`🎯 Drawing rect with mode: ${drawMode} (fill: ${hasFill}, stroke: ${hasStroke})`);
    pdf.rect(topLeft.x, topLeft.y, transformedWidth, transformedHeight, drawMode);
  }
  
  /**
   * Convert SVG circle element to PDF
   */
  private convertCircleToPdf(element: Element, pdf: jsPDF, transform: any): void {
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');
    const r = parseFloat(element.getAttribute('r') || '0');
    
    const center = this.transformCoordinates(cx, cy, transform);
    const transformedR = r * Math.min(transform.scaleX, transform.scaleY);
    
    console.log(`🔄 Converting circle: center(${cx},${cy}) radius=${r}`);
    
    const style = this.extractStyleProperties(element);
    this.applyStyleToPdf(pdf, style);
    
    // Determine draw mode
    const hasFill = style.fill && style.fill !== 'none';
    const hasStroke = style.stroke && style.stroke !== 'none';
    
    let drawMode = 'S'; // Default to stroke
    if (hasFill && hasStroke) {
      drawMode = 'FD'; // Fill and stroke
    } else if (hasFill) {
      drawMode = 'F'; // Fill only
    } else if (hasStroke) {
      drawMode = 'S'; // Stroke only
    }
    
    console.log(`🎯 Drawing circle with mode: ${drawMode} (fill: ${hasFill}, stroke: ${hasStroke})`);
    pdf.circle(center.x, center.y, transformedR, drawMode);
  }
  
  /**
   * Convert SVG ellipse element to PDF
   */
  private convertEllipseToPdf(element: Element, pdf: jsPDF, transform: any): void {
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');
    const rx = parseFloat(element.getAttribute('rx') || '0');
    const ry = parseFloat(element.getAttribute('ry') || '0');
    
    const center = this.transformCoordinates(cx, cy, transform);
    const transformedRx = rx * transform.scaleX;
    const transformedRy = ry * transform.scaleY;
    
    console.log(`🔄 Converting ellipse: center(${cx},${cy}) radii=${rx},${ry}`);
    
    const style = this.extractStyleProperties(element);
    this.applyStyleToPdf(pdf, style);
    
    // Determine draw mode
    const hasFill = style.fill && style.fill !== 'none';
    const hasStroke = style.stroke && style.stroke !== 'none';
    
    let drawMode = 'S'; // Default to stroke
    if (hasFill && hasStroke) {
      drawMode = 'FD'; // Fill and stroke
    } else if (hasFill) {
      drawMode = 'F'; // Fill only
    } else if (hasStroke) {
      drawMode = 'S'; // Stroke only
    }
    
    console.log(`🎯 Drawing ellipse with mode: ${drawMode} (fill: ${hasFill}, stroke: ${hasStroke})`);
    pdf.ellipse(center.x, center.y, transformedRx, transformedRy, drawMode);
  }
  
  /**
   * Convert SVG line element to PDF
   */
  private convertLineToPdf(element: Element, pdf: jsPDF, transform: any): void {
    const x1 = parseFloat(element.getAttribute('x1') || '0');
    const y1 = parseFloat(element.getAttribute('y1') || '0');
    const x2 = parseFloat(element.getAttribute('x2') || '0');
    const y2 = parseFloat(element.getAttribute('y2') || '0');
    
    const start = this.transformCoordinates(x1, y1, transform);
    const end = this.transformCoordinates(x2, y2, transform);
    
    console.log(`🔄 Converting line: (${x1},${y1}) to (${x2},${y2})`);
    
    const style = this.extractStyleProperties(element);
    this.applyStyleToPdf(pdf, style);
    
    console.log(`🎯 Drawing line with stroke styles applied`);
    pdf.line(start.x, start.y, end.x, end.y);
  }
  
  /**
   * Convert SVG polyline/polygon element to PDF
   */
  private convertPolyToPdf(element: Element, pdf: jsPDF, transform: any): void {
    const points = element.getAttribute('points');
    if (!points) return;
    
    const coords = this.parsePointsAttribute(points);
    if (coords.length < 2) return;
    
    console.log(`🔄 Converting ${element.tagName}: ${coords.length} points`);
    
    const style = this.extractStyleProperties(element);
    this.applyStyleToPdf(pdf, style);
    
    const transformedCoords = coords.map(coord => 
      this.transformCoordinates(coord.x, coord.y, transform)
    );
    
    console.log(`🎯 Drawing ${element.tagName} with stroke styles applied`);
    
    // Draw lines between consecutive points
    for (let i = 1; i < transformedCoords.length; i++) {
      pdf.line(
        transformedCoords[i-1].x, transformedCoords[i-1].y,
        transformedCoords[i].x, transformedCoords[i].y
      );
    }
    
    // Close polygon if needed
    if (element.tagName.toLowerCase() === 'polygon' && transformedCoords.length > 2) {
      pdf.line(
        transformedCoords[transformedCoords.length-1].x, transformedCoords[transformedCoords.length-1].y,
        transformedCoords[0].x, transformedCoords[0].y
      );
    }
  }
  
  /**
   * Convert SVG text element to PDF
   */
  private convertTextToPdf(element: Element, pdf: jsPDF, transform: any): void {
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    const text = element.textContent || '';
    
    if (!text.trim()) return;
    
    const position = this.transformCoordinates(x, y, transform);
    
    console.log(`🔄 Converting text: "${text}" at (${x},${y})`);
    
    // Apply text styling
    const style = this.extractStyleProperties(element);
    this.applyTextStyleToPdf(pdf, style);
    
    pdf.text(text, position.x, position.y);
  }
  
  // === Utility Methods ===
  
  /**
   * Read file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
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
    
    let width = 400; // default
    let height = 300; // default
    
    // Try to get width and height attributes
    const widthAttr = svgElement.getAttribute('width');
    const heightAttr = svgElement.getAttribute('height');
    
    if (widthAttr) {
      width = this.parseUnit(widthAttr);
    }
    if (heightAttr) {
      height = this.parseUnit(heightAttr);
    }
    
    // Fallback to viewBox if no explicit dimensions
    if (!widthAttr || !heightAttr) {
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/\s+/);
        if (parts.length === 4) {
          width = parseFloat(parts[2]);
          height = parseFloat(parts[3]);
        }
      }
    }
    
    return { width, height };
  }
  
  /**
   * Parse unit values (px, pt, etc.)
   */
  private parseUnit(value: string): number {
    const num = parseFloat(value);
    if (value.includes('mm')) return num * 2.834645669; // mm to pt
    if (value.includes('cm')) return num * 28.34645669; // cm to pt
    if (value.includes('in')) return num * 72; // in to pt
    return num; // assume points or unitless
  }
  
  /**
   * Parse viewBox attribute
   */
  private parseViewBox(svgElement: Element): any {
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(parseFloat);
      if (parts.length === 4) {
        return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
      }
    }
    return { x: 0, y: 0, width: 400, height: 300 };
  }
  
  /**
   * Calculate transformation matrix
   */
  private calculateTransform(viewBox: any, dimensions: any): any {
    return {
      scaleX: dimensions.width / viewBox.width,
      scaleY: dimensions.height / viewBox.height,
      offsetX: -viewBox.x,
      offsetY: -viewBox.y
    };
  }
  
  /**
   * Transform coordinates
   */
  private transformCoordinates(x: number, y: number, transform: any): { x: number; y: number } {
    return {
      x: (x + transform.offsetX) * transform.scaleX,
      y: (y + transform.offsetY) * transform.scaleY
    };
  }
  
  /**
   * Extract style properties from element
   */
  private extractStyleProperties(element: Element): any {
    const style: any = {};
    
    // Get from style attribute
    const styleAttr = element.getAttribute('style');
    if (styleAttr) {
      const styles = styleAttr.split(';');
      styles.forEach(s => {
        const [key, value] = s.split(':').map(x => x.trim());
        if (key && value) {
          style[key.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = value;
        }
      });
    }
    
    // Get from individual attributes
    ['fill', 'stroke', 'stroke-width', 'font-family', 'font-size'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        style[attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = value;
      }
    });
    
    return style;
  }
  
  /**
   * Apply style to PDF context
   */
  private applyStyleToPdf(pdf: jsPDF, style: any): void {
    console.log(`🎨 Applying styles:`, style);
    
    // Set fill color
    if (style.fill && style.fill !== 'none') {
      const color = this.parseColor(style.fill);
      if (color) {
        console.log(`🖌️ Setting fill color: rgb(${color.r}, ${color.g}, ${color.b})`);
        pdf.setFillColor(color.r, color.g, color.b);
      } else {
        console.log(`⚠️ Could not parse fill color: ${style.fill}`);
      }
    } else {
      console.log(`📝 No fill color (fill: ${style.fill})`);
    }
    
    // Set stroke color and width
    if (style.stroke && style.stroke !== 'none') {
      const color = this.parseColor(style.stroke);
      if (color) {
        console.log(`✏️ Setting stroke color: rgb(${color.r}, ${color.g}, ${color.b})`);
        pdf.setDrawColor(color.r, color.g, color.b);
      } else {
        console.log(`⚠️ Could not parse stroke color: ${style.stroke}`);
      }
    } else {
      console.log(`📝 No stroke color (stroke: ${style.stroke})`);
    }
    
    // Set stroke width (handle both strokeWidth and stroke-width)
    const strokeWidth = style.strokeWidth || style['stroke-width'] || 1;
    if (strokeWidth) {
      const width = parseFloat(strokeWidth);
      console.log(`📏 Setting stroke width: ${width}`);
      pdf.setLineWidth(width);
    } else {
      console.log(`📝 No stroke width specified, using default`);
    }
  }
  
  /**
   * Apply text style to PDF
   */
  private applyTextStyleToPdf(pdf: jsPDF, style: any): void {
    if (style.fontSize) {
      pdf.setFontSize(parseFloat(style.fontSize));
    }
    
    if (style.fontFamily) {
      // jsPDF has limited font support
      pdf.setFont('helvetica'); // fallback to supported font
    }
    
    if (style.fill && style.fill !== 'none') {
      const color = this.parseColor(style.fill);
      if (color) {
        pdf.setTextColor(color.r, color.g, color.b);
      }
    }
  }
  
  /**
   * Parse color string to RGB
   */
  private parseColor(colorStr: string): { r: number; g: number; b: number } | null {
    console.log(`🎨 Parsing color: "${colorStr}"`);
    
    // Handle hex colors
    if (colorStr.startsWith('#')) {
      const hex = colorStr.substring(1);
      if (hex.length === 3) {
        const result = {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16)
        };
        console.log(`✅ Parsed hex3 color: rgb(${result.r}, ${result.g}, ${result.b})`);
        return result;
      } else if (hex.length === 6) {
        const result = {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16)
        };
        console.log(`✅ Parsed hex6 color: rgb(${result.r}, ${result.g}, ${result.b})`);
        return result;
      }
    }
    
    // Handle rgb() colors
    const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const result = {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
      console.log(`✅ Parsed rgb color: rgb(${result.r}, ${result.g}, ${result.b})`);
      return result;
    }
    
    // Handle named colors (extended set)
    const namedColors: { [key: string]: { r: number; g: number; b: number } } = {
      'black': { r: 0, g: 0, b: 0 },
      'white': { r: 255, g: 255, b: 255 },
      'red': { r: 255, g: 0, b: 0 },
      'green': { r: 0, g: 128, b: 0 },
      'blue': { r: 0, g: 0, b: 255 },
      'yellow': { r: 255, g: 255, b: 0 },
      'cyan': { r: 0, g: 255, b: 255 },
      'magenta': { r: 255, g: 0, b: 255 },
      'orange': { r: 255, g: 165, b: 0 },
      'purple': { r: 128, g: 0, b: 128 },
      'gray': { r: 128, g: 128, b: 128 },
      'grey': { r: 128, g: 128, b: 128 },
      'lightblue': { r: 173, g: 216, b: 230 },
      'lightgreen': { r: 144, g: 238, b: 144 },
      'navy': { r: 0, g: 0, b: 128 }
    };
    
    const color = namedColors[colorStr.toLowerCase()];
    if (color) {
      console.log(`✅ Parsed named color "${colorStr}": rgb(${color.r}, ${color.g}, ${color.b})`);
      return color;
    }
    
    console.log(`❌ Could not parse color: "${colorStr}"`);
    return null;
  }
  
  /**
   * Parse SVG path data (enhanced to handle more commands)
   */
  private parsePathData(d: string): any[] {
    const commands: any[] = [];
    const regex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
    let match;
    let currentX = 0;
    let currentY = 0;
    
    console.log(`🔍 Parsing path data: "${d}"`);
    
    while ((match = regex.exec(d)) !== null) {
      const command = match[1];
      const params = match[2].trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
      const isRelative = command === command.toLowerCase();
      
      console.log(`📐 Found command: ${command} with params:`, params, `(relative: ${isRelative})`);
      
      switch (command.toUpperCase()) {
        case 'M': // moveTo
          if (params.length >= 2) {
            const x = isRelative ? currentX + params[0] : params[0];
            const y = isRelative ? currentY + params[1] : params[1];
            commands.push({ command: 'M', x, y });
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'L': // lineTo
          if (params.length >= 2) {
            const x = isRelative ? currentX + params[0] : params[0];
            const y = isRelative ? currentY + params[1] : params[1];
            commands.push({ command: 'L', x, y });
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'H': // horizontal lineTo
          if (params.length >= 1) {
            const x = isRelative ? currentX + params[0] : params[0];
            commands.push({ command: 'L', x, y: currentY });
            currentX = x;
          }
          break;
          
        case 'V': // vertical lineTo
          if (params.length >= 1) {
            const y = isRelative ? currentY + params[0] : params[0];
            commands.push({ command: 'L', x: currentX, y });
            currentY = y;
          }
          break;
          
        case 'C': // cubic bezier
          if (params.length >= 6) {
            const x1 = isRelative ? currentX + params[0] : params[0];
            const y1 = isRelative ? currentY + params[1] : params[1];
            const x2 = isRelative ? currentX + params[2] : params[2];
            const y2 = isRelative ? currentY + params[3] : params[3];
            const x = isRelative ? currentX + params[4] : params[4];
            const y = isRelative ? currentY + params[5] : params[5];
            
            commands.push({ command: 'C', x1, y1, x2, y2, x, y });
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'Q': // quadratic bezier
          if (params.length >= 4) {
            const x1 = isRelative ? currentX + params[0] : params[0];
            const y1 = isRelative ? currentY + params[1] : params[1];
            const x = isRelative ? currentX + params[2] : params[2];
            const y = isRelative ? currentY + params[3] : params[3];
            
            // Convert quadratic to cubic bezier
            const cp1x = currentX + (2/3) * (x1 - currentX);
            const cp1y = currentY + (2/3) * (y1 - currentY);
            const cp2x = x + (2/3) * (x1 - x);
            const cp2y = y + (2/3) * (y1 - y);
            
            commands.push({ command: 'C', x1: cp1x, y1: cp1y, x2: cp2x, y2: cp2y, x, y });
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'T': // smooth quadratic bezier
          // Simplified implementation - treat as line for now
          if (params.length >= 2) {
            const x = isRelative ? currentX + params[0] : params[0];
            const y = isRelative ? currentY + params[1] : params[1];
            commands.push({ command: 'L', x, y });
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'S': // smooth cubic bezier
          // Simplified implementation - treat as line for now
          if (params.length >= 4) {
            const x = isRelative ? currentX + params[2] : params[2];
            const y = isRelative ? currentY + params[3] : params[3];
            commands.push({ command: 'L', x, y });
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'A': // arc
          // Simplified implementation - treat as line for now
          if (params.length >= 7) {
            const x = isRelative ? currentX + params[5] : params[5];
            const y = isRelative ? currentY + params[6] : params[6];
            commands.push({ command: 'L', x, y });
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'Z': // closePath
          commands.push({ command: 'Z' });
          break;
          
        default:
          console.log(`⚠️ Unsupported path command: ${command}`);
          break;
      }
    }
    
    console.log(`📊 Parsed ${commands.length} path commands`);
    return commands;
  }
  
  /**
   * Parse points attribute for polyline/polygon
   */
  private parsePointsAttribute(points: string): { x: number; y: number }[] {
    const coords = points.trim().split(/[\s,]+/).map(parseFloat);
    const result = [];
    
    for (let i = 0; i < coords.length - 1; i += 2) {
      result.push({ x: coords[i], y: coords[i + 1] });
    }
    
    return result;
  }
  
  /**
   * Approximate bezier curve with line segments
   */
  private approximateBezier(x0: number, y0: number, x1: number, y1: number, 
                           x2: number, y2: number, x3: number, y3: number): { x: number; y: number }[] {
    const points = [];
    const steps = 10; // Number of approximation steps
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      
      const x = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
      const y = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
      
      points.push({ x, y });
    }
    
    return points;
  }
}
