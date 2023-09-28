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
      width={'65%'}
      footer={''}
    >
      <div className='max-md:h-screen'>
         <div className="p-8 flex justify-center items-center  bg-white">
           <div className="w-full  relative grid grid-cols-1   rounded-lg">
            <div
              className="second-flex-div  flex flex-col relative order-first md:order-last h-28 md:h-auto justify-center items-center  border-gray-400 col-span-2 m-2 rounded-lg bg-no-repeat bg-center bg-origin-padding bg-cover">
              <UppyUploadBox/>
            </div>

          </div>
        </div>
        <Checkbox className='pl-24 pb-10 max-lg:pt-72  text-gray-400 ' style={{ fontSize: '16px' }}>I acknowledgement I am permitted to print the images I am submitting. See our <a className='underline'>terms of service </a></Checkbox>
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
