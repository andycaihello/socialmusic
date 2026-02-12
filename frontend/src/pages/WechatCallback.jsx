/**
 * WeChat OAuth Callback Page
 */
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Spin, Result } from 'antd';
import { getCurrentUser } from '../store/authSlice';

const WechatCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // 保存token
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      // 获取用户信息
      dispatch(getCurrentUser());

      // 跳转到首页
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } else {
      // 登录失败
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [searchParams, navigate, dispatch]);

  const accessToken = searchParams.get('access_token');

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      {accessToken ? (
        <Result
          status="success"
          title="微信登录成功！"
          subTitle="正在跳转到首页..."
          icon={<Spin size="large" />}
        />
      ) : (
        <Result
          status="error"
          title="微信登录失败"
          subTitle="正在返回登录页..."
        />
      )}
    </div>
  );
};

export default WechatCallback;
