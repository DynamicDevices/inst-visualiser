# Deployment Guide

This guide covers various deployment options for the INST Tag Visualizer, from simple static hosting to enterprise deployments.

## 🚀 Quick Deployment Options

### GitHub Pages (Recommended for Testing)
**Pros**: Free, automatic SSL, easy setup
**Cons**: Public repositories only (unless GitHub Pro)

1. **Enable GitHub Pages**:
   ```bash
   # In your repository settings
   Settings → Pages → Source: "Deploy from a branch"
   Branch: main / (root)
   ```

2. **Access your site**:
   - URL: `https://yourusername.github.io/inst-visualiser/`
   - Updates automatically on push to main branch
   - Custom domain support available

3. **Optional: Custom Domain**:
   ```bash
   # Add CNAME file to repository root
   echo "visualizer.yourdomain.com" > CNAME
   git add CNAME && git commit -m "Add custom domain"
   ```

### Netlify (Great for Continuous Deployment)
**Pros**: Automatic deployments, form handling, edge functions
**Cons**: Bandwidth limits on free tier

1. **Connect Repository**:
   - Visit [netlify.com](https://netlify.com)
   - "New site from Git" → Connect your repository
   - Build command: `npm run build` (or leave empty for static)
   - Publish directory: `/` (root)

2. **Custom Domain**:
   ```bash
   # In Netlify dashboard
   Domain settings → Add custom domain → Configure DNS
   ```

3. **Environment Variables**:
   ```bash
   # For different MQTT brokers per environment
   Site settings → Environment variables
   MQTT_BROKER_URL=wss://prod-broker.com:8083
   ```

### Vercel (Serverless-First Platform)
**Pros**: Excellent performance, automatic SSL, global CDN
**Cons**: Focused on JavaScript frameworks

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
vercel

# Production deployment
vercel --prod
```

## 🐳 Docker Deployment

### Simple Docker Setup
```dockerfile
# Dockerfile
FROM nginx:alpine

# Copy files
COPY . /usr/share/nginx/html

# Custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Enable gzip compression
        gzip on;
        gzip_types text/css application/javascript application/json;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Main app
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### Build and Run Docker
```bash
# Build image
docker build -t inst-visualiser .

# Run container
docker run -d \
  --name visualizer \
  -p 8080:80 \
  inst-visualiser

# Access at http://localhost:8080
```

### Docker Compose with MQTT Broker
```yaml
# docker-compose.yml
version: '3.8'

services:
  visualizer:
    build: .
    ports:
      - "8080:80"
    depends_on:
      - mqtt-broker

  mqtt-broker:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
      - "8083:8083"  # WebSocket port
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
      - ./certs:/mosquitto/certs
    restart: unless-stopped

volumes:
  mqtt-data:
```

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f
```

## ☁️ Cloud Platform Deployments

### AWS S3 + CloudFront
**Best for**: High-traffic production deployments

1. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://inst-visualiser-prod
   aws s3 website s3://inst-visualiser-prod \
     --index-document index.html \
     --error-document index.html
   ```

2. **Upload Files**:
   ```bash
   aws s3 sync . s3://inst-visualiser-prod \
     --exclude ".*" \
     --exclude "node_modules/*" \
     --exclude "docs/*"
   ```

3. **CloudFront Distribution**:
   ```json
   {
     "Origins": [{
       "DomainName": "inst-visualiser-prod.s3.amazonaws.com",
       "Id": "S3-inst-visualiser",
       "S3OriginConfig": {
         "OriginAccessIdentity": ""
       }
     }],
     "DefaultCacheBehavior": {
       "TargetOriginId": "S3-inst-visualiser",
       "ViewerProtocolPolicy": "redirect-to-https",
       "CachePolicyId": "managed-caching-optimized"
     },
     "Enabled": true,
     "PriceClass": "PriceClass_100"
   }
   ```

### Google Cloud Storage + CDN
```bash
# Create bucket
gsutil mb gs://inst-visualiser

# Upload files
gsutil -m cp -r . gs://inst-visualiser

# Make public
gsutil iam ch allUsers:objectViewer gs://inst-visualiser

# Enable website hosting
gsutil web set -m index.html -e index.html gs://inst-visualiser
```

### Azure Static Web Apps
```yaml
# .github/workflows/azure-static-web-apps.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [ main ]

jobs:
  build_and_deploy_job:
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
    - uses: actions/checkout@v3
      with:
        submodules: true
    - name: Build And Deploy
      id: builddeploy
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "/"
        output_location: "/"
```

## 🔒 SSL/HTTPS Setup

### Let's Encrypt with Nginx
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d visualizer.yourdomain.com

# Auto-renewal (add to crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration for Production
```nginx
server {
    listen 443 ssl http2;
    server_name visualizer.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/visualizer.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/visualizer.yourdomain.com/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    root /var/www/inst-visualiser;
    index index.html;
    
    # Enable compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss application/json;
    
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name visualizer.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🔧 Environment Configuration

### Production Settings
```javascript
// config/production.js
const config = {
    mqtt: {
        defaultBroker: 'wss://mqtt.yourdomain.com:8083',
        defaultTopic: 'uwb/production',
        reconnectInterval: 5000,
        maxReconnectAttempts: 10
    },
    ui: {
        enableConsole: false,
        defaultScale: 5,
        animationDuration: 1000
    },
    performance: {
        maxNodes: 50,
        maxConnections: 200,
        fastMessageThreshold: 1000
    }
};
```

### Development vs Production
```javascript
// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

const config = isDevelopment ? {
    mqtt: {
        defaultBroker: 'ws://localhost:8080',
        defaultTopic: 'test/uwb'
    },
    ui: {
        enableConsole: true,
        showDebugInfo: true
    }
} : {
    mqtt: {
        defaultBroker: 'wss://mqtt.production.com:8083',
        defaultTopic: 'uwb/live'
    },
    ui: {
        enableConsole: false,
        showDebugInfo: false
    }
};
```

## 📊 Monitoring & Analytics

### Performance Monitoring
```javascript
// Add to index.html head
<script>
// Performance monitoring
window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    
    // Log performance metrics
    console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart);
    console.log('DOM Ready:', perfData.domContentLoadedEventEnd - perfData.loadEventStart);
    
    // Send to analytics if needed
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_load_time', {
            value: Math.round(perfData.loadEventEnd - perfData.loadEventStart)
        });
    }
});
</script>
```

### Error Tracking
```javascript
// Error tracking
window.addEventListener('error', (e) => {
    const errorData = {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
    };
    
    // Send to error tracking service
    fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
    }).catch(() => {
        // Fallback: log to console
        console.error('Failed to report error:', errorData);
    });
});
```

## 🚀 Performance Optimization

### Build Optimization
```json
{
  "scripts": {
    "build": "npm run minify-css && npm run minify-js",
    "minify-css": "cleancss -o dist/css/styles.min.css css/styles.css",
    "minify-js": "terser js/visualizer.js -o dist/js/visualizer.min.js -c -m",
    "optimize-images": "imagemin images/* --out-dir=dist/images"
  }
}
```

### CDN Integration
```html
<!-- Use CDN for external dependencies -->
<script src="https://cdn.jsdelivr.net/npm/paho-mqtt@1.0.1/paho-mqtt.min.js"></script>

