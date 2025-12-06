
const WebSocket = require('ws');
const http = require('http');
const wss = new WebSocket.Server({ noServer: true });
const setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 1234;

const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Yjs Sync Server Running');
});

server.on('upgrade', (request, socket, head) => {
    // You can perform auth here if needed
    const handleAuth = (ws) => {
        wss.emit('connection', ws, request);
    };
    handleAuth(socket);
});

wss.on('connection', (conn, req) => {
    setupWSConnection(conn, req, { gc: true });
});

server.listen(port, host, () => {
    console.log(`Yjs Sync Server running at http://${host}:${port}`);
});
