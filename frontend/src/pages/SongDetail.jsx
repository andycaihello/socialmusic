import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Layout, Card, Button, Space, Typography, Statistic, List, Input, message,
  Avatar, Tag, Divider, Empty, Spin
} from 'antd';
import {
  ArrowLeftOutlined, PlayCircleOutlined, HeartOutlined, HeartFilled,
  MessageOutlined, CustomerServiceOutlined, SendOutlined
} from '@ant-design/icons';
import { musicAPI, interactionAPI } from '../api';
import MusicPlayer from '../components/MusicPlayer';
import { getAvatarUrl } from '../utils/url';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SongDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);

  useEffect(() => {
    fetchSongDetail();
    fetchComments();
    if (isAuthenticated) {
      checkLikeStatus();
    }
  }, [id, isAuthenticated]);

  const fetchSongDetail = async () => {
    setLoading(true);
    try {
      const res = await musicAPI.getSongDetail(id);
      setSong(res.data.song);
      setLikeCount(res.data.song.like_count);
    } catch (error) {
      message.error('获取歌曲信息失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const res = await interactionAPI.getLikeStatus(id);
      setIsLiked(res.data.is_liked);
    } catch (error) {
      console.error('获取点赞状态失败', error);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await interactionAPI.getComments(id);
      setComments(res.data.comments || []);
    } catch (error) {
      console.error('获取评论失败', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      if (isLiked) {
        await interactionAPI.unlikeSong(id);
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
        message.success('已取消点赞');
      } else {
        await interactionAPI.likeSong(id);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        message.success('点赞成功');
      }
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    if (!commentContent.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    setSubmitting(true);
    try {
      await interactionAPI.addComment(id, {
        content: commentContent,
        parent_id: replyTo?.id
      });

      message.success(replyTo ? '回复成功' : '评论成功');
      setCommentContent('');
      setReplyTo(null);
      fetchComments();
      fetchSongDetail(); // 更新评论数
    } catch (error) {
      message.error(error.response?.data?.error || '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    setCommentContent(`@${comment.user.nickname || comment.user.username} `);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setCommentContent('');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (!song) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '50px' }}>
          <Empty description="歌曲不存在" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content className="song-detail-content">
        {/* 返回按钮 */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="back-button"
        >
          返回
        </Button>

        {/* 歌曲信息卡片 */}
        <Card className="song-detail-card">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 响应式布局：移动端垂直排列，桌面端水平排列 */}
            <div className="song-info-container">
              {/* 封面 */}
              <div className="song-cover">
                {song.cover_url ? (
                  <img
                    src={song.cover_url}
                    alt={song.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 8,
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: '#f0f0f0',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CustomerServiceOutlined style={{ fontSize: 64, color: '#999' }} />
                  </div>
                )}
              </div>

              {/* 歌曲信息 */}
              <div style={{ flex: 1 }}>
                <Title level={2} style={{ marginBottom: 8, fontSize: 'clamp(20px, 5vw, 28px)' }}>
                  {song.title}
                </Title>
                <Space size="middle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                  <Text strong style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>{song.artist?.name}</Text>
                  {song.album && <Text type="secondary">{song.album.title}</Text>}
                  <Tag color="blue">{song.genre}</Tag>
                </Space>

                {/* 统计信息 - 响应式网格 */}
                <div className="song-stats">
                  <Statistic
                    title="播放"
                    value={formatNumber(song.play_count)}
                    prefix={<PlayCircleOutlined />}
                  />
                  <Statistic
                    title="点赞"
                    value={formatNumber(likeCount)}
                    prefix={<HeartOutlined />}
                  />
                  <Statistic
                    title="评论"
                    value={formatNumber(song.comment_count)}
                    prefix={<MessageOutlined />}
                  />
                  <Statistic
                    title="时长"
                    value={formatDuration(song.duration)}
                  />
                </div>

                <Space size="middle" style={{ marginTop: 16, flexWrap: 'wrap' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={() => setCurrentSong(song)}
                  >
                    播放
                  </Button>
                  <Button
                    size="large"
                    icon={isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                    onClick={handleLike}
                  >
                    {isLiked ? '已点赞' : '点赞'}
                  </Button>
                </Space>
              </div>
            </div>
          </Space>
        </Card>

        {/* 评论区 */}
        <Card title={`评论 (${song.comment_count})`} className="comments-card">
          {/* 发表评论 */}
          <div style={{ marginBottom: 24 }}>
            {replyTo && (
              <div style={{
                background: '#f0f2f5',
                padding: '8px 12px',
                borderRadius: 4,
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text type="secondary">
                  回复 @{replyTo.user.nickname || replyTo.user.username}
                </Text>
                <Button type="link" size="small" onClick={cancelReply}>
                  取消
                </Button>
              </div>
            )}
            <TextArea
              rows={3}
              placeholder={isAuthenticated ? "写下你的评论..." : "请先登录后评论"}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              maxLength={500}
              disabled={!isAuthenticated}
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">{commentContent.length}/500</Text>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmitComment}
                loading={submitting}
                disabled={!isAuthenticated || !commentContent.trim()}
              >
                {replyTo ? '回复' : '发表评论'}
              </Button>
            </div>
          </div>

          <Divider />

          {/* 评论列表 */}
          <List
            loading={loadingComments}
            dataSource={comments}
            locale={{ emptyText: '暂无评论，快来抢沙发吧！' }}
            renderItem={(comment) => (
              <List.Item key={comment.id} style={{ padding: '16px 0' }}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<CustomerServiceOutlined />}
                      src={getAvatarUrl(comment.user?.avatar_url)}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/user/${comment.user.id}`)}
                    />
                  }
                  title={
                    <Space style={{ flexWrap: 'wrap' }}>
                      <Text
                        strong
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/user/${comment.user.id}`)}
                      >
                        {comment.user?.nickname || comment.user?.username}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatTime(comment.created_at)}
                      </Text>
                      {user && user.id !== comment.user.id && (
                        <Button
                          type="link"
                          size="small"
                          icon={<MessageOutlined />}
                          onClick={() => navigate(`/messages/${comment.user.id}`)}
                          style={{ padding: 0, fontSize: 12 }}
                        >
                          私信
                        </Button>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Paragraph style={{ marginBottom: 8 }}>{comment.content}</Paragraph>
                      <Space>
                        <Button
                          type="link"
                          size="small"
                          icon={<HeartOutlined />}
                          style={{ padding: 0 }}
                        >
                          {comment.like_count > 0 && formatNumber(comment.like_count)}
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => handleReply(comment)}
                          style={{ padding: 0 }}
                        >
                          回复
                        </Button>
                      </Space>

                      {/* 回复列表 */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div style={{
                          marginTop: 12,
                          paddingLeft: 16,
                          borderLeft: '2px solid #f0f0f0'
                        }}>
                          {comment.replies.map((reply) => (
                            <div key={reply.id} style={{ marginBottom: 8 }}>
                              <Space size={4}>
                                <Text strong style={{ fontSize: 13 }}>
                                  {reply.user?.nickname || reply.user?.username}:
                                </Text>
                                <Text style={{ fontSize: 13 }}>{reply.content}</Text>
                              </Space>
                              <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {formatTime(reply.created_at)}
                                </Text>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Content>

      {/* 音乐播放器 */}
      {currentSong && (
        <MusicPlayer
          currentSong={currentSong}
          playlist={[song]}
          onSongChange={setCurrentSong}
        />
      )}

      {/* 响应式样式 */}
      <style>{`
        /* 移动端：页面铺满，无padding */
        .song-detail-content {
          padding: 0;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .back-button {
          margin: 12px;
        }

        .song-detail-card,
        .comments-card {
          margin: 0 0 0 0;
          border-radius: 0;
        }

        .song-info-container {
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        .song-cover {
          width: 200px;
          height: 200px;
          flex-shrink: 0;
        }

        .song-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .song-info-container {
            flex-direction: column;
            align-items: center;
          }

          .song-cover {
            width: 100%;
            max-width: 300px;
            height: auto;
            aspect-ratio: 1;
          }

          .song-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .song-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* 桌面端：恢复padding和圆角 */
        @media (min-width: 769px) {
          .song-detail-content {
            padding: 16px;
          }

          .back-button {
            margin: 0 0 16px 0;
          }

          .song-detail-card {
            margin-bottom: 16px;
            border-radius: 8px;
          }

          .comments-card {
            border-radius: 8px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default SongDetail;
