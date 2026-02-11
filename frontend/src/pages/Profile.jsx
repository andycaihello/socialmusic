import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Card, Avatar, Button, Space, Typography, Descriptions,
  Modal, Form, Input, Upload, message, Spin, List
} from 'antd';
import {
  UserOutlined, EditOutlined, LockOutlined, CameraOutlined,
  ArrowLeftOutlined, PhoneOutlined
} from '@ant-design/icons';
import { userAPI, socialAPI } from '../api';
import { getCurrentUser } from '../store/authSlice';
import { getAvatarUrl } from '../utils/url';

const { Content } = Layout;
const { Title, Text } = Typography;

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      editForm.setFieldsValue({
        nickname: user.nickname,
        bio: user.bio,
        phone: user.phone,
      });
      fetchFollowStats();
    }
  }, [user, editForm]);

  const fetchFollowStats = async () => {
    if (user) {
      try {
        const [followersRes, followingRes] = await Promise.all([
          socialAPI.getFollowers(user.id),
          socialAPI.getFollowing(user.id)
        ]);
        setFollowersCount(followersRes.data.total);
        setFollowingCount(followingRes.data.total);
      } catch (error) {
        console.error('获取关注统计失败', error);
      }
    }
  };

  const showFollowers = async () => {
    try {
      const res = await socialAPI.getFollowers(user.id);
      setFollowers(res.data.followers);
      setFollowersModalVisible(true);
    } catch (error) {
      message.error('获取粉丝列表失败');
    }
  };

  const showFollowing = async () => {
    try {
      const res = await socialAPI.getFollowing(user.id);
      setFollowing(res.data.following);
      setFollowingModalVisible(true);
    } catch (error) {
      message.error('获取关注列表失败');
    }
  };

  const handleEditProfile = async (values) => {
    setLoading(true);
    try {
      await userAPI.updateProfile(values);
      message.success('个人信息更新成功');
      setEditModalVisible(false);
      dispatch(getCurrentUser());
    } catch (error) {
      message.error(error.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      await userAPI.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      await userAPI.uploadAvatar(formData);
      message.success('头像上传成功');
      setAvatarModalVisible(false);
      dispatch(getCurrentUser());
    } catch (error) {
      message.error(error.response?.data?.error || '上传失败');
    } finally {
      setUploadLoading(false);
    }
    return false; // Prevent default upload behavior
  };

  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

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
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={120}
                  icon={<UserOutlined />}
                  src={avatarUrl}
                  style={{ marginBottom: 16 }}
                />
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  size="small"
                  onClick={() => setAvatarModalVisible(true)}
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 0,
                  }}
                />
              </div>
              <Title level={3} style={{ marginBottom: 8 }}>
                {user.nickname || user.username}
              </Title>
              <Text type="secondary">{user.bio || '这个人很懒，什么都没写'}</Text>

              {/* 关注统计 */}
              <Space size="large" style={{ marginTop: 24 }}>
                <div
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                  onClick={showFollowers}
                >
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {followersCount}
                  </div>
                  <Text type="secondary">粉丝</Text>
                </div>
                <div
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                  onClick={showFollowing}
                >
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {followingCount}
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
              <Descriptions.Item label="手机号">{user.phone || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="个人简介">{user.bio || '未设置'}</Descriptions.Item>
            </Descriptions>

            {/* 操作按钮 */}
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditModalVisible(true)}
              >
                编辑资料
              </Button>
              <Button
                icon={<LockOutlined />}
                onClick={() => setPasswordModalVisible(true)}
              >
                修改密码
              </Button>
            </Space>
          </Space>
        </Card>

        {/* 编辑资料弹窗 */}
        <Modal
          title="编辑资料"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditProfile}
          >
            <Form.Item
              label="昵称"
              name="nickname"
            >
              <Input placeholder="请输入昵称" />
            </Form.Item>

            <Form.Item
              label="手机号"
              name="phone"
              rules={[
                { pattern: /^[\d\s\-\(\)\+]+$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
            </Form.Item>

            <Form.Item
              label="个人简介"
              name="bio"
            >
              <Input.TextArea rows={4} placeholder="介绍一下自己吧" maxLength={200} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存
                </Button>
                <Button onClick={() => setEditModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 修改密码弹窗 */}
        <Modal
          title="修改密码"
          open={passwordModalVisible}
          onCancel={() => setPasswordModalVisible(false)}
          footer={null}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              label="当前密码"
              name="current_password"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
            </Form.Item>

            <Form.Item
              label="新密码"
              name="new_password"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
            </Form.Item>

            <Form.Item
              label="确认新密码"
              name="confirm_password"
              dependencies={['new_password']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确认修改
                </Button>
                <Button onClick={() => setPasswordModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 上传头像弹窗 */}
        <Modal
          title="上传头像"
          open={avatarModalVisible}
          onCancel={() => setAvatarModalVisible(false)}
          footer={null}
        >
          <Upload.Dragger
            name="avatar"
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleAvatarUpload}
            disabled={uploadLoading}
          >
            <p className="ant-upload-drag-icon">
              <CameraOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
            <p className="ant-upload-hint">
              支持 PNG, JPG, JPEG, GIF 格式，文件大小不超过 16MB
            </p>
          </Upload.Dragger>
        </Modal>

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

export default Profile;
