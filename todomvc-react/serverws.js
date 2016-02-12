var io=require('./node/socketioalt.js')('amqp://localhost:5672');
var express=require('express');
var app = express();
var http = require('http').Server(app);
app.use(express.static(__dirname+'node_modules'));
app.use(express.static(__dirname+'css'));
app.use(express.static(__dirname+'js'));
app.use(express.static(__dirname));


var advisories=[];
var socket=null;
function processMessage(cmd) {
	console.log("Command: " + cmd.command + ", Received: " + cmd);
	if (cmd.command === "insert") {
		advisories.push(cmd.item);
	}
	else if (cmd.command === "remove") {
		var index = -1;
		for (var i = 0; i < advisories.length; i++) {
			if (advisories[i].id === cmd.item.id) {
				index = i;
			}
		}
		advisories.splice(index, 1);
	}
	else if (cmd.command === "update") {
		var index = -1;
		for (var i = 0; i < advisories.length; i++) {
			if (advisories[i].id === cmd.item.id) {
				index = i;
			}
		}
		advisories[index] = cmd.item;
	}
	else if (cmd.command === 'init') {
		try {
			var retCmd = {
				command: "initdata",
				items: advisories
			}

			socket.emit("advisories",retCmd);
			console.log("Sent initialization data to " + cmd.clientId);
		}
		catch (e) {
			console.log("Error " + e);
		}
	}
}


io.on('connection', function(s){
	console.log('a user connected');
	socket=s;
	s.on('advisories', processMessage);
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
