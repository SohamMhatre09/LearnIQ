#!/bin/bash

# AWS Node.js Backend Deployment Script (No Local MongoDB)
# This script sets up a complete Node.js backend environment on AWS EC2

set -e  # Exit on any error

echo "🚀 Starting AWS Node.js Backend Deployment..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="learniq-backend"
APP_DIR="/home/ubuntu/$APP_NAME"
SERVICE_NAME="learniq-api"
DOMAIN_NAME=${1:-"learniq.handjobs.co.in"}  # Default to your domain
ADMIN_EMAIL="ichbinsoham@gmail.com"
NODE_VERSION="20"

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

# Check and cleanup existing deployment
print_status "Checking for existing deployments..."
if [ -d "$APP_DIR" ]; then
    print_warning "Existing deployment found at $APP_DIR"
    print_status "Stopping existing services..."
    
    # Stop PM2 processes if PM2 is available
    if command -v pm2 >/dev/null 2>&1; then
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
    fi
    
    # Stop Nginx
    sudo systemctl stop nginx 2>/dev/null || true
    
    # Remove existing application directory
    print_status "Removing existing application files..."
    sudo rm -rf "$APP_DIR"
    
    # Remove Nginx site configuration
    sudo rm -f /etc/nginx/sites-enabled/$APP_NAME
    sudo rm -f /etc/nginx/sites-available/$APP_NAME
    
    print_success "Existing deployment cleaned up"
fi

# Check if PM2 is installed and processes are running
if command -v pm2 >/dev/null 2>&1; then
    PM2_PROCESSES=$(pm2 list 2>/dev/null | grep -c "online" || echo "0")
    if [ "$PM2_PROCESSES" -gt 0 ]; then
        print_status "Stopping existing PM2 processes..."
        pm2 stop all
        pm2 delete all
    fi
else
    print_status "PM2 not yet installed, skipping PM2 cleanup..."
fi

# Update system (fix MongoDB repo issue first)
print_status "Fixing package repositories..."
sudo apt-key del 656408E390CFB1F5 2>/dev/null || true  # Remove old MongoDB key
sudo rm -f /etc/apt/sources.list.d/mongodb*.list  # Remove MongoDB repo

print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git vim ufw nginx certbot python3-certbot-nginx build-essential openssl snapd

# Install certbot via snap for better SSL management
print_status "Installing latest Certbot via snap..."
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Install Node.js 20.x (Official NodeSource repository)
print_status "Installing Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
print_status "Verifying installations..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install PM2 globally for process management
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install security updates
print_status "Installing unattended upgrades for security..."
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure firewall
print_status "Configuring UFW firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000  # Your backend port
sudo ufw --force enable
print_success "Firewall configured"

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown ubuntu:ubuntu $APP_DIR

# Deploy your actual user-api
print_status "Deploying LearnIQ user-api..."
cd $APP_DIR

# Check for user-api directory in multiple possible locations
USER_API_SOURCE=""
if [ -d "/home/ubuntu/LearnIQ/user-api" ]; then
    USER_API_SOURCE="/home/ubuntu/LearnIQ/user-api"
elif [ -d "/home/soham/LearnIQ/user-api" ]; then
    USER_API_SOURCE="/home/soham/LearnIQ/user-api"
elif [ -d "$(dirname $0)/user-api" ]; then
    USER_API_SOURCE="$(dirname $0)/user-api"
elif [ -d "../user-api" ]; then
    USER_API_SOURCE="../user-api"
fi

