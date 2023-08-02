import React from 'react'

import Uppy from '@uppy/core';
import DashboardCom from '@uppy/dashboard';
import { Dashboard } from '@uppy/react';
import GoogleDrive from '@uppy/google-drive';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

const uppy = new Uppy()
                  .use(GoogleDrive, {
                      companionUrl: 'http://app-filemanager.finerworks.com:5000/api/',
                  });


const Landing: React.FC = () : JSX.Element => {
  return (
    <div className="flex justify-end items-center pt-6">

      {/* <Dashboard uppy={uppy} plugins={['GoogleDrive']} /> */}
    </div>
  )
}

export default Landing
