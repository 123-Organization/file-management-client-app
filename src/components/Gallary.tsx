import React, { CSSProperties, useEffect, useState, useRef } from 'react'
import EditGallaryModal from './EditGallaryModal';
import { useDynamicData } from "../context/DynamicDataProvider";
import { Empty, message, Skeleton, Space, Spin } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { deleteImages, getGUID, getImages } from '../api/gallaryApi';
import { Typography } from 'antd';
import { removeDuplicates } from '../helpers/fileHelper';
import { useCookies } from 'react-cookie';
import { Session } from 'inspector';


/**
 * ****************************************************************** Outer Function **********************************************************
 */

const {  Text } = Typography;
const IMAGE_STYLES: CSSProperties = {
  width: 200, 
  height: 200 
}

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
  const [cookies] = useCookies(['AccountGUID', "Session"]);
  console.log('cookies',cookies?.AccountGUID)

    const [open, setOpen] = useState(false);
    const [imgData, setImgData] = useState({});
    const [referrerImages, setReferrerImages] = useState<Array<String|undefined>>([]);
    const [images, setImages] = useState<Array<ImageType>>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const dynamicData: any = useDynamicData();
    const { referrer, userInfo } = dynamicData.state;
    const [isRequestInProgress, setIsRequestInProgress] = useState(false);
    const pendingLibraryRef = useRef<string | null>(null);

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
          console.log('referrerImages',referrerImages);
          const imgs = data.data.images.map((image:any) =>
            (referrerImages?.length && referrerImages.includes(image.guid))
            ? { ...image, isSelected: true } : image
          );
          setImages(imgs)
          console.log('getAll imgs',imgs);
          
          
          let filterCount = ""+data.data.count
          let isUpdated = (
            filterCount !== referrer.filterCount
          );
          
          let fileSelected = referrerImages.map((guid:any) => {return {guid}});
          let referrerObj = {...referrer,...{fileSelected,filterCount}};
          
          console.log('get all images referrer',referrerObj)
          isUpdated && dynamicData.mutations.setReferrerData(referrerObj);
          
          // Mark request as complete
          setIsRequestInProgress(false);
          
          // Check if there's a pending library request
          if (pendingLibraryRef.current !== null) {
            console.log('Processing pending library request for:', pendingLibraryRef.current);
            const pendingLibrary = pendingLibraryRef.current;
            pendingLibraryRef.current = null;
            // Call getImagesData with the pending library
            fetchImagesForLibrary(pendingLibrary);
          }
        },
        onError(error: any) {
          // Mark request as complete even if error occurs
          setIsRequestInProgress(false);
          
          // Process any pending requests
          if (pendingLibraryRef.current !== null) {
            console.log('Processing pending library request after error:', pendingLibraryRef.current);
            const pendingLibrary = pendingLibraryRef.current;
            pendingLibraryRef.current = null;
            // Call getImagesData with the pending library
            fetchImagesForLibrary(pendingLibrary);
          }
        },
    });

    const {
      mutate : getImagesGUIDFn,
      isLoading:isLoadingImgGuid,
    } = useMutation((data: any) => getGUID(data), {
      onSuccess(data:any) {
        console.log('getGUID images',data.data);
        let fileSelected = data.data.guids.filter((guid:any) =>!referrerImages.includes(guid))
                                  .map((guid:any) => {return {guid}})
                                  .concat(referrer.fileSelected)
        console.log('Guid fileSelected',fileSelected)
        if(fileSelected.length){
          setTimeout(() => {
            
            let referrerObj=null;
            const hasSelected = true;
            
            if(userInfo.multiselectOptions){
              referrerObj = {...referrer,...{fileSelected,hasSelected}}
              console.log('referrerObj',referrer)
              console.log('GUId1referrerObj',referrerObj)
            } else {
              referrerObj = {...referrer,...{hasSelected,fileSelected:(fileSelected[0]?[fileSelected[0]]:[])}}
              console.log('referrerObj',referrer)
              console.log('GUId2referrerObj',referrerObj)
            }
          
            
            dynamicData.mutations.setReferrerData(referrerObj);
            setReferrerImages(referrerObj.fileSelected.map((img:any) => img.guid));
          }, 1000);
        }
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

 

    
    const handleSelect = (index: number) => {
      console.log('referrerImages',referrerImages)
        const nextImages = images.map((image, i) =>
          ( i === index 
            || (!userInfo.multiselectOptions && image.isSelected) 
          ) ? { 
            ...image, 
            
            isSelected:
            (
              (i === index && referrerImages?.length && referrerImages.includes(image.guid))
              ? false
              : !image.isSelected
            ) 
          } : {
            ...image, 
            isSelected:
              referrerImages?.length && referrerImages.includes(image.guid)
              ? true
              : image.isSelected
          }
        );

        console.log('nextImages',nextImages)
        const fileUnSelected = nextImages.filter((image) => !image.isSelected ).map((img:any) => img.guid);
        console.log('fileUnSelected',fileUnSelected)

        const fileSelected = userInfo.multiselectOptions 
                            ? nextImages
                              //No repeation on referrerImages
                              .filter((image) => (
                                  image.isSelected && !referrerImages.includes(image?.guid) 
                                ))
                              .concat(referrer.fileSelected)
                              .filter((image) =>(
                                (
                                  !fileUnSelected.includes(image.guid)
                                )
                              ))
                            : nextImages.filter((image) =>image.isSelected )
                          ;

        // setReferrerImages(fileSelected.map((img:any) => img.guid));
        //@ts-ignore
        setImages(nextImages);
        const hasSelected = nextImages.some((image) => image.isSelected);
        //@ts-ignore
        const referrerObj = {...referrer,...{hasSelected,fileSelected}}
        console.log('referrer',referrer)
        //post window event 
       
          window.parent.postMessage({ type: 'REFERRER_UPDATE', data: referrerObj }, '*');
      
        
                         
        console.log('referrerObj',referrerObj)

        let isUpdated = (
            referrerObj.hasSelected !== referrer.hasSelected ||
            referrerObj.fileSelected !== referrer.fileSelected ||
            referrerObj.fileSelected.length !== referrer.fileSelected.length
          );
        console.log('isUpdated',isUpdated)
  
        isUpdated && dynamicData.mutations.setReferrerData(referrerObj);

        // if(fileUnSelected.length && fileUnSelected.includes())
        //   setReferrerImages(fileSelected.map((img:any) => img.guid));

        let referrerImagesChange:string[] = []; 

        if(referrerImages.length){
          const imgSelected = nextImages.filter((image) => image.isSelected).map((img)=>img.guid);
          imgSelected.forEach(
            guids => {
              if(referrerImages.includes(guids) && guids){
                referrerImagesChange.push(guids)
              }
            }
          );
          
          if(referrerImagesChange.length){
            let finalArray:any[] = [...referrerImages,...referrerImagesChange];
            if(finalArray.length){
              let unique = [...removeDuplicates(finalArray)];
              setReferrerImages(unique);
            }
          }
        }  
      };

      const getAllImageParams = (filterPageNumber:string="1", libraryNameOverride:string | null = null) => {
          let libraryName = libraryNameOverride || "";
          if(!libraryName) {
            if(userInfo.libraryOptions.length===1){
              libraryName=userInfo.libraryOptions[0];
            } else if(userInfo.libraryOptions.length===2){
              libraryName=userInfo.libraryName;
            }
          }
          
          localStorage.setItem('libraryAccountKey', userInfo.libraryAccountKey);
          const fileLocationObj= {selected:libraryName}
          dynamicData.mutations.setFileLocationData(fileLocationObj);
          
          return {...userInfo,...{filterPageNumber,libraryName}};
      }
      
      const fetchImagesForLibrary = (libraryName: string) => {
        // Mark request as in progress
        setIsRequestInProgress(true);
        
        // Get images for the specified library
        getAllImagesFn(getAllImageParams(userInfo.filterPageNumber, libraryName));
      }
    
      const getImagesData = () => {
        let libraryName = "";
        if(userInfo.libraryOptions.length===1){
          libraryName=userInfo.libraryOptions[0];
        } else if(userInfo.libraryOptions.length===2){
          libraryName=userInfo.libraryName;
        }
        
        // Check if we already have a request in progress
        if (isRequestInProgress) {
          console.log('Request in progress, storing library for later:', libraryName);
          // Store the library name for processing when current request completes
          pendingLibraryRef.current = libraryName;
          return;
        }
        
        // If GUID pre-selected and no referrer images, fetch GUID first
        if(userInfo.guidPreSelected && !referrerImages.length) {
          getImagesGUIDFn({"guid":userInfo.guidPreSelected});
        }
        
        // Fetch images for the library
        fetchImagesForLibrary(libraryName);
      }
      
      

      useEffect(() => {
        const locationIsDifferent = (window.location !== window.parent.location);
        console.log('locationIsDifferent',locationIsDifferent)
        const diffentUser = (userInfo.librarySessionId!== cookies.AccountGUID && locationIsDifferent)
        const defalutUser = (userInfo.librarySessionId=== cookies.Session && !locationIsDifferent)
          if(defalutUser || diffentUser){
            getImagesData()
          }
        // eslint-disable-next-line react-hooks/exhaustive-deps    
      },[userInfo]);

      useEffect(() => {
        // if(referrer.fileSelected.length && userInfo.guidPreSelected){
          setReferrerImages(referrer.fileSelected.map((img:any) => img.guid));
          console.log('referrerImages useEffect',referrerImages)
        // }
      },[referrer.fileSelected]);



/**
 * ****************************************************************** JSX  ***************************************************************************
 */         
       
    return (
        <div className="grid max-sm:grid-cols-1 max-xl:grid-cols-2 grid-cols-4 gap-8 p-8 max-md:pt-20 content-center">
            {contextHolder}
            {
              isLoadingImg
              ? 
                <div className='center-div1  md:col-span-4'>
                  <Space size={'large'} className="text-center" wrap>
                    <Skeleton.Image style={IMAGE_STYLES}  active />
                    <Skeleton.Image style={IMAGE_STYLES} active />
                    <Skeleton.Image style={IMAGE_STYLES} active />
                    <Skeleton.Image style={IMAGE_STYLES} active />
                  </Space>
                  <Space className='pt-4 text-center'  size={'large'} wrap>
                    <Skeleton.Image style={IMAGE_STYLES}  active />
                    <Skeleton.Image style={IMAGE_STYLES} active />
                    <Skeleton.Image style={IMAGE_STYLES} active />
                    <Skeleton.Image style={IMAGE_STYLES} active />
                  </Space>
                  <Space className='pt-4 text-center' size={'large'} wrap>
                    <Skeleton.Image style={IMAGE_STYLES}  active />
                    <Skeleton.Image style={IMAGE_STYLES} active />
                    <Skeleton.Image style={IMAGE_STYLES} active />
                    <Skeleton.Image style={IMAGE_STYLES} active />
                  </Space>
                </div>
              :images.length 
                ?
                   <>
                    {images.map(
                      (image, i) => (            
                            <div key={i}   className={`border rounded-lg shadow-lg   border-gray-100 ${image.isSelected || (referrerImages?.length && referrerImages.includes(image.guid)) ?'isSelectedImg':''}`} >
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
