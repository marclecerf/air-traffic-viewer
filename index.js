var express = require('express');
var app = express();
var http = require('http').Server(app);
var net = require('net');
var io = require('socket.io')(http);


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.use('/public', express.static('public'));
app.use('/public', express.static('../WebWorldWind'));


io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('msg', function(msg){
        console.log('msg: ' + msg);
        io.emit('msg', msg);
    });
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

const server = net.createServer((c) => {
    // 'connection' listener
    console.log('client connected');
    c.on('end', () => {
        console.log('client disconnected');
    });
    c.on('data', (msg) => {
        //console.log('got msg: ' + msg);
        io.emit('msg', msg.toString());
    })
});

server.on('error', (err) => {
    throw err;
});

server.listen(13337, () => {
    console.log('server bound');
});
