const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
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

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Anti-Drug Quiz Server ready on http://${hostname}:${port}`);
    console.log(`> Real-time WebSockets attached and listening.`);
  });
});
