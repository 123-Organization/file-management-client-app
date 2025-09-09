/**
 * Test SVG Creator - Generate SVG files for testing conversion
 */

export class TestSVGCreator {
  
  /**
   * Create a simple SVG with basic shapes (should use vector conversion)
   */
  static createSimpleSVG(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect x="0" y="0" width="400" height="300" fill="#f0f8ff"/>
  
  <!-- Simple shapes -->
  <rect x="50" y="50" width="100" height="80" fill="#ff6b6b" stroke="#d63384" stroke-width="2"/>
  <circle cx="250" cy="90" r="40" fill="#4ecdc4" stroke="#20c997" stroke-width="3"/>
  <ellipse cx="320" cy="200" rx="60" ry="30" fill="#ffe66d" stroke="#ffc107" stroke-width="2"/>
  <line x1="50" y1="200" x2="150" y2="250" stroke="#6f42c1" stroke-width="4"/>
  
  <!-- Text -->
  <text x="200" y="270" font-size="20" fill="#212529" text-anchor="middle">Simple SVG Test</text>
</svg>`;
  }

  /**
   * Create a complex SVG with paths and gradients (should use raster conversion)
   */
  static createComplexSVG(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4ecdc4;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background with gradient -->
  <rect width="400" height="300" fill="url(#grad1)"/>
  
  <!-- Complex path -->
  <path d="M 50 150 Q 100 50 150 150 T 250 150" stroke="#fff" stroke-width="3" fill="none"/>
  
  <!-- Polygon -->
  <polygon points="300,50 350,100 325,150 275,150 250,100" fill="#ffe66d" stroke="#ffc107" stroke-width="2"/>
  
  <!-- Transformed elements -->
  <g transform="rotate(45 200 200)">
    <rect x="180" y="180" width="40" height="40" fill="#6f42c1"/>
  </g>
  
  <!-- Text with effects -->
  <text x="200" y="270" font-size="24" fill="#fff" text-anchor="middle" filter="url(#shadow)">Complex SVG Test</text>
</svg>`;
  }

  /**
   * Create and download an SVG file for testing
   */
  static downloadTestSVG(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Create a File object from SVG content for direct testing
   */
  static createSVGFile(content: string, filename: string): File {
    const blob = new Blob([content], { type: 'image/svg+xml' });
    return new File([blob], filename, { type: 'image/svg+xml' });
  }

  /**
   * Create a simple EPS file for testing
   */
  static createSimpleEPS(): string {
    return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 400 300
%%Creator: Test EPS Creator
%%Title: Simple Test EPS
%%CreationDate: ${new Date().toISOString()}
%%EndComments

% Set white background
1 1 1 setrgbcolor
0 0 400 300 rectfill

% Draw a red rectangle
1 0 0 setrgbcolor
50 50 100 80 rectfill

% Draw a green rectangle  
0 1 0 setrgbcolor
200 50 100 80 rectfill

% Draw a blue rectangle
0 0 1 setrgbcolor
100 150 100 80 rectfill

% Draw black border
0 0 0 setrgbcolor
2 setlinewidth
newpath
10 10 moveto
390 10 lineto
390 290 lineto
10 290 lineto
closepath
stroke

showpage
%%EOF`;
  }

  /**
   * Create a complex EPS file for testing
   */
  static createComplexEPS(): string {
    return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 400 300
%%Creator: Test EPS Creator (Complex)
%%Title: Complex Test EPS
%%CreationDate: ${new Date().toISOString()}
%%DocumentData: Clean7Bit
%%LanguageLevel: 2
%%EndComments

% Complex EPS with gradients and patterns
/mydict 20 dict def
mydict begin

% Define gradient function
/mygradient {
  /Device setcolorspace
  << /ShadingType 2
     /ColorSpace /DeviceRGB
     /Coords [0 0 400 300]
     /Function << /FunctionType 2
                  /Domain [0 1]
                  /C0 [1 0.5 0]
                  /C1 [0 0.5 1]
                  /N 1 >>
  >> shfill
} def

% Background gradient
gsave
mygradient
grestore

% Complex path with curves
newpath
1 0 0 setrgbcolor
2 setlinewidth
50 150 moveto
100 100 150 200 200 150 curveto
250 100 300 200 350 150 curveto
stroke

% Pattern fill
gsave
/Pattern setcolorspace
<< /PatternType 1
   /PaintType 1
   /TilingType 1
   /BBox [0 0 20 20]
   /XStep 20
   /YStep 20
   /PaintProc { 
     pop
     newpath
     0 0 20 20 rectfill
     1 1 1 setrgbcolor
     newpath
     10 10 5 0 360 arc
     fill
   }
>> matrix makepattern setcolor

100 100 200 100 rectfill
grestore

% Text with effects
/Helvetica-Bold findfont 24 scalefont setfont
0 0 0 setrgbcolor
gsave
200 50 translate
30 rotate
0 0 moveto
(Complex EPS) show
grestore

end
showpage
%%EOF`;
  }

  /**
   * Download EPS test file
   */
  static downloadTestEPS(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/postscript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// Helper functions for console testing
(window as any).createTestSVGs = () => {
  console.log('📝 Creating test SVG files...');
  
  // Simple SVG (should use vector conversion)
  const simpleSVG = TestSVGCreator.createSimpleSVG();
  TestSVGCreator.downloadTestSVG(simpleSVG, 'simple-test.svg');
  
  // Complex SVG (should use raster conversion)
  const complexSVG = TestSVGCreator.createComplexSVG();
  TestSVGCreator.downloadTestSVG(complexSVG, 'complex-test.svg');
  
  console.log('✅ Test SVG files downloaded!');
  console.log('   📁 simple-test.svg - Should use VECTOR conversion');
  console.log('   📁 complex-test.svg - Should use RASTER conversion');
};

(window as any).createTestEPS = () => {
  console.log('📝 Creating test EPS files...');
  
  // Simple EPS 
  const simpleEPS = TestSVGCreator.createSimpleEPS();
  TestSVGCreator.downloadTestEPS(simpleEPS, 'simple-test.eps');
  
  // Complex EPS
  const complexEPS = TestSVGCreator.createComplexEPS();
  TestSVGCreator.downloadTestEPS(complexEPS, 'complex-test.eps');
  
  console.log('✅ Test EPS files downloaded!');
  console.log('   📁 simple-test.eps - Should try Direct Image or HTML Wrapper');
  console.log('   📁 complex-test.eps - Should fall back to Informational PDF');
};

(window as any).createAllTestFiles = () => {
  (window as any).createTestSVGs();
  (window as any).createTestEPS();
};

console.log('🧪 File Test Helper loaded!');
console.log('💡 Available commands:');
console.log('   📁 createTestSVGs() - Generate test SVG files');
console.log('   📁 createTestEPS() - Generate test EPS files');
console.log('   📁 createAllTestFiles() - Generate both SVG and EPS test files');
console.log('   ⚡ window.skipPdfConfirmation = true - Auto-continue uploads (skip confirmation)');
console.log('   🛑 window.skipPdfConfirmation = false - Show confirmation dialog (default)');

