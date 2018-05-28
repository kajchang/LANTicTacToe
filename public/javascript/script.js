var socket = io();

socket.on('connect', function() {
    var playerId = socket.io.engine.id;

    socket.on('recieveGames', function(msg) {
        var new_body = document.createElement('tbody');
        new_body.id = "games";
        for (i = 0; i < msg.length; i++) {
            var trow = document.createElement('tr');
            var tdata = document.createElement('td');
            tdata.appendChild(document.createTextNode(msg[i]['id']));
            trow.appendChild(tdata);
            var tdata = document.createElement('td');
            tdata.appendChild(document.createTextNode(msg[i]['players'].length + '/2'));
            trow.appendChild(tdata);
            var tdata = document.createElement('td');
            tdata.appendChild(document.createTextNode(msg[i]['status']));
            trow.appendChild(tdata);
            var tdata = document.createElement('td');
            var button = document.createElement('button');
            if (msg[i]['players'].includes(playerId)) {
                button.appendChild(document.createTextNode('Leave'));
                button.setAttribute("onClick", "socket.emit('leaveGame', " + msg[i]['id'] + ")");
            }
            else {
                button.appendChild(document.createTextNode('Join'));
                button.setAttribute("onClick", "socket.emit('joinGame', " + msg[i]['id'] + ")");
                if (msg[i]['players'].length == 2) {
                    button.disabled = true;
                }
            }
            tdata.appendChild(button);
            trow.appendChild(tdata);
            new_body.appendChild(trow);
        }
        document.getElementById('games').parentNode.replaceChild(new_body, document.getElementById('games'));
    });
});

window.onload = function() {
    document.getElementById('createGame').onclick = function() {
        socket.emit('createGame');
        this.disabled = true;
    }
}