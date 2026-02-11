import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Layout, Tabs, Card, Button, Avatar, Space, Typography, List, Tag, Row, Col, Statistic, Empty } from 'antd';
import { UserOutlined, LogoutOutlined, CustomerServiceOutlined, FireOutlined, StarOutlined, PlayCircleOutlined, HeartOutlined, MessageOutlined } from '@ant-design/icons';
import { logout } from '../store/authSlice';
import { musicAPI, feedAPI } from '../api';
import MusicPlayer from '../components/MusicPlayer';
import { getAvatarUrl } from '../utils/url';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('1');
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [latestSongs, setLatestSongs] = useState([]);
  const [friendsActivity, setFriendsActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trendingRes, latestRes, activityRes] = await Promise.all([
        musicAPI.getTrendingSongs(),
        musicAPI.getLatestSongs(),
        feedAPI.getFriendsActivity({ per_page: 20 })
      ]);
      setTrendingSongs(trendingRes.data.songs || []);
      setLatestSongs(latestRes.data.songs || []);
      setFriendsActivity(activityRes.data.activities || []);
      setPlaylist([...(trendingRes.data.songs || []), ...(latestRes.data.songs || [])]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song, e) => {
    e.stopPropagation();
    setCurrentSong(song);
    // 设置为播放状态，这样播放器会自动播放
    setTimeout(() => {
      const audioElement = document.querySelector('audio');
      if (audioElement) {
        audioElement.play().catch(err => console.error('播放失败:', err));
      }
    }, 100);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
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

  // 歌曲卡片组件
  const SongCard = ({ song, showRank = false, rank = 0 }) => (
    <Card
      hoverable
      style={{ marginBottom: 16, cursor: 'pointer' }}
      bodyStyle={{ padding: '16px' }}
      onClick={() => navigate(`/songs/${song.id}`)}
    >
      <Row gutter={16} align="middle">
        {showRank && (
          <Col flex="40px">
            <div style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: rank <= 3 ? '#ff4d4f' : '#999',
              textAlign: 'center'
            }}>
              {rank}
            </div>
          </Col>
        )}
        <Col flex="60px">
          {song.cover_url ? (
            <img
              src={song.cover_url}
              alt={song.title}
              style={{
                width: 60,
                height: 60,
                borderRadius: 4,
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: 60,
              height: 60,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CustomerServiceOutlined style={{ fontSize: 24, color: '#999' }} />
            </div>
          )}
        </Col>
        <Col flex="auto">
          <div>
            <Text strong style={{ fontSize: 16 }}>{song.title}</Text>
            <br />
            <Text type="secondary">{song.artist?.name}</Text>
            {song.album && <Text type="secondary"> · {song.album.title}</Text>}
          </div>
        </Col>
        <Col>
          <Space size="large">
            <Statistic
              value={formatNumber(song.play_count)}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ fontSize: 14 }}
            />
            <Statistic
              value={formatNumber(song.like_count)}
              prefix={<HeartOutlined />}
              valueStyle={{ fontSize: 14 }}
            />
            <Statistic
              value={formatNumber(song.comment_count)}
              prefix={<MessageOutlined />}
              valueStyle={{ fontSize: 14 }}
            />
          </Space>
        </Col>
        <Col>
          <Text type="secondary">{formatDuration(song.duration)}</Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={(e) => handlePlaySong(song, e)}
          >
            播放
          </Button>
        </Col>
      </Row>
    </Card>
  );

  // Tab1: 推荐内容
  const RecommendedTab = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} xl={16}>
        {/* 热门歌曲 */}
        <Card
          title={
            <Space>
              <FireOutlined style={{ color: '#ff4d4f' }} />
              <span>热门歌曲</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <List
            loading={loading}
            dataSource={trendingSongs.slice(0, 10)}
            renderItem={(song, index) => (
              <SongCard song={song} showRank rank={index + 1} />
            )}
          />
        </Card>

        {/* 最新歌曲 */}
        <Card
          title={
            <Space>
              <StarOutlined style={{ color: '#1890ff' }} />
              <span>最新歌曲</span>
            </Space>
          }
        >
          <List
            loading={loading}
            dataSource={latestSongs.slice(0, 10)}
            renderItem={(song) => (
              <SongCard song={song} />
            )}
          />
        </Card>
      </Col>

      <Col xs={24} xl={8}>
        {/* 好友动态 */}
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>好友动态</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          {friendsActivity.length === 0 ? (
            <Empty
              description="暂无好友动态"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                关注好友后，可以在这里看到他们最近在听什么歌曲
              </Text>
            </Empty>
          ) : (
            <List
              loading={loading}
              dataSource={friendsActivity}
              renderItem={(activity) => (
                <List.Item style={{ padding: '12px 0', cursor: 'pointer' }} onClick={() => navigate(`/songs/${activity.song.id}`)}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={activity.user.avatar_url}
                        icon={!activity.user.avatar_url && <UserOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <Text
                          strong
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${activity.user.id}`);
                          }}
                        >
                          {activity.user.nickname || activity.user.username}
                        </Text>
                        <Text type="secondary">
                          {activity.action_type === 'like' ? '喜欢了' : '播放了'}
                        </Text>
                      </Space>
                    }
                    description={
                      <div>
                        <Text ellipsis style={{ maxWidth: 200, display: 'inline-block' }}>
                          {activity.song.title} - {activity.song.artist?.name}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(activity.created_at).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </div>
                    }
                  />
                  {activity.song.cover_url && (
                    <img
                      src={activity.song.cover_url}
                      alt={activity.song.title}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 4,
                        objectFit: 'cover'
                      }}
                    />
                  )}
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* 推荐歌手 */}
        <Card
          title={
            <Space>
              <CustomerServiceOutlined />
              <span>推荐歌手</span>
            </Space>
          }
        >
          <Paragraph type="secondary">
            根据你的听歌习惯，为你推荐可能喜欢的歌手
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            提示：Phase 6 将实现个性化推荐算法
          </Text>
        </Card>
      </Col>
    </Row>
  );

  // Tab2: 歌手热歌
  const ArtistsHotTab = () => {
    const [artists, setArtists] = useState([]);
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [artistSongs, setArtistSongs] = useState([]);
    const [loadingArtists, setLoadingArtists] = useState(false);
    const [loadingSongs, setLoadingSongs] = useState(false);

    useEffect(() => {
      fetchArtists();
    }, []);

    const fetchArtists = async () => {
      setLoadingArtists(true);
      try {
        const res = await musicAPI.getArtists();
        const artistsList = res.data.artists || [];
        setArtists(artistsList);
        if (artistsList.length > 0) {
          handleArtistClick(artistsList[0]);
        }
      } catch (error) {
        console.error('Failed to fetch artists:', error);
      } finally {
        setLoadingArtists(false);
      }
    };

    const handleArtistClick = async (artist) => {
      setSelectedArtist(artist);
      setLoadingSongs(true);
      try {
        const res = await musicAPI.getArtistSongs(artist.id);
        setArtistSongs(res.data.songs || []);
      } catch (error) {
        console.error('Failed to fetch artist songs:', error);
      } finally {
        setLoadingSongs(false);
      }
    };

    return (
      <Row gutter={[24, 24]}>
        {/* 左侧歌手列表 */}
        <Col xs={24} lg={6}>
          <Card
            title={
              <Space>
                <CustomerServiceOutlined />
                <span>歌手列表</span>
              </Space>
            }
            loading={loadingArtists}
          >
            <List
              dataSource={artists}
              renderItem={(artist) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: selectedArtist?.id === artist.id ? '#e6f7ff' : 'transparent',
                    padding: '12px',
                    borderRadius: 4,
                    marginBottom: 8
                  }}
                  onClick={() => handleArtistClick(artist)}
                >
                  <Space>
                    <Avatar size={48} icon={<CustomerServiceOutlined />} />
                    <div>
                      <div><Text strong>{artist.name}</Text></div>
                      <div>
                        <Tag color="blue">{artist.genre}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{artist.country}</Text>
                      </div>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 右侧歌手热歌 */}
        <Col xs={24} lg={18}>
          {selectedArtist ? (
            <Card
              title={
                <Space>
                  <Avatar size={48} icon={<CustomerServiceOutlined />} />
                  <div>
                    <div><Text strong style={{ fontSize: 18 }}>{selectedArtist.name}</Text></div>
                    <div>
                      <Tag color="blue">{selectedArtist.genre}</Tag>
                      <Text type="secondary">{selectedArtist.country}</Text>
                    </div>
                  </div>
                </Space>
              }
              extra={<Text type="secondary">{artistSongs.length} 首热门歌曲</Text>}
              loading={loadingSongs}
            >
              {selectedArtist.bio && (
                <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                  {selectedArtist.bio}
                </Paragraph>
              )}
              <List
                dataSource={artistSongs}
                renderItem={(song, index) => (
                  <SongCard song={song} showRank rank={index + 1} />
                )}
              />
            </Card>
          ) : (
            <Card>
              <Empty description="请选择一个歌手查看热门歌曲" />
            </Card>
          )}
        </Col>
      </Row>
    );
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span style={{ fontSize: 16, padding: '0 16px' }}>
          <FireOutlined /> 推荐
        </span>
      ),
    },
    {
      key: '2',
      label: (
        <span style={{ fontSize: 16, padding: '0 16px' }}>
          <CustomerServiceOutlined /> 歌手热歌
        </span>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header style={{
        background: '#fff',
        padding: '0 50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          🎵 SocialMusic
        </Title>

        <Space size="large">
          <Space size="middle" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            <Avatar
              size="large"
              icon={<UserOutlined />}
              src={getAvatarUrl(user?.avatar_url)}
            />
            <div style={{ lineHeight: '1.2' }}>
              <div><Text strong>{user?.nickname || user?.username}</Text></div>
              <div><Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Text></div>
            </div>
          </Space>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </Space>
      </Header>

      {/* 主内容区域 */}
      <Content style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', width: '100%' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            style={{ background: '#fff', padding: '0 24px', borderRadius: 8 }}
          />
          <div style={{ marginTop: 24 }}>
            {activeTab === '1' ? <RecommendedTab /> : <ArtistsHotTab />}
          </div>
        </div>
      </Content>

      {/* 音乐播放器 */}
      {currentSong && (
        <MusicPlayer
          currentSong={currentSong}
          playlist={playlist}
          onSongChange={setCurrentSong}
        />
      )}
    </Layout>
  );
};

export default Home;
