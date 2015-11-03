/**
 * Created by romans on 10/14/15.
 */
var amqp = require('amqplib');

var restemul=function(ch){
	var channel = ch;
	var callback= function (msg) {
		JSON.parse(msg.content.toString());
	}
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

module.exports=function(connectionInfo, callback){
	if (connectionInfo.url === undefined || connectionInfo.url===null){
		throw "connectionInfo must contain url property!";
	}
	if (connectionInfo.topic===undefined || connectionInfo.topic===null){
		throw "connectionInfo must contain topic property!";
	}

	var getCallBackFunc=null;
	var postCallBackFunc=null;
	var putCallbackFunc=null;
	var deleteCallbackFunc=null;

	var restReturn=function(ch) {
		return {
			on: {
				getRequest: function (getCallback) {
					getCallBackFunc = getCallback;
				},
				postRequest: function (postCallback) {
					postCallBackFunc = postCallback;
				},
				putRequest: function (putCallback) {
					putCallbackFunc = putCallback;
				},
				deleteRequest: function (deleteCallback) {
					deleteCallbackFunc = deleteCallback;
				}
			},
			reply:{
				get:function(data){
					var retCmd={
						command:"get",
						data:data
					}
					JSON.stringify(retCmd)
					ch.publish(connectionInfo.topic, '', new Buffer(retCmd));
				}
			}
		}
	}

	var processMessage= function (msg) {
		JSON.parse(msg.content.toString());

	}

	amqp.connect(connectionInfo.url).then(function(conn) {
		process.once('SIGINT', function () {
			conn.close();
		});
		conn.createChannel().then(function(ch) {
			console.log("Created channel!");
			var ok = ch.assertExchange(connectionInfo.topic, 'fanout', {durable: false});
			ok = ok.then(function() {
				return ch.assertQueue('', {exclusive: true});
			});
			ok = ok.then(function(qok) {
				return ch.bindQueue(qok.queue, connectionInfo.topic, '').then(function() {
					return qok.queue;
				});
			});
			ok = ok.then(function(queue) {
				return ch.consume(queue, processMessage, {noAck: true, noLocal:true});
			});
			return ok.then(function() {
				console.log('[*] Waiting for data on endpoint '+connectionInfo.topic+'. To exit press CTRL+C');
				callback(restReturn);
			});
		}).then(null, console.warn);;
	});
}
