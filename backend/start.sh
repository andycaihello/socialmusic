#!/bin/bash

# SocialMusic Backend Start Script

echo "Starting SocialMusic Backend..."

# Activate virtual environment
source venv/bin/activate

# Check if database exists
if [ ! -f "instance/socialmusic.db" ]; then
    echo "Database not found. Running migrations..."
    flask db upgrade
fi

# Start Flask server
echo "Starting Flask server on http://localhost:5000"
python run.py
