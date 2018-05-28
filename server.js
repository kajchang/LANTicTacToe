var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var Games = [];

app.use("/styles",  express.static(path.join(__dirname, 'public/css')));
app.use("/scripts", express.static(path.join(__dirname, 'public/javascript')));

app.get('/' , function(req , res) {
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
})

io.on('connection', function(socket) {
	var playerId = socket.id;

	socket.on('getGames', function() {
		this.emit('recieveGames', Games)
	});

	socket.on('createGame', function() {
		var GameId = Math.floor(Math.random() * 1000);
		var gameData = {
			'id': GameId,
			'players': [],
			'boardState': [0, 0, 0, 0, 0, 0, 0, 0, 0]
		}
		Games.push(gameData)

		this.emit('gameCreated', gameData)
	});

	socket.on('disconnect', function() {

		for (i=0; i<Games.length; i++) {
			if (Games[i]['players'].includes(playerId)) {
				Games.pop(Games[i]);
			}
		}
	});
});

http.listen(3000)
