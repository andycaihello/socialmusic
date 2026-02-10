# SocialMusic 社交音乐平台

一个基于 Flask（后端）和 React（前端）构建的社交音乐平台，具有用户认证、社交功能、音乐互动和个性化推荐等特性。

## 项目简介

SocialMusic 是一个全栈 Web 应用，允许用户：
- 🎵 浏览和播放音乐
- 👥 关注其他用户，查看好友动态
- ❤️ 点赞和评论喜欢的歌曲
- 📊 查看热门歌曲和最新发布
- 🎯 获得基于行为的个性化推荐
- 📝 记录完整的用户行为日志用于推荐算法

## 已实现功能

### ✅ 用户系统
- **用户注册与登录**：支持邮箱/用户名登录，JWT token 认证
- **个人资料管理**：修改昵称、个人简介、手机号
- **头像上传**：支持上传自定义头像（PNG、JPG、JPEG、GIF）
- **密码管理**：安全的密码修改功能
- **用户主页**：查看用户信息、关注/粉丝列表

### ✅ 音乐功能
- **音乐浏览**：浏览歌曲列表，查看歌曲详情
- **音乐播放**：内置音乐播放器，支持播放控制、进度条、音量调节
- **热门歌曲**：按播放量排序的热门歌曲榜单
- **最新歌曲**：最新发布的歌曲列表
- **歌手信息**：查看歌手详情和热门歌曲

### ✅ 社交功能
- **关注系统**：关注/取消关注其他用户
- **好友动态**：实时查看关注用户的播放和点赞动态
- **关注列表**：查看用户的关注和粉丝列表
- **用户互动**：点击用户名跳转到用户主页

### ✅ 互动功能
- **点赞歌曲**：为喜欢的歌曲点赞/取消点赞
- **评论系统**：发表评论、查看评论列表
- **嵌套回复**：支持评论的回复功能
- **评论管理**：删除自己的评论
- **实时统计**：实时更新播放量、点赞数、评论数

### ✅ 行为日志系统
完整记录用户行为用于推荐算法：
- 登录/登出行为
- 播放歌曲（记录播放时长）
- 点赞/取消点赞
- 发表评论
- 关注/取消关注
- 查看歌曲详情
- 查看用户主页
- 修改个人资料

### ✅ 响应式设计
- PC 端优化布局（大屏幕）
- 平板适配（中等屏幕）
- 移动端友好（小屏幕）

## 项目结构

```
SocialMusic/
├── backend/                    # Flask 后端
│   ├── app/
│   │   ├── __init__.py        # Flask 应用初始化
│   │   ├── config.py          # 配置文件
│   │   ├── extensions.py      # Flask 扩展
│   │   ├── models/            # 数据库模型
│   │   │   ├── user.py        # 用户模型
│   │   │   ├── music.py       # 歌手、专辑、歌曲模型
│   │   │   ├── social.py      # 关注、点赞、评论模型
│   │   │   └── log.py         # 用户行为日志模型
│   │   ├── schemas/           # 数据验证模式
│   │   │   └── auth.py        # 认证相关验证
│   │   ├── api/               # API 路由
│   │   │   ├── auth.py        # 认证接口
│   │   │   ├── user.py        # 用户管理接口
│   │   │   ├── music.py       # 音乐接口
│   │   │   ├── social.py      # 社交功能接口
│   │   │   ├── interaction.py # 互动功能接口
│   │   │   └── feed.py        # 动态推荐接口
│   │   ├── services/          # 业务逻辑
│   │   │   └── log_service.py # 日志服务
│   │   └── utils/             # 工具函数
│   │       ├── decorators.py  # 认证装饰器
│   │       └── jwt_helper.py  # JWT 工具
│   ├── migrations/            # 数据库迁移
│   ├── uploads/               # 文件上传目录
│   ├── instance/              # SQLite 数据库文件
│   ├── requirements.txt       # Python 依赖
│   ├── run.py                 # 应用入口
│   ├── init_data.py           # 初始化测试数据
│   └── create_activity_logs.py # 创建活动日志
│
└── frontend/                   # React 前端
    ├── src/
    │   ├── api/               # API 客户端
    │   │   └── index.js       # Axios 配置和 API 方法
    │   ├── components/        # 可复用组件
    │   │   └── MusicPlayer.jsx # 音乐播放器
    │   ├── pages/             # 页面组件
    │   │   ├── Login.jsx      # 登录页面
    │   │   ├── Register.jsx   # 注册页面
    │   │   ├── Home.jsx       # 首页
    │   │   ├── Profile.jsx    # 个人中心
    │   │   ├── SongDetail.jsx # 歌曲详情页
    │   │   └── UserDetail.jsx # 用户详情页
    │   ├── store/             # Redux 状态管理
    │   │   ├── index.js       # Store 配置
    │   │   └── authSlice.js   # 认证状态
    │   ├── routes/            # 路由配置
    │   │   └── PrivateRoute.jsx # 私有路由组件
    │   ├── App.jsx            # 主应用组件
    │   └── main.jsx           # 入口文件
    ├── .env                   # 环境变量
    └── package.json           # Node 依赖
```

