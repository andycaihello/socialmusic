"""Gunicorn configuration file for production deployment with WebSocket support"""

# Server socket
bind = "127.0.0.1:5000"

# Worker processes - use gevent for WebSocket support
workers = 1
worker_class = "geventwebsocket.gunicorn.workers.GeventWebSocketWorker"
worker_connections = 1000

# Timeout
timeout = 120
keepalive = 5

# Logging
accesslog = "/var/log/socialmusic/gunicorn_access.log"
errorlog = "/var/log/socialmusic/gunicorn_error.log"
loglevel = "info"

# Process naming
proc_name = "socialmusic-backend"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (uncomment if using HTTPS directly with Gunicorn)
# keyfile = None
# certfile = None
