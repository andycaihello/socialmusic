import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Row, Col, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { register } from '../store/authSlice';

const { Title, Text } = Typography;

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      await dispatch(register({
        username: values.username,
        email: values.email,
        phone: values.phone,
        password: values.password,
        nickname: values.nickname,
      })).unwrap();

      message.success('注册成功！');
      navigate('/');
    } catch (err) {
      message.error(err || '注册失败');
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
                加入我们，开启音乐之旅
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
                发现更多好音乐，结识志同道合的朋友
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
              注册
            </Title>

            <Form
              form={form}
              name="register"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名！' },
                  { min: 3, message: '用户名至少3个字符' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱！' },
                  { type: 'email', message: '请输入有效的邮箱地址！' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="邮箱"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                rules={[
                  { pattern: /^[\d\s\-\(\)\+]+$/, message: '请输入有效的手机号！' },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="手机号（可选）"
                />
              </Form.Item>

              <Form.Item
                name="nickname"
              >
                <Input
                  placeholder="昵称（可选）"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码！' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码！' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致！'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="确认密码"
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
                  注册
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">已有账号？</Text>
                {' '}
                <Link to="/login" style={{ fontWeight: 'bold' }}>立即登录</Link>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
      </div>
    </div>
  );
};

export default Register;
