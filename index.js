var express = require('express');
var app = express();
var http = require('http').Server(app);
var net = require('net');
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    console.log('Serving Frontend to client on port 3000')
    res.sendFile(__dirname + '/index.html');
});
app.use('/public', express.static('public'));

io.on('connection', function(socket){
    console.log('Frontend connected to socket.io');
    socket.on('disconnect', function(){
        console.log('Frontend disconnected');
    });
});

http.listen(3000, function(){
    console.log('Listening on *:3000');
});

const server = net.createServer((c) => {
    console.log('Client connected to port 13337');
    c.on('end', () => {
        console.log('Client disconnected');
    });
    c.on('data', (msg) => {
        io.emit('msg', msg.toString());
    })
});

server.on('error', (err) => {
    throw err;
});

server.listen(13337, () => {
    console.log('Listening on *:13337');
});
