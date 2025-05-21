const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

const DATA_FILE = path.join(__dirname, 'draw.json');

let drawCommands = [];
let redoStack = [];

// 🔄 Cargar datos desde archivo al iniciar
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      drawCommands = JSON.parse(data);
      console.log('✅ Historial cargado desde archivo.');
    } catch (err) {
      console.error('⚠️ Error al leer draw.json:', err);
    }
  }
}

// 💾 Guardar historial actual en archivo
function saveData() {
  fs.writeFile(DATA_FILE, JSON.stringify(drawCommands), (err) => {
    if (err) console.error('❌ Error al guardar draw.json:', err);
  });
}

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('👤 Usuario conectado:', socket.id);

  socket.on('request-history', () => {
    socket.emit('history', drawCommands);
  });

  socket.on('draw', (stroke) => {
    drawCommands.push(stroke);
    redoStack = [];
    socket.broadcast.emit('draw', stroke);
    saveData();
  });

  socket.on('clear', () => {
    drawCommands = [];
    redoStack = [];
    io.emit('clear');
    saveData();
  });

  socket.on('undo', () => {
    if (drawCommands.length > 0) {
      const undone = drawCommands.pop();
      redoStack.push(undone);
      io.emit('undo');
      saveData();
    }
  });

  socket.on('redo', (stroke) => {
    if (stroke && Array.isArray(stroke)) {
      drawCommands.push(stroke);
      io.emit('redo', stroke);
      saveData();
    }
  });

  socket.on('disconnect', () => {
    console.log('👤 Usuario desconectado:', socket.id);
  });
});

// Inicializar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  loadData();
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
