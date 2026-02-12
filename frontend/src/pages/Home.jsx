import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Tabs, Card, Button, Avatar, Space, Typography, List, Tag, Row, Col, Statistic, Empty, Modal, message as antMessage } from 'antd';
import { UserOutlined, CustomerServiceOutlined, FireOutlined, StarOutlined, PlayCircleOutlined, HeartOutlined, MessageOutlined, ShareAltOutlined } from '@ant-design/icons';
import { musicAPI, feedAPI, socialAPI, messageAPI } from '../api';
import MusicPlayer from '../components/MusicPlayer';
import { getAvatarUrl } from '../utils/url';

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
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedSongToShare, setSelectedSongToShare] = useState(null);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [sharingToUser, setSharingToUser] = useState(null);

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

  const handleShareClick = async (song, e) => {
    e.stopPropagation();
    setSelectedSongToShare(song);
    setShareModalVisible(true);

    // Fetch following users
    if (user) {
      setLoadingFollowing(true);
      try {
        const res = await socialAPI.getFollowing(user.id);
        setFollowingUsers(res.data.following || []);
      } catch (error) {
        console.error('Failed to fetch following users:', error);
        antMessage.error('获取关注列表失败');
      } finally {
        setLoadingFollowing(false);
      }
    }
  };

  const handleShareToUser = async (targetUser) => {
    if (!selectedSongToShare) return;

    setSharingToUser(targetUser.id);
    try {
      // Create song card message
      const songCard = {
        type: 'song_share',
        song: {
          id: selectedSongToShare.id,
          title: selectedSongToShare.title,
          artist: selectedSongToShare.artist?.name,
          cover_url: selectedSongToShare.cover_url,
          duration: selectedSongToShare.duration,
          play_count: selectedSongToShare.play_count,
          like_count: selectedSongToShare.like_count,
          comment_count: selectedSongToShare.comment_count,
        }
      };

      await messageAPI.sendMessage({
        receiver_id: targetUser.id,
        content: JSON.stringify(songCard),
      });

      antMessage.success(`已分享给 ${targetUser.nickname || targetUser.username}`);
    } catch (error) {
      console.error('Failed to share song:', error);
      antMessage.error('分享失败');
    } finally {
      setSharingToUser(null);
    }
  };

  const handleCloseShareModal = () => {
    setShareModalVisible(false);
    setSelectedSongToShare(null);
    setFollowingUsers([]);
  };

  // 歌曲卡片组件
  const SongCard = ({ song, showRank = false, rank = 0 }) => (
    <Card
      hoverable
      style={{ marginBottom: 16, cursor: 'pointer' }}
      bodyStyle={{ padding: '12px' }}
      onClick={() => navigate(`/songs/${song.id}`)}
      className="song-card"
    >
      <div className="song-card-content">
        {/* 左侧：排名 + 封面 */}
        <div className="song-left">
          {showRank && (
            <div className="song-rank">
              {rank}
            </div>
          )}
          <div className="song-cover">
            {song.cover_url ? (
              <img
                src={song.cover_url}
                alt={song.title}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 4,
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: '#f0f0f0',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CustomerServiceOutlined style={{ fontSize: 24, color: '#999' }} />
              </div>
            )}
          </div>
        </div>

        {/* 中间：歌曲信息 */}
        <div className="song-info">
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>
            {song.title}
          </Text>
          <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
            {song.artist?.name}
          </Text>
          <Space size="middle" className="song-stats">
            <span>
              <HeartOutlined /> {formatNumber(song.like_count)}
            </span>
            <span>
              <MessageOutlined /> {formatNumber(song.comment_count)}
            </span>
            <span>{formatDuration(song.duration)}</span>
          </Space>
        </div>

        {/* 右侧：播放和分享按钮 */}
        <div className="song-actions">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={(e) => handlePlaySong(song, e)}
            size="small"
          >
            <span className="button-text">播放</span>
          </Button>
          <Button
            icon={<ShareAltOutlined />}
            onClick={(e) => handleShareClick(song, e)}
            size="small"
          >
            <span className="button-text">分享</span>
          </Button>
        </div>
      </div>
    </Card>
  );

  // Tab1: 推荐内容 - 只显示热门歌曲
  const RecommendedTab = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24}>
        {/* 热门歌曲 */}
        <Card
          title={
            <Space>
              <FireOutlined style={{ color: '#ff4d4f' }} />
              <span>热门歌曲</span>
            </Space>
          }
        >
          <List
            loading={loading}
            dataSource={trendingSongs.slice(0, 10)}
            renderItem={(song, index) => (
              <SongCard song={song} showRank rank={index + 1} />
            )}
          />
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

  // Tab3: 好友动态
  const FriendsActivityTab = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24}>
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>好友动态</span>
            </Space>
          }
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
                            navigate(`/user/${activity.user.id}`);
                          }}
                        >
                          {activity.user.nickname || activity.user.username}
                        </Text>
                        <Text type="secondary">
                          {activity.action_type === 'like' ? '喜欢了' : '播放了'}
                        </Text>
                        {user && user.id !== activity.user.id && (
                          <Button
                            type="link"
                            size="small"
                            icon={<MessageOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/messages/${activity.user.id}`);
                            }}
                            style={{ padding: 0, fontSize: 12 }}
                          >
                            私信
                          </Button>
                        )}
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
      </Col>
    </Row>
  );

  // Tab4: 最新歌曲
  const LatestSongsTab = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24}>
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
    </Row>
  );

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
    {
      key: '3',
      label: (
        <span style={{ fontSize: 16, padding: '0 16px' }}>
          <UserOutlined /> 好友动态
        </span>
      ),
    },
    {
      key: '4',
      label: (
        <span style={{ fontSize: 16, padding: '0 16px' }}>
          <StarOutlined /> 最新歌曲
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', width: '100%' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            style={{ background: '#fff', padding: '0 24px', borderRadius: 8 }}
          />
          <div style={{ marginTop: 24 }}>
            {activeTab === '1' && <RecommendedTab />}
            {activeTab === '2' && <ArtistsHotTab />}
            {activeTab === '3' && <FriendsActivityTab />}
            {activeTab === '4' && <LatestSongsTab />}
          </div>
        </div>

        {/* 音乐播放器 */}
        {currentSong && (
          <MusicPlayer
            currentSong={currentSong}
            playlist={playlist}
            onSongChange={setCurrentSong}
          />
        )}

        {/* 分享模态框 */}
        <Modal
          title={`分享歌曲：${selectedSongToShare?.title}`}
          open={shareModalVisible}
          onCancel={handleCloseShareModal}
          footer={null}
          width={500}
        >
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">选择要分享给的好友：</Text>
          </div>
          <List
            loading={loadingFollowing}
            dataSource={followingUsers}
            locale={{ emptyText: <Empty description="你还没有关注任何人" /> }}
            renderItem={(followUser) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    size="small"
                    loading={sharingToUser === followUser.id}
                    onClick={() => handleShareToUser(followUser)}
                  >
                    分享
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={getAvatarUrl(followUser.avatar_url)}
                      icon={<UserOutlined />}
                    />
                  }
                  title={followUser.nickname || followUser.username}
                  description={followUser.bio || followUser.email}
                />
              </List.Item>
            )}
          />
        </Modal>

        {/* 响应式样式 */}
        <style>{`
          /* 歌曲卡片布局 */
          .song-card-content {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .song-left {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
          }

          .song-rank {
            font-size: 24px;
            font-weight: bold;
            color: #999;
            width: 30px;
            text-align: center;
          }

          .song-rank:nth-child(1) {
            color: #ff4d4f;
          }

          .song-cover {
            width: 60px;
            height: 60px;
            flex-shrink: 0;
          }

          .song-info {
            flex: 1;
            min-width: 0;
          }

          .song-stats {
            font-size: 12px;
            color: #999;
          }

          .song-stats span {
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          .song-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
          }

          .song-actions button {
            width: 36px;
            height: 36px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .button-text {
            display: none;
          }

          /* 桌面端显示完整布局 */
          @media (min-width: 769px) {
            .song-card-content {
              gap: 16px;
            }

            .song-rank {
              width: 40px;
              font-size: 28px;
            }

            .song-cover {
              width: 80px;
              height: 80px;
            }

            .song-info {
              display: flex;
              align-items: center;
              gap: 24px;
            }

            .song-stats {
              font-size: 14px;
            }

            .song-actions {
              flex-direction: row;
              gap: 12px;
            }

            .song-actions button {
              width: auto;
              min-width: 80px;
              height: 36px;
              padding: 4px 20px;
              font-size: 14px;
            }

            .button-text {
              display: inline;
              margin-left: 4px;
            }

            .song-actions button .anticon {
              margin-right: 0;
            }
          }
        `}</style>
      </div>
  );
};

export default Home;
