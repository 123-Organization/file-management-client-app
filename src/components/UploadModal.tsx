import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Typography, Checkbox, Modal, Button, message, Alert, Spin } from 'antd';
import ImageUploading, { ErrorsType } from 'react-images-uploading';
import {
  StopOutlined
} from '@ant-design/icons';
import { useDynamicData } from '../context/DynamicDataProvider';
import { flushSync } from 'react-dom';
import { Uploader } from '../helpers/fileUploader';
import { makeUniqueFileName, osName } from '../helpers/fileHelper';
import { PDFProcessor, isPdfFile } from '../helpers/pdfProcessor';
import { PDFFileUploader } from '../helpers/pdfFileUploader';
import { isEpsFile } from '../helpers/epsConverterNew';
import { isSvgFile as isSvgFileHelper } from '../helpers/svgConverterNew';
import UppyUploadBox from './UppyUploadBox';
import config  from "../config/configs";
import { sendEvent } from '../helpers/GA4Events';
import tiffDefault from "../assets/images/tiff_default.png"

// File type icons for non-image files
const FileTypeIcon = ({ fileType, fileName }: { fileType: string, fileName: string }) => {
  const getFileIcon = () => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (extension === 'pdf' || fileType === 'application/pdf') {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-red-50 border-2 border-red-200 rounded-lg aspect-square">
          <div className="text-red-600 text-4xl mb-2">📄</div>
          <div className="text-red-600 font-semibold text-sm">PDF</div>
          <div className="text-gray-500 text-xs mt-1 px-2 text-center truncate max-w-full">
            {fileName}
          </div>
        </div>
      );
    }
    
    if (extension === 'eps' || fileType === 'application/postscript') {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-purple-50 border-2 border-purple-200 rounded-lg aspect-square">
          <div className="text-purple-600 text-4xl mb-2">🖼️</div>
          <div className="text-purple-600 font-semibold text-sm">EPS</div>
          <div className="text-gray-500 text-xs mt-1 px-2 text-center truncate max-w-full">
            {fileName}
          </div>
        </div>
      );
    }
    
    if (extension === 'svg' || fileType === 'image/svg+xml') {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-green-50 border-2 border-green-200 rounded-lg aspect-square">
          <div className="text-green-600 text-4xl mb-2">🖼️</div>
          <div className="text-green-600 font-semibold text-sm">SVG</div>
          <div className="text-gray-500 text-xs mt-1 px-2 text-center truncate max-w-full">
            {fileName}
          </div>
        </div>
      );
    }
    
    // Default fallback for other file types
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 border-2 border-gray-200 rounded-lg aspect-square">
        <div className="text-gray-600 text-4xl mb-2">📁</div>
        <div className="text-gray-600 font-semibold text-sm">FILE</div>
        <div className="text-gray-500 text-xs mt-1 px-2 text-center truncate max-w-full">
          {fileName}
        </div>
      </div>
    );
  };

  return getFileIcon();
};

const contentFlagLongFileName:string = 'File name is too long. Please shorten the filename and try again.'
// const { Title, Text } = Typography;
let OsName = osName();

interface UploadModalProps {
  openModel?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
}

