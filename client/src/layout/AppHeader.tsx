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
      background: '#fff', 
      padding: '0 100px', // УВЕЛИЧЕННЫЙ ОТСТУП ОТ КРАЕВ ЭКРАНА (чтобы не прижималось)
      height: '80px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderBottom: '1px solid #F0F0F0',
      position: 'fixed', 
      width: '100%', 
      zIndex: 1000,
    }}>
      {/* LEFT: Логотип */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <img src={logoSvg} alt="nVision U" style={{ height: '50px' }} />
      </div>

      {/* CENTER: Меню с отступами по 100px */}
      <Menu 
        mode="horizontal" 
        selectedKeys={[location.pathname]} 
        items={menuItems} 
        style={{ 
          flex: 1, 
          border: 'none', 
          display: 'flex', 
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 500,
          background: 'transparent'
        }} 
      />

      {/* RIGHT: Профиль админа с запасом места */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <Dropdown menu={profileMenu} trigger={['click']}>
          <Space style={{ cursor: 'pointer' }} size={12}>
            <Avatar 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" 
              size={46} 
              style={{ border: '2px solid #F0F7FF' }}
            />
            <Space direction="vertical" size={0} style={{ lineHeight: '1.2' }}>
              <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Admin:</Text>
              <Text strong style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
                Bolatovich N. <DownOutlined style={{ fontSize: '10px' }} />
              </Text>
            </Space>
          </Space>
        </Dropdown>
      </div>

      <style>{`
        /* Устанавливаем 100px между названиями (50px + 50px) */
        .ant-menu-horizontal .ant-menu-item {
          padding: 0 50px !important; 
          margin: 0 !important;
        }
        
        /* Фикс высоты для центрирования синей линии */
        .ant-menu-horizontal {
          line-height: 78px !important;
        }

        /* Цвет и стиль активного пункта */
        .ant-menu-item-selected {
          color: #006CFF !important;
        }

        .ant-menu-item-selected::after {
          border-bottom-width: 3px !important;
          border-bottom-color: #006CFF !important;
          bottom: 0px !important;
        }

        /* Плавность */
        .ant-menu-item::after {
          transition: all 0.2s ease !important;
        }

        /* Убираем лишние ховер-эффекты фона */
        .ant-menu-light .ant-menu-item:hover {
          color: #006CFF !important;
        }
      `}</style>
    </Header>
  );
};

export default AppHeader;