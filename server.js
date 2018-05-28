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

	socket.on('createGame', function() {
		var GameId = Math.floor(Math.random() * 1000);
		var gameData = {
			'id': GameId,
			'players': [],
			'boardState': [0, 0, 0, 0, 0, 0, 0, 0, 0],
			'status' : 'Waiting for Players',
			'createdBy': playerId
		}
		Games.push(gameData)

		io.emit('recieveGames', Games)
	});

	socket.on('joinGame', function(msg) {
		for (i=0; i<Games.length; i++) {
			if (Games[i]['id'] == msg) {
				Games[i]['players'].push(playerId);
			}
		}

		io.emit('recieveGames', Games)
	});

	socket.on('leaveGame', function(msg) {
		for (i=0; i<Games.length; i++) {
			if (Games[i]['id'] == msg && Games[i]['players'].includes(playerId)) {
				Games[i]['players'].pop(playerId);
			}
		}

		io.emit('recieveGames', Games)
	});

	socket.on('disconnect', function() {
		for (i=0; i<Games.length; i++) {
			if (Games[i]['createdBy'] == playerId) {
				Games.pop(Games[i]);
			}
		}

		io.emit('recieveGames', Games)
	});

	this.emit('recieveGames', Games)

});

http.listen(3000)
