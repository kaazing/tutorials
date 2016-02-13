/**
 * Created by romans on 10/14/15.
 */
var amqp = require('amqplib');

var getCallBackFunc=null;
var postCallBackFunc=null;
var putCallBackFunc=null;
var deleteCallBackFunc=null;

var restReturn=function(ch, topic) {
	return {
		on:{
			getRequest: function (getCallback) {
				getCallBackFunc = getCallback;
			},
			postRequest: function (postCallback) {
				postCallBackFunc = postCallback;
			},
			putRequest: function (putCallback) {
				putCallBackFunc = putCallback;
			},
			deleteRequest: function (deleteCallback) {
				deleteCallBackFunc = deleteCallback;
			}
		},
		reply:{
			get:function(data){
				var retCmd={
					command:"on.get",
					data:data
				}
				var sndData=JSON.stringify(retCmd)
				ch.publish(topic, '', new Buffer(sndData));
			}
		}
	}
};
var processMessage= function (msg) {
	var cmd=JSON.parse(msg.content.toString());
	if (cmd.command==="get"){
		if (getCallBackFunc!=null)
			getCallBackFunc(cmd.parameters);
	}
	else if (cmd.command==="put"){
		if (putCallBackFunc!=null)
			putCallBackFunc(cmd.parameters, cmd.data);
	}
	else if (cmd.command==="post"){
		if (postCallBackFunc!=null)
			postCallBackFunc(cmd.parameters, cmd.data);
	}
	else if (cmd.command==="delete"){
		if (deleteCallBackFunc!=null)
			deleteCallBackFunc(cmd.parameters);
	}

}


module.exports=function(connectionInfo){
	if (connectionInfo.url === undefined || connectionInfo.url===null){
		throw "connectionInfo must contain url property!";
	}
	if (connectionInfo.topic===undefined || connectionInfo.topic===null){
		throw "connectionInfo must contain topic property!";
	}
	return {
		connect:function(callback){
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
						callback(restReturn(ch, connectionInfo.topic));
					});
				}).then(null, console.warn);;
			});
		}
	};
}
