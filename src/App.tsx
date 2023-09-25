import React, { useState } from 'react';
import logo from './assets/logo/finerworks_logo.svg';
import './App.css';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import Router from "./routes";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";

import { useDispatch } from 'react-redux';
import { useTypedSelector } from './hooks/useTypeSelector';
import { postUploadFiles } from './store/actionCreators/uploadFiles';
import { routes } from './config/routes';
import HeaderIcon from './components/HeaderIcon';
import BottomIcon from './components/BottomIcon';


const { Header, Footer, Sider, Content } = Layout;

const App: React.FC = () => {
  const dispatch = useDispatch();
  const [postId, setPostID] = useState("");
  const location = useLocation();
  console.log(location.pathname);
  const { images, loading, error } = useTypedSelector((state) => state.images);
  const navigate = useNavigate();

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await dispatch(postUploadFiles(postId) as any);
  }

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout className="layout">
      <Header style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', }}>
        <HeaderIcon />
      </Header>
      <Content style={{ padding: '50px' }}>
        {/* <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>List</Breadcrumb.Item>
          <Breadcrumb.Item>App</Breadcrumb.Item>
        </Breadcrumb> */}
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
