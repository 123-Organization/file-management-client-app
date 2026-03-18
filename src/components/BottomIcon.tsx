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
        : <div>
            {contextHolder}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              height: '52px',
              padding: '0 16px',
              background: '#ffffff',
              gap: '0',
            }}>
              {/* Left: action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                {referrer.hasSelected ? (
                  <>
                    {/* Selection count badge */}
                    <span style={{
                      fontSize: '12px', fontWeight: 600, color: '#6b7280',
                      background: '#f3f4f6', border: '1px solid #e5e7eb',
                      borderRadius: '20px', padding: '2px 10px', marginRight: '4px',
                      whiteSpace: 'nowrap',
                    }}>
                      {referrer.fileSelected?.length ?? 0} selected
                    </span>

                    {fileLocation.selected === 'inventory' && (
                      <button
                        onClick={onDownloadHandler}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '5px 13px', borderRadius: '8px', fontSize: '13px',
                          fontWeight: 500, color: '#374151', background: '#f3f4f6',
                          border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#f3f4f6')}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 20 19" xmlns="http://www.w3.org/2000/svg">
                          <path stroke="#6b7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15h.01M4 12H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-3M9.5 1v10.93m4-3.93-4 4-4-4"/>
                        </svg>
                        Download
                      </button>
                    )}

                    <button
                      onClick={onDeleteHandler}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '5px 13px', borderRadius: '8px', fontSize: '13px',
                        fontWeight: 500, color: '#dc2626', background: '#fef2f2',
                        border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; }}
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 18 20" xmlns="http://www.w3.org/2000/svg">
                        <path stroke="#dc2626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"/>
                      </svg>
                      Delete
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>No items selected</span>
                )}
              </div>

              {/* Vertical divider */}
              <div style={{
                width: '1px', height: '24px', background: '#e5e7eb',
                margin: '0 14px', flexShrink: 0,
              }} />

              {/* Right: pagination */}
              <div style={{ marginLeft: 'auto' }}>
                <Pagination
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
                        console.log('🔥 Setting isChangingPageSize REF to true');
                        isChangingPageSizeRef.current = true;
                        
                        const userInfoObj = {
                            ...userInfo, 
                            filterPerPage: size.toString(),
                            filterUpdate: userInfo.filterUpdate + Math.random().toString(36).substr(2, 9)
                        };
                        dynamicData.mutations.setUserInfoData(userInfoObj);
                        
                        setTimeout(() => {
                            const updatedUserInfo = dynamicData.state.userInfo;
                            console.log('🔥 VERIFICATION - Updated state after setUserInfoData:', {
                                filterPageNumber: updatedUserInfo.filterPageNumber,
                                filterPerPage: updatedUserInfo.filterPerPage
                            });
                        }, 50);
                        
                        setPageSize(size);
                        
                        setTimeout(() => {
                            isChangingPageSizeRef.current = false;
                        }, 100);
                        
                    } catch (error) {
                        console.error('🔥 ERROR in onShowSizeChange:', error);
                        isChangingPageSizeRef.current = false;
                    }
                  }}
                  current={current}
                  pageSize={pageSize}
                  total={referrer.filterCount}
                  size="small"
                />
              </div>
            </div>
          </div>
    )
}

export default BottomIcon
