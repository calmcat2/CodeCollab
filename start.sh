#!/bin/bash

# Configure Nginx Port (Render sets $PORT, default to 80)
PORT="${PORT:-80}"
sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/sites-available/default

# Start Nginx
service nginx start

# Start Y-Websocket Server (Node)
# Assuming y-websocket is installed in /app/frontend/node_modules
export HOST=0.0.0.0
export PORT=1234
node /app/frontend/node_modules/y-websocket/bin/server.js &

# Start FastAPI (Python)
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Wait for any process to exit
wait -n
  
exit $?
