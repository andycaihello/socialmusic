# 阿里云 Ubuntu 部署指南

本指南将帮助你将 SocialMusic 项目部署到阿里云 Ubuntu 服务器上。

## 前置要求

- 阿里云 Ubuntu 20.04/22.04 服务器
- 服务器已开放端口：22 (SSH), 80 (HTTP), 443 (HTTPS)
- 域名（可选，用于生产环境）

## 1. 服务器初始化

### 1.1 连接到服务器

```bash
ssh root@your_server_ip
```

### 1.2 更新系统

```bash
apt update && apt upgrade -y
```

### 1.3 安装基础工具

```bash
apt install -y git curl wget vim ufw
```

## 2. 安装依赖软件

### 2.1 安装 Python 3.10+

```bash
apt install -y python3 python3-pip python3-venv
python3 --version  # 确认版本
```

### 2.2 安装 PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

配置数据库：

```bash
sudo -u postgres psql
```

在 PostgreSQL 命令行中执行：

```sql
CREATE DATABASE socialmusic;
CREATE USER socialmusic_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE socialmusic TO socialmusic_user;
\q
```

### 2.3 安装 Node.js 和 npm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version  # 确认版本
npm --version
```

### 2.4 安装 Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

## 3. 部署代码

### 3.1 创建部署目录

```bash
mkdir -p /var/www/socialmusic
cd /var/www/socialmusic
```

### 3.2 克隆代码

方式一：从 Git 仓库克隆

```bash
git clone your_repository_url .
```

方式二：从本地上传（在本地执行）

```bash
# 在本地项目目录执行
rsync -avz --exclude 'node_modules' --exclude '.venv' --exclude '__pycache__' \
  --exclude '.git' ./ root@your_server_ip:/var/www/socialmusic/
```

## 4. 配置后端

### 4.1 创建 Python 虚拟环境

```bash
cd /var/www/socialmusic/backend
python3 -m venv venv
source venv/bin/activate
```

### 4.2 安装 Python 依赖

```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

### 4.3 配置环境变量

```bash
cp .env.example .env
vim .env
```

编辑 `.env` 文件：

```bash
# Database Configuration
DATABASE_URL=postgresql://socialmusic_user:your_secure_password@localhost:5432/socialmusic

# JWT Configuration
JWT_SECRET_KEY=生成一个强随机密钥
JWT_ACCESS_TOKEN_EXPIRES=86400
JWT_REFRESH_TOKEN_EXPIRES=604800

# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=production
SECRET_KEY=生成一个强随机密钥

# Upload Configuration
UPLOAD_FOLDER=/var/www/socialmusic/backend/uploads
MAX_CONTENT_LENGTH=16777216
```

生成随机密钥：

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 4.4 初始化数据库

**方法一：使用 Python 脚本（推荐）**

项目已包含 `init_db.py` 脚本，直接运行即可：

```bash
cd /var/www/socialmusic/backend
source venv/bin/activate
python init_db.py
```

**方法二：使用 Flask-Migrate**

如果你想使用 Flask-Migrate，需要先设置环境变量：

```bash
source venv/bin/activate
export FLASK_APP=run.py
flask db upgrade
```

或者使用提供的迁移脚本：

```bash
chmod +x migrate.sh
./migrate.sh
```

**验证数据库初始化**

```bash
# 连接数据库查看表
sudo -u postgres psql -d socialmusic -c "\dt"
```

**常见问题**

如果遇到 "No such command 'db'" 错误：
1. 确保已安装 Flask-Migrate: `pip install Flask-Migrate`
2. 确保设置了 FLASK_APP 环境变量: `export FLASK_APP=run.py`
3. 使用 `init_db.py` 脚本代替 flask 命令

### 4.5 创建上传目录

```bash
mkdir -p /var/www/socialmusic/backend/uploads
chmod 755 /var/www/socialmusic/backend/uploads
```

### 4.6 创建 Gunicorn 配置文件

```bash
vim /var/www/socialmusic/backend/gunicorn_config.py
```

添加以下内容：

```python
bind = "127.0.0.1:5000"
workers = 4
worker_class = "sync"
timeout = 120
accesslog = "/var/log/socialmusic/gunicorn_access.log"
errorlog = "/var/log/socialmusic/gunicorn_error.log"
loglevel = "info"
```

创建日志目录：

```bash
mkdir -p /var/log/socialmusic
chmod 755 /var/log/socialmusic
```

### 4.7 创建 Systemd 服务

```bash
vim /etc/systemd/system/socialmusic-backend.service
```

添加以下内容：