## 数据库模型

### 核心表结构

**users** - 用户表
- 用户认证信息（邮箱、用户名、密码哈希）
- 个人资料（昵称、头像、个人简介、手机号）
- 时间戳（创建时间、更新时间）

**artists** - 歌手表
- 歌手信息（姓名、头像、简介、国家、音乐风格）

**albums** - 专辑表
- 专辑信息（标题、封面、发行日期、所属歌手）

**songs** - 歌曲表
- 歌曲信息（标题、时长、风格、歌词、封面、音频链接）
- 统计数据（播放量、点赞数、评论数）
- 关联关系（歌手、专辑）

**follows** - 关注关系表
- 关注者 ID、被关注者 ID
- 唯一约束防止重复关注

**likes** - 点赞表
- 用户 ID、歌曲 ID
- 唯一约束防止重复点赞

**comments** - 评论表
- 评论内容、用户 ID、歌曲 ID
- 支持嵌套回复（parent_id）
- 点赞数统计

**user_behavior_logs** - 用户行为日志表
- 行为类型（login、play、like、comment、follow 等）
- 关联对象（歌曲 ID、歌手 ID）
- 元数据（播放时长、IP 地址、User Agent）
- 时间戳

## 技术栈

### 后端技术
- **Flask 3.0.0** - Web 框架
- **SQLAlchemy 2.0** - ORM 数据库操作
- **Flask-Migrate** - 数据库迁移管理
- **Flask-JWT-Extended** - JWT 认证
- **Flask-CORS** - 跨域支持
- **Marshmallow** - 数据验证和序列化
- **bcrypt** - 密码加密
- **SQLite** - 开发环境数据库

### 前端技术
- **React 18** - UI 框架
- **Vite** - 构建工具
- **Redux Toolkit** - 状态管理
- **React Router 6** - 路由管理
- **Axios** - HTTP 客户端
- **Ant Design 5** - UI 组件库

## 快速开始

### 后端设置

1. 进入后端目录：
```bash
cd backend
```

2. 创建并激活虚拟环境：
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 初始化数据库：
```bash
flask db upgrade
```

5. 导入测试数据（可选）：
```bash
python init_data.py
python create_activity_logs.py
```

6. 启动开发服务器：
```bash
python run.py
```

后端将运行在 `http://localhost:5001`

### 前端设置

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端将运行在 `http://localhost:5173`

## API 接口文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh-token` - 刷新访问令牌
- `GET /api/auth/me` - 获取当前用户信息

### 用户管理接口
- `GET /api/users/me` - 获取当前用户资料
- `PUT /api/users/me` - 更新用户资料
- `PUT /api/users/me/password` - 修改密码
- `POST /api/users/me/avatar` - 上传头像
- `GET /api/users/:id` - 获取用户信息

### 社交功能接口
- `POST /api/social/follow/:userId` - 关注用户
- `DELETE /api/social/follow/:userId` - 取消关注
- `GET /api/social/is-following/:userId` - 检查关注状态
- `GET /api/social/followers/:userId` - 获取粉丝列表
- `GET /api/social/following/:userId` - 获取关注列表

