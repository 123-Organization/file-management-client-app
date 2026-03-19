import React, { CSSProperties, useEffect, useState } from 'react'
import fwlogo from '../assets/logo/finerworks_logo_icon.svg';
import ezlogo from '../assets/logo/ezcanvas_logo_icon.svg';
import FilterSortModal from './FilterSortModal';
import UploadModal from './UploadModal';
import { Checkbox, MenuProps, Spin, Skeleton, Avatar } from 'antd';
import { Dropdown, Space, Modal, message } from 'antd';
import { FileOutlined, FileTextOutlined } from '@ant-design/icons';
import { useDynamicData } from "../context/DynamicDataProvider";
import { useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { postPrintImages } from '../api/gallaryApi';

/**
 * ****************************************************************** Outer Function ****************************************************
 */


type SizeType = 'default' | 'small' | 'large';    
type AvatarShapeType = 'circle' | 'square';
const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    message.info('Click on left button.');
    console.log('click left button', e);
  };

const MODAL_STYLES: CSSProperties = {
    fontSize: '16px'
}

/**
 * ****************************************************************** Function Components **********************************************
 */
const HeaderIcon: React.FC = (): JSX.Element => {

    const [spinLoader, setSpinLoader] = useState(false);
    const [openFilter, setOpenFilter] = useState(false);
    const [openUpload, setOpenUpload] = useState(false);
    const [active, setActive] = useState(true);
    const [size, setSize] = useState<SizeType>('large');
    const [avatarShape, setAvatarShape] = useState<AvatarShapeType>('square');
    const [messageApi, contextHolder] = message.useMessage();
    const location = useLocation();
    const navigate = useNavigate();

    const dynamicData: any = useDynamicData();
    const { referrer, fileLocation, userInfo, openUpload: contextOpenUpload } = dynamicData.state;

    // Sync local upload state with context signal from Gallery
    useEffect(() => {
      if (contextOpenUpload) {
        setOpenUpload(true);
        dynamicData.mutations.setOpenUpload(false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextOpenUpload]);

    const {
        mutate: printImagesDataFn,
       } = useMutation((data: any) => postPrintImages(data), {
        onSuccess(data) {
            console.log('postPrintImages...', data)
            messageApi.open({
                type: 'success',
                content: 'Print api',
              });
              //yyyymmddHHMMSS
              setSpinLoader(false)
              window.parent.postMessage(data.data,'*')
              navigate('/thumbnail?guid='+data.data+'&timestamp='+(new Date()).toISOString().replace(/[^\d]/g,''))
            //   window.open(`https://finerworks.com/apps/orderform/post.aspx?guid=${data.data}`, "_blank")  
        },
        onError(error: any) {},
      });
    
    
    const handleMenuClick: MenuProps['onClick'] = (e) => {
        console.log('🚨 HeaderIcon handleMenuClick triggered! This might be resetting our pagination!');
        console.log('🚨 Event key:', e.key);

        let libraryName  = ((e.key==='2')?'inventory':'temporary')
        const fileLocationObj= {selected:libraryName} 
        
        let isUpdated = JSON.stringify(fileLocation) !== JSON.stringify(fileLocationObj);
        console.log('🚨 Library location isUpdated:', isUpdated)
        isUpdated && dynamicData.mutations.setFileLocationData(fileLocationObj);

        let userInfoObj = {...userInfo,libraryName};
    
        let isUpdatedUser = JSON.stringify(userInfo) !== JSON.stringify(userInfoObj);
        console.log('🚨 UserInfo isUpdatedUser:', isUpdatedUser);
        console.log('🚨 userInfoObj being created:', {
            filterPageNumber: userInfoObj.filterPageNumber,
            filterPerPage: userInfoObj.filterPerPage,
            libraryName: userInfoObj.libraryName
        });
    
        if(isUpdatedUser) {
            console.log('🚨 RESETTING filterPageNumber to 1 and calling setUserInfoData!');
            userInfoObj.filterPageNumber="1";
            dynamicData.mutations.setUserInfoData(userInfoObj);
        } 
        
    };
        
    const items: MenuProps['items'] = [
       
    ];

    userInfo.libraryOptions.includes("temporary") && items.push({
        label: 'Temporary',
        key: '1',
        icon: <FileOutlined className='gallary-text-lg' />,
        
      });

      userInfo.libraryOptions.includes("inventory") && items.push({
        label: 'Inventory',
        key: '2',
        icon: <FileTextOutlined className='gallary-text-lg'  />,
    })

    const menuProps = {
        items,
        onClick: handleMenuClick,
    };
    
    const createPrints = () => {
        if (spinLoader) return false;
        setSpinLoader(true)
        let guids = referrer.fileSelected.map((image: { guid: string })=>image.guid);
        printImagesDataFn({guids});
        // window.open(`https://finerworks.com/apps/orderform/post.aspx?guids=${guids}`, "_blank")

    }
    const getLocation = () => true;// (window.location.href !== window.parent.location.href)
    const locationIsDiff = getLocation();
    console.log('locationIsDiff',locationIsDiff)
    const logo = (
            !userInfo.domain && 
            locationIsDiff
        ) 
        ? "" : ((userInfo.domain === "finerworks.com" || !userInfo.domain) ? fwlogo : ezlogo);
    const info = () => {
        Modal.info({
          title: 'Print Acknowledgement',
          content: (
            <div>
              <p> 
                <Checkbox className='py-10 align-text-top  text-gray-400 ' style={MODAL_STYLES}>
                    I acknowledge I am the copyright holder or <a href='#' className='text-blue-400'>authorized</a> to print this images.
                </Checkbox>
            </p>                                                                                                                                                                                                                                          
            </div>
          ),
          onOk() {  },
          onCancel() {  },
        });
      };

    useEffect(() => {
        console.log('userInfo.domain',userInfo.domain)
    },[userInfo.domain]);

 

    useEffect(() => {
        console.log('referrer.filterCount',referrer.filterCount)
    },[referrer.filterCount]);

/**
 * ****************************************************************** JSX  ***************************************************************************
 */
    return (
        <>
          <style>{`
            .header-bar {
              display: flex;
              align-items: center;
              width: 100%;
              height: 64px;
              gap: 6px;
              position: relative;
            }

            /* Logo section */
            .header-logo-wrap {
              display: flex;
              align-items: center;
              padding-right: 18px;
              margin-right: 4px;
              border-right: 1px solid #e5e7eb;
              height: 36px;
              flex-shrink: 0;
            }

            /* Grouped nav pill container */
            .header-nav-group {
              position: absolute;
              left: 50%;
              transform: translateX(-50%);
              display: inline-flex;
              align-items: center;
              gap: 16px;
              background: transparent;
              border: none;
              padding: 0;
            }

            /* Individual nav button inside the group */
            .header-nav-btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 500;
              color: #4b5563;
              background: #f3f4f6;
              border: 1px solid #e5e7eb;
              cursor: pointer;
              transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
              white-space: nowrap;
              line-height: 1;
            }
            .header-nav-btn:hover {
              background: #ffffff;
              color: #111827;
              box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .header-nav-btn svg {
              flex-shrink: 0;
              color: #6b7280;
              transition: color 0.15s ease;
            }
            .header-nav-btn:hover svg {
              color: #374151;
            }

            /* Standalone nav button (library switcher on mobile) */
            .header-nav-btn-standalone {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 7px 13px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 500;
              color: #4b5563;
              background: transparent;
              border: none;
              cursor: pointer;
              transition: background 0.15s ease, color 0.15s ease;
              white-space: nowrap;
            }
            .header-nav-btn-standalone:hover {
              background: #f3f4f6;
              color: #111827;
            }

            /* Create prints CTA — compact, fits the 64px header */
            .header-create-btn {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 6px 14px;
              border-radius: 8px;
              font-size: 12.5px;
              font-weight: 600;
              color: #ffffff;
              background: #1f2937;
              border: none;
              cursor: pointer;
              transition: background 0.15s ease, box-shadow 0.15s ease;
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.15);
              letter-spacing: 0.01em;
              max-height: 34px;
            }
            .header-create-btn:hover {
              background: #111827;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            }
          `}</style>

          <div className="header-bar">
            {/* Logo */}
            <div className="header-logo-wrap">
              {!logo
                ? <Skeleton.Avatar active={active} size="default" shape={avatarShape} />
                : <img src={logo} onClick={() => window.location.reload()} className="App-logo-icon cursor-pointer" alt="logo" />
              }
            </div>

            {/* Grouped toolbar actions */}
            {location.pathname === '/thumbnail' && (
              <div className="header-nav-group">
                <button onClick={() => setOpenUpload(true)} type="button" className="header-nav-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15V4M12 4L8.5 7.5M12 4L15.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 16.5C21.1 15.7 22 14.5 22 13C22 10.5 20 8.5 17.5 8.5C17 8.5 16.5 8.6 16.1 8.7C15.4 6.5 13.3 5 11 5C8 5 5.5 7.5 5.5 10.5C5.5 11 5.6 11.5 5.7 11.9C4.2 12.6 3.1 14 3.1 15.7C3.1 18 5.1 20 7.5 20H18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Upload
                </button>
                <button onClick={() => setOpenFilter(true)} type="button" className="header-nav-btn">
                  <svg width="18" height="18" fill="none" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 17V1m0 0L1 4m3-3 3 3m4-3h6l-6 6h6m-7 10 3.5-7 3.5 7m-6.125-2H16"/>
                  </svg>
                  Filter & Sort
                </button>
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Create prints CTA */}
            {referrer.hasSelected && (
              <button onClick={createPrints} className="header-create-btn">
                <Spin spinning={spinLoader} size="small">
                  <span>{userInfo.button_text}</span>
                </Spin>
              </button>
            )}
          </div>

          <FilterSortModal openModel={openFilter} setOpen={setOpenFilter} />
          <UploadModal openModel={openUpload} setOpen={setOpenUpload} />
        </>
    )
}

export default HeaderIcon
