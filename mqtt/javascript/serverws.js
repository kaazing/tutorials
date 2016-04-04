var io=require('./node/socketioalt.js')('tcp://localhost:1883');
var express=require('express');
var app = express();
var http = require('http').Server(app);
app.use(express.static(__dirname+'bower_components'));
app.use(express.static(__dirname+'css'));
app.use(express.static(__dirname+'js'));
app.use(express.static(__dirname));


var todos=[];
var devices=[];

var maxClicks=10;

var socket=null;
function processMessage(cmd) {
	if (cmd.clientID==="server")
		return;
	console.log("Command: " + cmd.command + ", Received: " + cmd);
	if (cmd.command === "insert") {
		todos.push(cmd.item);
	}
	else if (cmd.command === "remove") {
		var index = -1;
		for (var i = 0; i < todos.length; i++) {
			if (todos[i].id === cmd.item.id) {
				index = i;
			}
		}

		for (var key in devices) {
			var deviceInfo = devices[key];
			if (deviceInfo.itemId==todos[index].id){
				delete devices[key];
			}
		}
		todos.splice(index, 1);
	}
	else if (cmd.command === "update") {
		var index = -1;
		for (var i = 0; i < todos.length; i++) {
			if (todos[i].id === cmd.item.id) {
				index = i;
			}
		}
		if(todos[index].completed!=cmd.item.completed) {
			for (var key in devices){
				var deviceInfo=devices[key];
				if (deviceInfo.itemId=cmd.item.id){
					if (cmd.item.completed){
						deviceInfo.counter=0;
						socket.emit("/Devices/command", {clientId:deviceInfo.clientId, maintenancelight:"off"});
						devices[deviceInfo.clientId]=deviceInfo;
					}
					else{
						socket.emit("/Devices/command", {clientId:deviceInfo.clientId, maintenancelight:"on"});
					}
				}
			}
		}
		todos[index] = cmd.item;

	}
	else if (cmd.command === 'init') {
		try {
			var retCmd = {
				command: "initdata",
				items: todos
			}

			socket.emit("todomvc",retCmd);
			console.log("Sent initialization data to " + cmd.clientId);
		}
		catch (e) {
			console.log("Error " + e);
		}
	}
}


function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function processDeviceMessage(cmd){
	var deviceInfo=devices[cmd.clientId];
	if (deviceInfo==null){
		deviceInfo={counter:1, itemId:getRandomInt(1, 100000), clientId:cmd.clientId};
		devices[cmd.clientId]=deviceInfo;
		console.log("Registering new device:"+cmd.clientId);
	}
	else{
		deviceInfo.counter++;
		console.log("Updating device:"+cmd.clientId+", new counter="+deviceInfo.counter);
	}
	devices[cmd.clientId]=deviceInfo;
	if (deviceInfo.counter>=maxClicks){
		var exists=false;
		var item=-1;
		for(var i=0;i<todos.length;i++){
			if (todos[i].id===deviceInfo.itemId){
				item=i;
			}
		}
		if (item<0){
			var newTodo = {
				id: deviceInfo.itemId,
				title: "Perform maintenance on "+deviceInfo.clientId,
				completed: false,
				busy: false
			};
			todos.push(newTodo);
			var cmd={command:"insert", item:newTodo, clientID:"server"};
			socket.emit("todomvc", cmd);
		}
		else{
			todos[item].completed=false;
			var cmd={command:"update", item:todos[item]};
			socket.emit("todomvc", cmd);
		}

		socket.emit("/Devices/command", {clientId:deviceInfo.clientId, maintenancelight:"on"});
	}
}



io.on('connection', function(s){
	console.log('a user connected');
	socket=s;
	s.on('todomvc', processMessage);
	s.on('/Devices/status', processDeviceMessage)
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
