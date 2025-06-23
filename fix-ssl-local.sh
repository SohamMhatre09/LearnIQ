#!/bin/bash

# Local SSL Fix Script (no SSH required)
echo "🔧 Fixing SSL Certificate Issues Locally..."
echo "=========================================="

DOMAIN="learniq.handjobs.co.in"
APP_NAME="learniq-backend"
ADMIN_EMAIL="ichbinsoham@gmail.com"

echo "1. Checking current directory and moving to deployment folder..."
cd /home/ubuntu/learniq-backend || {
    echo "❌ Deployment directory not found"
    exit 1
}

echo "2. Stopping Nginx to clear any issues..."
sudo systemctl stop nginx

echo "3. Removing any existing SSL certificates for clean setup..."
sudo certbot delete --cert-name $DOMAIN 2>/dev/null || echo "No existing certificate to delete"

echo "4. Ensuring webroot directory exists..."
sudo mkdir -p /var/www/html/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/html

echo "5. Creating fresh Nginx configuration..."
sudo tee /etc/nginx/sites-available/$APP_NAME << EOF
# HTTP server for Let's Encrypt challenges and redirects
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy to backend for HTTP access (temporary)
    location / {
        proxy_pass https://learniq.handjobs.co.in;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto http;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

echo "6. Enabling the site and starting Nginx..."
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo "❌ Nginx configuration failed"
    exit 1
fi

echo "7. Testing HTTP access..."
sleep 3
if curl -f https://learniq.handjobs.co.in/health > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is not responding"
    exit 1
fi

echo "8. Checking DNS resolution..."
SERVER_IP=$(curl -s http://checkip.amazonaws.com/ || curl -s http://ipinfo.io/ip || echo "Unable to detect IP")
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

echo "Server IP: $SERVER_IP"
echo "Domain IP: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️ WARNING: Domain doesn't point to this server"
    echo "Please update your DNS records to point $DOMAIN to $SERVER_IP"
    echo "Continuing anyway..."
fi

echo "9. Testing HTTP domain access..."
if curl -f http://$DOMAIN/health > /dev/null 2>&1; then
    echo "✅ HTTP domain access works"
else
    echo "❌ HTTP domain access failed"
    echo "Checking what might be wrong..."
    sudo systemctl status nginx --no-pager -l | head -10
fi

echo "10. Obtaining SSL certificate from Let's Encrypt..."
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
    
    echo "11. Setting up auto-renewal..."
    echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx" | sudo crontab -
    
    echo "12. Testing renewal..."
    sudo certbot renew --dry-run
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate auto-renewal is working"
    else
        echo "⚠️ SSL certificate auto-renewal test failed"
    fi
    
    echo "13. Testing HTTPS..."
    sleep 5
    if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
        echo "✅ HTTPS is working correctly!"
    else
        echo "⚠️ HTTPS test failed - might need a few minutes to propagate"
    fi
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Common causes:"
    echo "1. Domain doesn't point to this server"
    echo "2. Firewall blocking port 80/443"
    echo "3. Another service using port 80/443"
    
    echo "14. Checking what's using port 80..."
    sudo netstat -tulpn | grep :80
    
    echo "15. Checking firewall..."
    sudo ufw status
fi

echo ""
echo "🔧 SSL fix completed!"
echo "Test your site:"
echo "  HTTP:  http://$DOMAIN/health"
echo "  HTTPS: https://$DOMAIN/health"
echo ""
echo "Current status:"
pm2 status
sudo systemctl status nginx --no-pager -l | head -5
