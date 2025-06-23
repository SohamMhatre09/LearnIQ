#!/bin/bash

# Complete Fix Script - Backend + SSL
echo "🔧 Complete Fix: Backend + SSL..."
echo "================================="

DOMAIN="learniq.handjobs.co.in"
APP_NAME="learniq-backend"
ADMIN_EMAIL="ichbinsoham@gmail.com"

echo "1. Checking and starting backend (PM2)..."
cd /home/ubuntu/learniq-backend || {
    echo "❌ Deployment directory not found"
    exit 1
}

# Check PM2 status
pm2 status

# Restart PM2 if needed
if ! pm2 list | grep -q "online"; then
    echo "Starting PM2 processes..."
    if [ -f "ecosystem.config.cjs" ]; then
        pm2 start ecosystem.config.cjs --env production
    elif [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --env production
    else
        echo "No PM2 config found, starting directly..."
        pm2 start index.js --name learniq-api
    fi
    pm2 save
fi

# Wait for backend to start
echo "2. Waiting for backend to be ready..."
sleep 5

# Test backend
if curl -f https://learniq.handjobs.co.in/health > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend still not responding, checking logs..."
    pm2 logs --lines 20
    echo "Trying to restart backend..."
    pm2 restart all
    sleep 5
    if curl -f https://learniq.handjobs.co.in/health > /dev/null 2>&1; then
        echo "✅ Backend is now responding after restart"
    else
        echo "❌ Backend still failing, please check manually"
        exit 1
    fi
fi

echo "3. Stopping Nginx for SSL setup..."
sudo systemctl stop nginx

echo "4. Creating Nginx configuration for HTTP first..."
sudo tee /etc/nginx/sites-available/$APP_NAME << 'NGINX_EOF'
# HTTP server for Let's Encrypt challenges and backend proxy
server {
    listen 80;
    server_name learniq.handjobs.co.in www.learniq.handjobs.co.in;

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Proxy to backend
    location / {
        proxy_pass https://learniq.handjobs.co.in;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto http;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Health check endpoint
    location /health {
        proxy_pass https://learniq.handjobs.co.in/health;
        access_log off;
    }
}
NGINX_EOF

echo "5. Enabling the site and starting Nginx..."
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration failed"
    exit 1
fi

# Ensure webroot exists
sudo mkdir -p /var/www/html/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/html

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

echo "6. Testing HTTP access..."
sleep 3

# Test local backend
if curl -f https://learniq.handjobs.co.in/health > /dev/null 2>&1; then
    echo "✅ Local backend responding"
else
    echo "❌ Local backend not responding"
    pm2 status
    pm2 logs --lines 10
fi

# Test domain HTTP
if curl -f http://$DOMAIN/health > /dev/null 2>&1; then
    echo "✅ HTTP domain access works"
else
    echo "⚠️ HTTP domain access failed, but continuing with SSL..."
    # Check what might be wrong
    sudo systemctl status nginx --no-pager -l | head -10
fi

echo "7. Obtaining SSL certificate from Let's Encrypt..."
sudo certbot --nginx \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $ADMIN_EMAIL \
    --redirect \
    --expand

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    echo "8. Setting up auto-renewal..."
    echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx" | sudo crontab -
    
    echo "9. Testing HTTPS..."
    sleep 5
    if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
        echo "✅ HTTPS is working correctly!"
    else
        echo "⚠️ HTTPS test failed - checking certificate..."
        sudo certbot certificates
    fi
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Checking DNS and connectivity..."
    
    # Check DNS
    SERVER_IP=$(curl -s http://checkip.amazonaws.com/ || curl -s http://ipinfo.io/ip || echo "Unknown")
    DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
    echo "Server IP: $SERVER_IP"
    echo "Domain IP: $DOMAIN_IP"
    
    if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
        echo "❌ DNS mismatch! Update your DNS to point $DOMAIN to $SERVER_IP"
    fi
fi

echo ""
echo "🔧 Fix completed!"
echo "================="
echo "Status check:"
echo ""

# Final status
echo "PM2 Status:"
pm2 status

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l | head -5

echo ""
echo "SSL Certificates:"
sudo certbot certificates

echo ""
echo "Test URLs:"
echo "  HTTP:  http://$DOMAIN/health"
echo "  HTTPS: https://$DOMAIN/health"
echo ""

# Quick tests
echo "Quick connectivity tests:"
curl -I https://learniq.handjobs.co.in/health 2>/dev/null && echo "✅ Local backend OK" || echo "❌ Local backend failed"
curl -I http://$DOMAIN/health 2>/dev/null && echo "✅ HTTP domain OK" || echo "❌ HTTP domain failed"
curl -I https://$DOMAIN/health 2>/dev/null && echo "✅ HTTPS domain OK" || echo "❌ HTTPS domain failed"
