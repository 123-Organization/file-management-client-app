import React, { useEffect } from 'react'

import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import { Dashboard } from '@uppy/react';
import GoogleDrive from '@uppy/google-drive';
import Dropbox from '@uppy/dropbox';
import Box from '@uppy/box';
import { message, Spin } from 'antd';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { useDynamicData } from '../context/DynamicDataProvider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getUserAccount, postUppyImages } from '../api/gallaryApi';
import config  from "../config/configs";

import ArtzipIcon from "../assets/provider/icon_artzip_32.svg"
import Url from '@uppy/url';

const SERVER_BASE_URL = config.COMPANION_BASE_URL;
//  const SERVER_BASE_URL = 'http://localhost:5000';

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
  const [messageApi, contextHolder] = message.useMessage();
  

  const {
    mutate: fileUploadPostDataFn,
    isLoading:isLoadingImgUpload,
   } = useMutation((data: any) => postUppyImages(data), {
    onSuccess(data) {
      messageApi.open({
        type: 'success',
        content: 'File has been uploaded',
      });
      window.location.reload();
    },
    onError(error: any) {

      console.error('error file upload',error)
          messageApi.open({
            type: 'error',
            content: 'File having issue while upload',
          });

    },
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
    // logger: debugLogger,
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
              'fileURL' : file.uploadURL,
              'fileLibrary' : userInfo.libraryName
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
    

    
      const addArtzip = () => {
      const element1 = document.querySelector('.uppy-Dashboard-AddFiles-list');
      if(element1){
   
        const fragment = document.createDocumentFragment();
        
        const params:any = { "metadata[name]": userInfo.libraryName, "metadata[session_id]": userInfo.librarySessionId, "metadata[account_key]": userInfo.libraryAccountKey,"metadata[site_id]": userInfo.librarySiteId };
        const queryString = new URLSearchParams(params).toString();
        const baseurl = 'https://app.artzip.com/referrals/fine_dummy?' + queryString;

        const div = document.createElement("div")
        div.setAttribute("class","uppy-DashboardTab")
        div.setAttribute("role","presentation")
        div.setAttribute("onclick","javascript:window.parent.location.href='"+baseurl+"'")
        
        
        const button = document.createElement("button")
        button.setAttribute("class","uppy-u-reset uppy-c-btn uppy-DashboardTab-btn")
        button.setAttribute("role","tab")
        const div1 = document.createElement("div")
        div1.setAttribute("class","uppy-DashboardTab-inner")
        //button.appendChild(div1)
        const div2 = document.createElement("div")
        div2.setAttribute("class","uppy-DashboardTab-name")
        const img = document.createElement("img")
        img.setAttribute("src",ArtzipIcon)
        img.setAttribute("width","30px")
        img.setAttribute("height","35px")

        const li = fragment
        //@ts-ignore
          .appendChild(div)
          .appendChild(button)
          .appendChild(div1)
          .appendChild(img)
        // div1.innerHTML = ArtzipIcon; 
          // .append(div2)
        button.appendChild(div2)  
        div2.textContent = "Artzip";
                //@ts-ignore
                element1?.appendChild(fragment);
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
      if(userInfo.account_id > 0)
       addArtzip()
      
    });




  return (
    <div className="xxl:flex justify-end items-center pt-6">
      {
        !isLoadingImgUpload 
        ?<>
            <> { contextHolder}</>
            <div className="uppy-DashboardTab hidden" id="artzipIcon" role="presentation" data-uppy-acquirer-id="Artzip">
              <button type="button" className="uppy-u-reset uppy-c-btn uppy-DashboardTab-btn" role="tab" data-uppy-super-focusable="true">
              <div className="uppy-DashboardTab-inner">
                <img className="mx-2" src="${ArtzipIcon}"  width="30px" height="35px" />
              </div>
              <div className="uppy-DashboardTab-name">Artzip</div>
              </button>
            </div>
            <Dashboard onChange={() => {
                removeUppy();
                removeArtzip();

            }} onFocus={() => {
              
              removeUppy();
              removeArtzip();

            }}
            disableLocalFiles={true}  
            disableInformer={false} uppy={uppy}  plugins={['GoogleDrive','Dropbox','Box']} />
        </>
        : <div><Spin tip={<div className='whitespace-nowrap -ml-3'>Uploading images...</div>}><div className="content " /></Spin></div>
    }
    </div>
  )
}

export default UppyUploadBox
