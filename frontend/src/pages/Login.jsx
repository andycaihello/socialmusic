import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Row, Col, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login, clearError } from '../store/authSlice';

const { Title, Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      const result = await dispatch(login({
        identifier: values.identifier,
        password: values.password,
      })).unwrap();

      message.success('登录成功！');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      // 处理各种错误格式
      const errorMessage = err?.message || err?.error || err || '登录失败，请检查用户名和密码';
      message.error(errorMessage);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: 1400 }}>
        <Row gutter={[48, 24]} align="middle">
          <Col xs={24} lg={12} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            minHeight: '50vh'
          }}>
            <div style={{ textAlign: 'center', color: '#fff', maxWidth: 600 }}>
              <Title level={1} style={{ color: '#fff', fontSize: 48, marginBottom: 24 }}>
                🎵 SocialMusic
              </Title>
              <Title level={3} style={{ color: '#fff', fontWeight: 'normal', marginBottom: 16 }}>
                发现音乐，分享快乐
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
                与好友一起探索音乐世界
              </Text>
            </div>
          </Col>

          <Col xs={24} lg={12} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}>
            <Card
              style={{
                width: '100%',
                maxWidth: 450,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                borderRadius: 12
              }}
            >
              <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
                登录
              </Title>

              <Form
                form={form}
                name="login"
                onFinish={onFinish}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="identifier"
                  rules={[
                    { required: true, message: '请输入邮箱或用户名！' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="邮箱或用户名"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码！' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{ height: 45 }}
                  >
                    登录
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">还没有账号？</Text>
                  {' '}
                  <Link to="/register" style={{ fontWeight: 'bold' }}>立即注册</Link>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Login;
