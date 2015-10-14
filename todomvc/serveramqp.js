var amqp = require('amqplib');
var todos=[];
amqp.connect('amqp://localhost:5672').then(function(conn) {
	process.once('SIGINT', function() { conn.close(); });
	return conn.createChannel().then(function(ch) {
		var ok = ch.assertExchange('todomvc', 'fanout', {durable: false});
		ok = ok.then(function() {
			return ch.assertQueue('', {exclusive: true});
		});
		ok = ok.then(function(qok) {
			return ch.bindQueue(qok.queue, 'todomvc', '').then(function() {
				return qok.queue;
			});
		});
		ok = ok.then(function(queue) {
			return ch.consume(queue, processMessage, {noAck: true, noLocal:true});
		});
		return ok.then(function() {
			console.log(' [*] Waiting for data. To exit press CTRL+C');
		});

		function processMessage(msg) {
			var cmd=JSON.parse(msg.content.toString());
			console.log("Command: "+cmd.command+", Received: "+msg.content.toString());
			if (cmd.command==="insert"){
				todos.push(cmd.item);
			}
			else if (cmd.command==="remove"){
				var index=-1;
				for(var i=0;i<todos.length;i++){
					if (todos[i].id===cmd.item.id){
						index=i;
					}
				}
				todos.splice(index, 1);
			}
			else if (cmd.command==="update"){
				var index=-1;
				for(var i=0;i<todos.length;i++){
					if (todos[i].id===cmd.item.id){
						index=i;
					}
				}
				todos[index]=cmd.item;
			}
			else if (cmd.command==='init'){
				try{
					var retCmd={
						command:"initdata",
						client:cmd.client,
						items:todos
					}

					ch.publish("todomvc", '', new Buffer(JSON.stringify(retCmd)));
					console.log("Sent initialization data to "+cmd.client);
				}
				catch(e){
					console.log("Error "+e);
				}
			}
		}
	});
}).then(null, console.warn);