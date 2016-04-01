var express=require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname+'bower_components'));
app.use(express.static(__dirname+'data'));
app.use(express.static(__dirname+'css'));
app.use(express.static(__dirname+'js'));
app.use(express.static(__dirname));

var todos=[];
var socket=null;
function processMessage(cmd) {
	console.log("Command: " + cmd.command + ", Received: " + cmd);
	if (cmd.command === "insert") {
		todos.push(cmd.item);
		socket.broadcast.emit("todomvc-snd",cmd);
	}
	else if (cmd.command === "remove") {
		var index = -1;
		for (var i = 0; i < todos.length; i++) {
			if (todos[i].id === cmd.item.id) {
				index = i;
			}
		}
		todos.splice(index, 1);
		socket.broadcast.emit("todomvc-snd",cmd);
	}
	else if (cmd.command === "update") {
		var index = -1;
		for (var i = 0; i < todos.length; i++) {
			if (todos[i].id === cmd.item.id) {
				index = i;
			}
		}
		todos[index] = cmd.item;
		socket.broadcast.emit("todomvc-snd",cmd);
	}
	else if (cmd.command === 'init') {
		try {
			var retCmd = {
				command: "initdata",
				mqttClient: cmd.mqttClient,
				items: todos
			}

			socket.emit("todomvc-snd",retCmd);
			console.log("Sent initialization data to " + cmd.mqttClient);
		}
		catch (e) {
			console.log("Error " + e);
		}
	}
}


io.on('connection', function(s){
	console.log('a user connected');
	socket=s;
	s.on('disconnect', function(){
		console.log('user disconnected');
	});
	s.on('todomvc-rcv', processMessage);
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
