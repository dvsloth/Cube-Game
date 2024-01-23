const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const port = 3521;

app.use(express.static('public'));

io.on('connection', (socket) => {
  const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
socket.emit('setColor', randomColor);

socket.on('chatMessage', (data) => {
  socket.broadcast.emit('chatMessage', { message: data.message });
  console.log({ message: data.message })
});

socket.on('rotate', (data) => {
  socket.broadcast.emit('playerRotated', {
      playerId: socket.id,
      rotationY: data.rotationY,
  });
});
  socket.on('disconnect', () => {
    io.emit('playerDisconnected', socket.id);
  });
  socket.on('move', (data) => {
    io.emit('playerMoved', { id: socket.id, position: data.position });
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
