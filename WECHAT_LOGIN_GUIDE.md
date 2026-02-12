# 微信登录配置指南

## 功能说明

OnBeat已集成微信登录功能，支持：
- PC端扫码登录
- 移动端内授权登录
- 账号绑定/解绑微信

## 配置步骤

### 1. 注册微信开放平台

访问 [微信开放平台](https://open.weixin.qq.com/)

1. 注册开发者账号
2. 创建网站应用
3. 填写网站信息：
   - 网站名称：OnBeat合拍
   - 网站域名：app.onbeat.com.cn
   - 授权回调域：app.onbeat.com.cn

### 2. 获取AppID和AppSecret

在微信开放平台的应用详情页面获取：
- AppID（应用唯一标识）
- AppSecret（应用密钥）

### 3. 配置后端

编辑文件：`backend/app/api/wechat_auth.py`

```python
# 第8-10行，替换为你的配置
WECHAT_APP_ID = 'YOUR_WECHAT_APP_ID'  # 替换为你的AppID
WECHAT_APP_SECRET = 'YOUR_WECHAT_APP_SECRET'  # 替换为你的AppSecret
WECHAT_REDIRECT_URI = 'https://app.onbeat.com.cn/api/auth/wechat/callback'  # 回调地址
```

### 4. 重启后端服务

```bash
cd backend
# 停止现有服务
lsof -ti:5001 | xargs kill -9

# 启动服务
python run.py
```

## API接口

### 1. 获取微信登录URL
```
GET /api/auth/wechat/login?type=pc
```
参数：
- type: 'pc'（PC扫码）或 'mobile'（移动端）

返回：
```json
{
  "auth_url": "https://open.weixin.qq.com/connect/qrconnect?...",
  "state": "随机字符串"
}
```

### 2. 微信授权回调
```
GET /api/auth/wechat/callback?code=xxx&state=xxx
```
自动处理，重定向到前端页面并携带token

### 3. 绑定微信账号
```
POST /api/auth/wechat/bind
```
请求体：
```json
{
  "code": "微信授权code"
}
```

### 4. 解绑微信账号
```
POST /api/auth/wechat/unbind
```

## 前端使用

### 登录页面

登录页面已添加"微信登录"按钮，点击后：
1. 自动检测设备类型（PC/移动端）
2. 跳转到微信授权页面
3. 用户授权后自动登录并跳转到首页

### 回调处理

前端路由 `/auth/wechat/callback` 会自动处理微信回调：
1. 接收access_token和refresh_token
2. 保存到localStorage
3. 更新Redux状态
4. 跳转到首页

## 数据库字段

User表新增字段：
- `wechat_openid`: 微信OpenID（唯一标识）
- `wechat_unionid`: 微信UnionID（多应用统一标识）
- `is_active`: 账号激活状态

## 注意事项

1. **域名配置**：微信要求必须使用已备案的域名，不支持IP地址和localhost
2. **HTTPS要求**：生产环境必须使用HTTPS
3. **回调地址**：必须与微信开放平台配置的回调域一致
4. **测试环境**：开发时可以使用微信开放平台的测试号功能
5. **用户信息**：微信登录会自动获取用户昵称和头像

## 测试流程

### 开发环境测试

1. 申请微信测试号：https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login
2. 配置测试号的AppID和AppSecret
3. 使用内网穿透工具（如ngrok）将本地服务映射到公网
4. 在微信测试号配置回调域名

### 生产环境部署

1. 确保域名已备案
2. 配置HTTPS证书
3. 在微信开放平台配置正式的回调域名
4. 更新后端配置文件中的AppID和AppSecret
5. 重启服务

## 故障排查

### 常见问题

1. **redirect_uri参数错误**
   - 检查回调地址是否与微信平台配置一致
   - 确保URL编码正确

2. **获取access_token失败**
   - 检查AppID和AppSecret是否正确
   - 确认code是否已使用或过期

3. **获取用户信息失败**
   - 检查access_token是否有效
   - 确认scope权限是否正确

4. **无法跳转到微信授权页**
   - 检查前端API调用是否正确
   - 查看浏览器控制台错误信息

## 相关文档

- [微信开放平台文档](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)
- [微信网页授权](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html)
