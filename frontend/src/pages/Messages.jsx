/**
 * Messages page for private messaging
 */
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Row,
  Col,
  List,
  Avatar,
  Typography,
  Input,
  Button,
  Space,
  Badge,
  Empty,
  Spin,
  Card,
  message as antMessage,
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CustomerServiceOutlined,
  HeartOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import {
  fetchConversations,
  fetchConversation,
  sendMessage,
  setCurrentConversation,
  markConversationAsRead,
  clearError,
  addMessageToConversation,
} from '../store/messageSlice';
import { userAPI } from '../api';
import { getAvatarUrl } from '../utils/url';
import io from 'socket.io-client';
import MusicPlayer from '../components/MusicPlayer';

const { Text } = Typography;
const { TextArea } = Input;

const Messages = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { conversations, currentConversation, messages, loading, error } = useSelector(
    (state) => state.message
  );
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const [currentSong, setCurrentSong] = useState(null);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (userId) {
      const userIdNum = parseInt(userId);
      dispatch(setCurrentConversation(userIdNum));
      dispatch(fetchConversation({ userId: userIdNum }));
      dispatch(markConversationAsRead(userIdNum));

      // Find current user from conversations
      const conversation = conversations.find(c => c.user.id === userIdNum);
      if (conversation) {
        setCurrentUser(conversation.user);
      } else {
        // If no conversation exists, fetch user info
        fetchUserInfo(userIdNum);
      }
    } else if (conversations.length > 0 && !currentConversation && window.innerWidth >= 576) {
      // 桌面端：如果没有userId且没有选中会话，自动选择第一个会话
      // 移动端：保持在会话列表页，不自动跳转
      const firstConversation = conversations[0];
      navigate(`/messages/${firstConversation.user.id}`, { replace: true });
    }
  }, [userId, dispatch, conversations, currentConversation, navigate]);

  const fetchUserInfo = async (userIdNum) => {
    try {
      const res = await userAPI.getProfile(userIdNum);
      setCurrentUser(res.data.user);
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  useEffect(() => {
    if (error) {
      antMessage.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Connect to WebSocket
    // In production, connect to current domain; in dev, connect to localhost:5001
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
      console.log('WebSocket connected');
    });

    socket.on('connected', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    socket.on('new_message', (message) => {
      console.log('New message received:', message);

      // Add message to current conversation if it's from the current chat
      if (currentConversation &&
          (message.sender_id === currentConversation || message.receiver_id === currentConversation)) {
        dispatch(addMessageToConversation(message));

        // Mark as read if it's the current conversation
        if (message.sender_id === currentConversation) {
          dispatch(markConversationAsRead(currentConversation));
        }
      }

      // Refresh conversations list to update unread counts
      dispatch(fetchConversations());
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch, currentConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !currentConversation) return;

    setSending(true);
    try {
      await dispatch(
        sendMessage({
          receiver_id: currentConversation,
          content: messageContent.trim(),
        })
      ).unwrap();
      setMessageContent('');
      // Refresh conversations to update last message
      dispatch(fetchConversations());
    } catch (err) {
      antMessage.error(err || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePlaySong = (songData, e) => {
    e.stopPropagation();
    // Convert song data to the format expected by MusicPlayer
    const song = {
      id: songData.song.id,
      title: songData.song.title,
      artist: { name: songData.song.artist },
      cover_url: songData.song.cover_url,
      duration: songData.song.duration,
      play_count: songData.song.play_count,
      like_count: songData.song.like_count,
      comment_count: songData.song.comment_count,
    };
    setCurrentSong(song);
    // Auto play
    setTimeout(() => {
      const audioElement = document.querySelector('audio');
      if (audioElement) {
        audioElement.play().catch(err => console.error('播放失败:', err));
      }
    }, 100);
  };

  const formatMessageTime = (timestamp) => {
    const messageTime = new Date(timestamp);
    const year = messageTime.getFullYear();
    const month = (messageTime.getMonth() + 1).toString().padStart(2, '0');
    const day = messageTime.getDate().toString().padStart(2, '0');
    const hours = messageTime.getHours().toString().padStart(2, '0');
    const minutes = messageTime.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const renderMessageContent = (msg) => {
    try {
      const parsed = JSON.parse(msg.content);
      if (parsed.type === 'song_share' && parsed.song) {
        // Return a special marker for song share
        return { isSongShare: true, data: parsed };
      }
    } catch (e) {
      // Not a JSON message, render as text
    }

    // Regular text message
    return { isSongShare: false, content: msg.content };
  };

  const renderSongCard = (songData) => {
    return (
      <Card
        hoverable
        style={{
          maxWidth: 320,
          background: '#fff',
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* 封面图片 - 点击跳转详情页 */}
        <div
          onClick={() => navigate(`/songs/${songData.song.id}`)}
          style={{ cursor: 'pointer' }}
        >
          {songData.song.cover_url ? (
            <img
              src={songData.song.cover_url}
              alt={songData.song.title}
              style={{
                width: '100%',
                height: 180,
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: 180,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CustomerServiceOutlined style={{ fontSize: 64, color: '#fff' }} />
            </div>
          )}
        </div>

        {/* 歌曲信息 */}
        <div style={{ padding: 16 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ fontSize: 16, display: 'block', color: '#000' }}>
                {songData.song.title}
              </Text>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {songData.song.artist}
              </Text>
            </div>

            {/* 标签信息 */}
            <Space size="middle" style={{ marginTop: 8 }}>
              {songData.song.play_count !== undefined && (
                <Space size={4}>
                  <PlayCircleOutlined style={{ color: '#999', fontSize: 14 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {songData.song.play_count >= 10000
                      ? (songData.song.play_count / 10000).toFixed(1) + '万'
                      : songData.song.play_count}
                  </Text>
                </Space>
              )}
              {songData.song.like_count !== undefined && (
                <Space size={4}>
                  <HeartOutlined style={{ color: '#999', fontSize: 14 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {songData.song.like_count >= 10000
                      ? (songData.song.like_count / 10000).toFixed(1) + '万'
                      : songData.song.like_count}
                  </Text>
                </Space>
              )}
              {songData.song.comment_count !== undefined && (
                <Space size={4}>
                  <MessageOutlined style={{ color: '#999', fontSize: 14 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {songData.song.comment_count >= 10000
                      ? (songData.song.comment_count / 10000).toFixed(1) + '万'
                      : songData.song.comment_count}
                  </Text>
                </Space>
              )}
              {songData.song.duration && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {Math.floor(songData.song.duration / 60)}:{(songData.song.duration % 60).toString().padStart(2, '0')}
                </Text>
              )}
            </Space>

            {/* 播放按钮 - 直接播放 */}
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              size="large"
              block
              style={{ marginTop: 12 }}
              onClick={(e) => handlePlaySong(songData, e)}
            >
              立即播放
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  return (
    <div className="messages-container">
      {/* 页面标题栏 - 移动端根据是否选中会话显示不同内容 */}
      <div className="messages-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            if (userId) {
              // 在对话详情页：返回会话列表
              navigate('/messages');
            } else {
              // 在会话列表页：返回首页
              navigate('/?tab=' + (sessionStorage.getItem('lastTab') || '1'));
            }
          }}
        />
        {currentUser ? (
          <Space>
            <Avatar
              size={40}
              icon={<UserOutlined />}
              src={getAvatarUrl(currentUser.avatar_url)}
            />
            <Typography.Title level={4} style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 20px)' }}>
              与 {currentUser.nickname || currentUser.username} 的对话
            </Typography.Title>
          </Space>
        ) : (
          <Typography.Title level={4} style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 20px)' }}>
            私信
          </Typography.Title>
        )}
      </div>

      <Row style={{ height: 'calc(100vh - 64px - 73px)', overflow: 'hidden' }}>
          {/* Conversation List - 移动端：仅在没有userId时显示；桌面端：始终显示 */}
          <Col
            xs={userId ? 0 : 24}
            sm={8}
            md={8}
            lg={6}
            style={{
              background: '#fff',
              borderRight: '1px solid #f0f0f0',
              overflowY: 'auto',
              height: '100%',
              display: userId && window.innerWidth < 576 ? 'none' : 'block',
            }}
          >
            <List
              loading={loading && conversations.length === 0}
              dataSource={conversations}
              locale={{ emptyText: <Empty description="暂无私信" /> }}
              renderItem={(conversation) => (
                <List.Item
                  key={conversation.user.id}
                  onClick={() => navigate(`/messages/${conversation.user.id}`)}
                  style={{
                    cursor: 'pointer',
                    background:
                      currentConversation === conversation.user.id ? '#e6f7ff' : 'transparent',
                    padding: '12px 16px',
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={conversation.unread_count} offset={[-5, 5]}>
                        <Avatar
                          size={48}
                          icon={<UserOutlined />}
                          src={getAvatarUrl(conversation.user.avatar_url)}
                        />
                      </Badge>
                    }
                    title={
                      <Space>
                        <Text strong>{conversation.user.nickname || conversation.user.username}</Text>
                        {conversation.unread_count > 0 && (
                          <Badge status="processing" />
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Text
                          type="secondary"
                          ellipsis
                          style={{ fontSize: 12, display: 'block' }}
                        >
                          {conversation.last_message.is_from_me ? '我: ' : ''}
                          {(() => {
                            try {
                              const parsed = JSON.parse(conversation.last_message.content);
                              if (parsed.type === 'song_share') {
                                return '[分享了一首歌曲]';
                              }
                            } catch (e) {}
                            return conversation.last_message.content;
                          })()}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {formatMessageTime(conversation.last_message.created_at)}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Col>

          {/* Message Area - 移动端：仅在有userId时显示；桌面端：始终显示 */}
          <Col
            xs={userId ? 24 : 0}
            sm={16}
            md={16}
            lg={18}
            style={{
              height: '100%',
              overflow: 'hidden',
              display: !userId && window.innerWidth < 576 ? 'none' : 'block',
            }}
          >
            {currentConversation ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    background: '#fafafa',
                  }}
                >
                  {loading && messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin />
                    </div>
                  ) : messages.length === 0 ? (
                    <Empty description="暂无消息" />
                  ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {messages.map((msg) => {
                        const isFromMe = msg.sender_id === user?.id;
                        const messageContent = renderMessageContent(msg);

                        // Check if this is a song share message
                        if (messageContent.isSongShare) {
                          return (
                            <div
                              key={msg.id}
                              style={{
                                display: 'flex',
                                justifyContent: isFromMe ? 'flex-end' : 'flex-start',
                                padding: '4px 0',
                              }}
                            >
                              <div
                                style={{
                                  maxWidth: '70%',
                                  display: 'flex',
                                  flexDirection: isFromMe ? 'row-reverse' : 'row',
                                  gap: 8,
                                  alignItems: 'flex-start',
                                }}
                              >
                                <Avatar
                                  size={36}
                                  icon={<UserOutlined />}
                                  src={getAvatarUrl(
                                    isFromMe ? user?.avatar_url : msg.sender?.avatar_url
                                  )}
                                />
                                <div style={{ flex: 1 }}>
                                  {renderSongCard(messageContent.data)}
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: '#999',
                                      marginTop: 4,
                                      textAlign: isFromMe ? 'right' : 'left',
                                      paddingLeft: isFromMe ? 0 : 4,
                                      paddingRight: isFromMe ? 4 : 0,
                                    }}
                                  >
                                    {formatMessageTime(msg.created_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Regular text message
                        return (
                          <div
                            key={msg.id}
                            style={{
                              display: 'flex',
                              justifyContent: isFromMe ? 'flex-end' : 'flex-start',
                              padding: '4px 0',
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '70%',
                                display: 'flex',
                                flexDirection: isFromMe ? 'row-reverse' : 'row',
                                gap: 8,
                                alignItems: 'flex-start',
                              }}
                            >
                              <Avatar
                                size={36}
                                icon={<UserOutlined />}
                                src={getAvatarUrl(
                                  isFromMe ? user?.avatar_url : msg.sender?.avatar_url
                                )}
                              />
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    background: isFromMe ? '#1890ff' : '#f0f0f0',
                                    color: isFromMe ? '#fff' : '#000',
                                    padding: '10px 14px',
                                    borderRadius: isFromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    fontSize: 14,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {messageContent.content}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: '#999',
                                    marginTop: 4,
                                    textAlign: isFromMe ? 'right' : 'left',
                                    paddingLeft: isFromMe ? 0 : 4,
                                    paddingRight: isFromMe ? 4 : 0,
                                  }}
                                >
                                  {formatMessageTime(msg.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </Space>
                  )}
                </div>

                {/* Input Area */}
                <div
                  style={{
                    background: '#fff',
                    padding: '16px',
                    borderTop: '1px solid #f0f0f0',
                  }}
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <TextArea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="输入消息... (Enter发送, Shift+Enter换行)"
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      maxLength={2000}
                      showCount
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSendMessage}
                      loading={sending}
                      disabled={!messageContent.trim()}
                      style={{ height: 'auto' }}
                    >
                      发送
                    </Button>
                  </Space.Compact>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Empty description="选择一个会话开始聊天" />
              </div>
            )}
          </Col>
        </Row>

        {/* 音乐播放器 */}
        {currentSong && (
          <MusicPlayer
            currentSong={currentSong}
            playlist={[currentSong]}
            onSongChange={setCurrentSong}
          />
        )}

        {/* 响应式样式 */}
        <style>{`
          /* 移动端：页面铺满，无padding */
          .messages-container {
            background: #f0f2f5;
          }

          .messages-header {
            background: #fff;
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          /* 移动端：完全隐藏另一侧 */
          @media (max-width: 575px) {
            /* 当有userId时，完全隐藏会话列表 */
            .ant-col-xs-0 {
              display: none !important;
            }
            /* 当没有userId时，完全隐藏对话详情 */
            .ant-col-xs-24 {
              display: block !important;
            }
          }

          /* 桌面端：显示分屏布局 */
          @media (min-width: 576px) {
            .messages-header {
              padding: 16px;
            }

            .ant-col-sm-8,
            .ant-col-sm-16 {
              display: block !important;
            }
          }
        `}</style>
      </div>
  );
};

export default Messages;