const UploadModal = ({ openModel=false, setOpen=(val)=>val }: UploadModalProps) => {

  const maxNumber = 25;
  const maxFileSize = 1024 * 1024 * 500 * 20; //40 MB

  const [successImagesList, setSuccessImagesList] = React.useState<string[]>([]);
  const [images, setImages] = React.useState([]);
  const [uploaders, setUploaders] = React.useState<object[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const [imagesProgress, setImagesProgress] = React.useState<number[]>([]);
  const [imageListModal, setImageListModal] = React.useState<boolean>(false);
  const [imageListEvent, setImageListEvent] = React.useState<boolean>(false);
  const [imageListEventLoad, setImageListEventLoad] = useState<boolean>(false);
  const [componentDisabled, setComponentDisabled] = useState<boolean>(true);

  const dynamicData: any = useDynamicData();
  const { referrer, userInfo } = dynamicData.state;

  const [loading, setLoading] = useState(false);
  const [flagLongFileName, setFlagLongFileName] = useState<boolean>(false);
  const [uploadErrors, setUploadErrors] = useState<any>(null);
  const [unifiedInput, setUnifiedInput] = useState<HTMLInputElement | null>(null);
  const handleOk = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setImageListModal(false);
    }, 3000);
  };

  
  //!images.length && imageListModal && setImageListModal(false);
  const handleCancel = () => {
    setOpen(false);
  };


  const handleChange = (value: string) => {
    console.log(`selected ${value}`);
  };

  const setUploadImageModal = (imageList: any, modal: boolean) => {
    flushSync(() => {
      setImages(imageList);
      setImageListModal(modal) 
      
    });  
  }

  const flushImagesProgress = (arrPercentage: number[]) => {
    flushSync(() => {
      setTimeout(() => {
        setImagesProgress(arrPercentage)
      }, 1000);
    });  
  }

  const onChange = async(imageList: any, addUpdateIndex: any) => {
    console.log('onChange called with imageList:', imageList);
    
    // Clear any existing upload errors when new files are selected
    setUploadErrors(null);
    
    imageList = imageList.filter((img:any, i:number) => {
      console.log('Processing file:', img.file.name, 'type:', img.file.type);
      
      if(img.file.name.length > config.MAX_CHARACTER_FILENAME) {
        console.log('file error',img)
        
        if(!flagLongFileName) setFlagLongFileName(true);
        return false;
      }
      return true;
    })

    if(flagLongFileName) {
      setTimeout(() => {
        setFlagLongFileName(false);
      }, 10000);
    }
    if(!imageList.length) return false;
    if(!imagesProgress.length){
      
      setImagesProgress([...new Array(maxNumber)].fill(0,0,(imageList.length)));
    }
    setUploadImageModal(imageList,true);
    console.log('imageList after filtering....',imageList)
    if(imageListModal) { console.log('change event aborted'); return true; }
    
    //@ts-ignore
    const uploadPromises = imageList.map((img, i) => {
      console.log('Creating upload promise for:', img?.file?.name, 'type:', img?.file?.type);
      return uploadImage(img?.file,i);
    });

    await Promise.allSettled(uploadPromises)
      .then((results) => {
          results.forEach((result) => console.log('result.status',result.status))

          console.log('All settled result.status')  
        } 
      )

     
  }
  

  // Helper function to check if file is SVG
  const isSvgFile = (file: any) => {
    return isSvgFileHelper(file);
  }

  // Helper function to strip hash values from filenames
  const stripHashFromFilename = (filename: string): string => {
    console.log(`🔧 Original filename: ${filename}`);
    
    // Get file extension
    const lastDotIndex = filename.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    
    console.log(`   📄 Name without extension: ${nameWithoutExt}`);
    console.log(`   📄 Extension: ${extension}`);
    
    let cleanName = nameWithoutExt;
    
    // LEADING HASH PATTERNS (new patterns for hashes at the beginning):
    // 1. Leading hash with double underscore: "H176002157927998856__Heat Sub Sample" -> "Heat Sub Sample"
    cleanName = cleanName.replace(/^[A-Z0-9]+__/, '');
    
    // 2. Leading hash with single underscore: "H176002157927998856_Heat Sub Sample" -> "Heat Sub Sample"  
    cleanName = cleanName.replace(/^[A-Z0-9]+_/, '');
    
    // 3. Leading hash with dash: "H176002157927998856-Heat Sub Sample" -> "Heat Sub Sample"
    cleanName = cleanName.replace(/^[A-Z0-9]+-/, '');
    
    // 4. Leading alphanumeric hash (10+ chars): "abc123def456Heat Sub Sample" -> "Heat Sub Sample"
    cleanName = cleanName.replace(/^[a-zA-Z0-9]{10,}([A-Z][a-z])/, '$1');
    
    // TRAILING HASH PATTERNS (existing patterns):
    // Remove UUID-like patterns (8-4-4-4-12 format)
    cleanName = cleanName.replace(/-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, '');
    
    // Remove timestamp-like patterns (14+ digits)
    cleanName = cleanName.replace(/-\d{14,}$/, '');
    
    // Remove hash patterns with dash (6+ alphanumeric characters)
    cleanName = cleanName.replace(/-[a-zA-Z0-9]{6,}$/, '');
    
    // Remove hash patterns with underscore (6+ alphanumeric characters)
    cleanName = cleanName.replace(/_[a-zA-Z0-9]{6,}$/, '');
    
    // Remove hash in parentheses
    cleanName = cleanName.replace(/\([a-zA-Z0-9]{6,}\)$/, '');
    
    // Remove hash in brackets
    cleanName = cleanName.replace(/\[[a-zA-Z0-9]{6,}\]$/, '');
    
    // CLEANUP:
    // Remove # characters (as specifically requested)
    cleanName = cleanName.replace(/#/g, '');
    
    // Remove multiple consecutive dashes/underscores and trim
    cleanName = cleanName.replace(/[-_]+$/, '').replace(/^[-_]+/, '').trim();
    
    // Remove extra spaces
    cleanName = cleanName.replace(/\s+/g, ' ').trim();
    
    // If name becomes empty, use a default
    if (!cleanName) {
      cleanName = 'file';
    }
    
    const cleanFilename = cleanName + extension;
    console.log(`   ✨ Clean filename: ${cleanFilename}`);
    
    return cleanFilename;
  };

  // Test function for hash stripping (can be called from console)
  const testHashStripping = () => {
    const testFilenames = [
      'H176002157927998856__Heat Sub Sample #3.jpg', // Your specific case
      'ABC123456789__Document Name.pdf',
      'H12345__File Name #2.png',
      'document-abc123.pdf',
      'image_hash456.jpg',
      'file(xyz789).png',
      'report[def123].docx',
      'photo-12345678-1234-1234-1234-123456789abc.jpg',
      'data-20231009123456.csv',
      'normal-file.txt',
      'file-with-multiple-dashes.pdf',
      'file_with_underscores.jpg'
    ];
    
    console.log('🧪 Testing hash stripping:');
    testFilenames.forEach(filename => {
      const cleaned = stripHashFromFilename(filename);
      console.log(`   ${filename} → ${cleaned}`);
    });
  };

  // Make test function available globally for console testing
  (window as any).testHashStripping = testHashStripping;

  // Helper function to get proper src for image display
  const getSrcForImage = (image: any) => {
    // Handle TIFF files
    if (image['data_url'] && image['data_url'].includes("image/tif")) {
      return tiffDefault;
    }
    
    // Handle SVG files - use object URL for reliable display
    if (isSvgFile(image.file) && image.file) {
      // For SVG files, use URL.createObjectURL for reliable display
      try {
        return URL.createObjectURL(image.file);
      } catch (error) {
        console.error('Error creating SVG object URL:', error);
        // Fallback to data_url if available
        return image['data_url'] || '';
      }
    }
    
    // Default case for other image types
    return image['data_url'] || '';
  }

  // Helper function to check if file needs a custom icon (non-displayable files)
  const needsCustomIcon = (file: any) => {
    if (!file) return false;
    
    const fileName = file.name || '';
    const fileType = file.type || '';
    const extension = fileName.toLowerCase().split('.').pop();
    
    // Files that can't be displayed as images and need custom icons
    // SVG removed from this list since browsers can display SVG files
    return (
      extension === 'pdf' || fileType === 'application/pdf' ||
      extension === 'eps' || fileType === 'application/postscript'
    );
  }

  // Helper function to check if file is PNG
  const isPngFile = (file: any) => {
    return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  }

  // Helper function to check if file is PDF
  const isPdfFileType = (file: any) => {
    if (!file) return false;
    const fileName = file.name || '';
    const fileType = file.type || '';
    
    // Check both MIME type and file extension
    const isPdfByType = fileType === 'application/pdf' || 
                       fileType === 'application/x-pdf' || 
                       fileType === 'application/acrobat' ||
                       fileType === 'text/pdf';
    const isPdfByExtension = fileName.toLowerCase().endsWith('.pdf');
    
    console.log(`🔍 PDF Check for ${fileName}:`);
    console.log(`   MIME type: ${fileType}`);
    console.log(`   Is PDF by type: ${isPdfByType}`);
    console.log(`   Is PDF by extension: ${isPdfByExtension}`);
    console.log(`   Original isPdfFile result: ${isPdfFile(file)}`);
    
    return isPdfByType || isPdfByExtension;
  }

  // Helper function to check if file is EPS
  const isEpsFileType = (file: any) => {
    return isEpsFile(file);
  }

  // PDF download functionality removed - uploads proceed directly

  // PDF confirmation dialog removed - uploads proceed automatically

  // NOTE: EPS files now upload directly without conversion - this function is no longer used
  // const uploadEpsFile = async(file: any, addUpdateIndex: any) => {
  //   try {
  //     console.log('🚀 uploadEpsFile called - Converting EPS to PDF:', file.name, 'size:', file.size, 'type:', file.type);
      
  //     // Show initial conversion progress
  //     imagesProgress[addUpdateIndex] = 10;
  //     flushImagesProgress(imagesProgress);
  //     setImageListEvent(true);
  //     
  //     // Show conversion start message
  //     messageApi.open({
  //       type: 'info',
  //       content: `Converting EPS file: ${file.name}`,
  //       duration: 3
  //     });
  //     
  //     // Convert EPS to PDF
  //     const epsConverter = new EPSConverter();
  //     const startTime = Date.now();
  //     const conversionResult = await epsConverter.convertToPDF(file);
  //     const conversionTime = Date.now() - startTime;
  //     
  //     console.log('📊 EPS Conversion Results:');
  //     console.log(`   ✅ Converted to: ${conversionResult.fileName}`);
  //     console.log(`   🔧 Method used: ${conversionResult.conversionMethod}`);
  //     console.log(`   ⏱️ Conversion time: ${conversionTime}ms`);
  //     console.log(`   📏 Original size: ${(conversionResult.originalSize / 1024).toFixed(2)} KB`);
  //     console.log(`   📦 PDF size: ${(conversionResult.convertedSize / 1024).toFixed(2)} KB`);
  //     console.log(`   🔄 Size change: ${conversionResult.convertedSize > conversionResult.originalSize ? '+' : ''}${(((conversionResult.convertedSize - conversionResult.originalSize) / conversionResult.originalSize) * 100).toFixed(1)}%`);
  //     
  //     // Download converted PDF locally for inspection
  //     downloadConvertedPdf(conversionResult.pdfBlob, conversionResult.fileName);
  //     
  //     // Show conversion success message with method info
  //     messageApi.open({
  //       type: 'success',
  //       content: `EPS converted to PDF using ${conversionResult.conversionMethod}! (${conversionTime}ms)`,
  //       duration: 8
  //     });
  //     
  //     // Add a small delay to allow user to check the downloaded file
  //     console.log('⏳ Pausing 3 seconds to allow PDF inspection...');
  //     console.log('💡 Check your Downloads folder and open the PDF to verify quality');
  //     await new Promise(resolve => setTimeout(resolve, 3000));
  //     
  //     // Optional: Add user confirmation dialog (can be disabled via console)
  //     // Set window.skipPdfConfirmation = true to bypass this dialog for testing
  //     const skipConfirmation = (window as any).skipPdfConfirmation === true;
  //     
  //     if (!skipConfirmation) {
  //       const shouldContinue = await showPdfConfirmationDialog(conversionResult.fileName);
  //       if (!shouldContinue) {
  //         console.log('❌ User cancelled upload after PDF inspection');
  //         messageApi.open({
  //           type: 'info',
  //           content: 'Upload cancelled - PDF downloaded for inspection',
  //           duration: 4
  //         });
  //         return;
  //       }
  //     } else {
  //       console.log('⚡ Skipping PDF confirmation dialog (auto-continue enabled)');
  //       messageApi.open({
  //         type: 'info',
  //         content: 'Auto-continuing upload (confirmation disabled)',
  //         duration: 2
  //       });
  //     }
  //     
  //     // Update progress after conversion and pause
  //     imagesProgress[addUpdateIndex] = 30;
  //     flushImagesProgress(imagesProgress);
  //     setImageListEvent(true);
  //     
  //     // Create a File object from the PDF blob
  //     const pdfFile = new File([conversionResult.pdfBlob], conversionResult.fileName, {
  //       type: 'application/pdf'
  //     });
  //     
  //     console.log('📄 Created PDF File object:', {
  //       name: pdfFile.name,
  //       size: pdfFile.size,
  //       type: pdfFile.type,
  //       lastModified: pdfFile.lastModified
  //     });
  //     
  //     // Upload the converted PDF directly (not as extracted PNG pages)
  //       await uploadConvertedPdfFile(pdfFile, addUpdateIndex);
      
  //   } catch (error) {
  //     console.error('❌ EPS conversion error:', error);
  //     messageApi.open({
  //       type: 'error',
  //       content: `Failed to convert EPS: ${error instanceof Error ? error.message : 'Unknown error'}`,
  //       duration: 8
  //     });
  //   }
  // }

  // NOTE: SVG files now upload directly without conversion - this function is no longer used
  // const uploadSvgFile = async(file: any, addUpdateIndex: any) => {
  //   try {
  //     console.log('🚀 uploadSvgFile called - Converting SVG to PDF:', file.name, 'size:', file.size, 'type:', file.type);
      
  //     // Show initial conversion progress
  //     imagesProgress[addUpdateIndex] = 10;
  //     flushImagesProgress(imagesProgress);
  //     setImageListEvent(true);
  //     
  //     // Show conversion start message
  //     messageApi.open({
  //       type: 'info',
  //       content: `Converting SVG file: ${file.name}`,
  //       duration: 3
  //     });
  //     
  //     // Convert SVG to PDF
  //     const svgConverter = new SVGConverter();
  //     const startTime = Date.now();
  //     const conversionResult = await svgConverter.convertToPDF(file);
  //     const conversionTime = Date.now() - startTime;
  //     
  //     console.log('📊 SVG Conversion Results:');
  //     console.log(`   ✅ Converted to: ${conversionResult.fileName}`);
  //     console.log(`   ⏱️ Conversion time: ${conversionTime}ms`);
  //     console.log(`   📏 Original size: ${(conversionResult.originalSize / 1024).toFixed(2)} KB`);
  //     console.log(`   📦 PDF size: ${(conversionResult.convertedSize / 1024).toFixed(2)} KB`);
  //     console.log(`   🔄 Size change: ${conversionResult.convertedSize > conversionResult.originalSize ? '+' : ''}${(((conversionResult.convertedSize - conversionResult.originalSize) / conversionResult.originalSize) * 100).toFixed(1)}%`);
  //     
  //     // Download converted PDF locally for inspection
  //     downloadConvertedPdf(conversionResult.pdfBlob, conversionResult.fileName);
  //     
  //     // Show conversion success message with download info
  //     messageApi.open({
  //       type: 'success',
  //       content: `SVG converted to PDF successfully! (${conversionTime}ms) - Downloaded to check quality`,
  //       duration: 8
  //     });
  //     
  //     // Add a small delay to allow user to check the downloaded file
  //     console.log('⏳ Pausing 3 seconds to allow PDF inspection...');
  //     console.log('💡 Check your Downloads folder and open the PDF to verify quality');
  //     await new Promise(resolve => setTimeout(resolve, 3000));
  //     
  //     // Optional: Add user confirmation dialog (can be disabled via console)
  //     // Set window.skipPdfConfirmation = true to bypass this dialog for testing
  //     const skipConfirmation = (window as any).skipPdfConfirmation === true;
  //     
  //     if (!skipConfirmation) {
  //       const shouldContinue = await showPdfConfirmationDialog(conversionResult.fileName);
  //       if (!shouldContinue) {
  //         console.log('❌ User cancelled upload after PDF inspection');
  //         messageApi.open({
  //           type: 'info',
  //           content: 'Upload cancelled - PDF downloaded for inspection',
  //           duration: 4
  //         });
  //         return;
  //       }
  //     } else {
  //       console.log('⚡ Skipping PDF confirmation dialog (auto-continue enabled)');
  //       messageApi.open({
  //         type: 'info',
  //         content: 'Auto-continuing upload (confirmation disabled)',
  //         duration: 2
  //       });
  //     }
  //     
  //     // Update progress after conversion and pause
  //     imagesProgress[addUpdateIndex] = 30;
  //     flushImagesProgress(imagesProgress);
  //     setImageListEvent(true);
  //     
  //     // Create a File object from the PDF blob
  //     const pdfFile = new File([conversionResult.pdfBlob], conversionResult.fileName, {
  //       type: 'application/pdf'
  //     });
  //     
  //     console.log('📄 Created PDF File object:', {
  //       name: pdfFile.name,
  //       size: pdfFile.size,
  //       type: pdfFile.type,
  //       lastModified: pdfFile.lastModified
  //     });
  //     
  //     // Upload the converted PDF directly (not as extracted PNG pages)
  //       await uploadConvertedPdfFile(pdfFile, addUpdateIndex);
      
  //   } catch (error) {
  //     console.error('❌ SVG conversion error:', error);
  //     messageApi.open({
  //       type: 'error',
  //       content: `Failed to convert SVG: ${error instanceof Error ? error.message : 'Unknown error'}`,
  //       duration: 8
  //     });
  //   }
  // }

  // Upload converted PDF file directly (for SVG/EPS conversions)
  const uploadConvertedPdfFile = async (file: File, addUpdateIndex: number) => {
    try {
      console.log('📤 Uploading converted PDF directly:', file.name);
      
      // Strip hash from filename before uploading
      const cleanFileName = stripHashFromFilename(file.name);
      console.log('Clean converted PDF filename:', cleanFileName);
      
      // Get user info from localStorage
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      const libraryAccountKey = localStorage.getItem('libraryAccountKey') || '';
      
      // Use the regular file uploader for the PDF blob
      const uploaderOptions = {
        file: file,
        fileName: cleanFileName,
        fileType: file.type,
        basecampProjectID: Math.floor(Math.random() * 100000).toString(),
        fileLibrary: 'temporary',
        userInfo: userInfo,
        isSvg: false,
        isEps: true, // Mark as EPS-converted file
        onProgressFn: (progress: number) => {
          console.log(`📊 PDF Upload Progress: ${progress}%`);
          imagesProgress[addUpdateIndex] = 30 + (progress * 0.7); // 30% base + 70% for upload
          flushImagesProgress(imagesProgress);
          setImageListEvent(true);
        }
      };

      const uploader = new Uploader(uploaderOptions);
      
      await uploader.initialize();
      
      console.log('✅ Converted PDF uploaded successfully');
      
      // Final progress update
      imagesProgress[addUpdateIndex] = 100;
      flushImagesProgress(imagesProgress);
      setImageListEvent(true);
      
    } catch (error) {
      console.error('❌ Failed to upload converted PDF:', error);
      messageApi.open({
        type: 'error',
        content: `Failed to upload converted PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 8
      });
      
      // Reset progress on error
      imagesProgress[addUpdateIndex] = 0;
      flushImagesProgress(imagesProgress);
      setImageListEvent(true);
      
      throw error;
    }
  }

  const uploadPdfFile = async(file: any, addUpdateIndex: any) => {
    try {
      console.log('uploadPdfFile called - Processing PDF file:', file.name, 'size:', file.size, 'type:', file.type);
      
      // Strip hash from filename before processing
      const cleanFileName = stripHashFromFilename(file.name);
      console.log('Clean PDF filename:', cleanFileName);
      
      // Create a new file object with clean filename
      const cleanFile = new File([file], cleanFileName, { type: file.type });
      
      // Process PDF and extract pages
      const pdfProcessor = new PDFProcessor(
        cleanFile,
        userInfo,
        (Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000)).toString(),
        userInfo.libraryName
      );
      
      console.log('PDFProcessor created, starting page extraction...');
      
      const pages = await pdfProcessor.extractPages();
      console.log(`PDF processed: ${pages.length} pages extracted`);
      
      console.log('✅ Proceeding with PDF upload...');
      
      // Create PDF uploader
      const pdfUploader = new PDFFileUploader();
      
      // Set up progress tracking
      pdfUploader
        .onProgress(({ percentage, currentPage, totalPages }) => {
          console.log(`PDF Upload Progress: ${percentage}% (Page ${currentPage}/${totalPages})`);
          imagesProgress[addUpdateIndex] = percentage;
          flushImagesProgress(imagesProgress);
          setImageListEvent(true);
        })
        .onError((error) => {
          console.error('PDF upload error:', error);
          let errorMessage = 'PDF upload failed';
          if (error?.message) {
            errorMessage = error.message;
          }
          messageApi.open({
            type: 'error',
            content: errorMessage,
            duration: 5
          });
        })
        .onSuccess(({ totalPages }) => {
          console.log(`PDF upload successful: ${totalPages} pages uploaded`);
          
          // Set progress to 100% for completion
          imagesProgress[addUpdateIndex] = 100;
          flushImagesProgress(imagesProgress);
          setImageListEvent(true);
          
          // For PDF uploads, add only one GUID to match the single file in images array
          const pdfGuid = `pdf-complete-${Date.now()}`;
          setSuccessImagesList(prevList => [...prevList, pdfGuid]);
          
          // Trigger the file upload completed event
          fileManagerAppFileUploadedEvent();
          setImageListEventLoad(true);
          
          messageApi.open({
            type: 'success',
            content: `PDF uploaded successfully: ${totalPages} pages processed`,
            duration: 5
          });
        });
      
      // Start PDF upload
      await pdfUploader.uploadPDFPages(pages);
      
    } catch (error) {
      console.error('PDF processing error:', error);
      messageApi.open({
        type: 'error',
        content: `Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5
      });
    }
  }

  const uploadRegularFile = async(file: any, addUpdateIndex: any) => {
    // This function handles regular file upload (including EPS files until backend conversion is ready)
    let percentage: any = 0

    const cleanFileName = stripHashFromFilename(file.name);
    const uniqueFileName = makeUniqueFileName(cleanFileName);
    
    console.log('🔧 Regular file processing:');
    console.log('   Original:', file.name);
    console.log('   Clean:', cleanFileName);
    console.log('   Unique:', uniqueFileName);
    
    const videoUploaderOptions = {
      fileName: uniqueFileName,
      fileType: file.type,
      file,
      userInfo,
      basecampProjectID:(Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000)),
      fileLibrary:userInfo.libraryName,
      isSvg: isSvgFile(file),  // Add SVG flag to options
      isEps: isEpsFileType(file)  // Add EPS flag to options
    }

    const uploader = new Uploader(videoUploaderOptions)
    uploaders[addUpdateIndex] = uploader;
    setUploaders(uploaders);

    await uploader
      .onProgress(({ percentage: newPercentage }: any) => {
        // to avoid the same percentage to be logged twice
        setImageListEvent(false)
        if (newPercentage !== percentage) {
          imagesProgress[addUpdateIndex] = percentage = newPercentage
          console.log('percentage', `${percentage}%`)
          flushImagesProgress(imagesProgress);
          setImageListEvent(true)
        } 
      })
      .onError((error: any) => {
        console.error('error file upload', error)
        let errorMessage = 'File upload failed';
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        messageApi.open({
          type: 'error',
          content: errorMessage,
          duration: 5
        });
      })
      .onSuccess(({ response: newResponse, userInfo: updatedUserInfo }: any) => {
        console.log("Check on success function response", newResponse);
        console.log("Response data structure:", newResponse?.data);
        
        // Handle both v1 and v2 API response structures
        let guid: string | null = null;
        
        if (newResponse?.data?.result?.guid) {
          // Regular upload response structure
          guid = newResponse.data.result.guid;
          console.log("Found GUID in regular format:", guid);
        } else if (newResponse?.data?.guid) {
          // V2 API might return GUID directly
          guid = newResponse.data.guid;
          console.log("Found GUID in v2 format:", guid);
        } else if (newResponse?.data) {
          // Log the actual structure to understand v2 response
          console.log("Unknown response structure for file upload:", newResponse.data);
          // For now, generate a temporary GUID to make UI work
          guid = `file-${Date.now()}`;
          console.log("Using temporary GUID for file:", guid);
        }
        
        if (guid !== null) {
          setSuccessImagesList(prevList => [...prevList, guid as string]);
        }
      })

    return await uploader.start()
  }

  const uploadImage = async(file: any, addUpdateIndex: any) => {
    console.log('uploadImage called with file:', file?.name, 'type:', file?.type);
   
    if(imageListModal) { console.log('change event aborted') }
    if (file) {
      console.log('File details:', file);
      console.log('Is PDF file?', isPdfFileType(file));
      console.log('Is EPS file?', isEpsFileType(file));
      console.log('Is SVG file?', isSvgFile(file));
      
      // Handle SVG files - upload directly without conversion
      if (isSvgFile(file)) {
        console.log('Processing as SVG file - uploading directly...');
        return await uploadRegularFile(file, addUpdateIndex);
      }
      
      // Handle EPS files - upload directly without conversion
      if (isEpsFileType(file)) {
        console.log('Processing as EPS file - uploading directly...');
        return await uploadRegularFile(file, addUpdateIndex);
      }
      
      // Handle PDF files separately
      if (isPdfFileType(file)) {
        console.log('Processing as PDF file...');
        return await uploadPdfFile(file, addUpdateIndex);
      }
      
      let percentage: any = 0

     const cleanFileName = stripHashFromFilename(file.name);
     const uniqueFileName = makeUniqueFileName(cleanFileName);
     
     console.log('🔧 Filename processing:');
     console.log('   Original:', file.name);
     console.log('   Clean:', cleanFileName);
     console.log('   Unique:', uniqueFileName);

     const videoUploaderOptions = {
        fileName: uniqueFileName,
        fileType: file.type,
        file,
        userInfo,
        basecampProjectID:(Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000)),
        fileLibrary:userInfo.libraryName,
        isSvg: isSvgFile(file),  // Add SVG flag to options
        isEps: isEpsFileType(file)  // Add EPS flag to options
      }

      const uploader = new Uploader(videoUploaderOptions)
      uploaders[addUpdateIndex] = uploader;
      setUploaders(uploaders);

      await uploader
        .onProgress(({ percentage: newPercentage }: any) => {
          // to avoid the same percentage to be logged twice
          setImageListEvent(false)
          if (newPercentage !== percentage) {
            imagesProgress[addUpdateIndex] = percentage = newPercentage
            console.log('percentage', `${percentage}%`)
            flushImagesProgress(imagesProgress);
            setImageListEvent(true)
          } 
        })
        .onError((error: any) => {
          console.error('error file upload', error)
          let errorMessage = 'File upload failed';
          if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          messageApi.open({
            type: 'error',
            content: errorMessage,
            duration: 5
          });
          // Don't add to successImagesList since it failed
          // setSuccessImagesList(prevList => [...prevList, videoUploaderOptions.fileName]);
        })
        .onSuccess(({ response: newResponse, userInfo: updatedUserInfo }: any) => {
          console.log("Check on success function response", newResponse);
          console.log("Response data structure:", newResponse?.data);
          
          // Handle both v1 and v2 API response structures
          let guid: string | null = null;
          
          if (newResponse?.data?.result?.guid) {
            // Regular upload response structure
            guid = newResponse.data.result.guid;
            console.log("Found GUID in regular format:", guid);
          } else if (newResponse?.data?.guid) {
            // V2 API might return GUID directly
            guid = newResponse.data.guid;
            console.log("Found GUID in v2 format:", guid);
          } else if (newResponse?.data) {
            // Log the actual structure to understand v2 response
            console.log("Unknown response structure for SVG upload:", newResponse.data);
            // For now, generate a temporary GUID to make UI work
            guid = `svg-${Date.now()}`;
            console.log("Using temporary GUID for SVG:", guid);
          }
          
          if (guid !== null) {
            setSuccessImagesList(prevList => [...prevList, guid as string]);
          }
        })


      return await uploader.start()

    }
  }   


  useEffect(()=>{

    console.log(` handleRedirection `);
    if(images.length === successImagesList.length && successImagesList.length > 0){
      // Add a delay to allow for thumbnail generation
      setTimeout(async () => {
        setUploadImageModal([],false);
        setOpen(false);
        setImageListEventLoad(false);
        
        // First delay for thumbnail generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update filterUpdate with timestamp to trigger refresh
        let filterUpdate = Date.now().toString();
        let userInfoObj = {...userInfo, filterUpdate};
        await dynamicData.mutations.setUserInfoData(userInfoObj);
        
        // Second delay to ensure the gallery picks up the change
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        messageApi.open({
          type: 'success',
          content: 'File has been uploaded',
        });
        setTimeout(()=>{ messageApi.open({
          type: 'success',
          content: 'Large files may take a few minutes to process',
        });},2000)
        setSuccessImagesList([]);
      }, 1000);
    }
  },[successImagesList]);

  useEffect(() => {
    console.log(`UseEffect Called:  ${images} ${imagesProgress}`,images);
    if(images?.length){
      let totalProcess = imagesProgress.reduce((a,b) => Number(a)+Number(b));
      console.log('totalProcess',totalProcess)
      let totalImagesProgress = (imagesProgress.filter(imagesProgress => Number(imagesProgress)).length*100)
      console.log('totalImagesProgress',totalImagesProgress)
      
      if(totalProcess===totalImagesProgress){
       
        fileManagerAppFileUploadedEvent();
        setImageListEventLoad(true)

      }
    } else {
      setTimeout(() => {
        setUploadImageModal([],false)
      }, 1000);
    }
  }, [imagesProgress,imageListEvent]);

  const onError = (errors: ErrorsType) => {
    // data for submit
    console.log('onError called with errors:', errors);
    setUploadErrors(errors);
    
    // Log specific error types
    if (errors?.acceptType) {
      console.log('Accept type error - file type not allowed');
    }
    if (errors?.maxFileSize) {
      console.log('Max file size error');
    }
    if (errors?.maxNumber) {
      console.log('Max number error');
    }
    // setImageListModal(true)
  };

  const fileManagerAppFileUploadedEvent = () => {
    const eventName = "file_manager_app_file_uploaded";
    const eventParams = {
      'upload_complete': 'true'
    };
    sendEvent(userInfo.GAID,eventName,eventParams);
  }


  const onImageRemoveAllHandler = async() => {

     //@ts-ignore
     const abortUploadPromises = imageList.map((img, i) => onImageRemoveHandler(i));

     await Promise.allSettled(abortUploadPromises)
     //@ts-ignore
       .then((results) => results.forEach((result) => console.log(result.status)))
  }

  // Unified handler for all file types (images, PDF, EPS, SVG)
  const handleUnifiedUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 handleUnifiedUpload called!');
    const files = event.target.files;
    console.log('📁 Files from event:', files);
    console.log('📊 Number of files:', files ? files.length : 0);
    
    if (files && files.length > 0) {
      console.log('🔍 Files selected:', Array.from(files).map(f => `${f.name} (${f.type})`));
      
      // Debug each file type
      Array.from(files).forEach(file => {
        console.log(`📄 File: ${file.name}`);
        console.log(`   Type: ${file.type}`);
        console.log(`   Size: ${file.size} bytes`);
        console.log(`   Is PDF (type check): ${isPdfFileType(file)}`);
        console.log(`   Is EPS (type check): ${isEpsFileType(file)}`);
        console.log(`   Is SVG (type check): ${isSvgFile(file)}`);
      });
      
      // Clear any existing upload errors
      setUploadErrors(null);
      
      // Filter files by name length and supported types
      const validFiles = Array.from(files).filter(file => {
        // Check file name length
        if (file.name.length > config.MAX_CHARACTER_FILENAME) {
          console.log('File name too long:', file.name);
          if (!flagLongFileName) setFlagLongFileName(true);
          return false;
        }
        
        // Check if file type is supported
        console.log(`🔍 Checking file support for: ${file.name}`);
        const isPdf = isPdfFileType(file);
        const isEps = isEpsFileType(file);
        const isSvg = isSvgFile(file);
        const isImage = file.type.startsWith('image/');
        
        console.log(`   📄 Is PDF: ${isPdf}`);
        console.log(`   📄 Is EPS: ${isEps}`);
        console.log(`   📄 Is SVG: ${isSvg}`);
        console.log(`   📄 Is Image: ${isImage}`);
        
        const isSupported = isPdf || isEps || isSvg || isImage;
        console.log(`   📄 Overall supported: ${isSupported}`);
        
        if (!isSupported) {
          console.log(`❌ Unsupported file type: ${file.name} (${file.type})`);
          messageApi.error(`Unsupported file type: ${file.name}. Please select images, SVG, PDF, or EPS files.`);
          return false;
        }
        
        console.log(`✅ Supported file: ${file.name} (${file.type})`);
        return true;
      });
      
      if (flagLongFileName) {
        setTimeout(() => setFlagLongFileName(false), 10000);
      }
      
      if (validFiles.length === 0) return;
      
      // Create image list entries for all files
      const imageList = await Promise.all(validFiles.map(async (file) => {
        // Generate data_url for regular images (not PDF, EPS, or SVG)
        let data_url = null;
        
        if (file.type.startsWith('image/') && !isSvgFile(file)) {
          try {
            console.log(`📸 Generating thumbnail for image: ${file.name}`);
            data_url = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            console.log(`✅ Thumbnail generated for: ${file.name}`);
          } catch (error) {
            console.error(`❌ Failed to generate thumbnail for ${file.name}:`, error);
          }
        }
        
        return {
          file: file,
          data_url: data_url
        };
      }));
      
      // Set up progress tracking - always reset for new uploads
      console.log('🔄 Setting up progress tracking for', validFiles.length, 'files');
      setImagesProgress(new Array(validFiles.length).fill(0));
      
      console.log('📋 Setting up image modal with imageList:', imageList);
      console.log('📋 ImageList details:', imageList.map(img => ({
        fileName: img.file?.name,
        fileType: img.file?.type,
        hasDataUrl: !!img.data_url,
        dataUrlLength: img.data_url?.length || 0
      })));
      
      setUploadImageModal(imageList, true);
      console.log('✅ Image modal set up, processing files...');
      
      if (imageListModal) {
        console.log('Upload modal already open, aborting');
        return;
      }
      
      // Process each file
      const uploadPromises = validFiles.map((file, index) => {
        console.log(`🚀 Creating upload promise for: ${file.name} (${file.type})`);
        console.log(`   File index: ${index}`);
        console.log(`   Is PDF: ${isPdfFileType(file)}`);
        console.log(`   Is EPS: ${isEpsFileType(file)}`);
        console.log(`   Is SVG: ${isSvgFile(file)}`);
        return uploadImage(file, index);
      });
      
      Promise.allSettled(uploadPromises)
        .then((results) => {
          results.forEach((result) => console.log('Upload result:', result.status));
          console.log('All uploads completed');
        });
    } else {
      console.log('❌ No files selected or files is null');
      if (files) {
        console.log('📊 Files array exists but length is:', files.length);
      }
    }
    
    // Reset the input value to allow selecting the same file again
    console.log('🔄 Resetting input value...');
    event.target.value = '';
  }

  const onImageRemoveHandler = async(index: number) => {
    const uploader = uploaders[index];
    console.log(uploader);
    //@ts-ignore
    console.log('uploader.completeResponse',uploader.completeResponse);
    //@ts-ignore
    console.log('uploader.basecampProjectID',uploader.basecampProjectID);
    //@ts-ignore
    console.log('completeResponseData',uploader.completeResponse[uploader.basecampProjectID]);
    //@ts-ignore
    await uploader.abort();
    //@ts-ignore
    uploader.aborted = true;
    uploaders[index] = uploader;
    setUploaders(uploaders);

    // if(index!=(imagesProgress.length-1)){
      //imagesProgress.splice(index, 1);
      imagesProgress[index] = 100;
      imagesProgress.filter(imagesProgress => Boolean(imagesProgress))
      //imagesProgress[index] = imagesProgress[index+1]
      //imagesProgress[index+1] = 0
      console.log('onImageRemoveHandler', imagesProgress)
      flushImagesProgress(imagesProgress);
    // }

  }

  const handleSelect = (index: number) => {
    const nextImages = images.map((image, i) =>
      i === index ? { ...images, isSelected: !image['isSelected'] } : image
    );
    // setImages(nextImages);
    const hasSelected = nextImages.some((image) => image.isSelected);
    const referrerObj = {hasSelected}
    console.log('referrer',referrer)
    console.log('referrerObj',referrerObj)

    let isUpdated = referrerObj.hasSelected !== referrer.hasSelected;
    console.log('isUpdated',isUpdated)

    isUpdated && dynamicData.mutations.setReferrerData(referrerObj);


  };

  console.log('bebe',images)
  
  return (
    <>
      <style>{`
        .png-dotted-bg {
          background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px);
          background-size: 8px 8px;
          background-color: rgba(229, 231, 235, 0.1);
        }
        .png-dotted-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(circle, #9ca3af 1px, transparent 1px);
          background-size: 6px 6px;
          opacity: 0.3;
          border-radius: inherit;
          pointer-events: none;
        }
        
        .svg-preview-bg {
          background-color: #f8f9fa;
        }
        
        .svg-preview-bg img {
          background-color: white;
          border: 1px solid #e9ecef;
        }
      `}</style>
      <Modal
        style={{ height: '80%' }}
        title={<h1 className=' text-gray-500'>Upload File</h1>}
        centered
        open={openModel}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        width={'99%'}
        footer={''}
        className='min-w-[350px]'
      >
      <div className='max-lg:flex1 '>
      <div className="p-8 max-lg:flex max-lg:flex-col uppy-Manual items-center  bg-white">
        { 
          !componentDisabled
          ? <>
            <div className='flex whitespace-pre max-lg:absolute max-lg:left-8 justify-items-start lg:p-10 '>
              <Spin tip="Please check below terms to proceed..." ><></></Spin>
            </div>
          </>
          :<div className="w-full disabled  relative lg:grid grid-cols-1 lg:grid-cols-31 lg:border rounded-lg">
            <div
              className="first-flex-div lg:rounded-l-lg p-4 flex flex-col justify-center items-center border-0  border-gray-300 ">
              {uploadErrors && <div className='text-red-500 font-medium'>
                  {uploadErrors.maxNumber && <span>Number of selected images exceed maxNumber {maxNumber}<br /></span>}
                  {uploadErrors.acceptType && <span>Your selected file type is not allow<br /></span>}
                  {uploadErrors.maxFileSize && <span>Selected file size exceed maxFileSize ({humanFileSize(maxFileSize)})<br /></span>}
                  {uploadErrors.resolution && <span>Selected file is not match your desired resolution<br /></span>}
                </div>
              }
              {flagLongFileName && <Alert message={contentFlagLongFileName} type="warning" showIcon closable />} 
              {/* <label className="cursor-pointer hover:opacity-80 inline-flex items-center 
              shadow-md my-4 px-8 py-4 bg-green-400 text-gray-50 border border-transparent
              rounded-md font-semibold text-base  hover:bg-green-300 active:bg-green-300 focus:outline-none 
            focus:border-green-200 focus:ring ring-green-200 disabled:opacity-25 transition ease-in-out duration-150" htmlFor="uploadImage">
               */}
              {/* <input id="uploadImage" className="text-sm cursor-pointer w-36 hidden" type="file" /> */}
              {imagesProgress && <ImageUploading
                multiple
                value={images}
                onChange={() => {}} // Disabled - using custom handler
                onError={onError}
                maxNumber={maxNumber}
                dataURLKey="data_url"
                maxFileSize={maxFileSize}
                acceptType={['jpg','jpeg', 'bmp', 'png', 'tif', 'tiff','zip','eps','pdf']} // Keep for compatibility
              >
                {({
                  imageList,
                  onImageUpload,
                  onImageRemoveAll,
                  onImageUpdate,
                  onImageRemove,
                  isDragging,
                  dragProps,
                  errors
                }) => (
                  // write your building UI
                  <div className="upload__image-wrapper text-center w-full">

                    <div className="relative">
                      {/* Custom file input that accepts all types */}
                      <input
                        type="file"
                        multiple
                        accept="*"
                        onChange={handleUnifiedUpload}
                        ref={(input) => setUnifiedInput(input)}
                        style={{ display: 'none' }}
                        id="unified-upload"
                      />
                      <div
                        onClick={() => {
                          console.log('🖱️ Upload button clicked');
                          console.log('🔗 unifiedInput ref:', unifiedInput);
                          if (unifiedInput) {
                            console.log('📂 Triggering file input click...');
                            unifiedInput.click();
                          } else {
                            console.error('❌ unifiedInput ref is null!');
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Files dropped');
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0 && unifiedInput) {
                            // Simulate file selection by creating a new event
                            const event = {
                              target: { files: files, value: '' }
                            } as React.ChangeEvent<HTMLInputElement>;
                            handleUnifiedUpload(event);
                          }
                        }}
                      style={isDragging ? { color: 'red' } : undefined}
                        className="cursor-pointer">
                        <UppyUpload />
                      </div>
                    </div>
                      <div className="mt-20 text-center">
                        <p className="text-sm text-gray-500 font-medium">Supported file types:</p>
                        <p className="text-xs text-gray-400 mt-1">
                          JPG, JPEG, PNG, BMP, TIF, TIFF, SVG, PDF, EPS
                        </p>
                        
                        
                      </div>
                      &nbsp;


                    <Modal
                      title={<h1 className=' text-gray-500'>Uploaded Image List</h1>}
                      centered
                      open={imageListModal}
                      onOk={() => setImageListModal(false)}
                      onCancel={() => setImageListModal(false)}
                      closeIcon={<></>}
                      className="sm:h-screen"
                      width={'70%'}
                      footer={[
                        // images?.length>=1 &&
                        imageListEventLoad 
                        ? <Button className='border-none mr-20'>
                            <Spin className='' tip="Uploading..." ><></></Spin>
                          </Button>
                        : <Button key="submit" className='py-2 bg-orange-500' size={'large'} type="primary" loading={loading} onClick={() => {
                          onImageRemoveAllHandler();
                          handleOk();
                          onImageRemoveAll();
                          window.location.reload();
                        }}>
                          Cancel All
                        </Button>,
                        !!images.length && <div className='absolute left-0 text-gray-400 ml-5 font-bold '>{images.length} Files Uploading ...</div>

                      ]}
                    >
                      {/* {
                      !!images?.length && 
                      <>
                        <br /><br />
                        <button className='fw-sky-btn' onClick={onImageRemoveAll}>Remove all images</button>
                      </>
                      } */}
                      {flagLongFileName && <Alert message={contentFlagLongFileName} type="warning" showIcon closable />}
                      <div className='grid grid-cols-1 lg:grid-cols-3  gap-8 p-8'>
                      {!!imageList.length && contextHolder}
                        {imagesProgress && imageList.map((image, index) => {
                          const isPng = isPngFile(image.file);
                          return (
                          <div key={index} className={` relative rounded-lg shadow dark:text-gray-400 dark:bg-gray-800 image-item ${image.isSelected?'isSelectedImg':''} ${isPng ? 'png-dotted-bg' : ''} ${isSvgFile(image.file) ? 'svg-preview-bg' : ''}`} >
                            <div className="w-full absolute bottom-1 bg-gray-200 rounded-full dark:bg-gray-700">
                              <div className="bg-blue-400 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{width: `${imagesProgress[index]?imagesProgress[index]:'20'}%`, minWidth:'20%' }}> {imagesProgress[index]?imagesProgress[index] :'0'}%</div>
                            </div>
                            {needsCustomIcon(image.file) ? (
                              <div className='h-[70%] cursor-pointer w-full rounded-lg'>
                                <FileTypeIcon 
                                  fileType={image.file?.type || ''} 
                                  fileName={image.file?.name || 'Unknown File'} 
                                />
                              </div>
                            ) : (
                              <img 
                                className='h-[70%] cursor-pointer w-full rounded-lg object-contain' 
                                src={getSrcForImage(image)} 
                                alt={image.file?.name || ''} 
                                width="100"
                                style={{
                                  // Ensure SVG files display properly
                                  backgroundColor: isSvgFile(image.file) ? 'white' : 'transparent'
                                }}
                                onError={(e) => {
                                  // Fallback to file icon if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fileType = image.file && isSvgFile(image.file) ? 'SVG' : 
                                                   image.file && isEpsFile(image.file) ? 'EPS' : 'IMAGE';
                                    parent.innerHTML = `
                                      <div class="flex flex-col items-center justify-center h-full w-full bg-gray-50 border-2 border-gray-200 rounded-lg">
                                        <div class="text-gray-600 text-4xl mb-2">🖼️</div>
                                        <div class="text-gray-600 font-semibold text-sm">${fileType}</div>
                                        <div class="text-gray-500 text-xs mt-1 px-2 text-center truncate max-w-full">
                                          ${image.file?.name || 'Unknown File'}
                                        </div>
                                        <div class="text-red-500 text-xs mt-1">Preview unavailable</div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            )}
                            <div className='flex relative w-full flex-col'>
                                <div className='text-sm pt-10 mb-2'>{ image['file'] ? image['file']['name'] : '' } </div>
                                <div>

                                <StopOutlined 
                                  className="image-item__btn-wrapper absolute cursor-pointer right-0 bottom-0  w-5 h-5 mb-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
                                onClick={async() => {
                                    await onImageRemoveHandler(index);
                                    onImageRemove(index);

                                }}   />
                                {/* <svg onClick={() => {
                                    onImageRemove(index)
                                    
                                }}  className="image-item__btn-wrapper absolute cursor-pointer right-0 bottom-0  w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9h2v5m-2 0h4M9.408 5.5h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                </svg> */}
                                </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>


                      <div>
                        {errors && <div className='text-red-500 font-medium'>
                          {errors.maxNumber && <span>Number of selected images exceed maxNumber {maxNumber}</span>}
                          {errors.acceptType && <span>Your selected file type is not allow</span>}
                          {errors.maxFileSize && <span>Selected file size exceed maxFileSize ({humanFileSize(maxFileSize)})</span>}
                          {errors.resolution && <span>Selected file is not match your desired resolution</span>}
                        </div>
                        }
                      </div>
                    </Modal>
                  </div>
                )}
              </ImageUploading>
            }
        </div> 
         <div className="p-8 flex justify-center items-center col-span-2  bg-white">
           <div className="w-full  relative grid grid-cols-1   rounded-lg">
            <div
              className="
                second-flex-div  flex flex-col relative order-first md:order-last h-28 md:h-auto 
                justify-center items-center  border-gray-400 col-span-2 m-2 rounded-lg bg-no-repeat 
                bg-center bg-origin-padding bg-cover
              ">
              <UppyUploadBox  setOpen={setOpen} />
            
            </div>
          </div>
        </div> 
        </div>
        }
        <Checkbox   
          checked={componentDisabled}
          onChange={(e) => setComponentDisabled(e.target.checked)} 
        className='xl:pl-4 pb-10 xl:pt-4 max-lg:pt-80  text-gray-400 ' style={{ fontSize: '16px' }}>I acknowledgement I am permitted to print the images I am submitting. See our <a href={'http://'+userInfo.domain+userInfo.terms_of_service_url} target="_blank" rel="noreferrer" className='underline'>terms of service </a></Checkbox>
      </div>
      </div>
    </Modal>
    </>
  )
}

/**
 * Format bytes as human-readable text.
 * 
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use 
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 * 
 * @return Formatted string.
 */
function humanFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
}

const UppyUpload = () => {
  let deviceName = "Computer";
  if(OsName==='windows'){
    deviceName = "PC";
  }else if(OsName==='apple'){
    deviceName = "MAC";
  }
  
  return <div className="uppy-DashboardTab uppy-DashboardManual " id="artzipIcon" role="presentation" data-uppy-acquirer-id="Artzip">
    <button type="button" className="uppy-u-reset uppy-c-btn uppy-DashboardTab-btn" role="tab" data-uppy-super-focusable="true">
    <div className="uppy-DashboardTab-inner">
      <svg className="uppy-DashboardTab-iconMyDevice" aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32"><path d="M8.45 22.087l-1.305-6.674h17.678l-1.572 6.674H8.45zm4.975-12.412l1.083 1.765a.823.823 0 00.715.386h7.951V13.5H8.587V9.675h4.838zM26.043 13.5h-1.195v-2.598c0-.463-.336-.75-.798-.75h-8.356l-1.082-1.766A.823.823 0 0013.897 8H7.728c-.462 0-.815.256-.815.718V13.5h-.956a.97.97 0 00-.746.37.972.972 0 00-.19.81l1.724 8.565c.095.44.484.755.933.755H24c.44 0 .824-.3.929-.727l2.043-8.568a.972.972 0 00-.176-.825.967.967 0 00-.753-.38z" fill="currentcolor" fill-rule="evenodd"></path></svg>
    </div>
    <div className="uppy-DashboardTab-name pr-6">My {
      deviceName
    } / Device</div>
    </button>
  </div>
}

export default UploadModal
