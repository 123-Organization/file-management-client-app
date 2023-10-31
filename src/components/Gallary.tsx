import React, { useEffect, useState } from 'react'
import EditGallaryModal from './EditGallaryModal';
import { useDynamicData } from "../context/DynamicDataProvider";
import { Empty, message, Spin } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { deleteImages, getImages } from '../api/gallaryApi';
import { Typography } from 'antd';

const {  Text } = Typography;
/**
 * ****************************************************************** Outer Function **********************************************************
 */

interface ImageType {
  public_thumbnail_uri?: string;
  guid?: string;
  public_preview_uri?: string;
  isSelected?: false;
  title?:string;
}
/**
 * ****************************************************************** Function Components *******************************************************
 */

const Gallary: React.FC = (): JSX.Element => {

    const [open, setOpen] = useState(false);
    const [imgData, setImgData] = useState({});
    const [images, setImages] = useState<Array<ImageType>>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const dynamicData: any = useDynamicData();
    const { referrer, userInfo } = dynamicData.state;

    const {
        mutate: deleteImageFn,
        isLoading:isLoadingImgDelete,
      } = useMutation((data: any) => deleteImages(data), {
        onSuccess(data) {
          messageApi.open({
            type: 'success',
            content: 'File has been deleted',
          });
          setOpen(false)
          let filterUpdate=(userInfo.filterUpdate?"":" ");
          let userInfoObj={...userInfo,filterUpdate};
          dynamicData.mutations.setUserInfoData(userInfoObj);
        },
        onError(error: any) {},
    });
    
    const {
        mutate : getAllImagesFn,
        isLoading:isLoadingImg,
      } = useMutation((data: any) => getImages(data), {
        onSuccess(data:any) {
          console.log('getAll images',data.data.images);
          setImages(data.data.images)
          let filterCount = ""+data.data.count
          let isUpdated = (
            filterCount !== referrer.filterCount
          );
          isUpdated && dynamicData.mutations.setReferrerData({...referrer,filterCount});
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
        if (window.confirm('Are you sure to delete this image ?')) {
          let data = {
                guids,
                "librarySessionId":userInfo.librarySessionId,
                "libraryAccountKey": userInfo.libraryAccountKey,
                "librarySiteId": userInfo.librarySiteId
          }; 
          deleteImageFn(data);
        }
    };

 

    const referrerImages = referrer.fileSelected.map((img:any) => img.guid);
    const handleSelect = (index: number) => {
        const nextImages = images.map((image, i) =>
          (i === index || (!userInfo.multiselectOptions && image.isSelected)) ? { ...image, isSelected: !image.isSelected } : image
        );

        
        const fileUnSelected = nextImages.filter((image) => !image.isSelected ).map((img:any) => img.guid);

        
        const fileSelected = userInfo.multiselectOptions 
                            ? nextImages
                              .filter((image) =>image.isSelected && !referrerImages.includes(image.guid))
                              .concat(referrer.fileSelected)
                              .filter((image) =>(
                                (
                                  !fileUnSelected.includes(image.guid)
                                )
                              ))
                            : nextImages.filter((image) =>image.isSelected )
                          ;


        //@ts-ignore
        setImages(nextImages);
        const hasSelected = nextImages.some((image) => image.isSelected);
        //@ts-ignore
        const referrerObj = {...referrer,...{hasSelected,fileSelected}}
        console.log('referrer',referrer)
        console.log('referrerObj',referrerObj)

        let isUpdated = (
            referrerObj.hasSelected !== referrer.hasSelected ||
            referrerObj.fileSelected !== referrer.fileSelected ||
            referrerObj.fileSelected.length !== referrer.fileSelected.length
          );
        console.log('isUpdated',isUpdated)
  
        isUpdated && dynamicData.mutations.setReferrerData(referrerObj);

      };

      const getAllImageParams = (filterPageNumber:string="1") => {
           return {...userInfo,filterPageNumber};
      }
    
      useEffect(() => {
        const locationIsDifferent = (window.location !== window.parent.location);
        const diffentUser = (userInfo.librarySessionId!=='81de5dba-0300-4988-a1cb-df97dfa4e3721' && locationIsDifferent)
        const defalutUser = (userInfo.librarySessionId==='81de5dba-0300-4988-a1cb-df97dfa4e3721' && !locationIsDifferent)
          if(defalutUser || diffentUser)
            getAllImagesFn(getAllImageParams(userInfo.filterPageNumber));
        // eslint-disable-next-line react-hooks/exhaustive-deps    
      },[userInfo]);



/**
 * ****************************************************************** JSX  ***************************************************************************
 */         
       
    return (
        <div className="grid max-sm:grid-cols-1 max-xl:grid-cols-2 grid-cols-4 gap-8 p-8 max-md:pt-20 content-center">
            {contextHolder}
            {
              isLoadingImg
                   ? <div className='center-div1 max-md:pt-40 pt-60 md:col-span-4'><Spin  tip={<div >Loading My Libraries...</div>} size="large" > <div className="content" /></Spin></div>
            :images.length
                ?
                   <>
                    {images.map(
                      (image, i) => (            
                            <div key={i}   className={`border rounded-lg shadow-lg   border-gray-100 ${image.isSelected || referrerImages.includes(image.guid) ?'isSelectedImg':''}`} >
                                <div onClick={()=> handleSelect(i)}  className='min-h-[300px] flex justify-center items-center'>
                                  <div>

                                  <img className={`m-2 min-h-[200px] cursor-pointer  max-w-[200px]   object-contain    `} src={image.public_thumbnail_uri} alt="" />
                                  </div>
                                </div>                      
                                <div className='flex relative w-full justify-center pb-2'>
                                    <div className='text-sm pt-2'>
                                      <Text
                                        style={{ width: 100 } }
                                        ellipsis={{ tooltip: image.title } }
                                      >
                                        {image.title}
                                      </Text>
                                    </div>
                                    <div>
                                    <svg onClick={() => {
                                        setOpen(true)
                                        setImgData(image)

                                        
                                    }}  className="absolute cursor-pointer right-0 bottom-0  w-5 h-5 mb-2 mr-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9h2v5m-2 0h4M9.408 5.5h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                    </svg>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                    <EditGallaryModal onDeleteHandler={onDeleteHandler} isSuccess={!isLoadingImgDelete} openModel={open} setOpen={setOpen} imgData={imgData} />
                   </>
              : <Empty />
            }
        </div>
    )
}

export default Gallary  
