import React, { useState } from 'react';
import logo from './assets/logo/finerworks_logo.svg';
import './App.css';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import Router from "./routes";
import { BrowserRouter, useNavigate } from "react-router-dom";

import { useDispatch } from 'react-redux';
import { useTypedSelector } from './hooks/useTypeSelector';
import { getComments } from './store/actionCreators/getComment';
import { routes } from './config/routes';

const { Header, Footer, Sider, Content } = Layout;

const App: React.FC = () => {
  const dispatch = useDispatch();
  const [postId, setPostID] = useState("");
  const { comments, loading, error } = useTypedSelector((state) => state.comments);
  const navigate = useNavigate();

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await dispatch(getComments(postId) as any);
  }

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout className="layout">
      <Header style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', }}>
        <img src={logo} onClick= { ()=> navigate(routes.landingPage) } className="App-logo cursor-pointer " alt="logo" />
        <Menu
          theme="light"
          mode="horizontal"
          defaultSelectedKeys={['4']}
          items={[
            {
              key:1,
              label: `login`,
              onClick: () => { navigate(routes.login); }
            },
            {
              key:2,
              label: `upload`,
              onClick: () => { navigate(routes.upload); }
            },
            {
              key:3,
              label: `thumbnail`,
              onClick: () => { navigate(routes.thumbnail); }
            }
          ]
          }
        />
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>List</Breadcrumb.Item>
          <Breadcrumb.Item>App</Breadcrumb.Item>
        </Breadcrumb>
        <div className="site-layout-content" style={{ background: colorBgContainer, minHeight: '600px' }}>
          <Router />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Finer Works ©2023</Footer>
    </Layout>

  );
}

export default App;
