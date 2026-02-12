/**
 * WeChat OAuth API
 */
import api from './index';

export const wechatAPI = {
  // 获取微信登录URL
  getWechatLoginUrl: (type = 'pc') => api.get('/auth/wechat/login', { params: { type } }),

  // 绑定微信账号
  bindWechat: (code) => api.post('/auth/wechat/bind', { code }),

  // 解绑微信账号
  unbindWechat: () => api.post('/auth/wechat/unbind'),
};

export default wechatAPI;
