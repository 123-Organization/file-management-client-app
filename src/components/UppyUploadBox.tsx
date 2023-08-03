import React from 'react'

import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import { Dashboard } from '@uppy/react';
import GoogleDrive from '@uppy/google-drive';
import Dropbox from '@uppy/dropbox';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import axios from 'axios';

const SERVER_BASE_URL = 'http://localhost:3020';
const getTimeStamp = () => {
  return Date.now()
}
const debugLogger = {
  debug: (...args:any) => console.debug(`[Uppy] [${getTimeStamp()}]`, ...args),
  warn: (...args:any) => console.warn(`[Uppy] [${getTimeStamp()}]`, ...args),
  error: (...args:any) => console.error(`[Uppy] [${getTimeStamp()}]`, ...args),
};

const uppy = new Uppy({ logger: debugLogger , autoProceed: false,
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
    console.log("successful files:", result.successful);
    console.log("failed files:", result.failed);
  });


const UppyUploadBox: React.FC = () : JSX.Element => {
  return (
    <div className="flex justify-end items-center pt-6">

      <Dashboard  uppy={uppy} plugins={['GoogleDrive','Dropbox']} />
    </div>
  )
}

export default UppyUploadBox
