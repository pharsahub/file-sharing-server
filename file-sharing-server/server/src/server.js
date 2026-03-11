const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// WebRTC / WebSocket Signaling for local network discovery
const wss = new WebSocketServer({ server, path: '/discovery' });
const clients = new Map(); // ws -> metadata

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'register') {
        clients.set(ws, { id: data.id, name: data.name, ip, device: data.device });
        broadcastUsers();
      } else if (data.type === 'signal') {
        // Forward WebRTC signal to target peer
        for (let [clientWs, metadata] of clients.entries()) {
          if (metadata.id === data.target && clientWs.readyState === 1) {
            clientWs.send(JSON.stringify({
              type: 'signal',
              sender: clients.get(ws).id,
              signal: data.signal
            }));
            break;
          }
        }
      }
    } catch (e) {
      console.error('WS Error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcastUsers();
  });
});

function broadcastUsers() {
  const usersList = Array.from(clients.values());
  const msg = JSON.stringify({ type: 'users', users: usersList });
  for (let ws of clients.keys()) {
    if (ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('common'));

// Serve static uploads for easy access (if not handled by Nginx directly)
app.use('/storage', express.static(path.join(__dirname, '../../storage/uploads')));

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const shareRoutes = require('./routes/share');

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/share', shareRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
