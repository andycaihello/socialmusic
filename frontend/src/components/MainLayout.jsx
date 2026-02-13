/**
 * Main Layout component with header
 */
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Avatar, Space, Typography, Badge, Input } from 'antd';
import { UserOutlined, LogoutOutlined, MessageOutlined, SearchOutlined } from '@ant-design/icons';
import { logout } from '../store/authSlice';
import { fetchUnreadCount } from '../store/messageSlice';
import { getAvatarUrl } from '../utils/url';
import io from 'socket.io-client';

const { Header } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const MainLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.message);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [searchValue, setSearchValue] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchOverlayRef = useRef(null);

  useEffect(() => {
    // 使用屏幕宽度检测是否为移动端
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 初始检测
    checkMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    // 点击外部关闭移动端搜索框
    const handleClickOutside = (event) => {
      if (searchOverlayRef.current && !searchOverlayRef.current.contains(event.target)) {
        setShowMobileSearch(false);
      }
    };

    if (showMobileSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileSearch]);

  useEffect(() => {
    // Fetch unread count initially
    dispatch(fetchUnreadCount());

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Connect to WebSocket for real-time updates
    // In production, connect to current domain; in dev, connect to localhost:5000
    const socketUrl = import.meta.env.VITE_API_URL === '/api'
      ? window.location.origin
      : 'http://localhost:5001';

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
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

  const handleSearch = (value) => {
    if (value && value.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  const onSearch = (value, event) => {
    if (event?.key === 'Enter' || !event) {
      handleSearch(value);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 - 固定在所有页面 */}
      <Header
        style={{
          background: '#fff',
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => navigate('/')}
        >
          <img
            src="/socialmusic.png"
            alt="OnBeat"
            style={{
              width: 'clamp(28px, 6vw, 48px)',
              height: 'clamp(28px, 6vw, 48px)',
              objectFit: 'contain',
            }}
          />
          <Title
            level={3}
            style={{
              margin: 0,
              color: '#1890ff',
              fontSize: 'clamp(14px, 4vw, 20px)',
            }}
          >
            OnBeat
          </Title>
        </div>

        {/* 搜索框 - 仅在桌面端显示 */}
        {!isMobile && (
          <div style={{ flex: 1, maxWidth: 500, margin: '0 24px' }}>
            <Search
              placeholder="搜索歌曲、歌手或用户"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              onChange={(e) => setSearchValue(e.target.value)}
              value={searchValue}
            />
          </div>
        )}

        <Space size="middle">
          {/* 移动端搜索图标 */}
          {isMobile && (
            <Button
              type="text"
              icon={<SearchOutlined />}
              onClick={() => setShowMobileSearch(true)}
              style={{ fontSize: 20 }}
            />
          )}

          {/* Message icon with unread badge */}
          <Badge count={unreadCount} overflowCount={99}>
            <Button
              type="text"
              icon={<MessageOutlined />}
              onClick={() => navigate('/messages')}
              style={{ fontSize: 20 }}
            />
          </Badge>

          <Space
            size="small"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
            className="user-info-space"
          >
            <Avatar
              size="large"
              icon={<UserOutlined />}
              src={getAvatarUrl(user?.avatar_url)}
            />
            {/* 移动端隐藏用户信息文字 */}
            <div style={{ lineHeight: '1.2' }} className="user-info-text">
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

          {/* 移动端隐藏退出登录按钮文字 */}
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="logout-button"
          >
            <span className="logout-text">退出登录</span>
          </Button>
        </Space>
      </Header>

      {/* 移动端悬浮搜索框 */}
      {isMobile && showMobileSearch && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'flex-start',
            paddingTop: 80,
            justifyContent: 'center',
          }}
        >
          <div
            ref={searchOverlayRef}
            style={{
              width: '90%',
              maxWidth: 500,
              background: '#fff',
              borderRadius: 8,
              padding: 16,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Search
              placeholder="搜索歌曲、歌手或用户"
              allowClear
              enterButton="搜索"
              size="large"
              onSearch={(value) => {
                handleSearch(value);
                setShowMobileSearch(false);
              }}
              onChange={(e) => setSearchValue(e.target.value)}
              value={searchValue}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* 添加响应式样式 */}
      <style>{`
        @media (max-width: 768px) {
          .user-info-text {
            display: none !important;
          }
          .logout-text {
            display: none !important;
          }
        }
      `}</style>

      {/* 页面内容 */}
      {children}
    </Layout>
  );
};

export default MainLayout;
