var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
    });
app.get('/game.js', function(req, res){
	res.sendFile(__dirname + '/game.js');
    });
app.use(express.static(__dirname + '/components'));
app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname + '/engine'));
app.use(express.static(__dirname + '/fonts'));
app.use(express.static(__dirname + '/game'));
app.use(express.static(__dirname + '/libs'));
app.use(express.static(__dirname + '/misc'));
app.use(express.static(__dirname + '/rendercontexts'));
app.use(express.static(__dirname + '/resourceloaders'));
app.use(express.static(__dirname + '/resources'));
app.use(express.static(__dirname + '/spatial'));
app.use(express.static(__dirname + '/textrender'));
io.on('connection', function(socket){
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	    });
    });

http.listen(3000, function(){
	console.log('listening on *:3000');
    });
