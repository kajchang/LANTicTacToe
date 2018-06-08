var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var Games = [];
var winningpatterns = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6], [0, 3, 6], [1, 4, 7], [2, 5, 8]];

app.use("/styles",  express.static(path.join(__dirname, 'public/css')));
app.use("/scripts", express.static(path.join(__dirname, 'public/javascript')));
app.use("/images", express.static(path.join(__dirname, 'public/images')));

app.get('/' , function(req , res) {
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

app.get('/game', function(req, res) {
	res.sendFile(path.join(__dirname, 'public/html/game.html'))
});

io.on('connection', function(socket) {
	var playerId = socket.id;

	socket.on('page', function(msg) {
		if (msg['page'] == 'gamefinder') {

			var inGame = false;

			socket.on('createGame', function() {
				var GameId = Math.floor(Math.random() * 1000);
				var gameData = {
					'id': GameId,
					'players': [],
					'boardState': [0, 0, 0, 0, 0, 0, 0, 0, 0],
					'activePlayer': 0,
					'status' : 'Waiting for Players',
					'createdBy': playerId
				}
				Games.push(gameData);

				io.emit('recieveGames', Games);
			});

			socket.on('joinGame', function(msg) {
				for (i=0; i<Games.length; i++) {
					if (Games[i]['id'] == msg && !inGame) {

						Games[i]['players'].push(playerId);

						io.emit('recieveGames', Games)

						inGame = true;

						if (Games[i]['players'].length == 2) {
							Games[i]['status'] = 'In Game';

							io.emit('recieveGames', Games);

							Games[i]['players'] = []
						}
					}
				}
			});

			socket.on('leaveGame', function(msg) {
				for (i=0; i<Games.length; i++) {
					if (Games[i]['id'] == msg && Games[i]['players'].includes(playerId)) {

						Games[i]['players'].pop(playerId);
						inGame = false;
					}
				}

				io.emit('recieveGames', Games);
			});

			socket.on('disconnect', function() {
				for (i=0; i<Games.length; i++) {
					if (Games[i]['createdBy'] == playerId && Games[i]['status'] == 'Waiting for Players') {
						Games.splice(i, 1);
					}
				}

				io.emit('recieveGames', Games);
			});

			this.emit('recieveGames', Games);
		}

		if (msg['page'] == 'game') {
			var gameId = msg['gameId'];
			var gameFound = false;

			for (i=0; i<Games.length; i++) {

					if (Games[i]['id'] == gameId && Games[i]['players'].length < 2) {
						Games[i]['players'].push(playerId);
						var gameFound = true;
						socket.join(gameId);
						if (Games[i]['players'].length == 2) {
							var activePlayer = Games[i]['players'][Math.floor(Math.random() * Games[i]['players'].length)]
							Games[i]['activePlayer'] = activePlayer;
							this.emit('gameState', {'activePlayer': Games[i]['activePlayer'],
													'boardState': Games[i]['boardState']});
							socket.to(gameId).emit('gameState', {'activePlayer': Games[i]['activePlayer'],
																 'boardState': Games[i]['boardState']});
						}
					}

					else if (Games[i]['id'] == gameId && Games[i]['status'] == 'In Game' && Games[i]['players'].length == 2) {
						this.emit('redirect', 'Game Is Full');
					}
			
				}

			if (!gameFound) {
				this.emit('redirect', 'Game Not Found');
			}

			socket.on('move', function(msg) {
				for (i=0; i<Games.length; i++) {
					if (Games[i]['players'].includes(playerId) && playerId == Games[i]['activePlayer'] && Games[i]['boardState'][msg['position']] == 0) {
						Games[i]['boardState'][msg['position']] = msg['playerId'];
						if (Games[i]['activePlayer'] == Games[i]['players'][0]) {
							Games[i]['activePlayer'] = Games[i]['players'][1];
						}
						else {
							Games[i]['activePlayer'] = Games[i]['players'][0];
						}
						this.emit('gameState', {'activePlayer': Games[i]['activePlayer'],
												'boardState': Games[i]['boardState']});
						socket.to(gameId).emit('gameState', {'activePlayer': Games[i]['activePlayer'],
															 'boardState': Games[i]['boardState']});

						for (x=0; x<winningpatterns.length; x++) {
							if (Games[i]['boardState'][winningpatterns[x][0]] != 0 && Games[i]['boardState'][winningpatterns[x][0]] == Games[i]['boardState'][winningpatterns[x][1]] && Games[i]['boardState'][winningpatterns[x][0]] == Games[i]['boardState'][winningpatterns[x][2]]) {
								this.emit('redirect', 'You Win!');

								socket.to(gameId).emit('redirect', 'You Lose');

								Games[i]['status'] = 'Complete';
							}
						}

						if (Games[i]['status'] != 'Complete' && Games[i]['boardState'][0] != 0 && Games[i]['boardState'][1] != 0 && Games[i]['boardState'][2] != 0 && Games[i]['boardState'][3] != 0 && Games[i]['boardState'][4] != 0 && Games[i]['boardState'][5] != 0 && Games[i]['boardState'][6] != 0 && Games[i]['boardState'][7] != 0 && Games[i]['boardState'][8] != 0) {
							this.emit('redirect', 'You Tied');

							socket.to(gameId).emit('redirect', 'You Tied');

							Games[i]['status'] = 'Complete';
						}
					}
				}
			});

			socket.on('disconnect', function() {
				for (i=0; i<Games.length; i++) {
					if (Games[i]['id'] == gameId && Games[i]['players'].includes(playerId)) {
						var Game = Games.pop(Games[i]);
						if (Game['status'] != 'Complete') {
							socket.to(gameId).emit('redirect', 'Other Player Disconnected');
						}
					}
				}

				io.emit('recieveGames', Games);

			});

		}

		});

	});

http.listen(3000)