```ini
[Unit]
Description=SocialMusic Backend Service
After=network.target postgresql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/socialmusic/backend
Environment="PATH=/var/www/socialmusic/backend/venv/bin"
ExecStart=/var/www/socialmusic/backend/venv/bin/gunicorn -c gunicorn_config.py run:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

修改文件权限：

```bash
chown -R www-data:www-data /var/www/socialmusic
chmod -R 755 /var/www/socialmusic
```

启动服务：

```bash
systemctl daemon-reload
systemctl start socialmusic-backend
systemctl enable socialmusic-backend
systemctl status socialmusic-backend
```

## 5. 配置前端

### 5.1 配置环境变量

```bash
cd /var/www/socialmusic/frontend
vim .env
```

添加以下内容（根据实际情况修改）：

```bash
VITE_API_BASE_URL=http://your_server_ip/api
# 或使用域名
# VITE_API_BASE_URL=https://api.yourdomain.com
```

### 5.2 安装依赖并构建

```bash
npm install
npm run build
```

构建完成后，静态文件会生成在 `dist` 目录中。

## 6. 配置 Nginx

### 6.1 创建 Nginx 配置文件

```bash
vim /etc/nginx/sites-available/socialmusic
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your_server_ip;  # 或使用域名 yourdomain.com

    # 前端静态文件
    location / {
        root /var/www/socialmusic/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 处理跨域
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # 上传文件访问
    location /uploads {
        alias /var/www/socialmusic/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 日志
    access_log /var/log/nginx/socialmusic_access.log;
    error_log /var/log/nginx/socialmusic_error.log;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;
}
```

### 6.2 启用配置并重启 Nginx

```bash
ln -s /etc/nginx/sites-available/socialmusic /etc/nginx/sites-enabled/
nginx -t  # 测试配置
systemctl restart nginx
```

## 7. 配置防火墙

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

## 8. 配置 HTTPS（可选但推荐）

### 8.1 安装 Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 8.2 获取 SSL 证书

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot 会自动配置 Nginx 并启用 HTTPS。

### 8.3 自动续期

```bash
certbot renew --dry-run
```

## 9. 验证部署

### 9.1 检查后端服务

```bash
systemctl status socialmusic-backend
curl http://localhost:5000/api/health  # 假设有健康检查端点
```

### 9.2 检查 Nginx

```bash
systemctl status nginx
curl http://your_server_ip
```

### 9.3 查看日志

```bash
# 后端日志
tail -f /var/log/socialmusic/gunicorn_error.log

# Nginx 日志
tail -f /var/log/nginx/socialmusic_error.log
```

## 10. 常用维护命令

### 重启服务

```bash
# 重启后端
systemctl restart socialmusic-backend

# 重启 Nginx
systemctl restart nginx
```

### 更新代码

```bash
cd /var/www/socialmusic

# 拉取最新代码
git pull

# 更新后端
cd backend
source venv/bin/activate
pip install -r requirements.txt
flask db upgrade
systemctl restart socialmusic-backend

# 更新前端
cd ../frontend
npm install
npm run build
systemctl restart nginx
```

### 数据库备份

```bash
# 备份
sudo -u postgres pg_dump socialmusic > backup_$(date +%Y%m%d).sql

# 恢复
sudo -u postgres psql socialmusic < backup_20260210.sql
```

## 11. 故障排查

### 后端无法启动

```bash
# 查看服务状态
systemctl status socialmusic-backend

# 查看日志
journalctl -u socialmusic-backend -n 100 --no-pager

# 手动测试
cd /var/www/socialmusic/backend
source venv/bin/activate
python run.py
```

### Nginx 502 错误

检查后端服务是否运行：

```bash
systemctl status socialmusic-backend
netstat -tlnp | grep 5000
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 服务
systemctl status postgresql

# 测试连接
sudo -u postgres psql -d socialmusic
```

### 权限问题

```bash
# 修复权限
chown -R www-data:www-data /var/www/socialmusic
chmod -R 755 /var/www/socialmusic
chmod -R 755 /var/www/socialmusic/backend/uploads
```

## 12. 性能优化建议

1. 启用 Nginx 缓存
2. 配置 CDN 加速静态资源
3. 使用 Redis 缓存会话和数据
4. 配置数据库连接池
5. 启用 Gzip 压缩
6. 使用 PM2 或 Supervisor 管理进程

## 13. 安全建议

1. 定期更新系统和软件包
2. 使用强密码和密钥
3. 配置防火墙规则
4. 启用 HTTPS
5. 限制数据库远程访问
6. 定期备份数据
7. 监控服务器资源和日志
8. 配置失败登录限制（fail2ban）

## 联系方式

如有问题，请查看项目文档或提交 Issue。
