const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permitir acceso desde cualquier sitio (incluido tu S3)
    methods: ["GET", "POST"]
  }
});

// Cuando alguien se conecta
io.on('connection', (socket) => {
  console.log('Un usuario se conectó');

  socket.on('draw', (data) => {
    // Envía a todos MENOS al que dibujó
    socket.broadcast.emit('draw', data);
  });

  socket.on('clear', () => {
    // Limpiar para todos
    io.emit('clear');
  });

  socket.on('disconnect', () => {
    console.log('Un usuario se desconectó');
  });
});

// Puerto para Render (usa su variable o 3000 en local)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
