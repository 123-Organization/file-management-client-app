import React from 'react'
import icloudImg from '../assets/provider/icon_icloud.svg';
import googleDriveImg from '../assets/provider/icon_googledrive.svg';
import dropBoxImg from '../assets/provider/icon_dropbox.svg';
import artzipImg from '../assets/provider/icon_artzip.svg';

import { Typography, Checkbox, Modal, Button, message, notification } from 'antd';
const { Title, Text } = Typography;

const UppyDemoBox: React.FC = () : JSX.Element => {
  return (
    <div
              className="second-flex-div flex flex-col relative order-first md:order-last h-28 md:h-auto justify-center items-center  border-gray-400 col-span-2 m-2 rounded-lg bg-no-repeat bg-center bg-origin-padding bg-cover">
              <div className='relative justify-center w-full flex '>
                <Title level={4} className="text-gray-300 sm:pl-20" disabled >Other File Sources</Title>
                {/* <div className='absolute -top-2 right-0 text-lg'><CloseCircleOutlined style={{ fontSize: '25px' }} /></div> */}
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
                <div className='basis-2/4 flex flex-col'>
                  <div className='pb-5'>
                    <img src={googleDriveImg} className="upload-logo inline cursor-pointer " alt="logo" />
                  </div>
                  <Text type="secondary" className='text-lg'>Google Drive</Text>
                </div>
                <div className='basis-2/4 flex flex-col'>
                  <div className='pb-5'>
                    <img src={artzipImg} className="upload-logo inline cursor-pointer " alt="logo" />
                  </div>
                  <Text type="secondary" className='text-lg'>ArtZip</Text>
                </div>
              </div>
            </div>
  )
}

export default UppyDemoBox
