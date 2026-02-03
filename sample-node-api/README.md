# Sample Node.js API

A simple REST API for DevOps Learning Session practice.

## Your Task

**Create a Dockerfile for this application!**

This application intentionally does NOT include a Dockerfile. Your task is to create one yourself.

## Application Features

- Express.js REST API
- Health check endpoint
- User CRUD operations (in-memory)
- Redis integration (optional)
- File-based logging
- Request logging middleware

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message and endpoint list |
| GET | `/health` | Health check |
| GET | `/info` | Server information |
| GET | `/users` | List all users |
| POST | `/users` | Create a new user |
| GET | `/users/:id` | Get specific user |
| GET | `/counter` | Get counter value (Redis) |
| POST | `/counter/increment` | Increment counter (Redis) |
| GET | `/logs` | View recent application logs |

## Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# The API will be available at http://localhost:3000
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |

## Dockerfile Task

Create a `Dockerfile` with the following requirements:

1. **Base Image:** Use `node:18-alpine`
2. **Working Directory:** Set to `/app`
3. **Dependencies:** Copy `package*.json` and run `npm install`
4. **Source Code:** Copy all application files
5. **Port:** Expose port 3000
6. **Command:** Start the application with `node server.js`

### Hints

```dockerfile
# Start with base image
FROM ???

# Set working directory
WORKDIR ???

# Copy package files first (for better caching)
COPY ??? ???

# Install dependencies
RUN ???

# Copy source code
COPY ???

# Expose port
EXPOSE ???

# Start command
CMD ???
```

## Testing Your Dockerfile

```bash
# Build image
docker build -t my-node-api .

# Run container
docker run -d --name my-api -p 3000:3000 my-node-api

# Test
curl http://localhost:3000/health

# View logs
docker logs my-api

# Stop and remove
docker stop my-api && docker rm my-api
```

## Data Persistence Challenge

After creating the basic Dockerfile, try:

1. Run with volume mount for logs:
   ```bash
   docker run -d --name my-api \
     -p 3000:3000 \
     -v $(pwd)/logs:/app/logs \
     my-node-api
   ```

2. Connect to Redis container:
   ```bash
   # Create network
   docker network create app-net

   # Run Redis
   docker run -d --network app-net --name redis redis:alpine

   # Run API with Redis connection
   docker run -d --network app-net --name my-api \
     -p 3000:3000 \
     -e REDIS_HOST=redis \
     my-node-api
   ```

Good luck!
