import React from 'react'

import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import { Dashboard } from '@uppy/react';
import GoogleDrive from '@uppy/google-drive';
import Dropbox from '@uppy/dropbox';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { useDynamicData } from '../context/DynamicDataProvider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { postUppyImages } from '../api/gallaryApi';

const SERVER_BASE_URL = 'http://localhost:3020';
// const SERVER_BASE_URL = 'http://13.50.227.147:5000';
const getTimeStamp = () => {
  return Date.now()
}
const debugLogger = {
  debug: (...args:any) => console.debug(`[Uppy] [${getTimeStamp()}]`, ...args),
  warn: (...args:any) => console.warn(`[Uppy] [${getTimeStamp()}]`, ...args),
  error: (...args:any) => console.error(`[Uppy] [${getTimeStamp()}]`, ...args),
};


  
const UppyUploadBox: React.FC = () : JSX.Element => {
    
  const dynamicData: any = useDynamicData();
  const { userInfo } = dynamicData.state;
  

  const {
    mutate: fileUploadPostDataFn,
   } = useMutation((data: any) => postUppyImages(data), {
    onSuccess(data) {
     window.location.reload();
    },
    onError(error: any) {},
  });

  const uppy = new Uppy({ 
    logger: debugLogger,
    autoProceed: false,
    restrictions:{
      maxFileSize: (1024*1024*80),
      maxNumberOfFiles: 20,
      allowedFileTypes : ['.jpg', '.jpeg', '.png', '.bmp','.tif']
    } })
    .use(AwsS3, {
      shouldUseMultipart: (file) => file.size > 100 * 2 ** 20,
      companionUrl: `${SERVER_BASE_URL}`,
    })
    .use(GoogleDrive, {
      companionUrl: `${SERVER_BASE_URL}`,
    })
    .use(Dropbox, {
      companionUrl: `${SERVER_BASE_URL}`,
    })
    .on("complete", (result) => {
      if (result.failed.length === 0) {
        console.log("Upload successful");
      } else {
        console.warn("Upload failed");
      }
  
      if(result.successful.length){
        let fileDetails = result.successful.map((file:any) => {
            let path = file.uploadURL.split('/');
            let fileName = path[path.length-1];
            return {
              fileName,
              'fileSize' : file.size,
              'fileURL' : file.uploadURL
            }
        });
  
        const fileUploadPostData = {fileDetails,...userInfo}
        console.log("fileUploadPostData", fileUploadPostData);
        fileUploadPostDataFn(fileUploadPostData)
      }
      console.log("successful files:", result.successful);
      console.log("failed files:", result.failed);
    });
    

  return (
    <div className="flex justify-end items-center pt-6">

      <Dashboard  uppy={uppy} plugins={['GoogleDrive','Dropbox']} />
    </div>
  )
}

export default UppyUploadBox
