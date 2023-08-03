import React, { useEffect, useState } from 'react'
import EditGallaryModal from './EditGallaryModal';
import { useDynamicData } from "../context/DynamicDataProvider";
import { Empty, message } from 'antd';
import { QueryClient, useMutation } from '@tanstack/react-query';
import { deleteImages, getImages } from '../api/gallaryApi';
import images from "../json/images.json"

/**
 * ****************************************************************** Outer Function **********************************************************
 */

const IMAGES = images.gallaryImages;

/**
 * ****************************************************************** Function Components *******************************************************
 */

const Gallary: React.FC = (): JSX.Element => {

    const [open, setOpen] = useState(false);
    const [imageURL, setImageURL] = useState({});
    const [images, setImages] = useState(IMAGES);
    const [messageApi, contextHolder] = message.useMessage();

    const {
        mutate: deleteImageFn,
        isLoading,
        isError,
        error,
        data,
        isSuccess,
      } = useMutation((data: any) => deleteImages(data), {
        onSuccess(data) {
          messageApi.open({
            type: 'success',
            content: 'File has been deleted',
          });
          setOpen(false)
          getAllImagesFn(getAllImageParams("1"));
        },
        onError(error: any) {},
    });
    
    const {
        mutate : getAllImagesFn,
        isLoading:isLoadingImg,
        isError:isErrorImg,
        error:errorImg,
        data:dataImg,
        isSuccess:isSuccessImg,
      } = useMutation((data: any) => getImages(data), {
        onSuccess(data:any) {
          console.log('getAll images',data.data.images);
          setImages(data.data.images)
          // QueryClient.setQueryData('allImages', newArticle);
        },
        onError(error: any) {},
    });

    const onDeleteHandler = (guids: string,multiple:boolean=true) => {
        console.log('guids',guids)
        if(multiple){
            //@ts-ignore
            guids = images.filter((img)=>img.isSelected).map((img)=>img.guid).join();
            console.log('guids',guids);
            // return false;
        }
        if (window.confirm('Are you sure')) {
          let data = {
                guids,
                "librarySessionId": "81de5dba-0300-4988-a1cb-df97dfa4e3721",
                "libraryAccountKey": "kqdzaai2xyzppcxuhgsjorv21",
                "librarySiteId": "2"
            }; 
          deleteImageFn(data);
        }
    };

 
    const dynamicData: any = useDynamicData();
    const { referrer, userInfo } = dynamicData.state;

    const handleSelect = (index: number) => {
        const nextImages = images.map((image, i) =>
          i === index ? { ...image, isSelected: !image.isSelected } : image
        );
        setImages(nextImages);
        const hasSelected = nextImages.some((image) => image.isSelected);
        //@ts-ignore
        const fileSelected = nextImages.filter((image) =>image.isSelected);
        const referrerObj = {hasSelected,fileSelected}
        console.log('referrer',referrer)
        console.log('referrerObj',referrerObj)

        let isUpdated = (
            referrerObj.hasSelected !== referrer.hasSelected ||
            referrerObj.fileSelected !== referrer.fileSelected
          );
        console.log('isUpdated',isUpdated)
  
        isUpdated && dynamicData.mutations.setReferrerData(referrerObj);

      };

      const getAllImageParams = (filterPageNumber:string="1") => {
           return {...userInfo,filterPageNumber};
      }
    
      useEffect(() => {
        getAllImagesFn(getAllImageParams(userInfo.filterPageNumber));
      },[userInfo]);

/**
 * ****************************************************************** JSX  ***************************************************************************
 */         
       
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-8">
            {contextHolder}
            {
            images.length
             ?
                <>
                {images.map(
                  (image, i) => (            
                        <div key={i} className={`border rounded-lg shadow-lg   border-gray-100 ${image.isSelected?'isSelectedImg':''}`} >
                            <div className='min-h-[240px] flex justify-center items-center'>
                              <div>

                              <img className={`m-2 min-h-[200px] cursor-pointer max-w-[200px]   object-contain   `} onClick={()=> handleSelect(i)} src={image.public_thumbnail_uri} alt="" />
                              </div>
                            </div>                      
                            <div className='flex relative w-full justify-center pb-2'>
                                <div className='text-sm pt-2'>{` ${image.title?image.title: 'Lorem ipsum'}` }</div>
                                <div>
                                <svg onClick={() => {
                                    setOpen(true)
                                    setImageURL(image)

                                    
                                }}  className="absolute cursor-pointer right-0 bottom-0  w-5 h-5 mb-2 mr-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9h2v5m-2 0h4M9.408 5.5h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                </svg>
                                </div>
                            </div>
                        </div>
                    )
                )}
                <EditGallaryModal onDeleteHandler={onDeleteHandler} openModel={open} setOpen={setOpen} imgURL={imageURL} />
                </>
            : <Empty />
            }
        </div>
    )
}

export default Gallary
