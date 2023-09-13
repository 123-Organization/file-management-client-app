import React, { CSSProperties, useState } from 'react'
import logo from '../assets/logo/finerworks_logo_icon.svg';
import FilterSortModal from './FilterSortModal';
import UploadModal from './UploadModal';
import { Checkbox, MenuProps, Spin } from 'antd';
import { Dropdown, Space, Modal, message } from 'antd';
import { FileOutlined, FileTextOutlined } from '@ant-design/icons';
import { useDynamicData } from "../context/DynamicDataProvider";
import { useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { postPrintImages } from '../api/gallaryApi';

/**
 * ****************************************************************** Outer Function ****************************************************
 */


    
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
    const [messageApi, contextHolder] = message.useMessage();
    const location = useLocation();
    const navigate = useNavigate();

    const dynamicData: any = useDynamicData();
    const { referrer, fileLocation, userInfo } = dynamicData.state;

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

        let libraryName  = ((e.key==='2')?'inventory':'temporary')
        const fileLocationObj= {selected:libraryName} 
        
        let isUpdated = JSON.stringify(fileLocation) !== JSON.stringify(fileLocationObj);
        console.log('isUpdated',isUpdated)
        isUpdated && dynamicData.mutations.setFileLocationData(fileLocationObj);

        let userInfoObj = {...userInfo,libraryName};
    
        let isUpdatedUser = JSON.stringify(userInfo) !== JSON.stringify(userInfoObj);
        console.log('isUpdated',isUpdated,userInfo,userInfoObj)
    
        if(isUpdatedUser) {
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
/**
 * ****************************************************************** JSX  ***************************************************************************
 */
    return (
        <div className='flex w-full'>
            <div className=" fixed left-0 z-50 w-full top-0 h-18 bg-white pt-1  mb-2 border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                <div className="grid max-md:grid-cols-4 max-md:grid-rows-2 max-w-[700px] grid-cols-7 font-medium">
                    <div className='flex flex-col items-center'>
                        <img  src={logo} onClick={()=>{ navigate('/') }} className="App-logo-icon cursor-pointer flex flex-col " alt="logo" />    
                    </div>
                    {/* <button onClick={()=>{ navigate('/') }} type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                        <svg  className="w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                        </svg>
                        <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Home</span>
                    </button> */}
                    <button onClick={()=>{ navigate('/thumbnail') }} type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                        <svg className="w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5h6M9 8h6m-6 3h6M4.996 5h.01m-.01 3h.01m-.01 3h.01M2 1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z"/>
                        </svg>
                        <span className="text-sm text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                        {/* Gallary */}
                        <Dropdown menu={menuProps}>
                            <Space>
                               My Libraries
                            </Space>
                        </Dropdown>
                        </span>
                    </button>
                    { 
                        location.pathname==='/thumbnail' 
                        ?
                            <>
                                <button  onClick={() => setOpenUpload(true)}  data-tooltip-target="tooltip-document" type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                                    <svg className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M.188 5H5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707c-.358.362-.617.81-.753 1.3C.148 5.011.166 5 .188 5ZM14 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm2 7h-1v1a1 1 0 0 1-2 0v-1h-1a1 1 0 0 1 0-2h1v-1a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2Z" />
                                        <path d="M6 14a7.969 7.969 0 0 1 10-7.737V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H.188A.909.909 0 0 1 0 6.962V18a1.969 1.969 0 0 0 1.933 2h6.793A7.976 7.976 0 0 1 6 14Z" />
                                    </svg>
                                    {/* <span className="sr-only">New document</span> */}
                                    <span className="text-sm text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">New File</span>
                                </button>
                                <div id="tooltip-document" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                                    New document
                                    <div className="tooltip-arrow" data-popper-arrow></div>
                                </div>
                                <button onClick={() => setOpenFilter(true)} type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                                <svg className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 17V1m0 0L1 4m3-3 3 3m4-3h6l-6 6h6m-7 10 3.5-7 3.5 7m-6.125-2H16"/>
            </svg>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap group-hover:text-blue-600 dark:group-hover:text-blue-500">Filter & Sort</span>
                                </button>
                            </>
                        : <></>
                    }
                    { 
                        referrer.hasSelected &&
                        <div onClick={createPrints} className='fw-sky-btn absolute max-md:row-1 max-md:col-span-4 max-md:relative'>

                            <Spin spinning={spinLoader}  size="small">
                            <button type="button"  className="  
                                 ">Create Prints</button>
                            </Spin>
                        </div>
                    }
                </div>
            </div>

            <FilterSortModal openModel={openFilter} setOpen={setOpenFilter} />
            <UploadModal openModel={openUpload} setOpen={setOpenUpload} />

        </div>
    )
}

export default HeaderIcon