<!-- Preload critical resources -->
<link rel="preload" href="css/styles.css" as="style">
<link rel="preload" href="js/visualizer.js" as="script">

<!-- DNS prefetch for MQTT broker -->
<link rel="dns-prefetch" href="//mqtt.yourdomain.com">
```

### Service Worker for Offline Support
```javascript
// sw.js
const CACHE_NAME = 'inst-visualiser-v1.4.0';
const urlsToCache = [
    '/',
    '/css/styles.css',
    '/js/visualizer.js',
    'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});
```

## 🔍 Health Checks & Monitoring

### Health Check Endpoint
```javascript
// Add to visualizer.js
window.healthCheck = {
    status: 'healthy',
    version: '1.4.0',
    uptime: Date.now(),
    
    getStatus() {
        return {
            status: this.status,
            version: this.version,
            uptime: Date.now() - this.uptime,
            mqtt: {
                connected: state.isConnected,
                messagesReceived: state.messagesReceived,
                lastMessage: state.lastMessageTime
            },
            visualization: {
                nodes: state.nodes.size,
                connections: state.currentDistances.size,
                isAnimating: state.isLayoutAnimating
            }
        };
    }
};

// Expose health endpoint
if (window.location.pathname === '/health') {
    document.body.innerHTML = `<pre>${JSON.stringify(window.healthCheck.getStatus(), null, 2)}</pre>`;
}
```

### Uptime Monitoring
```bash
# Add to monitoring system (e.g., Pingdom, UptimeRobot)
curl -f https://visualizer.yourdomain.com/health || exit 1
```

## 🔐 Security Checklist

### Pre-Deployment Security
- [ ] HTTPS enabled with valid certificate
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] No sensitive data in client-side code
- [ ] MQTT broker authentication configured
- [ ] CORS properly configured for MQTT connections
- [ ] Error messages don't expose sensitive information
- [ ] Input validation for all user inputs
- [ ] Rate limiting on MQTT connections

### Security Headers Example
```nginx
# Complete security headers
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; connect-src 'self' wss://mqtt.yourdomain.com:8083; img-src 'self' data:; font-src 'self'";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] Test with sample MQTT data
- [ ] Verify all features work in production build
- [ ] Check browser compatibility
- [ ] Validate responsive design on mobile
- [ ] Review security headers and HTTPS setup
- [ ] Configure monitoring and error tracking
- [ ] Set up backup and recovery procedures
- [ ] Document configuration for team

### Post-Deployment
- [ ] Verify SSL certificate and security headers
- [ ] Test MQTT connectivity from production URL
- [ ] Monitor performance and error rates
- [ ] Check analytics and user tracking
- [ ] Verify CDN and caching behavior
- [ ] Test offline functionality (if enabled)
- [ ] Update documentation with production URLs
- [ ] Notify stakeholders of deployment

### Maintenance
- [ ] Regular security updates
- [ ] SSL certificate renewal
- [ ] Performance monitoring reviews
- [ ] Backup verification
- [ ] Dependency updates
- [ ] Log rotation and cleanup
- [ ] Capacity planning reviews

---

Need help with deployment? Check our [troubleshooting guide](TROUBLESHOOTING.md) or [open an issue](https://github.com/yourusername/inst-visualiser/issues).
