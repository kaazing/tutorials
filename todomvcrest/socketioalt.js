/**
 * Created by romans on 10/14/15.
 */
var amqp = require('amqplib');

var socket=function(ch){
	var channel = ch;
	return {
		on:function(endpoint, callback){
			var ok = ch.assertExchange(endpoint, 'fanout', {durable: false});
			ok = ok.then(function() {
				return ch.assertQueue('', {exclusive: true});
			});
			ok = ok.then(function(qok) {
				return ch.bindQueue(qok.queue, endpoint, '').then(function() {
					return qok.queue;
				});
			});
			ok = ok.then(function(queue) {
				return ch.consume(queue, callback, {noAck: true, noLocal:true});
			});
			return ok.then(function() {
				console.log('[*] Waiting for data on endpoint '+endpoint+'. To exit press CTRL+C');
			});
		},
		emit:{
			broadcast:function(endpoint, msg){
				console.info("Broacasting to "+endpoint+" message "+msg);
				channel.publish(endpoint, '', new Buffer(msg));
			}
		}
	}
}

module.exports=function(url){
	return {
		on:function(event, callback){
			if (event==='connection'){
				amqp.connect(url).then(function(conn) {
					process.once('SIGINT', function () {
						conn.close();
					});
					conn.createChannel().then(function(ch) {
						console.log("io.on: "+event+" created channel!");
						callback(socket(ch));
					}).then(null, console.warn);;
				});
			}
			else{
				throw "Unsupported event "+event;
			}
		}
	};
}
