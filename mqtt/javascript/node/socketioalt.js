/**
 * Created by romans on 10/14/15.
 */
var mqtt = require('mqtt');
var url = require('url');

var topics=[];
var socket=function(cl){
	var client = cl;

	client.on('message', function (topic, message) {
		console.log("Received message "+message.toString());
		var arr=topic.split('/');
		for(var i=0;i<topics.length;i++){
			var t=topics[i];
			var found=true;
			for(var k=0;k<t.elements.length;k++){

				if (t.elements[k]=='+'){
					continue;
				}
				else if (t.elements[k]=="#"){
					break;
				}
				if (t.elements[k]!=arr[k]){
					found=false;
					break;
				}
			}
			if (found){
				console.log("Sending to the Client message "+message.toString());
				var cmd = JSON.parse(message.toString());
				t.callback(cmd);
			}
		}
	});

	return {
		on:function(endpoint, callback){
			client.subscribe(endpoint);
			var t={elements:endpoint.split("/"), callback:callback};
			topics.push(t);
			console.log('[*] Waiting for data on endpoint '+endpoint+'. To exit press CTRL+C');
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
