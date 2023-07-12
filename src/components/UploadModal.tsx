import React, { Dispatch, FC, SetStateAction, useState } from 'react'
import { Typography, Checkbox, Modal, Button } from 'antd';
import icloudImg from '../assets/provider/icon_icloud.svg';
import googleDriveImg from '../assets/provider/icon_googledrive.svg';
import dropBoxImg from '../assets/provider/icon_dropbox.svg';
import artzipImg from '../assets/provider/icon_artzip.svg';

import ImageUploading, { ErrorsType } from 'react-images-uploading';


import {
  StopOutlined
} from '@ant-design/icons';
import { useDynamicData } from '../context/DynamicDataProvider';

const { Title, Text } = Typography;

interface UploadModalProps {
  openModel: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const UploadModal = ({ openModel, setOpen }: UploadModalProps) => {

  const [images, setImages] = React.useState([]);
  const [imageListModal, setImageListModal] = React.useState(false);

  const maxNumber = 8;
  const maxFileSize = 1024 * 40;
  
  const dynamicData: any = useDynamicData();
  const { referrer, setReferrerData } = dynamicData.state;

  const [loading, setLoading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<any>(null);
  const handleOk = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setImageListModal(false);
    }, 3000);
  };

  
  !images.length && imageListModal && setImageListModal(false);
  const handleCancel = () => {
    setOpen(false);
  };


  const handleChange = (value: string) => {
    console.log(`selected ${value}`);
  };



  const onChange = (imageList: any, addUpdateIndex: any) => {
    // data for submit
    console.log(imageList, addUpdateIndex);
    setImages(imageList);
    setImageListModal(true)
  };

  const onError = (errors: ErrorsType) => {
    // data for submit
    console.log(onError, errors);
    setUploadErrors(errors);
    // setImageListModal(true)
  };


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
      <div>
        <div className="p-8 flex justify-center items-center  bg-white">
          <div className="w-full  relative grid grid-cols-1 md:grid-cols-3 border rounded-lg">
            <div
              className="first-flex-div rounded-l-lg p-4 sm:py-64 flex flex-col justify-center items-center border-0 max-sm:border-b sm:border-r border-gray-300 ">
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
              <ImageUploading
                multiple
                value={images}
                onChange={onChange}
                onError={onError}
                maxNumber={maxNumber}
                dataURLKey="data_url"
                maxFileSize={maxFileSize}
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
                    <label className="cursor-pointer hover:opacity-80 inline-flex items-center 
              shadow-md my-4 px-8 py-4 bg-green-400 text-gray-50 border border-transparent
              rounded-md font-semibold text-base  hover:bg-green-300 active:bg-green-300 focus:outline-none 
            focus:border-green-200 focus:ring ring-green-200 disabled:opacity-25 transition ease-in-out duration-150" htmlFor="uploadImage">

                      <button
                        style={isDragging ? { color: 'red' } : undefined}
                        onClick={onImageUpload}
                        {...dragProps}
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
                      width={'70%'}
                      footer={[
                        // images?.length>=1 &&
                        <Button key="submit" className='py-2 bg-orange-500' size={'large'} type="primary" loading={loading} onClick={() => {
                          handleOk();
                          onImageRemoveAll();
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
                      <div className='grid grid-cols-1 md:grid-cols-4 gap-8 p-8'>

                        {imageList.map((image, index) => (
                          <div key={index} className={`image-item  ${image.isSelected?'isSelectedImg':''}`} >
                            <img className='h-auto cursor-pointer w-full rounded-lg' src={image['data_url']} alt="" width="100" />
                            <div className='flex relative w-full flex-col'>
                                <div className='text-sm pt-10 mb-2'>Lorem ipsum </div>
                                <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                                  <div className="bg-blue-400 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{width: "45%"}}> 45%</div>
                                </div>
                                <div>

                                <StopOutlined 
                                  className="image-item__btn-wrapper absolute cursor-pointer right-0 bottom-0  w-5 h-5 mb-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
                                onClick={() => {
                                    onImageRemove(index)
                                    
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
              {/* </label> */}

            </div>
            <div
              className="second-flex-div flex flex-col relative order-first md:order-last h-28 md:h-auto justify-center items-center  border-gray-400 col-span-2 m-2 rounded-lg bg-no-repeat bg-center bg-origin-padding bg-cover">
              <div className='relative justify-center w-full flex '>
                <Title level={4} className="text-gray-300 sm:pl-20" disabled >Other File Sources</Title>
                {/* <div className='absolute -top-2 right-0 text-lg'><CloseCircleOutlined style={{ fontSize: '25px' }} /></div> */}
              </div>
              <div className='flex flex-row h-full w-full items-center text-center '>
                <div className='basis-2/4 flex flex-col'>
                  <div className='pb-5'>
                    <img src={icloudImg} className="upload-logo inline cursor-pointer" alt="logo" />
                  </div>
                  <Text type="secondary" className='text-lg'>iCloud</Text>
                </div>
                <div className='basis-2/4 flex flex-col'>
                  <div className='pb-5'>
                    <img src={dropBoxImg} className="upload-logo inline cursor-pointer " alt="logo" />
                  </div>
                  <Text type="secondary" className='text-lg'>DropBox</Text>
                </div>
              </div>
              <div className='flex flex-row h-full w-full items-center text-center '>
                <div className='basis-2/4 flex flex-col'>
                  <div className='pb-5'>
                    <img src={googleDriveImg} className="upload-logo inline cursor-pointer " alt="logo" />
                  </div>
                  <Text type="secondary" className='text-lg'>Google Drive</Text>
                </div>
                <div className='basis-2/4 flex flex-col'>
                  <div className='pb-5'>
                    <img src={artzipImg} className="upload-logo inline cursor-pointer " alt="logo" />
                  </div>
                  <Text type="secondary" className='text-lg'>ArtZip</Text>
                </div>
              </div>

            </div>

          </div>
        </div>
        <Checkbox className='pl-10 pb-10  text-gray-400 ' style={{ fontSize: '16px' }}>I acknowledgement I am permitted to print the images I am sumbmitting. See our <a className='underline'>terms of service </a></Checkbox>
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
