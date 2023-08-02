import React from 'react'

import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import { Dashboard } from '@uppy/react';
import GoogleDrive from '@uppy/google-drive';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import axios from 'axios';

const uppy = new Uppy({ autoProceed: false })
  .use(AwsS3, {
    shouldUseMultipart: (file) => file.size > 100 * 2 ** 20,
    companionUrl: 'http://companion.uppy.io/',
  })
  .use(GoogleDrive, {
    companionUrl: 'http://companion.uppy.io/',
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
  // .use(GoogleDrive, {
  //   companionUrl: 'http://localhost:5000/api/',
  // });


const UppyUploadBox: React.FC = () : JSX.Element => {
  return (
    <div className="flex justify-end items-center pt-6">

      <Dashboard  uppy={uppy} plugins={['GoogleDrive']} />
    </div>
  )
}

export default UppyUploadBox
