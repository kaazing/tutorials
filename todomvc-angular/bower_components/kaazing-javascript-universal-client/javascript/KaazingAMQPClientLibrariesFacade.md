# Kaazing JavaScript AMQP Client Libraries Facade
Kaazing AMQP Client Libraries Facade:
• Implements basic publish-subscribe functionality for AMQP protocol to help developers in getting started with their AMQP WebSocket projects 
• Provide developers with the reference implementations for using Kaazing AMQP JavaScript client libraries
For more information see:
- [How to Build JavaScript Clients Using Kaazing  WebSocket Gateway][2]
- [Use the Kaazing WebSocket Gateway JavaScript AMQP Client Library][3]

## Organization of the library
Library consists of amqpClientFunction that creates AmqpClient object. AmqpClient objects provides the following functionality:
- **connect** function - connects client to Kaazing WebSocket AMQP gateway and on success returns via callback a _connection_ object that will be used to create subscriptions.
- ** subscribe ** method of a _connecion_ object that creates publishing endpoint and subscribes to a subscription endpoint. Method returns _subscription_ object that is used for sending messages.
- **sendMessage** method of a _subscription_ object - sends the message to a publishing endpoint
- **close** function of a _subscription_ object - closes both publishing and subscription.
- **disconnect** method - closes all subscriptions and disconnects client from Kaazing WebSocket AMQP gateway


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
	amqpClient.connect(options, function(){
          var connection=createConnectionObject(amqpClient,connectionInfo.username);
                connectedFunctionHandle(connection);
            });
	```
	
### **subscribe** method of connection object
1. Creates subscription object
2. Initializes subscription object
	- Opens publishing and consumption (subscription) channels using amqpClient openChannel function that will call on success the callback function that is passed as a parameter:  
	
		```javascript
		var openHandler=function(){  
			publishChannel = amqpClient.openChannel(this.publishChannelOpenHandler);  
			consumeChannel = amqpClient.openChannel(this.consumeChannelOpenHandler);  
		}		
		```
		
	Once the channels are created method returns the _subscription_ object via a callback.
	During the creation of the channels:
	- Publishing channel open handler declares AMQP Exchange of a _fanout_ type thus creating publishing endpoint.
		
		```javascript
		publishChannelOpenHandler:function(that){
                	that.publishChannel.declareExchange({exchange: that.topicPub, type: "fanout"});
                }
		```		
	- Consumption (or subscription) channel open handler:
		1.  Adds an event listener for “message” event providing the ability to receive messages. 
		2. Declares subscription queue for the client. Library randomly generates the name for every client.
		3. Binds the queue to a subscription exchange with “broadcastkey” routing key. 
		
		**Note** For fanout exchanges routing key is not used. For more information about exchanges and routing keys see: [https://www.rabbitmq.com/tutorials/amqp-concepts.html][1] 
		
		4. Starts basic consumer. Basic consumer is started with noAck=true parameter so the client does not need to implement explicit acknowledgement. Another parameter - noLocal - controls whether the client wants to receive its own messages.
	
			```javascript
				consumeChannelOpenHandler:function(that{  
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
						that.messageReceivedFunc(body);;  
					});  
		 			that.consumeChannel.declareQueue({queue: that.queueName})
                    				.bindQueue({queue: that.queueName, exchange: that.topicSub, routingKey: routingKey })
                    				.consumeBasic({queue: that.queueName, consumerTag: that.clientId, noAck: true, noLocal:that.noLocal })  
				}
			```
			
### **sendMessage** function of a subscription object
Function sets AMQP properties and sends the message to a publishing exchange using specified routing key.   
**Note:** As mentioned earlier, library creates a fanout type of exchange that does not use routing keys; thus library sets the value of the routing key to 'broadcast'.

```javascript
sendMessage:function(msg){
                if (typeof msg ==="object"){
					msg.clientId=this.clientId;
                    msg=JSON.stringify(msg);
                }
                else{
                    handleException("Message "+msg+" should be an object!");
                }

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
                props.setMessageId((this.messageIdCounter++).toString());
                props.setPriority("6");
                props.setTimestamp(new Date());
                props.setUserId(this.user);
				logInformation("sent","Sending message to "+this.topicPub+": "+ msg, "sent");
                this.publishChannel.publishBasic({body: body, properties: props, exchange: this.topicPub, routingKey: routingKey});
            }
```
		
### **close** function of a subscription object
Due to AMQP nature, nothing has to be performed.

### **disconnect** function
Disconnects the client from Kaazing WebSocket AMQP Gateway
```javascript
amqpClient.disconnect();
```



[1]:	https://www.rabbitmq.com/tutorials/amqp-concepts.html
[2]:	http://developer.kaazing.com/documentation/amqp/4.0/dev-js/o_dev_js.html#keglibs
[3]:	http://developer.kaazing.com/documentation/amqp/4.0/dev-js/p_dev_js_client.html
