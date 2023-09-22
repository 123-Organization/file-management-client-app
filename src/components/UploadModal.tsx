import React, { Dispatch, FC, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Typography, Checkbox, Modal, Button, message, notification } from 'antd';


import ImageUploading, { ErrorsType } from 'react-images-uploading';


import {
  StopOutlined
} from '@ant-design/icons';
import { useDynamicData } from '../context/DynamicDataProvider';
import { flushSync } from 'react-dom';
import { Uploader } from '../helpers/fileUploader';
import { makeUniqueFileName } from '../helpers/fileHelper';
import { useQueryClient } from '@tanstack/react-query';
import UppyUploadBox from './UppyUploadBox';

const { Title, Text } = Typography;

interface UploadModalProps {
  openModel: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const UploadModal = ({ openModel, setOpen }: UploadModalProps) => {

  const maxNumber = 8;
  const maxFileSize = 1024 * 1024 * 500 * 20; //40 MB

  const [images, setImages] = React.useState([]);
  const [uploaders, setUploaders] = React.useState<object[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient()

  const [imagesProgress, setImagesProgress] = React.useState<number[]>([]);
  const [imageListModal, setImageListModal] = React.useState(false);
  const [imageListEvent, setImageListEvent] = React.useState(false);

  const dynamicData: any = useDynamicData();
  const { referrer, userInfo } = dynamicData.state;

  const [loading, setLoading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<any>(null);
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
    
    if(!imagesProgress.length){
      
      setImagesProgress([...new Array(maxNumber)].fill(0,0,(imageList.length)));
    }
    setUploadImageModal(imageList,true);
    console.log('imageList....',imageList)
    if(imageListModal) { console.log('change event aborted'); return true; }
    
    //@ts-ignore
    const uploadPromises = imageList.map((img, i) => uploadImage(img?.file,i));

    await Promise.allSettled(uploadPromises)
      .then((results) => results.forEach((result) => console.log(result.status)))

  }

  const uploadImage = async(file: any, addUpdateIndex: any) => {

    if(imageListModal) { console.log('change event aborted') }
    if (file) {
      console.log(file);
      
      let percentage: any = 0

     const videoUploaderOptions = {
        fileName: makeUniqueFileName(file.name),
        fileType: file.type,
        file,
        userInfo,
        basecampProjectID:(Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000))
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
          //setFile(undefined)
          // imagesProgress[addUpdateIndex] = 100;
          // flushImagesProgress(imagesProgress);
          console.error('error file upload',error)
          messageApi.open({
            type: 'error',
            content: 'File having issue while upload',
          });
        })

      return await uploader.start()

    }
  }   

  useEffect(() => {
    console.log(`UseEffect Called:  ${images} ${imagesProgress}`,images);
    if(images?.length){
      let totalProcess = imagesProgress.reduce((a,b) => Number(a)+Number(b));
      console.log('totalProcess',totalProcess)
      let totalImagesProgress = (imagesProgress.filter(imagesProgress => Number(imagesProgress)).length*100)
      console.log('totalImagesProgress',totalImagesProgress)
      if(totalProcess===totalImagesProgress){
        messageApi.open({
          type: 'success',
          content: 'File has been uploaded',
        });
        setTimeout(() => {
          //@ts-ignore
          console.log(`uploader.completeResponse `,uploaders);
          setUploadImageModal([],false)
        }, 1000);
        setTimeout(() => {
          window.location.reload();
        },5000);
      }
    } else {
      setTimeout(() => {
        setUploadImageModal([],false)
      }, 1000);
    }
  }, [imagesProgress,imageListEvent]);

  const onError = (errors: ErrorsType) => {
    // data for submit
    console.log(onError, errors);
    setUploadErrors(errors);
    // setImageListModal(true)
  };

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

  
  return (
    <Modal
      style={{ height: '60%' }}
      title={<h1 className=' text-gray-500'>Upload File</h1>}
      centered
      open={openModel}
      onOk={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      width={'85%'}
      footer={''}
    >
      <div className='max-md:h-screen'>
        <div className="p-8 flex justify-center items-center  bg-white">
          <div className="w-full  relative grid grid-cols-1 lg:grid-cols-3 lg:border rounded-lg">
            <div
              className="first-flex-div lg:rounded-l-lg p-4 sm:py-64 flex flex-col justify-center items-center border-0 max-lg:border-b lg:border-r border-gray-300 ">
              <Title level={4} className="text-gray-300" disabled >My Computer / Device</Title>
              {uploadErrors && <div className='text-red-500 font-medium'>
                {uploadErrors.maxNumber && <span>Number of selected images exceed maxNumber {maxNumber}<br /></span>}
                {uploadErrors.acceptType && <span>Your selected file type is not allow<br /></span>}
                {uploadErrors.maxFileSize && <span>Selected file size exceed maxFileSize ({humanFileSize(maxFileSize)})<br /></span>}
                {uploadErrors.resolution && <span>Selected file is not match your desired resolution<br /></span>}
              </div>
              }
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
                acceptType={['jpg','jpeg', 'bmp', 'png', 'tif', 'tiff','zip','psd']}
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
                      className="cursor-pointer hover:opacity-80 inline-flex items-center 
                shadow-md my-4 px-8 py-4 bg-green-400 text-gray-50 border border-transparent
                rounded-md font-semibold text-base  hover:bg-green-300 active:bg-green-300 focus:outline-none 
              focus:border-green-200 focus:ring ring-green-200 disabled:opacity-25 transition ease-in-out duration-150" htmlFor="uploadImage">

                        <button
                        
                        >
                          Select Images
                        </button>
                      </label>
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
                        <Button key="submit" className='py-2 bg-orange-500' size={'large'} type="primary" loading={loading} onClick={() => {
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
                      <div className='grid grid-cols-1 lg:grid-cols-4 gap-8 p-8'>
                      {!!imageList.length && contextHolder}
                        {imagesProgress && imageList.map((image, index) => (
                          <div key={index} className={` rounded-lg shadow dark:text-gray-400 dark:bg-gray-800 image-item  ${image.isSelected?'isSelectedImg':''}`} >
                            <img className='h-[57%] cursor-pointer w-full rounded-lg' src={image['data_url']} alt="" width="100" />
                            <div className='flex relative w-full flex-col'>
                                <div className='text-sm pt-10 mb-2'>Lorem ipsum </div>
                                <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                                  <div className="bg-blue-400 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{width: `${imagesProgress[index]?imagesProgress[index]:'20'}%`, minWidth:'20%' }}> {imagesProgress[index]?imagesProgress[index] :'0'}%</div>
                                </div>
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
                        ))}
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
              {/* </label> */}

            </div>
            <div
              className="second-flex-div  flex flex-col relative order-first md:order-last h-28 md:h-auto justify-center items-center  border-gray-400 col-span-2 m-2 rounded-lg bg-no-repeat bg-center bg-origin-padding bg-cover">
              <UppyUploadBox/>
            </div>

          </div>
        </div>
        <Checkbox className='pl-10 pb-10 max-lg:pt-72  text-gray-400 ' style={{ fontSize: '16px' }}>I acknowledgement I am permitted to print the images I am submitting. See our <a className='underline'>terms of service </a></Checkbox>
      </div>
    </Modal>
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

export default UploadModal
