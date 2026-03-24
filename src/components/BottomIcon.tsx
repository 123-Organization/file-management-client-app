import React, { useEffect, useState, useRef } from 'react'
import { message, PaginationProps, Spin } from 'antd';
import { Pagination } from 'antd';
import { useDynamicData } from '../context/DynamicDataProvider';
import { deleteImages, postPrintImages } from '../api/gallaryApi';
import { useMutation } from '@tanstack/react-query';
import { sendEvent } from '../helpers/GA4Events';
import { useNavigate } from 'react-router';



const BottomIcon: React.FC = (): JSX.Element => {
    const dynamicData: any = useDynamicData();
    const { userInfo, referrer, fileLocation } = dynamicData.state;
    const [messageApi, contextHolder] = message.useMessage();
    const [current, setCurrent] = useState(parseInt(userInfo.filterPageNumber) || 1);
    const [pageSize, setPageSize] = useState(parseInt(userInfo.filterPerPage) || 12);
    const isChangingPageSizeRef = useRef(false);
    const [spinLoader, setSpinLoader] = useState(false);
    const navigate = useNavigate();

    
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

    const {
        mutate: printImagesDataFn,
       } = useMutation((data: any) => postPrintImages(data), {
        onSuccess(data) {
            console.log('postPrintImages...', data)
            messageApi.open({
                type: 'success',
                content: 'Print api',
              });
              setSpinLoader(false)
              window.parent.postMessage(data.data,'*')
              navigate('/thumbnail?guid='+data.data+'&timestamp='+(new Date()).toISOString().replace(/[^\d]/g,''))
        },
        onError(error: any) {},
      });

    const createPrints = () => {
        if (spinLoader) return false;
        setSpinLoader(true)
        let guids = referrer.fileSelected.map((image: { guid: string })=>image.guid);
        printImagesDataFn({guids});
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
        ? <div className='pt-5 pb-2 text-center'>
            <Spin tip="Deleting files..." ><></></Spin>
          </div>
        : <div style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}>
            {contextHolder}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              padding: '8px 20px',
              borderRadius: '100px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(229, 231, 235, 0.8)',
              gap: '16px',
              maxWidth: '90vw',
              backdropFilter: 'blur(8px)',
            }}>
              {/* Left: action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                {referrer.hasSelected ? (
                  <>
                    {/* Selection count badge */}
                    <span style={{
                      fontSize: '12px', fontWeight: 600, color: '#111827',
                      background: '#f3f4f6', border: '1px solid #e5e7eb',
                      borderRadius: '20px', padding: '4px 12px', marginRight: '4px',
                      whiteSpace: 'nowrap',
                    }}>
                      {referrer.fileSelected?.length ?? 0} selected
                    </span>

                    <button
                      onClick={onDeleteHandler}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '6px 14px', borderRadius: '100px', fontSize: '13px',
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

                    <button
                      onClick={createPrints}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '7px 18px', borderRadius: '100px', fontSize: '13px',
                        fontWeight: 600, color: '#ffffff', background: '#111827',
                        border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#1f2937'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <Spin spinning={spinLoader} size="small" style={{ color: '#fff' }}>
                        <span>{userInfo.button_text}</span>
                      </Spin>
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: '13px', color: '#6b7280', padding: '0 8px' }}>Select items to act</span>
                )}
              </div>

              {/* Vertical divider */}
              <div style={{
                width: '1px', height: '28px', background: '#e5e7eb',
                flexShrink: 0,
              }} />

              {/* Right: pagination */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Pagination
                  showSizeChanger={true}
                  showQuickJumper={false}
                  pageSizeOptions={[2, 4, 6, 8, 10, 12, 15, 25, 50, 100]}
                  onChange={onChange}
                  onShowSizeChange={(current, size) => {
                    try {
                        isChangingPageSizeRef.current = true;
                        const userInfoObj = {
                            ...userInfo, 
                            filterPerPage: size.toString(),
                            filterUpdate: userInfo.filterUpdate + Math.random().toString(36).substr(2, 9)
                        };
                        dynamicData.mutations.setUserInfoData(userInfoObj);
                        setPageSize(size);
                        setTimeout(() => {
                            isChangingPageSizeRef.current = false;
                        }, 100);
                    } catch (error) {
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

export default BottomIcon;
