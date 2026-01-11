# Biometric Wallet - Deployment & Setup Guide

## System Requirements

### Minimum Requirements
- Node.js 18+ (v22.13.0 recommended)
- MySQL 8.0+ or TiDB compatible database
- 2GB RAM minimum
- 10GB storage minimum
- Linux/macOS/Windows with Docker support

### Recommended Requirements
- Node.js 22.13.0 LTS
- MySQL 8.0.33+
- 4GB+ RAM
- 50GB+ SSD storage
- Ubuntu 22.04 LTS or similar

## Pre-Deployment Setup

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/biometric_wallet

# Authentication
JWT_SECRET=your-secure-jwt-secret-key-here
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id

# Application
VITE_APP_TITLE=Biometric Wallet
VITE_APP_LOGO=https://your-domain.com/logo.png
NODE_ENV=production

# API Keys
BUILT_IN_FORGE_API_KEY=your-forge-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@biometricwallet.com

# Cryptocurrency APIs
BLOCKCYPHER_API_KEY=your-blockcypher-api-key
BLOCKCHAIN_API_KEY=your-blockchain-api-key

# Application Settings
OWNER_NAME=Admin User
OWNER_OPEN_ID=admin-open-id
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### 2. Database Setup

#### Using MySQL

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE biometric_wallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create user
mysql -u root -p -e "CREATE USER 'wallet_user'@'localhost' IDENTIFIED BY 'secure_password';"

# Grant privileges
mysql -u root -p -e "GRANT ALL PRIVILEGES ON biometric_wallet.* TO 'wallet_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

#### Using Docker

```bash
docker run -d \
  --name biometric-wallet-db \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=biometric_wallet \
  -e MYSQL_USER=wallet_user \
  -e MYSQL_PASSWORD=secure_password \
  -p 3306:3306 \
  mysql:8.0
```

### 3. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Setup database schema
pnpm db:push
```

## Development Deployment

### Local Development

```bash
# Start development server
pnpm dev

# Server runs on http://localhost:3000
# Frontend accessible at http://localhost:3000
```

### Development Database

The development environment uses SQLite by default. To use MySQL:

```bash
# Update DATABASE_URL in .env
DATABASE_URL=mysql://wallet_user:secure_password@localhost:3306/biometric_wallet

# Push schema
pnpm db:push
```

## Production Deployment

### 1. Build Application

```bash
# Build frontend and backend
pnpm build

# Output in dist/ directory
```

### 2. Environment Configuration

Ensure all environment variables are set in production:

```bash
# Verify critical variables
echo $DATABASE_URL
echo $JWT_SECRET
echo $OAUTH_SERVER_URL
```

### 3. Database Migrations

```bash
# Run migrations
pnpm db:push

# Verify schema
mysql -u wallet_user -p biometric_wallet -e "SHOW TABLES;"
```

### 4. Start Production Server

```bash
# Start application
pnpm start

# Server runs on http://0.0.0.0:3000
```

### 5. Process Management

Use PM2 or similar for process management:

```bash
# Install PM2
npm install -g pm2

# Create PM2 config (ecosystem.config.js)
module.exports = {
  apps: [{
    name: 'biometric-wallet',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

## Docker Deployment

### Build Docker Image

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN pnpm install --prod

COPY dist ./dist
COPY drizzle ./drizzle

EXPOSE 3000

CMD ["node", "dist/index.js"]
EOF

# Build image
docker build -t biometric-wallet:latest .

# Run container
docker run -d \
  --name biometric-wallet \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://user:pass@db:3306/biometric_wallet \
  -e JWT_SECRET=your-secret \
  --link biometric-wallet-db:db \
  biometric-wallet:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://wallet_user:secure_password@db:3306/biometric_wallet
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: biometric_wallet
      MYSQL_USER: wallet_user
      MYSQL_PASSWORD: secure_password
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  db_data:
```

## SSL/TLS Configuration

### Using Let's Encrypt with Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name biometricwallet.com;

    ssl_certificate /etc/letsencrypt/live/biometricwallet.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/biometricwallet.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name biometricwallet.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring & Logging

### Application Logs

```bash
# View logs with PM2
pm2 logs biometric-wallet

# Or with Docker
docker logs -f biometric-wallet
```

### Database Monitoring

```bash
# Monitor MySQL
mysql -u wallet_user -p biometric_wallet -e "SHOW PROCESSLIST;"

# Check database size
mysql -u wallet_user -p -e "SELECT table_schema, ROUND(SUM(data_length+index_length)/1024/1024,2) FROM information_schema.tables GROUP BY table_schema;"
```

### System Monitoring

```bash
# CPU and Memory
top -b -n 1 | head -20

# Disk usage
df -h

# Network
netstat -tuln | grep 3000
```

## Backup & Recovery

### Database Backup

```bash
# Full backup
mysqldump -u wallet_user -p biometric_wallet > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup
0 2 * * * mysqldump -u wallet_user -p biometric_wallet > /backups/wallet_$(date +\%Y\%m\%d).sql
```

### Database Restore

```bash
# Restore from backup
mysql -u wallet_user -p biometric_wallet < backup_20240106_120000.sql
```

## Performance Optimization

### Database Optimization

```sql
-- Analyze tables
ANALYZE TABLE users, wallets, transactions, fingerprints;

-- Optimize tables
OPTIMIZE TABLE users, wallets, transactions, fingerprints;

-- Check indexes
SHOW INDEX FROM wallets;
```

### Application Optimization

1. **Enable Caching**: Configure Redis for session and query caching
2. **Compression**: Enable gzip compression in Nginx
3. **CDN**: Use CDN for static assets
4. **Database Indexing**: Ensure proper indexes on frequently queried columns

## Security Hardening

### 1. Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Database Security

```bash
# Change default MySQL password
mysql -u root -p -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'strong_password';"

# Remove anonymous users
mysql -u root -p -e "DELETE FROM mysql.user WHERE User='';"

# Disable remote root login
mysql -u root -p -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
```

### 3. Application Security

- Keep dependencies updated: `pnpm update`
- Use environment variables for secrets
- Enable HTTPS/TLS
- Implement rate limiting
- Enable CORS properly
- Use security headers

### 4. Regular Audits

```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies
pnpm update
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
mysql -u wallet_user -p -h localhost biometric_wallet -e "SELECT 1;"

# Check MySQL service
systemctl status mysql

# Restart MySQL
systemctl restart mysql
```

### Application Won't Start

```bash
# Check logs
pm2 logs biometric-wallet

# Verify environment variables
env | grep DATABASE_URL

# Check port availability
lsof -i :3000
```

### High Memory Usage

```bash
# Check Node.js process
ps aux | grep node

# Restart application
pm2 restart biometric-wallet

# Check for memory leaks
node --inspect dist/index.js
```

## Support & Resources

- Documentation: https://docs.biometricwallet.com
- GitHub: https://github.com/biometric-wallet
- Support Email: support@biometricwallet.com
- Status Page: https://status.biometricwallet.com

## Version History

- v1.0.0 (2026-01-06): Initial release
  - Biometric authentication
  - Multi-currency wallet support
  - Cryptocurrency integration
  - Transaction management
  - Admin panel
  - Email notifications
