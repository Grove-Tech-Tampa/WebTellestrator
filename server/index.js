const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const socketService = require('./services/socketService');
const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Directories to create
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, '../public/uploads');
const publicDir = path.join(__dirname, '../public');

[dataDir, uploadsDir, publicDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Static files
app.use(express.static(publicDir));

// Routes
app.use('/api', apiRoutes);
app.use('/api', uploadRoutes);

// Socket.io
socketService(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Local Network IPs:');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  http://${iface.address}:${PORT}`);
      }
    }
  }
});