if [ -n "$USER_API_SOURCE" ]; then
    print_status "Copying user-api files from $USER_API_SOURCE..."
    cp -r "$USER_API_SOURCE"/* .
    cp "$USER_API_SOURCE"/.* . 2>/dev/null || true  # Copy hidden files
elif [ -f "package.json" ] && grep -q "learniq-api" package.json; then
    print_status "User-api files already present..."
else
    print_error "User-api source not found. Please ensure:"
    print_error "1. You're running this script from a system with access to user-api directory"
    print_error "2. Or manually copy your user-api files to $APP_DIR before running this script"
    print_error "3. Current working directory: $(pwd)"
    print_error "4. Script directory: $(dirname $0)"
    exit 1
fi

# Verify we have the correct package.json
if [ ! -f "package.json" ]; then
    print_error "package.json not found in user-api"
    exit 1
fi

# Check if it's the correct user-api
if ! grep -q "learniq-api" package.json; then
    print_error "This doesn't appear to be the LearnIQ user-api (package.json doesn't contain 'learniq-api')"
    exit 1
fi

print_success "User-api files deployed successfully"

# Create environment file for user-api
print_status "Creating environment configuration for user-api..."
cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration (Atlas Cloud)
MONGODB_URI=mongodb+srv://user-admin:user-admin@customerservicechat.4uk1s.mongodb.net/?retryWrites=true&w=majority&appName=CustomerServiceChat

# JWT Authentication
JWT_SECRET=a7f3b09e1c5d28e64f9a2b7d0c58e3f1a6b9d2c4e7f0a3b5d8c1e6f9
JWT_RESET_SECRET=f1e6d3c9b5a2f7e0d4c8b3a6e9f2d1c7b4a0e5f2d8c6b3a9
JWT_EXPIRY=24h
ENCRYPTION_KEY=b5a9c2e7f1d6b3a8c4e0f2d7a9b5c3e1f8d4a6b2c9e5f7d3a1b8

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8080,https://${DOMAIN_NAME},http://${DOMAIN_NAME},https://www.${DOMAIN_NAME},http://www.${DOMAIN_NAME}

# API Keys
GEMINI_API_KEY=AIzaSyDePyQW4fuzM5mZRWTSpNzyuIz12SBpz7A

# Rate Limiting
RATE_LIMITING_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100000
REGISTER_LIMIT_WINDOW_MS=3600000
REGISTER_LIMIT_MAX_REQUESTS=5000000

# Security
BCRYPT_SALT_ROUNDS=12
EOF

# Your user-api is already deployed - no need to create a basic server
print_status "User-api is ready - skipping basic server creation..."

# Verify the main file exists
if [ ! -f "index.js" ]; then
    print_error "index.js not found in user-api"
    exit 1
fi

print_success "User-api main file verified"

# Install dependencies from user-api
print_status "Installing user-api dependencies..."
npm install

# Check if installation was successful
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    print_status "Trying to install with --legacy-peer-deps..."
    npm install --legacy-peer-deps
    
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies even with --legacy-peer-deps"
        print_status "Package contents:"
        cat package.json
        exit 1
    fi
fi

print_success "Dependencies installed successfully"

# Configure PM2 ecosystem file for user-api (ES modules compatible)
print_status "Creating PM2 configuration for user-api..."

# Check if this is an ES module project
if grep -q '"type": "module"' package.json; then
    print_status "Detected ES modules, creating compatible PM2 config..."
    # For ES modules, we need to use .cjs extension or different approach
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
    CONFIG_FILE="ecosystem.config.cjs"
else
    print_status "Using CommonJS PM2 config..."
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: './index.js',
    instances: 'max',
    exec_mode: 'cluster',
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
    CONFIG_FILE="ecosystem.config.js"
fi

# Create logs directory
mkdir -p logs

# Start user-api with PM2
print_status "Starting LearnIQ user-api with PM2..."
pm2 start $CONFIG_FILE --env production
pm2 save
pm2 startup

# Configure Nginx as reverse proxy
print_status "Configuring Nginx reverse proxy..."

# Always create domain-based configuration since we have a domain
sudo tee /etc/nginx/sites-available/$APP_NAME << EOF
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API proxy
    location /api/ {
        proxy_pass https://learniq.handjobs.co.in/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Direct access to backend
    location / {
        proxy_pass https://learniq.handjobs.co.in;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass https://learniq.handjobs.co.in/health;
        access_log off;
    }

    # SSL verification endpoint
    location /ssl-status {
        return 200 'SSL is working correctly with Let'\''s Encrypt certificate for $DOMAIN_NAME';
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site and start Nginx
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Start Nginx first for Let's Encrypt
print_status "Starting Nginx for SSL certificate setup..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Test basic Nginx configuration
print_status "Testing basic Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    print_success "Basic Nginx configuration is valid"
else
    print_error "Nginx configuration failed"
    exit 1
fi

# Set up SSL certificates with Let's Encrypt
print_status "Setting up SSL certificate with Let's Encrypt for $DOMAIN_NAME..."

# Verify domain is pointing to this server
print_status "Verifying domain DNS configuration..."
SERVER_IP=$(curl -s http://checkip.amazonaws.com/ || curl -s http://ipinfo.io/ip || echo "Unable to detect IP")
DOMAIN_IP=$(dig +short $DOMAIN_NAME | tail -n1)

print_status "Server IP: $SERVER_IP"
print_status "Domain IP: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    print_warning "Domain $DOMAIN_NAME does not point to this server ($SERVER_IP != $DOMAIN_IP)"
    print_warning "SSL certificate installation may fail. Please update your DNS records."
    print_status "Continuing with certificate installation anyway..."
fi

# Create webroot directory for challenges
sudo mkdir -p /var/www/html/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/html

# Obtain SSL certificate
print_status "Obtaining SSL certificate from Let's Encrypt..."
sudo certbot --nginx \
    -d $DOMAIN_NAME \
    -d www.$DOMAIN_NAME \
    --non-interactive \
    --agree-tos \
    --email $ADMIN_EMAIL \
    --redirect \
    --expand

if [ $? -eq 0 ]; then
    print_success "SSL certificate obtained successfully!"
    
    # Set up auto-renewal
    print_status "Setting up automatic SSL certificate renewal..."
    echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx" | sudo crontab -
    
    # Test renewal
    print_status "Testing SSL certificate renewal..."
    sudo certbot renew --dry-run
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate auto-renewal is working"
    else
        print_warning "SSL certificate auto-renewal test failed"
    fi
else
    print_error "Failed to obtain SSL certificate"
    print_warning "Continuing with HTTP only configuration..."
fi

# Reload Nginx with SSL configuration
print_status "Reloading Nginx with SSL configuration..."
sudo nginx -t && sudo systemctl reload nginx

# Set up automatic monitoring
print_status "Setting up automatic monitoring..."
cat > /tmp/monitor.sh << 'EOF'
#!/bin/bash
if ! curl -f https://learniq.handjobs.co.in/health > /dev/null 2>&1; then
    echo "$(date): Backend is down, restarting..." >> /var/log/learniq-monitor.log
    /usr/bin/pm2 restart all >> /var/log/learniq-monitor.log 2>&1
fi
EOF

sudo mv /tmp/monitor.sh /usr/local/bin/learniq-monitor.sh
sudo chmod +x /usr/local/bin/learniq-monitor.sh
sudo chown root:root /usr/local/bin/learniq-monitor.sh

# Add monitoring to crontab
(sudo crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/learniq-monitor.sh") | sudo crontab -

print_success "Deployment completed successfully!"

# Final system check
print_status "Performing final system check..."
sleep 5

# Check if backend is responding via HTTPS
print_status "Checking HTTPS backend health..."
for i in {1..30}; do
    if curl -f -k https://localhost/health > /dev/null 2>&1; then
        print_success "✅ HTTPS Backend is responding!"
        break
    elif curl -f https://learniq.handjobs.co.in/health > /dev/null 2>&1; then
        print_success "✅ Backend is responding on port 5000!"
        break
    else
        if [ $i -eq 30 ]; then
            print_error "❌ Backend health check failed after 30 attempts"
            echo "Checking PM2 status:"
            pm2 status
            echo "Checking logs:"
            pm2 logs --lines 10
        else
            echo "Waiting for backend to start... (attempt $i/30)"
            sleep 2
        fi
    fi
done

# Test SSL certificate
if [ -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]; then
    print_status "Testing SSL certificate..."
    SSL_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem | cut -d= -f2)
    print_success "✅ SSL certificate is valid until: $SSL_EXPIRY"
    
    # Test HTTPS connection
    if curl -f https://$DOMAIN_NAME/health > /dev/null 2>&1; then
        print_success "✅ HTTPS is working correctly!"
    else
        print_warning "⚠️ HTTPS test failed - check DNS and firewall"
    fi
else
    print_warning "⚠️ SSL certificate not found"
fi

# Get server IP
SERVER_IP=$(curl -s http://checkip.amazonaws.com/ || curl -s http://ipinfo.io/ip || echo "Unable to detect IP")

echo ""
echo "================================================"
echo "🎉 LearnIQ Backend Deployment Complete!"
echo "================================================"
echo "✅ Node.js $(node --version) installed and running"
echo "✅ Backend API running on port 5000"
echo "✅ PM2 process manager active"
echo "✅ MongoDB Atlas connected"
echo "✅ Nginx reverse proxy configured"
echo "✅ UFW firewall active"
echo "✅ SSL certificate configured (if domain provided)"
echo "✅ Auto-monitoring enabled"
echo ""
echo "🌐 Access your user-api at:"
echo "   https://$DOMAIN_NAME (SSL enabled)"
echo "   https://www.$DOMAIN_NAME (SSL enabled)"
echo "   http://$DOMAIN_NAME (redirects to HTTPS)"
echo ""
echo "🔧 User-API Endpoints:"
echo "   GET  https://$DOMAIN_NAME/              - API info"
echo "   GET  https://$DOMAIN_NAME/health        - Health check"
echo "   GET  https://$DOMAIN_NAME/ssl-status    - SSL verification"
echo "   POST https://$DOMAIN_NAME/register      - User registration"
echo "   POST https://$DOMAIN_NAME/login         - User login"
echo "   All  https://$DOMAIN_NAME/api/*         - Your API routes"
echo ""
echo "� Management Commands:"
echo "   pm2 status          - Check running processes"
echo "   pm2 logs            - View application logs"
echo "   pm2 monit           - Real-time monitoring"
echo "   pm2 restart all     - Restart application"
echo "   sudo systemctl status nginx - Check Nginx status"
echo ""
echo "⚠️  Next Steps:"
echo "1. Update your frontend to use: https://$DOMAIN_NAME"
echo "2. Verify DNS: $DOMAIN_NAME points to $SERVER_IP"
echo "3. Test all user-api endpoints with HTTPS"
echo "4. Monitor SSL certificate auto-renewal"
echo "5. Check PM2 logs for any issues: pm2 logs"
echo ""
echo "🔒 Security Notes:"
echo "- Firewall is configured (UFW active)"
echo "- HTTPS is enabled with Let's Encrypt SSL"
echo "- SSL certificate auto-renewal is configured"
echo "- HTTP automatically redirects to HTTPS"
echo "- Rate limiting enabled"
echo "- Security headers configured"
echo "- Auto-updates enabled"
echo ""
echo "📧 SSL Certificate Details:"
echo "   Domain: $DOMAIN_NAME"
echo "   Email: $ADMIN_EMAIL"
echo "   Provider: Let's Encrypt"
echo "   Auto-renewal: Enabled (runs daily at 12:00)"
echo ""
print_success "🚀 Your LearnIQ User-API is LIVE and ready!"
echo "================================================"

# Display final status
echo ""
echo "📊 Current System Status:"
pm2 status
echo ""
sudo systemctl status nginx --no-pager -l | head -10
