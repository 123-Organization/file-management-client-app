import React, { FC } from 'react'
import { Typography, Checkbox } from 'antd';
import icloudImg from '../assets/provider/icon_icloud.svg';
import googleDriveImg from '../assets/provider/icon_googledrive.svg';
import dropBoxImg from '../assets/provider/icon_dropbox.svg';
import artzipImg from '../assets/provider/icon_artzip.svg';

import {
  CloseCircleOutlined
} from '@ant-design/icons';
import { useDynamicData } from '../context/DynamicDataProvider';

const { Title, Text } = Typography;

const Upload: React.FC = (): JSX.Element => {

  const dynamicData: any = useDynamicData();
  const { userInfo } = dynamicData.state;


  return (
    <div>
      <div className="p-8 flex justify-center items-center  bg-white">
        <div className="w-full h-screen relative grid grid-cols-1 md:grid-cols-3 border rounded-lg">
          <div
            className="first-flex-div rounded-l-lg p-4 sm:py-64 flex flex-col justify-center items-center border-0 max-sm:border-b sm:border-r border-gray-300 ">
            <Title level={4} className="text-gray-300" disabled >My Computer / Device</Title>
            <label className="cursor-pointer hover:opacity-80 inline-flex items-center 
              shadow-md my-4 px-8 py-4 bg-green-400 text-gray-50 border border-transparent
              rounded-md font-semibold text-base  hover:bg-green-300 active:bg-green-300 focus:outline-none 
            focus:border-green-200 focus:ring ring-green-200 disabled:opacity-25 transition ease-in-out duration-150" htmlFor="uploadImage">

              Select Images
              <input id="uploadImage" className="text-sm cursor-pointer w-36 hidden" type="file" />
            </label>
          </div>
          <div
            className="second-flex-div flex flex-col relative order-first md:order-last h-28 md:h-auto justify-center items-center  border-gray-400 col-span-2 m-2 rounded-lg bg-no-repeat bg-center bg-origin-padding bg-cover">
            <div className='relative justify-center w-full flex '>
              <Title level={4} className="text-gray-300 sm:pl-20" disabled >Other File Sources</Title>
              <div className='absolute -top-2 right-0 text-lg'><CloseCircleOutlined style={{ fontSize: '25px' }} /></div>
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
              {/* <div className='basis-2/4 flex flex-col'>
                <div className='pb-5'>
                  <img src={googleDriveImg} className="upload-logo inline cursor-pointer " alt="logo" />
                </div>
                <Text type="secondary" className='text-lg'>Google Drive</Text>
              </div> */}
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
      <Checkbox className='pl-10 pb-10  text-gray-400 ' style={{ fontSize: '16px' }}>I1s acknowledgement I am permitted to print the images I am sumbmitting. See our <a className='underline' href={userInfo.domain+userInfo.terms_of_service_url} target="_blank">terms of service </a></Checkbox>
    </div>
  )
}

export default Upload
