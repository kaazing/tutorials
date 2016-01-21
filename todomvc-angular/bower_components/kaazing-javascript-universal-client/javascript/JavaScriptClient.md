# Kaazing JavaScript Universal Client for JavaScript
This library is intended to be used with 'plain JavaScript' application; it provides JavaScript function that returns an object that can be used in the client application to interact with Kaazing Gateway.

## Using the Library
- Install library with the Bower as specified [README document][1].
- Add the following to the **\<head\>** section of your page:  
	```html
	
	<head>  
	....    
	<script src="bower_components/kaazing-javascript-universal-client/javascript/src/JavascriptUniversalClient.js"></script>
	<script src="bower_components/kaazing-javascript-universal-client/javascript/src/JmsClient.js"></script>
	....  
	</head>
	```
- Create an instance of the Universal Client Library.
	```javascript
	...
	
	var client=UniversalClientDef(protocol);
	...
	
	```
	Where:
	- **protocol**: Specifies protocol that should be used for communications: jms - for communication with Kaazing JMS Gateway, amqp - for communication with Kaazing AMQP Gateway.

- Establish connection within your controller
	```javascript
	...
	
	var client=UniversalClientDef(protocol);
	...

	$(document).ready(function () {
		client.connect(url, username, password, topicP, topicS, noLocal, messageDestinationFuncHandle,loggerFuncHandle);
		
		...
		
	}
	
	```
	Where:
	- **url**: Connection URL (e.g. ws://localhost:8001/amqp or ws://localhost:8001/jms)
	- **username**: User name to be used to establish connection
	- **password**: User password to be used to establish connection
	- **topicP**: Name of the publishing endpoint - AMQP exchange used for publishing or JMS Topic
	- **topicS**: Name of the subscription endpoint - AMQP exchange used for subscription or JMS Topic
	- **noLocal**: Flag indicating whether the client wants to receive its own messages (true) or not (false). That flag should be used when publishing and subscription endpoints are the same.
	- **messageDestinationFuncHandle**: Function that will be used to process received messages from subscription endpoint in a format: _function(messageBody)_
	- **errorFuncHandle**: function that is used for error handling in a format of _function(error)_
	- **loggerFuncHandle**: function that is used for logging events in a format of _function(severity, message)_
	- **connectFunctionHandle**: function this is called when connection is established in a format: _function()_
- Add disconnect on window close (shown method uses JQuery):
	```javascript
	...
	
	var client=UniversalClientDef(protocol);
	...

	$(document).ready(function () {
		client.connect(url, username, password, topicP, topicS, noLocal, messageDestinationFuncHandle,errorFuncHandle, loggerFuncHandle, connectFunctionHandle);
		
		...
		$( window ).unload(function() {
            // Disconnect
            client.disconnect();
        });
		
	}

	```
- To send messages use sendMessage(msg) method
	where _**msg**_ is message to be sent. If _**msg**_ is not a string it will be converted to JSON.
	```javascript
	...
	
	var client=UniversalClientDef(protocol);
	...
	
	var sendMessage=function(msg){
		// Send message
    	client.sendMessage(msg);
	}


	$(document).ready(function () {
		client.connect(url, username, password, topicP, topicS, noLocal, messageDestinationFuncHandle,errorFuncHandle, loggerFuncHandle, connectFunctionHandle);
		
		...
		$( window ).unload(function() {
            // Disconnect
            client.disconnect();
        });
		
	}
	```
- When message is received, service will call a function registered as **messageDestinationFuncHandle** as shown above. E.g.  

	```javascript
	...
	
	var client=UniversalClientDef(protocol);
	...
	
	var sendMessage=function(msg){
		// Send message
    	client.sendMessage(msg);
	}

	var processReceivedCommand=function(cmd){
		// Process received message
	}	

	$(document).ready(function () {
		client.connect(url, username, password, topicP, topicS, noLocal, processReceivedCommand,errorFuncHandle, loggerFuncHandle, connectFunctionHandle);
		
		...
		$( window ).unload(function() {
            // Disconnect
            client.disconnect();
        });
		
	}	

	```
- To handle WebSocket errors, specify the function **errorFuncHandle** or pass _null_ if not needed. E.g.:
	```javascript
	...
	
	var client=UniversalClientDef(protocol);
	...
	
	var sendMessage=function(msg){
		// Send message
    	client.sendMessage(msg);
	}

	var processReceivedCommand=function(cmd){
		// Process received message
	}	
	
	var handleWebSocketError = function (error) {
		// Habdle WebSocket error
	}
	
	$(document).ready(function () {
		client.connect(url, username, password, topicP, topicS, noLocal, processReceivedCommand,handleWebSocketError, loggerFuncHandle, connectFunctionHandle);
		
		...
		$( window ).unload(function() {
            // Disconnect
            client.disconnect();
        });
		
	}	
	```

- To log WebSocket related events, specify the function **loggerFuncHandle** or pass null if not needed. E.g.:  
	```javascript
	...
	
	var client=UniversalClientDef(protocol);
	...
	
	var sendMessage=function(msg){
		// Send message
    	client.sendMessage(msg);
	}

	var processReceivedCommand=function(cmd){
		// Process received message
	}	
	
	var handleWebSocketError = function (error) {
		// Habdle WebSocket error
	}
	
	var logWebSocketMessage = function (cls, msg) {
		// Log WebSocket messages
	}
	
	$(document).ready(function () {
		client.connect(url, username, password, topicP, topicS, noLocal, processReceivedCommand,handleWebSocketError, logWebSocketMessage, connectFunctionHandle);
		
		...
		$( window ).unload(function() {
            // Disconnect
            client.disconnect();
        });
		
	}	
	```
	
- To perform post-connect initalizations, specify the function **connectFunctionHandle** or pass null if not needed. E.g.:  
	```javascript
	...
	
	var client=UniversalClientDef(protocol);
	...
	
	var sendMessage=function(msg){
		// Send message
    	client.sendMessage(msg);
	}

	var processReceivedCommand=function(cmd){
		// Process received message
	}	
	
	var handleWebSocketError = function (error) {
		// Habdle WebSocket error
	}
	
	var logWebSocketMessage = function (cls, msg) {
		// Log WebSocket messages
	}
	
	var onWebSocketConnected = function () {
		// Do some post-connect initialization
	}


	$(document).ready(function () {
		client.connect(url, username, password, topicP, topicS, noLocal, processReceivedCommand,handleWebSocketError, logWebSocketMessage, onWebSocketConnected);
		
		...
		$( window ).unload(function() {
            // Disconnect
            client.disconnect();
        });
		
	}	
	```
## Organization of Kaazing JavaScript Universal Client   

![][image-1]

As shown on the diagram above, Kaazing Universal Client works as following:
- Determine Client Library Facade based on the specified protocol
- Download all necessary JavaScript libraries including the needed Client Library Facade using RequireJS.
	- <font color='red'> **Notes:** </font>
	
		- Kaazing AMQP client libraries require Kaazing WebSocket library to be downloaded and instantiated first, to achieve it Universal Client uses the following code:

			```javascript
			...
			 requirejs(['bower_components/kaazing-amqp-0-9-1-client-javascript/javascript/WebSocket.js'],function(){
                    requirejs(['bower_components/kaazing-amqp-0-9-1-client-javascript/javascript/Amqp-0-9-1.js', 'bower_components/kaazing-javascript-universal-client/javascript/src/AmqpUniversalClient.js'], function () {
                    ...
              });
            });
            ...
            ```						
            
		- <font color='orange'> Due to certain limitations, RequireJS cannot download Kaazing JMSClient.js library - hence it has to be included in the \<head\> section </font>
- Instantiate required Client Facade Library that will interact with necessary Kaazing Javascript Client Libraries
- Pass the data to and from the Kaazing Javascript Client libraries via instantiated Client Facade Library

For more information about Client Facade libraries see 
[AMQP Client Libraries Facade][2] and [JMS Client Libraries Facade][3].   

[1]:	README.md
[2]:	KaazingAMQPClientLibrariesFacade.md
[3]:	KaazingJMSClientLibrariesFacade.md
[image-1]:	images/JavascriptUniversalClient.png "Javascript Universal Client"
