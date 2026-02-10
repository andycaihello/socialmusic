#!/bin/bash

# SocialMusic Frontend Start Script

echo "Starting SocialMusic Frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Dependencies not found. Installing..."
    npm install
fi

# Start Vite dev server
echo "Starting Vite dev server on http://localhost:5173"
npm run dev
