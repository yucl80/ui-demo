var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var ot = require('ot');

var clients = [];

var str = '';

var socketIOServer = new ot.Server(str);

io.on('connection', function(socket) {
  console.log('Client connected: ' + socket.id);

  socketIOServer.addClient(new ot.SocketIOAdapter(socket));

  socket.on('disconnect', function() {
    console.log('Client disconnected: ' + socket.id);
  });
});

server.listen(3000);


/*
io.on('connection', function(socket) {
  console.log('Client connected: ' + socket.id);
  clients.push(socket);

  socket.on('disconnect', function() {
    console.log('Client disconnected: ' + socket.id);
    clients.splice(clients.indexOf(socket), 1);
  });

  socket.on('addVertices', function(vertices) {
    for (var i = 0; i < clients.length; i++) {
      if (clients[i] != socket) {
        clients[i].emit('addVertices', vertices);
      }
    }
  });

  socket.on('addEdges', function(edges) {
    for (var i = 0; i < clients.length; i++) {
      if (clients[i] != socket) {
        clients[i].emit('addEdges', edges);
      }
    }
  });

  socket.on('clear', function() {
    for (var i = 0; i < clients.length; i++) {
      if (clients[i] != socket) {
        clients[i].emit('clear');
      }
    }
  });
});

server.listen(3000);
*/
