import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Typography, Checkbox, Modal, Button, message, Alert, Spin } from 'antd';
import ImageUploading, { ErrorsType } from 'react-images-uploading';
import tiffDefault from "../assets/images/tiff_default.png"

import {
  StopOutlined
} from '@ant-design/icons';
import { useDynamicData } from '../context/DynamicDataProvider';
import { flushSync } from 'react-dom';
import { Uploader } from '../helpers/fileUploader';
import { makeUniqueFileName, osName } from '../helpers/fileHelper';
import { PDFProcessor, isPdfFile } from '../helpers/pdfProcessor';
import { PDFFileUploader } from '../helpers/pdfFileUploader';
import { EPSConverter, isEpsFile } from '../helpers/epsConverter';
import { SVGConverter, isSvgFile as isSvgFileHelper } from '../helpers/svgConverter';
import UppyUploadBox from './UppyUploadBox';

import config  from "../config/configs";
import { sendEvent } from '../helpers/GA4Events';
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
  const [pdfUploadInput, setPdfUploadInput] = useState<HTMLInputElement | null>(null);
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

  // Helper function to check if file is PNG
  const isPngFile = (file: any) => {
    return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  }

  // Helper function to check if file is PDF
  const isPdfFileType = (file: any) => {
    return isPdfFile(file);
  }

  // Helper function to check if file is EPS
  const isEpsFileType = (file: any) => {
    return isEpsFile(file);
  }

  const uploadSvgFile = async(file: any, addUpdateIndex: any) => {
    try {
      console.log('uploadSvgFile called - Converting SVG to PDF:', file.name, 'size:', file.size, 'type:', file.type);
      
      // Show initial conversion progress
      imagesProgress[addUpdateIndex] = 10;
      flushImagesProgress(imagesProgress);
      setImageListEvent(true);
      
      // Convert SVG to PDF
      const svgConverter = new SVGConverter();
      const conversionResult = await svgConverter.convertToPDF(file);
      
      console.log('SVG converted to PDF:', conversionResult.fileName);
      
      // Update progress after conversion
      imagesProgress[addUpdateIndex] = 30;
      flushImagesProgress(imagesProgress);
      setImageListEvent(true);
      
      // Create a File object from the PDF blob
      const pdfFile = new File([conversionResult.pdfBlob], conversionResult.fileName, {
        type: 'application/pdf'
      });
      
      // Use the existing PDF upload flow
      await uploadPdfFile(pdfFile, addUpdateIndex);
      
    } catch (error) {
      console.error('SVG conversion error:', error);
      messageApi.open({
        type: 'error',
        content: `Failed to convert SVG: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5
      });
    }
  }

  const uploadPdfFile = async(file: any, addUpdateIndex: any) => {
    try {
      console.log('uploadPdfFile called - Processing PDF file:', file.name, 'size:', file.size, 'type:', file.type);
      
      // Process PDF and extract pages
      const pdfProcessor = new PDFProcessor(
        file,
        userInfo,
        (Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000)).toString(),
        userInfo.libraryName
      );
      
      console.log('PDFProcessor created, starting page extraction...');
      
      const pages = await pdfProcessor.extractPages();
      console.log(`PDF processed: ${pages.length} pages extracted`);
      
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

    const videoUploaderOptions = {
      fileName: makeUniqueFileName(file.name),
      fileType: file.type,
      file,
      userInfo,
      basecampProjectID:(Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000)),
      fileLibrary:userInfo.libraryName,
      isSvg: isSvgFile(file)  // Add SVG flag to options
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
      
      // Handle SVG files - convert to PDF and use PDF flow
      if (isSvgFile(file)) {
        console.log('Processing as SVG file - converting to PDF...');
        return await uploadSvgFile(file, addUpdateIndex);
      }
      
      // Handle EPS files - upload directly, let backend convert
      if (isEpsFileType(file)) {
        console.log('Processing as EPS file - uploading directly...');
        // For now, upload EPS as regular file until backend adds EPS conversion
        // TODO: Implement server-side EPS to PDF conversion
        return await uploadRegularFile(file, addUpdateIndex);
      }
      
      // Handle PDF files separately
      if (isPdfFileType(file)) {
        console.log('Processing as PDF file...');
        return await uploadPdfFile(file, addUpdateIndex);
      }
      
      let percentage: any = 0

     const videoUploaderOptions = {
        fileName: makeUniqueFileName(file.name),
        fileType: file.type,
        file,
        userInfo,
        basecampProjectID:(Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000)),
        fileLibrary:userInfo.libraryName,
        isSvg: isSvgFile(file)  // Add SVG flag to options
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

  // Custom PDF/EPS/SVG file handler
  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('File selected:', file.name, file.type);
      
      if (isPdfFileType(file) || isEpsFileType(file) || isSvgFile(file)) {
        let fileType = 'PDF';
        if (isEpsFileType(file)) fileType = 'EPS';
        if (isSvgFile(file)) fileType = 'SVG';
        
        console.log(`Valid ${fileType} file detected, starting upload...`);
        
        // Create a mock image list entry for PDF/EPS/SVG
        const mockImageList = [{
          file: file,
          data_url: null
        }];
        
        // Simulate the upload process
        setUploadImageModal(mockImageList, true);
        setImagesProgress([0]); // Initialize progress for 1 file
        
        // Start upload based on file type
        if (isSvgFile(file)) {
          uploadSvgFile(file, 0);
        } else if (isEpsFileType(file)) {
          // Upload EPS as regular file until backend conversion is ready
          uploadRegularFile(file, 0);
        } else {
          uploadPdfFile(file, 0);
        }
      } else {
        messageApi.open({
          type: 'error',
          content: 'Please select a valid PDF, EPS, or SVG file',
          duration: 5
        });
      }
    }
    
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  }

  const triggerPdfUpload = () => {
    if (pdfUploadInput) {
      pdfUploadInput.click();
    }
  }

  const onImageRemoveAllHandler = async() => {

     //@ts-ignore
     const abortUploadPromises = imageList.map((img, i) => onImageRemoveHandler(i));

     await Promise.allSettled(abortUploadPromises)
     //@ts-ignore
       .then((results) => results.forEach((result) => console.log(result.status)))
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
      `}</style>
      <Modal
        style={{ height: '60%' }}
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
                onChange={onChange}
                onError={onError}
                maxNumber={maxNumber}
                dataURLKey="data_url"
                maxFileSize={maxFileSize}
                acceptType={['jpg','jpeg', 'bmp', 'png', 'tif', 'tiff','zip','psd','svg','eps']}
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

                    <label
                      style={isDragging ? { color: 'red' } : undefined}
                      onClick={onImageUpload}
                      {...dragProps}
                      className="" htmlFor="uploadImage">
                        <UppyUpload />
                      </label>
                      <div className="mt-20 text-center">
                        <p className="text-sm text-gray-500 font-medium">Supported file types:</p>
                        <p className="text-xs text-gray-400 mt-1">
                          JPG, JPEG, PNG, BMP, TIF, TIFF, SVG, PDF, EPS
                        </p>
                        
                        {/* PDF/SVG/EPS Upload Button */}
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={triggerPdfUpload}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                          >
                            Upload PDF/SVG/EPS File
                          </button>
                          <input
                            type="file"
                            accept=".pdf,.svg,.eps,application/pdf,image/svg+xml,application/postscript"
                            onChange={handlePdfUpload}
                            ref={(input) => setPdfUploadInput(input)}
                            style={{ display: 'none' }}
                          />
                        </div>
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
                          <div key={index} className={` relative rounded-lg shadow dark:text-gray-400 dark:bg-gray-800 image-item ${image.isSelected?'isSelectedImg':''} ${isPng ? 'png-dotted-bg' : ''}`} >
                            <div className="w-full absolute bottom-1 bg-gray-200 rounded-full dark:bg-gray-700">
                              <div className="bg-blue-400 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{width: `${imagesProgress[index]?imagesProgress[index]:'20'}%`, minWidth:'20%' }}> {imagesProgress[index]?imagesProgress[index] :'0'}%</div>
                            </div>
                            <img className='h-[70%] cursor-pointer w-full rounded-lg' src={(image['data_url'] &&  image['data_url'].includes("image/tif")) ? tiffDefault : image['data_url']} alt="" width="100" />
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
