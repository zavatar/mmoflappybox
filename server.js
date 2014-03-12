var express = require('express'),
    app = express(),
    io = require('socket.io').listen(app.listen(8080))
;

app.use('/static', express.static(__dirname + '/static'));

app.get('/', function(req, res) {
    name = generateName(6);
    console.log('render to', name);
    res.render('index.ejs', {name: name});
});

function generateName(length) {
    var haystack = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var name = '';

    for(var i = 0; i < length; i++) {
        name += haystack.charAt(Math.floor(Math.random() * 62));
    }

    return name;
};

var roomID = 1;
var players = {};

io.sockets.on('connection', function(socket) {
    console.log('someone connected');
    socket.on('join', function(data) {
        console.log(data.name + ' joined');
        if(data.name in players) {
        }
        else {
            socket.join(roomID);
            socket.set('name', data.name);
            players[data.name] = {
                player: socket
            };
            socket.emit('assign', Object.keys(players));
            io.sockets.in(roomID).emit('join', {name: data.name});
        }
    });

    socket.on('update', function(data) {
        //console.log(data);
        socket.get('name', function(err, name) {
            io.sockets.in(roomID).emit('update', {name: name, data: data});
        });
    });

    socket.on('disconnect', function() {
        console.log('Disconnected');
        socket.get('name', function(err, name) {
            io.sockets.in(roomID).emit('leave', {name: name});
            delete players[name];
        });
    });
});

console.log('Listening on port 8080');
