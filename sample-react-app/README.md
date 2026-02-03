# Sample React App

A simple React application for DevOps Learning Session practice.

## Your Task

**Create a Dockerfile for this application using multi-stage build!**

This application intentionally does NOT include a Dockerfile. Your task is to create one yourself.

## Application Features

- React 18 with Vite
- API integration with sample-node-api
- Health status display
- Redis counter functionality
- User management interface
- Modern responsive UI

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

## Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | http://localhost:3000 | Backend API URL |

## Dockerfile Task (Multi-Stage Build)

Create a `Dockerfile` with **two stages**:

### Stage 1: Build Stage
- Use `node:18-alpine` as base
- Set working directory
- Copy package files and install dependencies
- Copy source code
- Run `npm run build`

### Stage 2: Production Stage
- Use `nginx:alpine` as base
- Copy built files from Stage 1 to Nginx html directory
- Expose port 80
- Start Nginx

### Hints

```dockerfile
# ============ Stage 1: Build ============
FROM ??? AS builder
WORKDIR ???
COPY ??? ???
RUN ???
COPY ???
RUN ???

# ============ Stage 2: Production ============
FROM ???
COPY --from=builder ??? ???
EXPOSE ???
CMD ???
```

### Key Points

1. **Build output location:** `/app/dist`
2. **Nginx html directory:** `/usr/share/nginx/html`
3. **Multi-stage benefit:** Final image only contains built static files, not node_modules

## Testing Your Dockerfile

```bash
# Build image
docker build -t my-react-app .

# Run container
docker run -d --name my-frontend -p 8080:80 my-react-app

# Test
curl http://localhost:8080

# Or open in browser
open http://localhost:8080

# Stop and remove
docker stop my-frontend && docker rm my-frontend
```

## Connecting to Backend API

### Option 1: Using Environment Variable at Build Time

```bash
# Build with custom API URL
docker build \
  --build-arg VITE_API_URL=http://api.example.com \
  -t my-react-app .
```

For this, modify your Dockerfile to accept build arg:
```dockerfile
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
```

### Option 2: Run Both on Same Network

```bash
# Create network
docker network create app-network

# Run API
docker run -d --network app-network --name api -p 3000:3000 my-node-api

# Run Frontend
docker run -d --network app-network --name frontend -p 8080:80 my-react-app
```

## Image Size Comparison

After creating your Dockerfile, compare sizes:

```bash
# Check your image size
docker images my-react-app

# Compare with development image (if you created one)
# Multi-stage build should result in ~20-30MB image
# Non-optimized could be 500MB+
```

## Advanced: Custom Nginx Configuration

For production, you might want custom Nginx config for:
- SPA routing (handle client-side routes)
- Gzip compression
- Caching headers

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing - redirect all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

Then in Dockerfile:
```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Good luck!
