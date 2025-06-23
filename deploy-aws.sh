#!/bin/bash

# AWS Deployment Script for LearnIQ Node.js Application
# This script assumes a fresh Ubuntu/Debian EC2 instance with nothing installed

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="learniq"
APP_DIR="/var/www/$APP_NAME"
API_DIR="$APP_DIR/user-api"
DOMAIN="your-domain.com"  # Replace with your actual domain
DB_NAME="learniq_production"
NODE_VERSION="20"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Starting AWS deployment for LearnIQ application..."

# 1. System Updates and Basic Setup
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "Installing essential packages..."
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release

# 2. Install Node.js
print_status "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node_version=$(node --version)
npm_version=$(npm --version)
print_success "Node.js installed: $node_version"
print_success "npm installed: $npm_version"

# 3. Install MongoDB
print_status "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
print_success "MongoDB installed and started"

# 4. Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_success "Nginx installed and started"

# 5. Install PM2 (Process Manager)
print_status "Installing PM2..."
sudo npm install -g pm2
print_success "PM2 installed"

# 6. Setup Firewall
print_status "Configuring UFW firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw allow 8080
print_success "Firewall configured"

# 7. Create application directory
print_status "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
cd $APP_DIR

# 8. Clone or copy application (assuming you're running this from the project directory)
print_status "Copying application files..."
if [ -d "/home/ubuntu/LearnIQ" ]; then
    cp -r /home/ubuntu/LearnIQ/* $APP_DIR/
elif [ -d "/home/ec2-user/LearnIQ" ]; then
    cp -r /home/ec2-user/LearnIQ/* $APP_DIR/
else
    print_warning "Application source not found. Please ensure your code is uploaded to the server."
    print_warning "You can use: scp -r ./LearnIQ ubuntu@your-server-ip:/home/ubuntu/"
fi

# 9. Install dependencies
print_status "Installing application dependencies..."
cd $APP_DIR
npm install --production

cd $API_DIR
npm init -y  # Create package.json if it doesn't exist
npm install express mongoose bcryptjs jsonwebtoken dotenv cors helmet express-rate-limit axios

# 10. Create environment file for API
print_status "Creating environment configuration..."
cat > $API_DIR/.env << EOF
# Server Configuration
PORT=5000
NODE_ENV=production # Change to 'production' in production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://user-admin:user-admin@customerservicechat.4uk1s.mongodb.net/?retryWrites=true&w=majority&appName=CustomerServiceChat

# JWT Authentication
JWT_SECRET=a7f3b09e1c5d28e64f9a2b7d0c58e3f1a6b9d2c4e7f0a3b5d8c1e6f9
JWT_RESET_SECRET=f1e6d3c9b5a2f7e0d4c8b3a6e9f2d1c7b4a0e5f2d8c6b3a9
JWT_EXPIRY=24h
ENCRYPTION_KEY=b5a9c2e7f1d6b3a8c4e0f2d7a9b5c3e1f8d4a6b2c9e5f7d3a1b8
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8080,https://yourproductiondomain.com

# API Keys
GEMINI_API_KEY=AIzaSyDePyQW4fuzM5mZRWTSpNzyuIz12SBpz7A

# Rate Limiting
RATE_LIMITING_ENABLED=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100000
REGISTER_LIMIT_WINDOW_MS=3600000
REGISTER_LIMIT_MAX_REQUESTS=5000000

# Security
BCRYPT_SALT_ROUNDS=12
EOF

print_success "Environment file created at $API_DIR/.env"
print_warning "Please update the API keys in $API_DIR/.env file"

# 11. Build the frontend
print_status "Building frontend application..."
cd $APP_DIR
npm run build

# 12. Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '${APP_NAME}-api',
      script: './user-api/index.js',
      cwd: '$APP_DIR',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/pm2/${APP_NAME}-api-error.log',
      out_file: '/var/log/pm2/${APP_NAME}-api-out.log',
      log_file: '/var/log/pm2/${APP_NAME}-api.log',
      time: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
EOF

# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# 13. Configure Nginx
print_status "Configuring Nginx..."
sudo cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend (React build)
    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
if [ $? -eq 0 ]; then
    print_success "Nginx configuration is valid"
    sudo systemctl reload nginx
else
    print_error "Nginx configuration has errors"
    exit 1
fi

# 14. Create health check endpoint in API
print_status "Adding health check endpoint..."
cat >> $API_DIR/index.js << 'EOF'

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});
EOF

# 15. Setup MongoDB database and user
print_status "Setting up MongoDB database..."
mongosh << EOF
use $DB_NAME
db.createUser({
  user: "${APP_NAME}_user",
  pwd: "$(openssl rand -base64 32)",
  roles: [
    { role: "readWrite", db: "$DB_NAME" }
  ]
})
EOF

# 16. Start the application with PM2
print_status "Starting application with PM2..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Follow the PM2 startup instructions
print_warning "Please run the command that PM2 displays above to enable auto-start on boot"

# 17. Install SSL certificate (Let's Encrypt)
print_status "Installing Certbot for SSL certificates..."
sudo apt install -y certbot python3-certbot-nginx

print_warning "To enable SSL, run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"

# 18. Setup log rotation
print_status "Setting up log rotation..."
sudo cat > /etc/logrotate.d/$APP_NAME << EOF
/var/log/pm2/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# 19. Create backup script
print_status "Creating backup script..."
sudo cat > /usr/local/bin/backup-$APP_NAME.sh << EOF
#!/bin/bash
BACKUP_DIR="/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p \$BACKUP_DIR

# Backup MongoDB
mongodump --db $DB_NAME --out \$BACKUP_DIR/mongodb_\$DATE

# Backup application files
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "mongodb_*" -mtime +7 -exec rm -rf {} \;
find \$BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

sudo chmod +x /usr/local/bin/backup-$APP_NAME.sh

# Add to crontab for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-$APP_NAME.sh") | crontab -

# 20. Setup monitoring script
print_status "Creating monitoring script..."
cat > $APP_DIR/monitor.sh << EOF
#!/bin/bash
# Simple monitoring script

check_service() {
    if systemctl is-active --quiet \$1; then
        echo "\$1 is running"
    else
        echo "\$1 is not running - attempting restart"
        sudo systemctl restart \$1
    fi
}

check_pm2() {
    if pm2 list | grep -q "online"; then
        echo "PM2 applications are running"
    else
        echo "PM2 applications are not running - attempting restart"
        pm2 restart all
    fi
}

check_service nginx
check_service mongod
check_pm2

# Check disk space
df -h | awk '\$5 > 80 {print "Warning: " \$1 " is " \$5 " full"}'

# Check memory usage
free -m | awk 'NR==2{printf "Memory Usage: %s/%sMB (%.2f%%)\n", \$3,\$2,\$3*100/\$2 }'
EOF

chmod +x $APP_DIR/monitor.sh

# Add monitoring to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/monitor.sh >> /var/log/monitor.log 2>&1") | crontab -

# 21. Final status check
print_status "Performing final status checks..."

# Check if services are running
services=("nginx" "mongod")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        print_success "$service is running"
    else
        print_error "$service is not running"
    fi
done

# Check PM2 status
pm2_status=$(pm2 list | grep -c "online" || echo "0")
if [ "$pm2_status" -gt 0 ]; then
    print_success "PM2 applications are running ($pm2_status online)"
else
    print_error "No PM2 applications are running"
fi

# Display important information
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Important Information:"
echo "================================"
echo "🌐 Application URL: http://$DOMAIN"
echo "🔧 API Health Check: http://$DOMAIN/health"
echo "📁 Application Directory: $APP_DIR"
echo "📁 API Directory: $API_DIR"
echo "📄 Environment File: $API_DIR/.env"
echo "📄 Nginx Config: /etc/nginx/sites-available/$APP_NAME"
echo "📄 PM2 Config: $APP_DIR/ecosystem.config.js"
echo "📄 Logs: /var/log/pm2/"
echo ""
echo "🔧 Useful Commands:"
echo "================================"
echo "# View application logs:"
echo "pm2 logs $APP_NAME-api"
echo ""
echo "# Restart application:"
echo "pm2 restart $APP_NAME-api"
echo ""
echo "# View Nginx logs:"
echo "sudo tail -f /var/log/nginx/access.log"
echo "sudo tail -f /var/log/nginx/error.log"
echo ""
echo "# Check MongoDB status:"
echo "sudo systemctl status mongod"
echo ""
echo "# Monitor system resources:"
echo "$APP_DIR/monitor.sh"
echo ""
echo "⚠️  Next Steps:"
echo "================================"
echo "1. Update API keys in $API_DIR/.env"
echo "2. Update domain name in Nginx config if needed"
echo "3. Run: sudo certbot --nginx -d $DOMAIN to enable SSL"
echo "4. Test your application at http://$DOMAIN"
echo "5. Run the PM2 startup command displayed above"
echo ""

print_warning "Don't forget to update your domain DNS records to point to this server's IP address!"
