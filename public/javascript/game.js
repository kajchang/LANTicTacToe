var socket = io();

window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,    
    function(m, key, value) {
    	if (key == 'gameId') {
      	gameId = parseInt(value);
    	}
	}
);

function emitMove(x) {
	return function() {
	socket.emit('move', {'position': x, 
						 'playerId': playerId});}
}

socket.on('connect', function() {
	playerId = socket.io.engine.id;

	socket.emit('page', {'page': 'game',
						 'gameId': gameId});

	socket.on('redirect', function(msg) {
		var redirected = false;
		if (!redirected) {
			var redirected = true;
			window.location.href = '/';
			alert(msg);
		}
	});

	socket.on('gameState', function(msg) {
		console.log(msg);
		var boardState = msg['boardState'];
		console.log(boardState);
		for (i=0; i<boardState.length; i++) {
			if (boardState[i] == playerId) {
				document.getElementById(i).innerHTML = '';
				o = document.createElement('img');
				o.src = 'images/o.png';
				document.getElementById(i).appendChild(o);
			}
			else if (boardState[i] != 0) {
				document.getElementById(i).innerHTML = '';
				x = document.createElement('img');
				x.src = 'images/x.png';
				document.getElementById(i).appendChild(x);
			}
		}
	});

	for (var i=0; i<9; i++) {
		document.getElementById(i).onclick = emitMove(i);
	}
});
