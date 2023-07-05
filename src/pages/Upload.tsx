import React, { FC } from 'react'
import { Typography, Checkbox } from 'antd';
import icloudImg from '../assets/provider/icolud.jpeg';
import googleDriveImg from '../assets/provider/google_drive.png';
import dropBoxImg from '../assets/provider/dropbox.jpeg';
import artzipImg from '../assets/provider/artzip.svg';

import {
  CloseCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Upload: React.FC = () : JSX.Element => {
  return (
    <div>
      <div className="p-8 flex justify-center items-center  bg-white">
      <div className="w-full h-full relative grid grid-cols-1 md:grid-cols-3 border rounded-lg">
          <div
              className="rounded-l-lg p-4 py-64 flex flex-col justify-center items-center border-0 border-r border-gray-300 ">
              <Title level={4} className="text-gray-300" disabled >My Computer / Device</Title>
              <label className="cursor-pointer hover:opacity-80 inline-flex items-center shadow-md my-4 px-8 py-4 bg-green-400 text-gray-50 border border-transparent
              rounded-md font-semibold text-md  hover:bg-green-300 active:bg-green-300 focus:outline-none 
            focus:border-green-200 focus:ring ring-green-200 disabled:opacity-25 transition ease-in-out duration-150" htmlFor="uploadImage">
                
          Select Images
                  <input id="uploadImage" className="text-sm cursor-pointer w-36 hidden" type="file"/>
              </label>
          </div>
          <div 
              className="flex flex-col relative order-first md:order-last h-28 md:h-auto justify-center items-center border border-dashed border-gray-400 col-span-2 m-2 rounded-lg bg-no-repeat bg-center bg-origin-padding bg-cover">
                <div className='relative w-6/12 flex '>
                  <Title level={4} className="text-gray-300 pl-20" disabled >Other File Sources</Title>
                  <div className='absolute right-0 text-lg'><CloseCircleOutlined /></div>
                </div>
                <div className='flex flex-row h-full w-full justify-end  items-center '>
                  <div className='max-w-sm basis-2/4'>
                    <img src={icloudImg} className="upload-logo cursor-pointer " alt="logo" />
                    <Text type="secondary" className='pl-10  text-lg'>iCloud</Text>
                  </div>
                  <div className='max-w-sm basis-2/4'>
                    <img src={dropBoxImg} className="upload-logo cursor-pointer " alt="logo" />
                    <Text type="secondary" className='pl-10  text-lg'>DropBox</Text>
                  </div>
                </div>
                <div className='flex flex-row h-full  justify-end w-full items-center '>
                  <div className='max-w-sm basis-2/4'>
                    <img src={googleDriveImg} className="upload-logo cursor-pointer " alt="logo" />
                    <Text type="secondary" className='pl-8  text-lg'>Google Drive</Text>
                  </div>
                  <div className='max-w-sm basis-2/4'>
                    <img src={artzipImg} className="upload-logo bg-pink-400 cursor-pointer " alt="logo" />
                    <Text type="secondary" className='pl-10  text-lg'>ArtZip</Text>
                  </div>
                </div>
                
          </div>
          
      </div>
    </div>
          <Checkbox className='pl-10 pb-10'>I acknolodege I permmited to print the images I am sumbmitting. See our <a>Terms of service </a></Checkbox>
  </div>
  )
}

export default Upload
