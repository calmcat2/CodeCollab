# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY Frontend/package*.json ./
# CI is faster and more reliable than install
RUN npm ci
COPY Frontend/ .
# Ensure .env is set for build
RUN echo "VITE_API_BASE_URL=" > .env.production
RUN echo "VITE_WS_BASE_URL=" >> .env.production
RUN npm run build
# Prune dev dependencies
RUN npm prune --production

# Stage 2: Final Image
FROM python:3.11-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install Node.js (for y-websocket) & Nginx
# Combined update/install/clean to reduce layer size
RUN apt-get update && apt-get install -y nodejs npm nginx && rm -rf /var/lib/apt/lists/*

# Setup Directories
WORKDIR /app
RUN mkdir -p /app/frontend /app/backend /var/www/html

# Copy Frontend Build
COPY --from=frontend-build /app/frontend/dist /var/www/html

# Copy Backend Dependencies first (Caching)
WORKDIR /app/backend
COPY Backend/pyproject.toml Backend/uv.lock* ./
# Use uv for lightning-fast installs
RUN uv pip install --system -r pyproject.toml

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
