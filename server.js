const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

let drawCommands = []; // Aquí guardamos TODOS los trazos

app.use(express.static(path.join(__dirname, 'public')));

// Manejar conexiones de clientes
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Cuando alguien pide el historial
  socket.on('request-history', () => {
    socket.emit('history', drawCommands);
  });

  // Cuando alguien dibuja algo nuevo
  socket.on('draw', (stroke) => {
    drawCommands.push(stroke);
    socket.broadcast.emit('draw', stroke);
  });

  // Cuando alguien limpia todo
  socket.on('clear', () => {
    drawCommands = [];
    io.emit('clear');
  });

  // ⚡ NUEVO: Cuando alguien actualiza todo el historial
  socket.on('update-history', (newDrawCommands) => {
    drawCommands = newDrawCommands;
    io.emit('clear'); // Primero limpiar a todos
    for (const stroke of drawCommands) {
      io.emit('draw', stroke);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Levantar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
