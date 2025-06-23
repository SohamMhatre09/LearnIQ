# AWS Deployment Guide for LearnIQ

## Quick Deployment

1. **Upload your code to AWS EC2 instance:**
   ```bash
   scp -r ./LearnIQ ubuntu@your-ec2-ip:/home/ubuntu/
   ```

2. **SSH into your EC2 instance:**
   ```bash
   ssh ubuntu@your-ec2-ip
   ```

3. **Make the deployment script executable and run it:**
   ```bash
   cd /home/ubuntu/LearnIQ
   chmod +x deploy-aws.sh
   sudo ./deploy-aws.sh
   ```

## Prerequisites

### AWS EC2 Instance
- **Instance Type**: t3.medium or larger (minimum 2GB RAM)
- **Operating System**: Ubuntu 20.04 LTS or Ubuntu 22.04 LTS
- **Security Group**: Allow inbound traffic on ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 5000 (API)
- **Storage**: At least 20GB EBS volume

### DNS Configuration
- Point your domain's A record to your EC2 instance's public IP
- If using a subdomain, create appropriate CNAME records

## What the Deployment Script Does

1. **System Setup**:
   - Updates Ubuntu packages
   - Installs Node.js 20.x
   - Installs MongoDB 7.0
   - Installs Nginx
   - Installs PM2 (Process Manager)

2. **Security Configuration**:
   - Configures UFW firewall
   - Sets up security headers in Nginx
   - Generates secure JWT secret
   - Enables rate limiting

3. **Application Setup**:
   - Creates application directory structure
   - Installs dependencies
   - Builds the React frontend
   - Configures environment variables

4. **Process Management**:
   - Sets up PM2 for Node.js process management
   - Configures auto-restart on server reboot
   - Sets up log rotation

5. **Reverse Proxy**:
   - Configures Nginx to serve frontend and proxy API requests
   - Sets up compression and caching
   - Configures health checks

6. **Monitoring & Backup**:
   - Creates monitoring scripts
   - Sets up automated backups
   - Configures log rotation

## Post-Deployment Steps

### 1. Update Environment Variables
Edit `/var/www/learniq/user-api/.env` and update:
```bash
# Add your actual API keys
GOOGLE_AI_API_KEY=your_actual_google_ai_key
OPENAI_API_KEY=your_actual_openai_key

# Update domain if needed
ALLOWED_ORIGINS=https://yourdomain.com
```

### 2. Enable SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Run PM2 Startup Command
After deployment, PM2 will display a command like:
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```
Run this command to enable auto-start on boot.

### 4. Test Your Application
- Frontend: `http://yourdomain.com`
- API Health: `http://yourdomain.com/api/health`
- API Docs: `http://yourdomain.com/api/docs` (if available)

## Useful Commands

### Application Management
```bash
# View application status
pm2 status

# View logs
pm2 logs learniq-api

# Restart application
pm2 restart learniq-api

# Stop application
pm2 stop learniq-api

# Reload application (zero-downtime)
pm2 reload learniq-api
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo nginx -s reload

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### MongoDB Management
```bash
# Check status
sudo systemctl status mongod

# Start/stop/restart
sudo systemctl start mongod
sudo systemctl stop mongod
sudo systemctl restart mongod

# Connect to MongoDB shell
mongosh

# View database
mongosh --eval "show dbs"
```

### System Monitoring
```bash
# Run monitoring script
/var/www/learniq/monitor.sh

# Check system resources
htop
df -h
free -m

# View system logs
sudo journalctl -u nginx -f
sudo journalctl -u mongod -f
```

## Troubleshooting

### Common Issues

1. **Application won't start**:
   ```bash
   # Check PM2 logs
   pm2 logs learniq-api
   
   # Check if all dependencies are installed
   cd /var/www/learniq/user-api && npm install
   ```

2. **502 Bad Gateway**:
   ```bash
   # Check if API is running
   pm2 status
   
   # Check Nginx configuration
   sudo nginx -t
   
   # Check API is listening on port 5000
   sudo netstat -tlnp | grep 5000
   ```

3. **Database connection issues**:
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check MongoDB logs
   sudo tail -f /var/log/mongodb/mongod.log
   
   # Test connection
   mongosh mongodb://localhost:27017/learniq_production
   ```

4. **Permission issues**:
   ```bash
   # Fix ownership
   sudo chown -R ubuntu:ubuntu /var/www/learniq
   
   # Fix permissions
   chmod -R 755 /var/www/learniq
   ```

### Performance Optimization

1. **Enable compression in Nginx** (already configured in script)
2. **Configure PM2 cluster mode** (already configured in script)
3. **Set up MongoDB indexes** (add to your application)
4. **Enable caching** (already configured for static files)

### Security Best Practices

1. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Monitor failed login attempts**:
   ```bash
   sudo tail -f /var/log/auth.log
   ```

3. **Use strong passwords and SSH keys**
4. **Regularly backup your data**:
   ```bash
   /usr/local/bin/backup-learniq.sh
   ```

## Scaling Considerations

For high-traffic applications, consider:

1. **Load Balancer**: Use AWS Application Load Balancer
2. **Database**: Use MongoDB Atlas or AWS DocumentDB
3. **CDN**: Use AWS CloudFront for static assets
4. **Auto Scaling**: Use AWS Auto Scaling Groups
5. **Monitoring**: Use AWS CloudWatch or DataDog

## Support

If you encounter issues:
1. Check the logs using the commands above
2. Verify all services are running
3. Check security group settings
4. Ensure DNS is properly configured
