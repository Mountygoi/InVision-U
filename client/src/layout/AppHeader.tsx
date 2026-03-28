import { Layout, Menu, Input, Avatar, Space, Typography } from 'antd';
import { NavLink, useLocation } from 'react-router-dom';
import logoSvg from '../assets/icons/logo.svg';
import searchSvg from '../assets/icons/search.svg';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const location = useLocation();

  const menuItems = [
    { key: '/', label: <NavLink to="/">Dashboard</NavLink> },
    { key: '/candidates', label: <NavLink to="/candidates">Candidates</NavLink> },
    { key: '/scheduler', label: <NavLink to="/scheduler">Scheduler</NavLink> },
    { key: '/settings', label: <NavLink to="/settings">Settings</NavLink> },
  ];

  return (
    <Header style={{ 
      background: '#fff', 
      padding: '0 24px', 
      height: '72px', 
      display: 'flex', 
      alignItems: 'center', 
      borderBottom: '1px solid #F0F0F0',
      position: 'fixed', 
      width: '100%', 
      zIndex: 1000,
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginRight: '40px' }}>
        <img src={logoSvg} alt="logo" style={{ width: '32px', height: '32px', marginRight: '10px' }} />
        <Text strong style={{ fontSize: '18px', color: '#006CFF', fontFamily: 'Inter' }}>nVision U</Text>
      </div>

      <Menu 
        mode="horizontal" 
        selectedKeys={[location.pathname]} 
        items={menuItems} 
        style={{ flex: 1, border: 'none', height: '100%', lineHeight: '72px', fontFamily: 'Inter', fontWeight: 500 }} 
      />

      <Space size="large">
        <Input 
          placeholder="Search candidates..." 
          prefix={<img src={searchSvg} alt="search" style={{ width: '16px', height: '16px' }} />} 
          style={{ width: '280px', borderRadius: '8px', background: '#F5F5F5', border: 'none', height: '40px', fontFamily: 'Inter' }}
        />
        <Space>
          <Avatar src="https://api.dicebear.com/7.x/notionists/svg?seed=Admin" size={40} />
          <Text strong style={{fontFamily: 'Inter'}}>Admin</Text>
        </Space>
      </Space>
    </Header>
  );
};

export default AppHeader;