# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ .
# Ensure .env is set for build (though we want relative paths mostly)
RUN echo "VITE_API_BASE_URL=" > .env.production
RUN echo "VITE_WS_BASE_URL=" >> .env.production
RUN npm run build
# Prune dev dependencies to reduce image size (we only need y-websocket for runtime)
RUN npm prune --production

# Stage 2: Final Image
FROM python:3.11-slim

# Install Node.js (for y-websocket) & Nginx
RUN apt-get update && apt-get install -y nodejs npm nginx && rm -rf /var/lib/apt/lists/*

# Setup Directories
WORKDIR /app
RUN mkdir -p /app/frontend /app/backend /var/www/html

# Copy Frontend Build
COPY --from=frontend-build /app/frontend/dist /var/www/html

# Copy Backend
WORKDIR /app/backend
# Install dependencies explicitly for caching stability
RUN pip install "fastapi>=0.123.9" "uvicorn[standard]>=0.38.0" "pydantic>=2.12.5" "pydantic-settings>=2.12.0" "aiosqlite>=0.21.0" "asyncpg>=0.29.0" "python-multipart>=0.0.20" "websockets>=15.0.1"

COPY Backend/ .

# Setup Y-Websocket
# We need y-websocket package. We can just copy node_modules/y-websocket from build stage?
# Or install it afresh. Using build stage is cleaner if we did 'npm install' there.
# Let's verify if y-websocket is in dependencies of frontend. Yes.
COPY --from=frontend-build /app/frontend/node_modules /app/frontend/node_modules

# Nginx Config
COPY nginx.conf /etc/nginx/sites-available/default

# Start Script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Environment Variables
ENV PYTHONPATH=/app/backend
ENV PORT=80

EXPOSE 80

CMD ["/start.sh"]
