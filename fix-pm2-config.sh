#!/bin/bash

# Quick fix for PM2 ecosystem config on AWS server
set -e

echo "🔧 Fixing PM2 configuration for ES modules..."

APP_DIR="/home/ubuntu/learniq-backend"
SERVICE_NAME="learniq-api"

# Go to the deployment directory
cd $APP_DIR

# Stop any existing PM2 processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Create a proper PM2 config for ES modules
echo "Creating ecosystem.config.cjs for ES modules..."
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Remove the old malformed config
rm -f ecosystem.config.js

# Create logs directory if it doesn't exist
mkdir -p logs

# Start with the new config
echo "Starting LearnIQ user-api with PM2..."
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup

echo "✅ PM2 configuration fixed and service started!"
echo ""
echo "Check status with:"
echo "  pm2 status"
echo "  pm2 logs"
echo ""
echo "Test the API:"
echo "  curl https://learniq.handjobs.co.in/health"
