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
  message as antMessage,
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  fetchConversations,
  fetchConversation,
  sendMessage,
  setCurrentConversation,
  markConversationAsRead,
  clearError,
} from '../store/messageSlice';
import { userAPI } from '../api';
import { getAvatarUrl } from '../utils/url';

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

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    console.log('=== Messages Debug ===');
    console.log('conversations:', conversations);
    console.log('userId from URL:', userId);
    console.log('currentConversation:', currentConversation);

    if (userId) {
      const userIdNum = parseInt(userId);
      dispatch(setCurrentConversation(userIdNum));
      dispatch(fetchConversation({ userId: userIdNum }));
      dispatch(markConversationAsRead(userIdNum));

      // Find current user from conversations
      const conversation = conversations.find(c => c.user.id === userIdNum);
      console.log('Found conversation:', conversation);
      if (conversation) {
        setCurrentUser(conversation.user);
      } else {
        // If no conversation exists, fetch user info
        fetchUserInfo(userIdNum);
      }
    } else if (conversations.length > 0 && !currentConversation) {
      // If no userId in URL and no current conversation, select first conversation
      const firstConversation = conversations[0];
      console.log('Auto-selecting first conversation:', firstConversation);
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

  const formatMessageTime = (timestamp) => {
    const messageTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now - messageTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const hours = messageTime.getHours().toString().padStart(2, '0');
    const minutes = messageTime.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (diffDays === 0) {
      return timeStr;
    } else if (diffDays === 1) {
      return `昨天 ${timeStr}`;
    } else if (diffDays < 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return `${weekdays[messageTime.getDay()]} ${timeStr}`;
    } else {
      const month = (messageTime.getMonth() + 1).toString().padStart(2, '0');
      const day = messageTime.getDate().toString().padStart(2, '0');
      return `${month}-${day} ${timeStr}`;
    }
  };

  return (
    <div style={{ background: '#f0f2f5' }}>
      {/* 页面标题栏 */}
      <div style={{
        background: '#fff',
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
        />
        {currentUser ? (
          <Space>
            <Avatar
              size={40}
              icon={<UserOutlined />}
              src={getAvatarUrl(currentUser.avatar_url)}
            />
            <Typography.Title level={4} style={{ margin: 0 }}>
              与 {currentUser.nickname || currentUser.username} 的对话
            </Typography.Title>
          </Space>
        ) : (
          <Typography.Title level={4} style={{ margin: 0 }}>
            私信
          </Typography.Title>
        )}
      </div>

      <Row style={{ height: 'calc(100vh - 64px - 73px)' }}>
          {/* Conversation List */}
          <Col
            xs={0}
            sm={8}
            md={8}
            lg={6}
            style={{
              background: '#fff',
              borderRight: '1px solid #f0f0f0',
              overflowY: 'auto',
              display: 'block',
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
                          {conversation.last_message.content}
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

          {/* Message Area */}
          <Col xs={24} sm={16} md={16} lg={18}>
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
                                  {msg.content}
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
      </div>
  );
};

export default Messages;
