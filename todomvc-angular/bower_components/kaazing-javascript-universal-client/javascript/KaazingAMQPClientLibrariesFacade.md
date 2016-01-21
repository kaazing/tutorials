# Kaazing AMQP Client Libraries Facade
Kaazing AMQP Client Libraries Facade:
• Implements basic publish-subscribe functionality for AMQP protocol to help developers in getting started with their AMQP WebSocket projects 
• Provide developers with the reference implementations for using Kaazing AMQP JavaScript client libraries
For more information see:
- [How to Build JavaScript Clients Using Kaazing  WebSocket Gateway][2]
- [Use the Kaazing WebSocket Gateway JavaScript AMQP Client Library][3]

## Organization of the library
Library consists of amqpClientFunction that creates AmqpClient object. AmqpClient objects provides the following functionality:
- **connect** function - connects client to Kaazing WebSocket AMQP gateway, creates publishing endpoint and subscribes to a subscription endpoint
- **disconnect** function - disconnects client from Kaazing WebSocket AMQP gateway
- **sendMessage** function - sends the message to a publishing endpoint

### **connect** function
Connect function implements the following sequence:

1. Create WebSocket and AMQP client factories
	```javascript
	var amqpClientFactory = new AmqpClientFactory();  
	var webSocketFactory;  
	if ($gatewayModule && typeof($gatewayModule.WebSocketFactory) === "function") {  
		webSocketFactory = createWebSocketFactory();  
		amqpClientFactory.setWebSocketFactory(webSocketFactory);  
	}
	```

2. Create AMQP client
	```javascript
	amqpClient = amqpClientFactory.createAmqpClient();
	```

3. Connect to Gateway using amqpClient connect function. Connect function uses has the following parameters:
	- Connection options. In most common cases it contains of URL, credentials and virtual host (set to ‘/‘) hat specifies the namespace for entities (exchanges and queues) referred to by the protocol. Note that this is not virtual hosting in the HTTP sense.
	- Callback function that will be called once connection is established. 

	```javascript
	var credentials = {username: username, password: password};  
	var options = {  
		url: url,  
		virtualHost: "/",  
		credentials: credentials  
	};  
	amqpClient.connect(options, openHandler);
	```
4. Once the connection is established and callback function is called, it opens publishing and consumption (subscription) channels using amqpClient openChannel function that will call on success the callback function that is passed as a parameter:  
	```javascript
	var openHandler=function(){  
		publishChannel = amqpClient.openChannel(publishChannelOpenHandler);  
		consumeChannel = amqpClient.openChannel(consumeChannelOpenHandler);  
	}

	```
	
5. Publishing channel open handler declares AMQP Exchange of a _fanout_ type thus creating publishing endpoint.

	```javascript
	var publishChannelOpenHandler=function(){  
		publishChannel.declareExchange({exchange: topicPub, type: "fanout"});  
	}
	```
6. Consumption (or subscription) channel open handler:
	1.  Adds an event listener for “message” event providing the ability to receive messages. 
	2. Declares subscription queue for the client. Library randomly generates the name for every client.
	3. Binds the queue to a subscription exchange with “broadcastkey” routing key. 
		**Note** For fanout exchanges routing key is not used. For more information about exchanges and routing keys see: [https://www.rabbitmq.com/tutorials/amqp-concepts.html][1] 
	4. Starts basic consumer. Basic consumer is started with noAck=true parameter so the client does not need to implement explicit acknowledgement. Another parameter - noLocal - controls whether the client wants to receive its own messages.
	
	```javascript
	var consumeChannelOpenHandler=function(){  
		consumeChannel.addEventListener("message", function(message) {  
			var body = null;  
			// Check how the payload was packaged since older browsers like IE7 don't  
			// support ArrayBuffer. In those cases, a Kaazing ByteBuffer was used instead.  
			if (typeof(ArrayBuffer) === "undefined") {  
				body = message.getBodyAsByteBuffer().getString(Charset.UTF8);  
			}  
			else {  
				body = arrayBufferToString(message.getBodyAsArrayBuffer())  
			}  
			messageReceivedFunc(body);  
		});  
		consumeChannel.declareQueue({queue: queueName})  
			.bindQueue({queue: queueName, exchange: topicSub, routingKey: routingKey })  
		.consumeBasic({queue: queueName, consumerTag: appId, noAck: true, noLocal:noLocalFlag });  
	}
	```
		
### **disconnect** function
Disconnects the client from Kaazing WebSocket AMQP Gateway
```javascript
amqpClient.disconnect();
```

### **sendMessage** function	
Function sets AMQP properties and sends the message to a publishing exchange using specified routing key.   
**Note:** As mentioned earlier, library creates a fanout type of exchange that does not use routing keys; thus library sets the value of the routing key to 'broadcast'.
```javascript
AmqpClient.sendMessage=function(msg){  
	var body = null;  
	if (typeof(ArrayBuffer) === "undefined") {  
		body = new ByteBuffer();  
		body.putString(msg, Charset.UTF8);  
		body.flip();  
	}  
    	else {  
		body = stringToArrayBuffer(msg);  
	}  
	var props = new AmqpProperties();  
	props.setContentType("text/plain");  
	props.setContentEncoding("UTF-8");  
	props.setDeliveryMode("1");  
	props.setMessageId((messageIdCounter++).toString());  
	props.setPriority("6");  
	props.setTimestamp(new Date());  
	props.setUserId(user);  
  
	publishChannel.publishBasic({body: body, properties: props, exchange: topicPub, routingKey: routingKey});  
}
```

[1]:	https://www.rabbitmq.com/tutorials/amqp-concepts.html
[2]:	http://developer.kaazing.com/documentation/amqp/4.0/dev-js/o_dev_js.html#keglibs
[3]:	http://developer.kaazing.com/documentation/amqp/4.0/dev-js/p_dev_js_client.html
