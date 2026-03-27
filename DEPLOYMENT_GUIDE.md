# SEVA SMS - VPS Deployment Guide

## Production Domain
- **Main Domain**: https://sevadata.in
- **API Docs**: https://sevadata.in/api/docs
- **API Base URL**: https://sevadata.in/api

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04/22.04 LTS (recommended)
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: 20GB+ SSD
- **CPU**: 2 vCPUs minimum

### Software Requirements
- Python 3.10+
- Node.js 18+ & npm/yarn
- MongoDB 6.0+
- Nginx
- Git

---

## Step 1: Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential software-properties-common
```

---

## Step 2: Install MongoDB

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

---

## Step 3: Install Node.js 18+

```bash
# Install Node.js using NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install Yarn globally
sudo npm install -g yarn
```

---

## Step 4: Install Python 3.10+

```bash
# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Verify installation
python3 --version
pip3 --version
```

---

## Step 5: Create Application Directory

```bash
# Create directory for the app
sudo mkdir -p /var/www/seva-sms
sudo chown -R $USER:$USER /var/www/seva-sms

# Navigate to the directory
cd /var/www/seva-sms
```

---

## Step 6: Upload/Clone Application Code

### Option A: Using Git (if hosted on GitHub/GitLab)
```bash
git clone https://github.com/your-username/seva-sms.git .
```

### Option B: Using SCP (from local machine)
```bash
# Run this from your LOCAL machine
scp -r /path/to/seva-sms/* user@your-server-ip:/var/www/seva-sms/
```

### Option C: Using rsync (recommended for large files)
```bash
# Run this from your LOCAL machine
rsync -avz --progress /path/to/seva-sms/ user@your-server-ip:/var/www/seva-sms/
```

---

## Step 7: Configure Backend

```bash
cd /var/www/seva-sms/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install emergent integrations (for Object Storage)
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

### Create Backend Environment File

```bash
# Create .env file
cat > /var/www/seva-sms/backend/.env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=seva_sms
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EMERGENT_LLM_KEY=your-emergent-llm-key-for-object-storage
EOF
```

**Important:** Replace the following:
- `JWT_SECRET`: Generate a strong random string (32+ characters)
- `EMERGENT_LLM_KEY`: Your Emergent LLM key for Object Storage

---

## Step 8: Configure Frontend

```bash
cd /var/www/seva-sms/frontend

# Install dependencies
yarn install

# Create production environment file
cat > /var/www/seva-sms/frontend/.env << 'EOF'
REACT_APP_BACKEND_URL=https://sevadata.in
EOF
```

### Build Frontend for Production

```bash
yarn build
```

This creates a `build` directory with optimized production files.

---

## Step 9: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/seva-sms
```

### Nginx Configuration File

```nginx
server {
    listen 80;
    server_name sevadata.in www.sevadata.in;

    # Frontend (React build)
    location / {
        root /var/www/seva-sms/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        client_max_body_size 100M;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        root /var/www/seva-sms/frontend/build;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable the Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/seva-sms /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 10: Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate for sevadata.in
sudo certbot --nginx -d sevadata.in -d www.sevadata.in

# Auto-renewal is set up automatically
# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Step 11: Create Systemd Service for Backend

```bash
sudo nano /etc/systemd/system/seva-backend.service
```

### Service File Content

```ini
[Unit]
Description=SEVA SMS Backend API
After=network.target mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/seva-sms/backend
Environment="PATH=/var/www/seva-sms/backend/venv/bin"
ExecStart=/var/www/seva-sms/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Enable and Start the Service

```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/seva-sms

# Reload systemd
sudo systemctl daemon-reload

# Enable and start the backend service
sudo systemctl enable seva-backend
sudo systemctl start seva-backend

# Check status
sudo systemctl status seva-backend

# View logs if needed
sudo journalctl -u seva-backend -f
```

---

## Step 12: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 13: Initialize Database with Admin User

The application auto-creates an admin user on first start. Default credentials:
- **Email**: admin@seva.org
- **Password**: Admin@123

**⚠️ IMPORTANT**: Change the admin password immediately after first login!

---

## Directory Structure on VPS

```
/var/www/seva-sms/
├── backend/
│   ├── venv/              # Python virtual environment
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt
│   └── .env               # Backend environment variables
├── frontend/
│   ├── build/             # Production build (served by Nginx)
│   ├── src/
│   ├── package.json
│   └── .env               # Frontend environment variables
└── DEPLOYMENT_GUIDE.md
```

---

## Useful Commands

### Service Management
```bash
# Backend
sudo systemctl start seva-backend
sudo systemctl stop seva-backend
sudo systemctl restart seva-backend
sudo systemctl status seva-backend

# Nginx
sudo systemctl restart nginx
sudo nginx -t  # Test configuration

# MongoDB
sudo systemctl status mongod
```

### View Logs
```bash
# Backend logs
sudo journalctl -u seva-backend -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Update Application
```bash
cd /var/www/seva-sms

# Pull latest changes (if using Git)
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart seva-backend

# Update frontend
cd ../frontend
yarn install
yarn build
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
sudo journalctl -u seva-backend -n 50

# Test manually
cd /var/www/seva-sms/backend
source venv/bin/activate
python -c "import server"  # Check for import errors
```

### MongoDB connection issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Test connection
mongosh --eval "db.runCommand({ ping: 1 })"
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
sudo systemctl status seva-backend

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Permission issues
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/seva-sms

# Fix permissions
sudo chmod -R 755 /var/www/seva-sms
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Enable SSL/HTTPS with Let's Encrypt
- [ ] Configure UFW firewall
- [ ] Keep system packages updated
- [ ] Set up automated backups for MongoDB
- [ ] Consider MongoDB authentication for production

---

## MongoDB Backup (Recommended)

```bash
# Create backup directory
sudo mkdir -p /var/backups/mongodb

# Create backup script
sudo nano /usr/local/bin/backup-mongodb.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db seva_sms --out "$BACKUP_DIR/seva_sms_$DATE"
# Keep only last 7 days of backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-mongodb.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add line: 0 2 * * * /usr/local/bin/backup-mongodb.sh
```

---

## Support

For issues related to:
- **Emergent Object Storage**: Check your EMERGENT_LLM_KEY and balance at Emergent Platform
- **Application bugs**: Check backend logs with `sudo journalctl -u seva-backend -f`

**Production URLs**:
- Main Site: https://sevadata.in
- API Docs: https://sevadata.in/api/docs
- API Base: https://sevadata.in/api

**Default Credentials**: admin@seva.org / Admin@123
