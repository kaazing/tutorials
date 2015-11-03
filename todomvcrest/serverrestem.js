var amqp = require('amqplib');
var restalt=require('./restalt.js')({url:'amqp://localhost:5672',topic:"todomvc"});
var express=require('express');
var app = express();
var http = require('http').Server(app);
app.use(express.static(__dirname+'bower_components'));
app.use(express.static(__dirname+'css'));
app.use(express.static(__dirname+'js'));
app.use(express.static(__dirname));


var todos=[];

restalt.connect(function(restHandle){
	restHandle.on.getRequest(function(client){
		var retCmd = {
			client: client,
			items: todos
		}
		restHandle.reply.get(retCmd);
	});
	restHandle.on.postRequest(function(parameters, item){
		todos.push(item);
	});
	restHandle.on.putRequest(function(parameters, item){
		var index = -1;
		for (var i = 0; i < todos.length; i++) {
			if (todos[i].id === item.id) {
				index = i;
			}
		}
		todos[index] = item;
	});
	restHandle.on.deleteRequest(function(parameters){
		var index = -1;
		for (var i = 0; i < todos.length; i++) {
			if (todos[i].id === parameters) {
				index = i;
			}
		}
		todos.splice(index, 1);
	});


});

http.listen(5000, function(){
	console.log('listening on *:5000');
});