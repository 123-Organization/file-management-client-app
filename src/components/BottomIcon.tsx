import React, { useEffect, useState, useRef } from 'react'
import { message, PaginationProps, Spin } from 'antd';
import { Pagination } from 'antd';
import { useDynamicData } from '../context/DynamicDataProvider';
import { deleteImages } from '../api/gallaryApi';
import { useMutation } from '@tanstack/react-query';
import { sendEvent } from '../helpers/GA4Events';



const BottomIcon: React.FC = (): JSX.Element => {
    const dynamicData: any = useDynamicData();
    const { userInfo, referrer, fileLocation } = dynamicData.state;
    const [messageApi, contextHolder] = message.useMessage();
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(parseInt(userInfo.filterPerPage) || 12);
    const isChangingPageSizeRef = useRef(false);

    
    const {
        mutate: deleteImageFn,
        isLoading:isLoadingImgDelete,
      } = useMutation((data: any) => deleteImages(data), {
        onSuccess(data) {
          fileManagerAppFileDeletedEvent()
          messageApi.open({
            type: 'success',
            content: 'File has been deleted',
          });
          //setOpen(false)
          let filterUpdate=(userInfo.filterUpdate?"":" ");
          let userInfoObj={...userInfo,filterUpdate};
          dynamicData.mutations.setUserInfoData(userInfoObj);
        },
        onError(error: any) {},
    });

    const fileManagerAppFileDeletedEvent = () => {
        const eventName = "file_manager_app_file_deleted";
        const eventParams = {
          'deleted': 'true'
        };
        sendEvent(userInfo.GAID,eventName,eventParams);
    }
    
    const onChange: PaginationProps['onChange']|any = (filterPageNumber:number) => {
        console.log('🔢🔢🔢 onChange called with filterPageNumber:', filterPageNumber);
        console.log('🔢 isChangingPageSize REF value:', isChangingPageSizeRef.current);
        console.log('🔢 Current userInfo before onChange:', {
            filterPageNumber: userInfo.filterPageNumber,
            filterPerPage: userInfo.filterPerPage
        });
        
        // If we're in the middle of changing page size, ignore the onChange event
        if (isChangingPageSizeRef.current) {
            console.log('🔢 ✅ IGNORING onChange because we are changing page size');
            setCurrent(filterPageNumber);
            return;
        }
        
        console.log('🔢 ❌ NOT IGNORING onChange - processing normally');
        
        // Get the most recent userInfo from context to avoid stale state
        const currentUserInfo = dynamicData.state.userInfo;
        console.log('🔢 Fresh currentUserInfo:', {
            filterPageNumber: currentUserInfo.filterPageNumber,
            filterPerPage: currentUserInfo.filterPerPage
        });
        
        let userInfoObj = {...currentUserInfo, filterPageNumber: filterPageNumber.toString()};
        let isUpdated = JSON.stringify(currentUserInfo) !== JSON.stringify(userInfoObj);
        
        console.log('🔢 userInfoObj to be set:', {
            filterPageNumber: userInfoObj.filterPageNumber,
            filterPerPage: userInfoObj.filterPerPage
        });
        
        if (isUpdated) {
            console.log('🔢 Calling setUserInfoData from onChange...');
            dynamicData.mutations.setUserInfoData(userInfoObj);
        }
        
        setCurrent(filterPageNumber);
      };

    const onDeleteHandler = () => {
        let guids = referrer.fileSelected.map((image: { guid: string })=>image.guid).join();
        if (window.confirm('Click OK to confirm you want to deleted the selected image(s).')) {
            let data = {
                  guids,
                  "librarySessionId":userInfo.librarySessionId,
                  "libraryAccountKey": userInfo.libraryAccountKey,
                  "librarySiteId": userInfo.librarySiteId
            }; 
            deleteImageFn(data);
          }

    }  

    const onDownloadHandler = () => {
        let guids = referrer.fileSelected.map((image: { guid: string })=>image.guid).join();
        let locationPath = 'https://'+userInfo.domain +'/myaccount/mydownloads.aspx?guids='+guids;
        window.parent.location.href = locationPath;
    }  
    
    console.log('fileLocation',fileLocation)
    console.log('🎯 BottomIcon RENDER - Pagination props:', {
        current: current,
        pageSize: pageSize,
        total: referrer.filterCount,
        showSizeChanger: true,
        pageSizeOptions: [2, 4, 6, 8, 10, 12, 15, 25, 50, 100]
    });
    
    useEffect(() => {
        console.log('userInfo.filterPageNumber',userInfo.filterPageNumber)
        // onChange(userInfo.filterPageNumber);
        // setPageNumber(userInfo.filterPageNumber)
        setCurrent(+userInfo.filterPageNumber)
      },[userInfo.filterPageNumber]);

      useEffect(() => {
        console.log('📊 BottomIcon useEffect - userInfo.filterPerPage changed to:', userInfo.filterPerPage)
        console.log('📊 Full userInfo in useEffect:', {
            filterPageNumber: userInfo.filterPageNumber,
            filterPerPage: userInfo.filterPerPage,
            libraryName: userInfo.libraryName
        })
        console.log('📊 Setting pageSize state to:', +userInfo.filterPerPage)
        setPageSize(+userInfo.filterPerPage)
      },[userInfo.filterPerPage]);
        
    return (
        isLoadingImgDelete 
        ? <div className='pt-5 pb-2'>
            <Spin tip="Deleting files..." ><></></Spin>
          </div>
        :<div className='flex'>
            <div></div>
            <div className="flex fixed bottom-0 left-0  w-full h-16 bg-white  border-b mt-2 border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                <div className="grid h-full max-w-lg grid-cols-2 font-medium basis-1/2">
                    {
                        referrer.hasSelected &&
                        <>
                            {
                            fileLocation.selected==='inventory' && 
                                <button  onClick={onDownloadHandler}  type="button" className="max-md:ml-4 inline-flex flex-col items-center ml-20 justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                                    <svg className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 19">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15h.01M4 12H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-3M9.5 1v10.93m4-3.93-4 4-4-4" />
                                    </svg>
                                    <span className="max-md:whitespace-normal text-sm whitespace-nowrap text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Download Selected</span>
                                </button>
                            }
                            <button onClick={onDeleteHandler} data-tooltip-target="tooltip-document" type="button" className="max-md:pl-2 inline-flex ml-20 flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                                <svg className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z" />
                                </svg>
                                {/* <span className="sr-only">New document</span> */}
                                <span className="max-md:whitespace-normal text-sm text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Delete Selected</span>
                            </button>
                        </>    
                    }
                </div>
                <div className='flex w-full justify-end'>
                    <Pagination 
                        className=' mt-5 mr-3 ' 
                        showSizeChanger={true}
                        showQuickJumper={false}
                        pageSizeOptions={[2, 4, 6, 8, 10, 12, 15, 25, 50, 100]}
                        onChange={onChange}
                        onShowSizeChange={(current, size) => {
                            console.log('🔥🔥🔥 CRITICAL: onShowSizeChange DEFINITELY CALLED! 🔥🔥🔥');
                            console.log('🔥 FIRST LOG: onShowSizeChange handler entry point');
                            console.log('🔥 onShowSizeChange called - size:', size, 'current:', current);
                            console.log('🔥 Type of size:', typeof size, 'Type of current:', typeof current);
                            console.log('🔥 userInfo before change:', {
                                filterPageNumber: userInfo.filterPageNumber,
                                filterPerPage: userInfo.filterPerPage
                            });
                            
                            try {
                                // Set ref flag to prevent onChange from interfering
                                console.log('🔥 Setting isChangingPageSize REF to true');
                                isChangingPageSizeRef.current = true;
                                
                                // Force a unique update by adding timestamp to ensure React detects the change
                                const userInfoObj = {
                                    ...userInfo, 
                                    filterPerPage: size.toString(),
                                    filterUpdate: userInfo.filterUpdate + Math.random().toString(36).substr(2, 9)
                                };
                                console.log('🔥 BottomIcon onShowSizeChange - userInfoObj:', {
                                    filterPageNumber: userInfoObj.filterPageNumber,
                                    filterPerPage: userInfoObj.filterPerPage,
                                    libraryName: userInfoObj.libraryName
                                });
                                
                                console.log('🔥 About to call setUserInfoData...');
                                console.log('🔥 userInfoObj being passed to setUserInfoData:', JSON.stringify(userInfoObj, null, 2));
                                dynamicData.mutations.setUserInfoData(userInfoObj);
                                console.log('🔥 setUserInfoData called successfully');
                                
                                // Check if the state was actually updated
                                setTimeout(() => {
                                    const updatedUserInfo = dynamicData.state.userInfo;
                                    console.log('🔥 VERIFICATION - Updated state after setUserInfoData:', {
                                        filterPageNumber: updatedUserInfo.filterPageNumber,
                                        filterPerPage: updatedUserInfo.filterPerPage
                                    });
                                }, 50);
                                
                                console.log('🔥 About to call setPageSize...');
                                setPageSize(size);
                                console.log('🔥 setPageSize called successfully');
                                
                                // Clear the ref flag after a delay to allow onChange to work normally for actual page navigation
                                setTimeout(() => {
                                    console.log('🔥 Clearing isChangingPageSize REF to false');
                                    isChangingPageSizeRef.current = false;
                                }, 100);
                                
                            } catch (error) {
                                console.error('🔥 ERROR in onShowSizeChange:', error);
                                isChangingPageSizeRef.current = false; // Clear flag on error
                            }
                        }}
                        current={current} 
                        pageSize={pageSize} 
                        total={referrer.filterCount} 
                    />
                </div>
            </div>

        </div>
    )
}

export default BottomIcon
