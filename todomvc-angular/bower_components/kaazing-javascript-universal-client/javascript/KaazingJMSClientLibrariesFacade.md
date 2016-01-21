# Kaazing JMS Client Libraries Facade
Kaazing JMS Client Libraries Facade:
* Implements basic publish-subscribe functionality for JMS to help developers in getting started with their JMS WebSocket projects 
* Provide developers with the reference implementations for using Kaazing AMQP JavaScript client libraries

For more information see:
- [Build JavaScript JMS Clients Using Kaazing WebSocket Gateway - JMS Edition](http://developer.kaazing.com/documentation/jms/4.0/dev-js/o_dev_js.html)
- [Use the Kaazing WebSocket Gateway JavaScript JMS Client API][2]

## Organization of the library
Library consists of jmsClientFunction that creates JMSClient object. JMSClient objects provides the following functionality:
- **connect** function - connects client to Kaazing WebSocket JMS gateway, creates publishing endpoint and subscribes to a subscription endpoint
- **disconnect** function - disconnects client from Kaazing WebSocket JMS gateway
- **sendMessage** function - sends the message to a publishing endpoint

### **connect** function
Connect function implements the following sequence:

1. Create JMS connection factory
	```javascript
	var jmsConnectionFactory = new JmsConnectionFactory(url);
	```

2. Create connection. createConnection function of JmsConnectionFactory takes three parameters: login, password and a callback function that will be called upon completion. Function returns the future that is checked in a callback function for exceptions.
	```javascript
	var connectionFuture = jmsConnectionFactory.createConnection(username, password, function () {
		if (!connectionFuture.exception) {
			try {
				connection = connectionFuture.getValue();
				connection.setExceptionListener(handleException);
		
				session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
		
				connection.start(function () {
					prepareSend();
					prepareReceive(messageReceivedFunc);
				});
			}
			catch (e) {
				handleException(e);
			}
		}
		else {
			handleException(connectionFuture.exception);
		}
	})
	```
	
3. Once connection is created, callback function does the following:
	1. Obtains the connection from the connectionFuture that was returned by createConection.
	2. Sets exception listener to handle exceptions.
	3. Creates session using createSession method. Session is created with auto-acknowledgement. 
	4. Starts the connection using start function passing to it a callback function.

4. Once connection is started, callback function:
	1. Creates publishing topic and producer to send messages
	
		```javascript
		var prepareSend = function () {
			var dest = session.createTopic(topicPub);
	        	producer = session.createProducer(dest);
		}
		```
	2. Creates subscription topic and consumer.
	_In order to prevent client from receiving its own messages consumer may be created with the query that will filter out the messages with the 'appId' string property set to this client application ID - a randomly generated GUID._
	Once consumer is created, setMessageListener function is used to specify the function to be called when new message is received.

		```javascript
		var prepareReceive = function (rcvFunction) {
			var dest = session.createTopic(topicSub);
			if (noLocalFlag)
				consumer = session.createConsumer(dest, "appId<>'" + appId + "'");
			else
				consumer = session.createConsumer(dest);
				consumer.setMessageListener(function (message) {
				rcvFunction(body);
			});
		}
	    	
	    	
### **disconnect** function
Closes, producer, consumer and connection in a chain of callbacks.
	
```javascript
    JMSClient.disconnect=function(){
        producer.close(function(){
            consumer.close(function(){
                session.close(function(){
                    connection.close(function(){

                    });
                });
            });
        });
    }
```

### **sendMessage** function	
Function creates text message and sends it. In order to prevent client from receiving its own messages 'appId' string property may be set to this client application ID - a randomly generated GUID.
```javascript
JMSClient.sendMessage=function(msg){
	var textMsg = session.createTextMessage(msg);
	if (noLocalFlag)
		textMsg.setStringProperty("appId", appId);
	try {
		var future = producer.send(textMsg, function () {
			if (future.exception) {
				handleException(future.exception);
			}	
		});
	} catch (e) {
		handleException(e);
	}
}
```

[1]:	https://www.rabbitmq.com/tutorials/amqp-concepts.html
[2]:	http://developer.kaazing.com/documentation/jms/4.0/dev-js/p_dev_js_client.html
