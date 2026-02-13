import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, Card, List, Avatar, Empty, Spin, Typography, Tag, Space, Divider, Button } from 'antd';
import { CustomerServiceOutlined, UserOutlined, PlayCircleOutlined, HeartOutlined, MessageOutlined, CheckOutlined, PlusOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { musicAPI, userAPI } from '../api';
import { socialAPI } from '../api';
import { getAvatarUrl } from '../utils/url';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;

const SearchResults = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({
    songs: [],
    artists: [],
    users: [],
  });
  const [totals, setTotals] = useState({
    songs: 0,
    artists: 0,
    users: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState({});
  const [followingLoading, setFollowingLoading] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [expandedArtists, setExpandedArtists] = useState({});
  const [artistSongs, setArtistSongs] = useState({});

  useEffect(() => {
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
  }, []);

  useEffect(() => {
    if (query) {
      performSearch(query, 'all');
    }
  }, [query]);

  const performSearch = async (searchQuery, type) => {
    setLoading(true);
    try {
      const [musicRes, userRes] = await Promise.all([
        musicAPI.search(searchQuery, type === 'all' || type === 'songs' ? type : 'all'),
        userAPI.searchUsers(searchQuery),
      ]);

      const musicData = musicRes.data || {};
      const userData = userRes.data || {};

      setResults({
        songs: musicData.songs || [],
        artists: musicData.artists || [],
        users: userData.users || [],
      });

      setTotals({
        songs: musicData.songs_total || 0,
        artists: musicData.artists_total || 0,
        users: userData.total || 0,
        total: (musicData.total || 0) + (userData.total || 0),
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
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

  // Check follow status for users
  useEffect(() => {
    const checkFollowStatus = async () => {
      const newFollowingMap = {};
      await Promise.all(
        results.users.map(async (u) => {
          if (user && u.id !== user.id) {
            try {
              const res = await socialAPI.isFollowing(u.id);
              newFollowingMap[u.id] = res.data.is_following || false;
            } catch {
              newFollowingMap[u.id] = false;
            }
          } else {
            newFollowingMap[u.id] = false;
          }
        })
      );
      setFollowingMap(newFollowingMap);
    };

    if (results.users.length > 0 && user) {
      checkFollowStatus();
    }
  }, [results.users, user]);

  const handleFollow = useCallback(async (targetUser) => {
    if (!user || targetUser.id === user.id) return;

    setFollowingLoading(prev => ({ ...prev, [targetUser.id]: true }));
    try {
      await socialAPI.followUser(targetUser.id);
      setFollowingMap(prev => ({ ...prev, [targetUser.id]: true }));
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setFollowingLoading(prev => ({ ...prev, [targetUser.id]: false }));
    }
  }, [user]);

  const handleUnfollow = useCallback(async (targetUser) => {
    if (!user || targetUser.id === user.id) return;

    setFollowingLoading(prev => ({ ...prev, [targetUser.id]: true }));
    try {
      await socialAPI.unfollowUser(targetUser.id);
      setFollowingMap(prev => ({ ...prev, [targetUser.id]: false }));
    } catch (error) {
      console.error('Unfollow error:', error);
    } finally {
      setFollowingLoading(prev => ({ ...prev, [targetUser.id]: false }));
    }
  }, [user]);

  const handleArtistClick = async (artistId) => {
    if (expandedArtists[artistId]) {
      // 如果已展开，则收起
      setExpandedArtists(prev => ({ ...prev, [artistId]: false }));
    } else {
      // 如果未展开，则展开并加载歌曲
      setExpandedArtists(prev => ({ ...prev, [artistId]: true }));

      // 如果还没有加载过该歌手的歌曲，则加载
      if (!artistSongs[artistId]) {
        try {
          const res = await musicAPI.getArtistSongs(artistId);
          setArtistSongs(prev => ({ ...prev, [artistId]: res.data.songs || [] }));
        } catch (error) {
          console.error('Failed to load artist songs:', error);
        }
      }
    }
  };

  const SongItem = ({ song }) => (
    <List.Item
      style={{ padding: '12px 0', cursor: 'pointer' }}
      onClick={() => navigate(`/songs/${song.id}`)}
    >
      <List.Item.Meta
        avatar={
          <Avatar
            size={48}
            src={song.cover_url}
            icon={<CustomerServiceOutlined />}
          />
        }
        title={
          <Space>
            <Text strong>{song.title}</Text>
            <Tag color="blue">{song.artist?.name}</Tag>
          </Space>
        }
        description={
          <Space size="large" style={{ fontSize: 12 }}>
            <span><HeartOutlined /> {formatNumber(song.like_count)}</span>
            <span><MessageOutlined /> {formatNumber(song.comment_count)}</span>
            <span>{formatDuration(song.duration)}</span>
          </Space>
        }
      />
    </List.Item>
  );

  const ArtistItem = ({ artist }) => {
    const isExpanded = expandedArtists[artist.id] || false;
    const songs = artistSongs[artist.id] || [];

    return (
      <>
        <List.Item
          style={{ padding: '12px 0', cursor: 'pointer' }}
          onClick={() => handleArtistClick(artist.id)}
        >
          <List.Item.Meta
            avatar={
              <Avatar
                size={48}
                icon={<CustomerServiceOutlined />}
              />
            }
            title={
              <Space>
                {isExpanded ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
                <Text strong>{artist.name}</Text>
              </Space>
            }
            description={
              <Space>
                <Tag color="purple">{artist.genre}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>{artist.country}</Text>
              </Space>
            }
          />
        </List.Item>
        {isExpanded && (
          <div style={{ marginLeft: 64, marginBottom: 16, background: '#fafafa', padding: '12px', borderRadius: 8 }}>
            {songs.length > 0 ? (
              <List
                dataSource={songs}
                renderItem={(song) => <SongItem song={song} />}
              />
            ) : (
              <Spin />
            )}
          </div>
        )}
      </>
    );
  };

  const UserItem = ({ user: userItem }) => {
    const isFollowing = followingMap[userItem.id] || false;
    const isLoading = followingLoading[userItem.id] || false;
    const currentUser = useSelector((state) => state.auth).user;

    if (isMobile) {
      // 移动端：按钮显示在用户名下面
      return (
        <List.Item style={{ padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => navigate(`/user/${userItem.id}`)}
            >
              <Avatar
                size={48}
                src={getAvatarUrl(userItem.avatar_url)}
                icon={<UserOutlined />}
              />
              <div style={{ marginLeft: 12 }}>
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    {userItem.nickname || userItem.username}
                  </Text>
                </div>
                {userItem.bio && (
                  <div style={{ marginTop: 4 }}>
                    <Text ellipsis style={{ maxWidth: 200, fontSize: 12, color: '#999' }}>
                      {userItem.bio}
                    </Text>
                  </div>
                )}
              </div>
            </div>

            {currentUser && userItem.id !== currentUser.id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 100 }}>
                {isFollowing ? (
                  <Button
                    type="default"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnfollow(userItem);
                    }}
                    loading={isLoading}
                    block
                  >
                    已关注
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow(userItem);
                    }}
                    loading={isLoading}
                    block
                  >
                    关注
                  </Button>
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<MessageOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/messages/${userItem.id}`);
                  }}
                  block
                >
                  私信
                </Button>
              </div>
            )}
          </div>
        </List.Item>
      );
    }

    // PC端：按钮显示在右侧
    const actions = [];
    if (currentUser && userItem.id !== currentUser.id) {
      if (isFollowing) {
        actions.push(
          <Button
            type="default"
            size="small"
            icon={<CheckOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleUnfollow(userItem);
            }}
            loading={isLoading}
          >
            已关注
          </Button>
        );
      } else {
        actions.push(
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleFollow(userItem);
            }}
            loading={isLoading}
          >
            关注
          </Button>
        );
      }
      actions.push(
        <Button
          type="text"
          size="small"
          icon={<MessageOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/messages/${userItem.id}`);
          }}
        >
          私信
        </Button>
      );
    }

    return (
      <List.Item
        style={{ padding: '12px 0' }}
        actions={actions}
      >
        <List.Item.Meta
          avatar={
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/user/${userItem.id}`)}
            >
              <Avatar
                size={48}
                src={getAvatarUrl(userItem.avatar_url)}
                icon={<UserOutlined />}
              />
            </div>
          }
          title={
            <Text
              strong
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/user/${userItem.id}`)}
            >
              {userItem.nickname || userItem.username}
            </Text>
          }
          description={
            userItem.bio ? (
              <Text ellipsis style={{ maxWidth: 300 }}>{userItem.bio}</Text>
            ) : (
              <Text type="secondary">{userItem.email}</Text>
            )
          }
        />
      </List.Item>
    );
  };

  const tabItems = [
    {
      key: 'all',
      label: `全部 (${totals.total})`,
    },
    {
      key: 'songs',
      label: `歌曲 (${totals.songs})`,
    },
    {
      key: 'artists',
      label: `歌手 (${totals.artists})`,
    },
    {
      key: 'users',
      label: `用户 (${totals.users})`,
    },
  ];

  if (!query) {
    return (
      <div className="search-container" style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
        <Empty description="请输入搜索关键词" />
      </div>
    );
  }

  return (
    <div className="search-container" style={{ background: '#fff', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <div style={{
          marginBottom: isMobile ? 12 : 24,
          padding: isMobile ? '12px 16px' : '16px 24px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={isMobile ? 4 : 3} style={{ marginBottom: 4 }}>
            搜索结果："{query}"
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>找到 {totals.total} 个结果</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            performSearch(query, key);
          }}
          items={tabItems}
          size={isMobile ? 'middle' : 'large'}
          style={{ padding: isMobile ? '0 8px' : '0 24px' }}
        />

        <Spin spinning={loading}>
          <div style={{
            marginTop: isMobile ? 0 : 16,
            padding: isMobile ? '8px' : '16px 24px',
          }}>
            {(activeTab === 'all' || activeTab === 'songs') && results.songs.length > 0 && (
              <>
                <Title level={4} style={{ marginBottom: 16 }}>歌曲</Title>
                <List
                  dataSource={results.songs}
                  renderItem={(song) => <SongItem song={song} />}
                />
                {(activeTab === 'all' && (results.artists.length > 0 || results.users.length > 0)) && <Divider />}
              </>
            )}

            {(activeTab === 'all' || activeTab === 'artists') && results.artists.length > 0 && (
              <>
                <Title level={4} style={{ marginBottom: 16 }}>歌手</Title>
                <List
                  dataSource={results.artists}
                  renderItem={(artist) => <ArtistItem artist={artist} />}
                />
                {(activeTab === 'all' && results.users.length > 0) && <Divider />}
              </>
            )}

            {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
              <>
                <Title level={4} style={{ marginBottom: 16 }}>用户</Title>
                <List
                  dataSource={results.users}
                  renderItem={(user) => <UserItem user={user} />}
                />
              </>
            )}

            {!loading && results.songs.length === 0 && results.artists.length === 0 && results.users.length === 0 && (
              <Empty description="未找到相关结果" />
            )}
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default SearchResults;

/* 响应式样式 */
<style>{`
  /* 整体容器：铺满屏幕 */
  .search-container {
    background: #f0f2f5;
    min-height: calc(100vh - 64px);
  }

  /* Tabs区域：白色背景，无阴影 */
  .ant-tabs {
    background: #fff;
    box-shadow: none;
  }

  /* 内容区域 */
  .search-content {
    margin-top: 16px;
  }

  /* 移动端：Card无边距 */
  @media (max-width: 768px) {
    .ant-card {
      border-radius: 0;
      margin-bottom: 0 !important;
      box-shadow: none;
    }
  }
`}</style>
