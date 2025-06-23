#!/bin/bash

# SSL Diagnostic Script
echo "🔍 Diagnosing SSL Certificate Issues..."
echo "======================================"

DOMAIN="learniq.handjobs.co.in"

echo "1. Checking SSL Certificate Status:"
sudo certbot certificates

echo ""
echo "2. Checking if SSL certificate files exist:"
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "✅ SSL certificate directory exists"
    ls -la /etc/letsencrypt/live/$DOMAIN/
else
    echo "❌ SSL certificate directory NOT found"
fi

echo ""
echo "3. Checking Nginx configuration:"
sudo nginx -t

echo ""
echo "4. Checking active Nginx sites:"
ls -la /etc/nginx/sites-enabled/

echo ""
echo "5. Checking Nginx configuration for SSL:"
if [ -f "/etc/nginx/sites-enabled/learniq-backend" ]; then
    echo "Nginx config content:"
    sudo head -30 /etc/nginx/sites-enabled/learniq-backend
else
    echo "❌ Nginx site configuration not found"
fi

echo ""
echo "6. Testing connectivity:"
echo "HTTP test:"
curl -I https://learniq.handjobs.co.in/health 2>/dev/null && echo "✅ Local API works" || echo "❌ Local API failed"

echo "HTTP via domain:"
curl -I http://$DOMAIN/health 2>/dev/null && echo "✅ HTTP domain works" || echo "❌ HTTP domain failed"

echo "HTTPS via domain:"
curl -I https://$DOMAIN/health 2>/dev/null && echo "✅ HTTPS domain works" || echo "❌ HTTPS domain failed"

echo ""
echo "7. Checking DNS resolution:"
dig +short $DOMAIN

echo ""
echo "8. Checking server IP:"
curl -s http://checkip.amazonaws.com/ || curl -s http://ipinfo.io/ip || echo "Unable to detect IP"

echo ""
echo "9. Checking firewall status:"
sudo ufw status

echo ""
echo "10. Checking Nginx status:"
sudo systemctl status nginx --no-pager -l | head -20

echo ""
echo "11. Checking Nginx error logs:"
sudo tail -20 /var/log/nginx/error.log 2>/dev/null || echo "No nginx error log found"

echo ""
echo "🔍 Diagnosis complete!"
