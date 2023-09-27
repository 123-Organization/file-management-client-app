import React from 'react';
import './App.css';
import { Layout, theme } from 'antd';
import Router from "./routes";
import { useLocation } from "react-router-dom";

import HeaderIcon from './components/HeaderIcon';
import BottomIcon from './components/BottomIcon';
import { useDynamicData } from './context/DynamicDataProvider';

const { Header, Footer, Content } = Layout;

interface ISettings {
  settings ?: object
  libraries: string[]
  account_key: string
  guid: string
  multiselect: boolean
  session_id: string
}

const App: React.FC = () => {
  const location = useLocation();
  console.log(location.pathname);
  const dynamicData: any = useDynamicData();
  const { userInfo } = dynamicData.state;

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  window.addEventListener("message", function(event) {
    // if (event.origin != '*') {
    //   // something from an unknown domain, let's ignore it
    //   return;
    // }
    let settings:ISettings | null = null;
    console.log("received: ", event.data );
    if(typeof event.data === 'string'){
      settings = JSON.parse(event.data)['settings'];
      // settings = settings['settings'];
    } else if(typeof event.data === 'object'){
      settings = event.data['settings'];
    }

    if(settings && settings['libraries']){
      let updateUserInfo = {
        libraryOptions:settings['libraries'],
        multiselectOptions:!!(settings['multiselect']),
        librarySessionId:settings['session_id'],
        libraryAccountKey:settings['account_key'],
        guidPreSelected:settings['guid'],
      }
      console.log('updateUserInfo...',updateUserInfo);
      let userInfoObj = {...userInfo,...updateUserInfo};
  
      let isUpdatedUser = JSON.stringify(userInfo) !== JSON.stringify(userInfoObj);
      console.log('isUpdated',isUpdatedUser,userInfo,userInfoObj)

      if(isUpdatedUser) {
        setTimeout(() => {
          dynamicData.mutations.setUserInfoData(userInfoObj);
        }, 2000);
      } 

    }
  
    // can message back using event.source.postMessage(...)
  });

  return (
    <Layout className="layout">
      <Header style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', }}>
        <HeaderIcon />
      </Header>
      <Content style={{ padding: '50px' }}>
        <div className="site-layout-content" style={{ background: colorBgContainer, minHeight: '600px' }}>
          <Router />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', backgroundColor: '#fff', }}>
        {
          location.pathname==='/thumbnail' ? 
            <>
              <div className="pb-10">FinerWorks ©2023</div>
              <BottomIcon />
            </>
          : 'FinerWorks ©2023'  
        }
          
        </Footer>
        
    </Layout>

  );
}

export default App;
