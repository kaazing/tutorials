/**
 * Created by romans on 10/14/15.
 */
var mqtt = require('mqtt');
var url = require('url');

var socket=function(cl){
	var client = cl;
	return {
		on:function(endpoint, callback){
			client.subscribe(endpoint);
			console.log('[*] Waiting for data on endpoint '+endpoint+'. To exit press CTRL+C');
			client.on('message', function (topic, message) {
				// message is Buffer
				console.log("Received on ["+topic+"] message "+message.toString());

				if (topic==endpoint){
					console.log("Sending to the mqttClient message "+message.toString());
					var cmd = JSON.parse(message.toString());
					callback(cmd);
				}
			});
		},
		broadcast:{
			emit:function(endpoint, cmd){
				var msg=JSON.stringify(cmd)
				console.info("Broacasting to "+endpoint+" message "+msg);
				client.publish(endpoint, msg);
			}
		},
		emit:function(endpoint, cmd){
			var msg=JSON.stringify(cmd);
			console.info("Sending to "+endpoint+" message "+msg);
			client.publish(endpoint, msg);
		}
	}
}

module.exports=function(connUrl){
	var parser=url.parse(connUrl);
	parser.href = url;

	var client = mqtt.connect({ host: parser.hostname, port: parser.port });
	return {
		on:function(event, callback){
			if (event==='connection'){
				client.on('connect', function () {
					console.log("io.on: "+event+" created connection!");
					callback(socket(client))
				});
			}
			else{
				throw "Unsupported event "+event;
			}
		}
	};
}
