import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Layout, Card, Avatar, Button, Space, Typography, Descriptions,
  Spin, message, Modal, List
} from 'antd';
import {
  UserOutlined, ArrowLeftOutlined, UserAddOutlined, UserDeleteOutlined
} from '@ant-design/icons';
import { userAPI, socialAPI } from '../api';
import { getAvatarUrl } from '../utils/url';

const { Content } = Layout;
const { Title, Text } = Typography;

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    fetchUserDetail();
    if (currentUser && currentUser.id !== parseInt(id)) {
      checkFollowStatus();
    }
  }, [id, currentUser]);

  const fetchUserDetail = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getProfile(id);
      setUser(res.data.user);
    } catch (error) {
      message.error('获取用户信息失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const res = await socialAPI.isFollowing(id);
      setIsFollowing(res.data.is_following);
    } catch (error) {
      console.error('获取关注状态失败', error);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await socialAPI.unfollowUser(id);
        setIsFollowing(false);
        message.success('已取消关注');
      } else {
        await socialAPI.followUser(id);
        setIsFollowing(true);
        message.success('关注成功');
      }
      fetchUserDetail(); // 刷新关注数
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setFollowLoading(false);
    }
  };

  const showFollowers = async () => {
    try {
      const res = await socialAPI.getFollowers(id);
      setFollowers(res.data.followers);
      setFollowersModalVisible(true);
    } catch (error) {
      message.error('获取粉丝列表失败');
    }
  };

  const showFollowing = async () => {
    try {
      const res = await socialAPI.getFollowing(id);
      setFollowing(res.data.following);
      setFollowingModalVisible(true);
    } catch (error) {
      message.error('获取关注列表失败');
    }
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

  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '50px' }}>
          <Text>用户不存在</Text>
        </Content>
      </Layout>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === parseInt(id);
  const avatarUrl = getAvatarUrl(user.avatar_url);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 24 }}
        >
          返回
        </Button>

        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 头像和基本信息 */}
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={120}
                icon={<UserOutlined />}
                src={avatarUrl}
                style={{ marginBottom: 16 }}
              />
              <Title level={3} style={{ marginBottom: 8 }}>
                {user.nickname || user.username}
              </Title>
              <Text type="secondary">{user.bio || '这个人很懒，什么都没写'}</Text>

              {/* 关注按钮 */}
              {!isOwnProfile && currentUser && (
                <div style={{ marginTop: 16 }}>
                  <Button
                    type={isFollowing ? 'default' : 'primary'}
                    icon={isFollowing ? <UserDeleteOutlined /> : <UserAddOutlined />}
                    onClick={handleFollow}
                    loading={followLoading}
                    size="large"
                  >
                    {isFollowing ? '取消关注' : '关注'}
                  </Button>
                </div>
              )}

              {/* 关注统计 */}
              <Space size="large" style={{ marginTop: 24 }}>
                <div
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                  onClick={showFollowers}
                >
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {user.followers_count || 0}
                  </div>
                  <Text type="secondary">粉丝</Text>
                </div>
                <div
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                  onClick={showFollowing}
                >
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {user.following_count || 0}
                  </div>
                  <Text type="secondary">关注</Text>
                </div>
              </Space>
            </div>

            {/* 详细信息 */}
            <Descriptions bordered column={1}>
              <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
              <Descriptions.Item label="昵称">{user.nickname || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
              {user.phone && (
                <Descriptions.Item label="手机号">{user.phone}</Descriptions.Item>
              )}
              <Descriptions.Item label="个人简介">{user.bio || '未设置'}</Descriptions.Item>
            </Descriptions>

            {/* 编辑按钮（仅自己可见） */}
            {isOwnProfile && (
              <Button
                type="primary"
                onClick={() => navigate('/profile')}
              >
                编辑资料
              </Button>
            )}
          </Space>
        </Card>

        {/* 粉丝列表弹窗 */}
        <Modal
          title="粉丝列表"
          open={followersModalVisible}
          onCancel={() => setFollowersModalVisible(false)}
          footer={null}
          width={600}
        >
          <List
            dataSource={followers}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setFollowersModalVisible(false);
                  navigate(`/user/${item.id}`);
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<UserOutlined />}
                      src={getAvatarUrl(item.avatar_url)}
                    />
                  }
                  title={item.nickname || item.username}
                  description={item.bio || '这个人很懒，什么都没写'}
                />
              </List.Item>
            )}
            locale={{ emptyText: '还没有粉丝' }}
          />
        </Modal>

        {/* 关注列表弹窗 */}
        <Modal
          title="关注列表"
          open={followingModalVisible}
          onCancel={() => setFollowingModalVisible(false)}
          footer={null}
          width={600}
        >
          <List
            dataSource={following}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setFollowingModalVisible(false);
                  navigate(`/user/${item.id}`);
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<UserOutlined />}
                      src={getAvatarUrl(item.avatar_url)}
                    />
                  }
                  title={item.nickname || item.username}
                  description={item.bio || '这个人很懒，什么都没写'}
                />
              </List.Item>
            )}
            locale={{ emptyText: '还没有关注任何人' }}
          />
        </Modal>
      </Content>
    </Layout>
  );
};

export default UserDetail;
