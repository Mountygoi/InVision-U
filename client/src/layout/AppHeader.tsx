import { Layout, Menu, Avatar, Space, Typography, Dropdown } from 'antd';
import { NavLink, useLocation } from 'react-router-dom';
import { DownOutlined } from '@ant-design/icons';
import logoSvg from '../assets/icons/logo.svg';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const location = useLocation();

  const menuItems = [
    { key: '/admin', label: <NavLink to="/admin">Dashboard</NavLink> },
    { key: '/admin/candidates', label: <NavLink to="/admin/candidates">Candidates</NavLink> },
    { key: '/admin/settings', label: <NavLink to="/admin/settings">Settings</NavLink> },
    { key: '/admin/scheduler', label: <NavLink to="/admin/scheduler">Interviews</NavLink> },
    { key: '/admin/reviews', label: <NavLink to="/admin/reviews">Reviews</NavLink> },
  ];

  const profileMenu = {
    items: [
      { key: 'profile', label: 'Profile Settings' },
      { key: 'logout', label: 'Sign Out', danger: true },
    ],
  };

  return (
    <Header style={{ 
      background: 'rgba(255, 255, 255, 0.92)', 
      backdropFilter: 'blur(12px)',
      padding: '0 80px',
      height: '72px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderBottom: '1px solid #E2E8F0',
      position: 'fixed', 
      width: '100%', 
      zIndex: 1000,
      boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.3s ease',
    }}>
      {/* LEFT: Логотип */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <img src={logoSvg} alt="inVision U" style={{ height: '42px', transition: 'opacity 0.2s' }} />
      </div>

      {/* CENTER: Меню */}
      <Menu 
        mode="horizontal" 
        selectedKeys={[location.pathname]} 
        items={menuItems} 
        style={{ 
          flex: 1, 
          border: 'none', 
          display: 'flex', 
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 500,
          fontFamily: "'Raleway', sans-serif",
          background: 'transparent',
          letterSpacing: '0.02em',
        }} 
      />

      {/* RIGHT: Профиль */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        flexShrink: 0,
        marginRight: '20px'
      }}>
        <Dropdown menu={profileMenu} trigger={['click']}>
          <Space style={{ cursor: 'pointer' }} size={12}>
            <Avatar 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" 
              size={40} 
              style={{ border: '2px solid rgba(193, 241, 29, 0.3)', transition: 'border-color 0.2s' }}
            />
            <Space orientation="vertical" size={0} style={{ lineHeight: '1.2' }}>
              <Text style={{ fontSize: '11px', display: 'block', color: '#94A3B8' }}>Admin:</Text>
              <Text strong style={{ fontSize: '14px', whiteSpace: 'nowrap', color: '#1E293B' }}>
                Bolatovich N. <DownOutlined style={{ fontSize: '10px', color: '#94A3B8' }} />
              </Text>
            </Space>
          </Space>
        </Dropdown>
      </div>

      <style>{`
        /* Header menu styling — light theme with lime accent */
        .ant-layout-header .ant-menu-horizontal {
          background: transparent !important;
          border-bottom: none !important;
        }
        .ant-layout-header .ant-menu-horizontal .ant-menu-item {
          padding: 0 32px !important;
          margin: 0 !important;
          color: #64748B !important;
        }
        .ant-layout-header .ant-menu-horizontal .ant-menu-item:hover {
          color: #1E293B !important;
        }
        .ant-layout-header .ant-menu-horizontal .ant-menu-item a {
          color: inherit !important;
          font-family: 'Raleway', sans-serif !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          font-size: 13px !important;
          letter-spacing: 0.06em !important;
        }
        .ant-layout-header .ant-menu-horizontal {
          line-height: 70px !important;
        }
        .ant-layout-header .ant-menu-item-selected {
          color: #141414 !important;
          font-weight: 700 !important;
        }
        .ant-layout-header .ant-menu-item-selected a {
          color: #141414 !important;
        }
        .ant-layout-header .ant-menu-item-selected::after {
          border-bottom-width: 2px !important;
          border-bottom-color: #c1f11d !important;
          bottom: 0px !important;
        }
        .ant-layout-header .ant-menu-item::after {
          transition: all 0.2s ease !important;
        }
        .ant-layout-header .ant-menu-item:not(.ant-menu-item-selected)::after {
          border-bottom-color: transparent !important;
        }
      `}</style>
    </Header>
  );
};

export default AppHeader;