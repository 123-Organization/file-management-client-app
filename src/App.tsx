import React, { useEffect } from 'react';
import './App.css';
import { Layout, theme } from 'antd';
import Router from "./routes";
import { useLocation } from "react-router-dom";

import HeaderIcon from './components/HeaderIcon';
import BottomIcon from './components/BottomIcon';
import { useDynamicData } from './context/DynamicDataProvider';
import ReactGA from "react-ga4";

const { Header, Footer, Content } = Layout;

interface ISettings {
  settings ?: object
  libraries: string[]
  account_key: string
  guid: string
  multiselect: boolean
  session_id: string
  domain: string
  terms_of_service_url: string
  button_text: string
  account_id: string
  libraryName?: string

}

const App: React.FC = () => {
  const location = useLocation();
  console.log(location.pathname);
  const dynamicData: any = useDynamicData();
  const { userInfo } = dynamicData.state;

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const addScript = (gId:string) => {
    // let script = document.createElement('script');
    // script.src = `https://www.googletagmanager.com/gtag/js?id=${gId}`;
    // document.getElementsByTagName('head')[0].appendChild(script);
    console.log('gId',gId)
    ReactGA.initialize(gId);
    const eventName = "file_manager_app_loaded";
    const eventParams = {
      'loaded': 'true'
    };
    ReactGA.event(eventName, eventParams);
  }

  // addScript('G-HPJGR0WY9W');
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
        domain: settings['domain']?settings['domain']:"finerworks.com",
        terms_of_service_url: settings['terms_of_service_url']?settings['terms_of_service_url']:"/terms.aspx",
        button_text: settings['button_text']?settings['button_text']:"Create Print",
        account_id: settings['account_id']?settings['account_id']:0,
        libraryName: settings['libraries'].length===1
          ? settings['libraries'][0] 
          : ( settings['libraries'].length===2 
             ? userInfo.libraryName
             :""
             ),
      }

      localStorage.setItem('libraryAccountKey', updateUserInfo.libraryAccountKey);
      console.log('updateUserInfo...',updateUserInfo);
      let userInfoObj = {...userInfo,...updateUserInfo};
  
      let isUpdatedUser = JSON.stringify(userInfo) !== JSON.stringify(userInfoObj);
      console.log('isUpdated',isUpdatedUser,userInfo,userInfoObj)

      if(isUpdatedUser) {
       setTimeout(() => {
          dynamicData.mutations.setUserInfoData(userInfoObj);
        }, 1000);
      } 

    }
  
    // can message back using event.source.postMessage(...)
  });

  useEffect(() => {

    if (userInfo?.domain) {
      let gId = 'G-HPJGR0WY9W';
      if (userInfo?.domain === 'ezcanvas.com') {
        gId='G-3SK23H6SVW';
      } else if (userInfo?.domain === 'geogalleries.com') {
        gId='G-L5FVTJPL3J';
      }
      addScript(gId);  
    } else{
      addScript('G-HPJGR0WY9W');
    }

    // if (gtag !== 'undefined') {
    //   gtag('event', 'file_manager_app_loaded', {'loaded': 'true'});
    // }
   
  },[]);

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
        <BottomIcon />
     </Footer>
    </Layout>
  );
}

export default App;
