import React, { useEffect } from 'react'

import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import { Dashboard } from '@uppy/react';
import GoogleDrive from '@uppy/google-drive';
import Dropbox from '@uppy/dropbox';
import Box from '@uppy/box';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { useDynamicData } from '../context/DynamicDataProvider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getUserAccount, postUppyImages } from '../api/gallaryApi';

import ArtzipIcon from "../assets/provider/icon_artzip.svg"
import Url from '@uppy/url';

const SERVER_BASE_URL = 'https://companion-app-filemanagement.finerworks.com';
//  const SERVER_BASE_URL = 'http://localhost:3020';

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

  const {
    mutate: userDetailsDataFn,
   } = useMutation((data: any) => getUserAccount(data), {
    onSuccess(data) {
      console.log(data.data.user_account.account_id)
      if(data.data.user_account.account_id){
        window.location.href = 'https://app.artzip.com/referrals/finerworks?metadata[user]='+data.data.user_account.account_id+"&return_url=http://google.com&postback_url=http://yahoo.com"
      }
    },
    onError(error: any) {},
  });

  const uppy = new Uppy({ 
    logger: debugLogger,
    autoProceed: false,
    restrictions:{
      maxFileSize: (1024*1024*500*20),
      maxNumberOfFiles: 20,
      allowedFileTypes : ['.jpg', '.jpeg', '.png', '.bmp','.tif','.tiff','.zip','.psd','.svg']
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
    .use(Box, {
      companionUrl: `${SERVER_BASE_URL}`,
    })
    .use(Url, {
      companionUrl: `${SERVER_BASE_URL}`,
    })
    .on("complete", (result) => {
      if (result.failed.length === 0) {
        console.log("Upload successful");
      } else {
        console.warn("Upload failed");
      }
  
      if(result.successful.length){
        console.log('result.successful',result.successful)
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
  
    
    const gotoArtZip = () => {
      userDetailsDataFn({"account_key":"a737999f-bc07-43f4-8fab-affce461bcf1"})
      
    }

    const removeArtzip = () => {
      const element = document.querySelector('.artzipIcon');
      const element1 = document.querySelector('.uppy-Dashboard-AddFiles-list');
      if(element && element1){

        //@ts-ignore
        element.classList.remove('hidden');
      }
      else if (element){
         //@ts-ignore
        element.classList.add('hidden');
      }
    }

    const removeUppy = () => {
      const element = document.querySelector('.uppy-Dashboard-poweredBy');
      if(element){

        //@ts-ignore
        element.parentNode.removeChild(element);
      }
    }
    //if(artZipDownload===true){
      // const url =   .getPlugin('Url')
      // await url.addFile('https://example.com/myfile1.pdf')
      // await url.addFile('https://example.com/myfile2.pdf')
      // await uppy.upload()

      // uppy.addFile({
      //   // name: 'my-file.jpg', // file name
      //   // type: 'image/jpeg', // file type
      //   // data: blob, // file blob
      //   // meta: {
      //   //     // optional, store the directory path of a file so Uppy can tell identical files in different directories apart.
      //   //     relativePath: webkitFileSystemEntry.relativePath,
      //   // },
      //   // source: 'Local', // optional, determines the source of the file, for example, Instagram.
      //   isRemote: true,
      //   remote: {
      //     host: 'https://uppy.io',
      //     url : 'https://uppy.io/img/logo.svg' 
      //   }
        
      //    // optional, set to true if actual file is not in the browser, but on some remote server, for example,
      //   // when using companion in combination with Instagram.
      // });

      // const fileId = uppy.addFile({
      //   name: "uppy.svg",
      //   type: "image/svg",
      //   data: new Blob(),
      // });
      // uppy.setFileState(fileId, {
      //   progress: { uploadComplete: true, uploadStarted: true },
      //   uploadURL: "https://uppy.io/img/logo.svg", // optional - for use with showLinkToFileUploadResult
      // });
      // // only set this after initial files have been added
      // uppy.setOptions({
      //   autoProceed: true,
      // });

    //}
    useEffect(() => {
      removeUppy()
      
    });


  return (
    <div className="lg:flex justify-end items-center pt-6">
      <div id='artzipIcon' className='artzipIcon lg:absolute top-1/2 z-10 right-28 pt-2  pr-4 '>
        <div className='uppy-DashboardTab-btn rounded-lg' onClick={gotoArtZip}>
          <div className='bg-white h-9  pt-1 rounded-lg '>
            <img className='mx-2' src={ArtzipIcon} width="30px" height="35px" />
          </div>
          <p className=' pt-1 pl-2  uppy-Root1 uppy-size--md   uppy-DashboardTab-name1 text-xs  text-[#525252] '>Artzip</p>
        </div>
      </div>
      <Dashboard onChange={() => {
          removeUppy();
          removeArtzip();

      }} onFocus={() => {
        
        removeUppy();
        removeArtzip();

      }}  disableInformer={false} uppy={uppy}  plugins={['GoogleDrive','Dropbox','Box']} />
    </div>
  )
}

export default UppyUploadBox
