const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);

    // Cross-server Socket Emit Endpoint (allows Vercel API routes to broadcast via Railway socket server)
    if (parsedUrl.pathname === '/api/socket-emit' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const authHeader = req.headers['x-socket-secret'];
          const expectedSecret = process.env.JWT_SECRET || 'antidrug_club_secret_key_2026_secure';
          if (authHeader !== expectedSecret) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }

          const { event, data } = JSON.parse(body);
          if (global.io) {
            global.io.emit(event, data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, event }));
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Socket IO instance not initialized' }));
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid payload' }));
        }
      });
      return;
    }

    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Attach io to global scope for API routes access
  global.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected to WebSocket:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected from WebSocket:', socket.id);
    });
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Anti-Drug Quiz Server ready on http://${hostname}:${port}`);
    console.log(`> Real-time WebSockets attached and listening.`);
  });
});
