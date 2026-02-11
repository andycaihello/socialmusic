/**
 * Main Layout component with header
 */
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Avatar, Space, Typography, Badge } from 'antd';
import { UserOutlined, LogoutOutlined, MessageOutlined } from '@ant-design/icons';
import { logout } from '../store/authSlice';
import { fetchUnreadCount } from '../store/messageSlice';
import { getAvatarUrl } from '../utils/url';
import io from 'socket.io-client';

const { Header } = Layout;
const { Title, Text } = Typography;

const MainLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.message);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    // Fetch unread count initially
    dispatch(fetchUnreadCount());

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Connect to WebSocket for real-time updates
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('MainLayout WebSocket connected');
    });

    socket.on('new_message', (message) => {
      console.log('MainLayout received new message:', message);
      // Refresh unread count when new message arrives
      dispatch(fetchUnreadCount());
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 - 固定在所有页面 */}
      <Header
        style={{
          background: '#fff',
          padding: '0 50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Title level={3} style={{ margin: 0, color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate('/')}>
          🎵 SocialMusic
        </Title>

        <Space size="large">
          {/* Message icon with unread badge */}
          <Badge count={unreadCount} overflowCount={99}>
            <Button
              type="text"
              icon={<MessageOutlined />}
              onClick={() => navigate('/messages')}
              style={{ fontSize: 20 }}
            />
          </Badge>

          <Space size="middle" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            <Avatar
              size="large"
              icon={<UserOutlined />}
              src={getAvatarUrl(user?.avatar_url)}
            />
            <div style={{ lineHeight: '1.2' }}>
              <div>
                <Text strong>{user?.nickname || user?.username}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {user?.email}
                </Text>
              </div>
            </div>
          </Space>
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Space>
      </Header>

      {/* 页面内容 */}
      {children}
    </Layout>
  );
};

export default MainLayout;