### 音乐接口
- `GET /api/songs` - 获取歌曲列表（分页）
- `GET /api/songs/:id` - 获取歌曲详情
- `GET /api/songs/trending` - 获取热门歌曲
- `GET /api/songs/latest` - 获取最新歌曲
- `GET /api/artists/:id` - 获取歌手信息
- `GET /api/artists/:id/songs` - 获取歌手热门歌曲

### 互动功能接口
- `POST /api/songs/:id/like` - 点赞歌曲
- `DELETE /api/songs/:id/like` - 取消点赞
- `GET /api/songs/:id/like/status` - 获取点赞状态
- `POST /api/songs/:id/play` - 记录播放行为
- `POST /api/songs/:id/comments` - 发表评论
- `GET /api/songs/:id/comments` - 获取评论列表
- `DELETE /api/comments/:id` - 删除评论

### 动态推荐接口
- `GET /api/feed/friends-activity` - 获取好友动态

## 测试账号

初始化数据后，可以使用以下测试账号登录：

| 用户名 | 邮箱 | 密码 | 昵称 |
|--------|------|------|------|
| alice | alice@example.com | password123 | Alice音乐迷 |
| bob | bob@example.com | password123 | Bob摇滚 |
| charlie | charlie@example.com | password123 | Charlie爵士 |
| david | david@example.com | password123 | David电音 |

## 功能演示

### 1. 用户注册和登录
- 访问 `http://localhost:5173`
- 点击"注册"创建新账号
- 使用邮箱/用户名和密码登录

### 2. 浏览音乐
- 首页显示热门歌曲和最新歌曲
- 点击歌曲卡片查看详情
- 点击播放按钮播放音乐

### 3. 社交互动
- 点击用户名查看用户主页
- 点击"关注"按钮关注用户
- 在好友动态区域查看关注用户的活动

### 4. 音乐互动
- 在歌曲详情页点赞歌曲
- 发表评论和回复
- 查看其他用户的评论

### 5. 个人中心
- 点击右上角头像进入个人中心
- 修改个人资料和头像
- 查看关注和粉丝列表

## 开发说明

### 认证机制
- 使用 JWT Token 进行身份验证
- Access Token 有效期：24 小时
- Refresh Token 有效期：7 天
- 前端自动处理 Token 刷新

### 安全特性
- 密码使用 bcrypt 加密存储
- JWT Token 包含用户身份信息
- API 请求需要携带 Authorization Header
- 文件上传限制类型和大小
- SQL 注入防护（SQLAlchemy ORM）

### 数据库索引
为提高查询性能，已创建以下索引：
- users: email, username, phone
- songs: artist_id, album_id, play_count, like_count
- follows: follower_id, following_id
- user_behavior_logs: user_id, action_type, created_at

## 未来规划

### Phase 6: 推荐算法
- [ ] 协同过滤推荐
- [ ] 基于内容的推荐
- [ ] 用户画像构建
- [ ] 个性化 Feed 生成

### Phase 7: 性能优化
- [ ] Redis 缓存热门数据
- [ ] 数据库查询优化
- [ ] API 限流保护
- [ ] CDN 静态资源加速

### 功能增强
- [ ] 搜索功能（歌曲、歌手、用户）
- [ ] 播放列表管理
- [ ] 歌曲收藏功能
- [ ] 私信系统
- [ ] 通知系统
- [ ] 音乐分享功能

## 常见问题

**Q: 为什么音乐无法播放？**
A: 确保歌曲的 external_url 字段包含有效的音频链接。测试数据使用的是 SoundHelix 的免费测试音频。

**Q: 如何添加新的歌曲数据？**
A: 可以通过编写脚本或直接操作数据库添加。参考 `init_data.py` 中的示例代码。

**Q: 如何切换到 PostgreSQL？**
A: 修改 `backend/app/config.py` 中的 `SQLALCHEMY_DATABASE_URI`，然后运行 `flask db upgrade`。

**Q: 前端如何调用 API？**
A: 使用 `src/api/index.js` 中导出的 API 方法，例如 `musicAPI.getSongs()`。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎通过 Issue 反馈。

---

**注意**：本项目仅用于学习和演示目的，不存储实际音频文件，仅保存音乐元数据和外部链接。
