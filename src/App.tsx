import React, { useState } from 'react';
import logo from './assets/logo/finerworks_logo.svg';
import './App.css';
import { Breadcrumb, Layout, Menu, theme } from 'antd';

import { useDispatch } from 'react-redux';
import { useTypedSelector } from './hooks/useTypeSelector';
import { getComments } from './store/actionCreators/getComment';

const { Header, Footer, Sider, Content } = Layout;

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  height: 64,
  paddingInline: 50,
  lineHeight: '64px',
  backgroundColor: '#7dbcea',
};

const contentStyle: React.CSSProperties = {
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#108ee9',
};

const siderStyle: React.CSSProperties = {
  textAlign: 'center',
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#3ba0e9',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  backgroundColor: '#7dbcea',
};

const App: React.FC = () => {
  const dispatch = useDispatch();
  const [postId, setPostID] = useState("");
  const { comments, loading, error } = useTypedSelector((state) => state.comments);

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await dispatch(getComments(postId) as any);
  }

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout className="layout">
      <Header  style={{ display: 'flex', alignItems: 'center', backgroundColor:'#fff', }}>
        <img src={logo} className="App-logo" alt="logo" /> 
        <Menu
          theme="light"
          mode="horizontal"
          defaultSelectedKeys={['2']}
          items={new Array(15).fill(null).map((_, index) => {
            const key = index + 1;
            return {
              key,
              label: `nav ${key}`,
            };
          })}
        />
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>List</Breadcrumb.Item>
          <Breadcrumb.Item>App</Breadcrumb.Item>
        </Breadcrumb>
        <div className="site-layout-content" style={{ background: colorBgContainer, height: '500px' }}>
          Content
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Finer Works ©2023</Footer>
  </Layout>

    // <div className="App">
    //   <header className="App-header">
    //     <img src={logo} className="App-logo" alt="logo" />        
    //   </header>
    // </div>
  );
}

export default App;
