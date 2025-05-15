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

app.use(express.static(path.join(__dirname, 'public'))); // Sirve archivos estáticos (tu HTML irá en 'public/')

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Alguien pide historial
  socket.on('request-history', () => {
    socket.emit('history', drawCommands);
  });

  // Alguien dibuja algo
  socket.on('draw', (stroke) => {
    drawCommands.push(stroke);
    socket.broadcast.emit('draw', stroke); // Enviar a todos menos al que lo hizo
  });

  // Alguien limpia el canvas
  socket.on('clear', () => {
    drawCommands = [];
    io.emit('clear'); // Enviar a todos
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
