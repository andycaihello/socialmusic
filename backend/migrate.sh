#!/bin/bash
# 数据库迁移脚本

# 激活虚拟环境
source venv/bin/activate

# 设置 FLASK_APP 环境变量
export FLASK_APP=run.py

# 执行数据库迁移
flask db upgrade

echo "数据库迁移完成！"
