# Universal Clients for JavaScript Applications
The Kaazing JavaScript WebSocket Universal Clients library contains implementation of the Universal Clients including:
- [AngularJS Service][1]
- [JavaScript library][2]

Both implementation use the same underlying [AMQP Client Libraries Facade][3] and [JMS Client Libraries Facade][4] scripts for interaction with Kaazing AMQP and JMS client libraries. 
Please, refer to the links above for the details about the details of the usage and implementations.

## Obtaining Client Libraries with Bower
- Install NodeJS - please refer to the [NodeJS downloads page][9] for the installer that is appropriate for your OS
- Update npm  
	`sudo npm install npm -g`
- Install bower:  
	`sudo npm install -g bower`
- Install Kaazing Universal Javascript client libraries
	`bower install kaazing-javascript-univeral-client`

## Obtaining and configuring Kaazing Gateways and related Servers
The Kaazing Universal WebSocket clients depend on the Kaazing WebSocket Gateway (KWG) being installed on one or more servers. KWG supports two protocols, AMQP and JMS.

### AMQP
- Download AMQP Gateway (Gateway + Documentation + Demos) from  [AMQP Gateway downloads page][5] as a ZIP file
	**This package also contains AMQP server Apache QPID** see - [Apache QPID][6] for more information.
- Unzip downloaded package to _\<your installation directory\>_
- **_By default Gateway is configured not to restrict communications only from the scripts that are running on its embedded servers_** which may not be convenient for Web Development. In order to disable it
	- Go to _\<your installation directory\>/kaazing-websocket-gateway-amqp-4.0.6/conf _
	- Edit __gateway\_config.xml__
	- Locate lines  
		_\<allow-origin>http://${gateway.hostname}:${gateway.extras.port}\</allow-origin>_
and replace them with 
		_\<allow-origin>\*\</allow-origin>_
	- Make sure that you have Java 7 or greater installed
	- Open terminal window at _\<your installation directory\>/kaazing-websocket-gateway-amqp-4.0.6/bin_ and start gateway  
		`./gateway.start`
	- Open terminal window at _\<your installation directory\>/qpid-java-broker-0.28/bin_ and start Apache QPID AMQP server  
		`./qpid-server`
	- **Note**: to stop both Gateway and AMQP server just execute _Ctrl-C_ on the relevant terminal windows or just close them.  

#### Documentation
- [How to Build JavaScript Clients Using Kaazing  WebSocket Gateway][10]
- [Use the Kaazing WebSocket Gateway JavaScript AMQP Client Library][11]

#### Important AMQP Notes
- AMQP Facade library uses Fanout Exchange as the publishing endpoint which does not user Routing Key. Queue is automatically generated based on the unique client ID and is bound to the Exchange. For more information about Exchanges,  Routing and Queues refer to [RabbitMQ AMQP 0-9-1 Model Explained][14]

### JMS
- Download JMS Gateway (Gateway + Demos) from  [JMS Gateway Download Site][7] as a ZIP file
	**This package also contains JMS server Apache ActiveMQ** see - [Apache ActiveMQ][8] for more information.
- Unzip downloaded package to _\<your installation directory\>_
- **_By default Gateway is configured not to restrict communications only from the scripts that are running on its embedded servers_** which may not be convenient for Web Development. In order to disable it
	- Goto _\<your installation directory\>/kaazing-websocket-gateway-jms-4.0.9/conf _
	- Open __gateway\_config.xml__
	- Locate lines  
		_\<allow-origin>http://${gateway.hostname}:${gateway.extras.port}\</allow-origin>_
and replace them with 
		_\<allow-origin>
		\*\</allow-origin>_

	- Make sure that you have Java 7 or greater installed
	- Open terminal window at _\<your installation directory\>/kaazing-websocket-gateway-jms-4.0.9/bin _ and start gateway  
		`./gateway.start`
	- Open terminal window at  _\<your installation directory\>/apache-activemq-5.10.0/bin _ and start Apache Active MQ JMS server  
		`./activemq start`
	- **Note**: to stop:
		- Gateway: execute _Ctrl-C_ on the relevant terminal windows or just close it.
		- Apache ActiveMQ JMS Server: open terminal window at  _\<your installation directory\>/apache-activemq-5.10.0/bin _ and execute  
			`./activemq stop`

#### Documentation
- [Build JavaScript JMS Clients Using Kaazing WebSocket Gateway - JMS Edition](http://developer.kaazing.com/documentation/jms/4.0/dev-js/o_dev_js.html)
- [Use the Kaazing WebSocket Gateway JavaScript JMS Client API][13]

#### Important JMS Notes
- JMS Subscription created by the Facade Library is not durable - the client will not receive any messages that were sent before the subscription started. More information about durable subscriptions can be found at [Messaging Patterns][15].
- Due to the blocking nature of JMS, application that use JMS client may receive an exception when sending large number of messages _IllegalStateException: Message send already in progress_

[1]:	AngularJSClient.md "AngularJS Service"
[2]:	JavaScriptClient.md "JavaScript library"
[3]:	KaazingAMQPClientLibrariesFacade.md
[4]:	KaazingJMSClientLibrariesFacade.md
[5]:	http://developer.kaazing.com/downloads/amqp-edition-download/
[6]:	https://qpid.apache.org/
[7]:	http://developer.kaazing.com/downloads/jms-edition-download/
[8]:	http://activemq.apache.org/
[9]:	https://nodejs.org/en/download/
[10]:	http://developer.kaazing.com/documentation/amqp/4.0/dev-js/o_dev_js.html#keglibs
[11]:	http://developer.kaazing.com/documentation/amqp/4.0/dev-js/p_dev_js_client.html
[13]:	http://developer.kaazing.com/documentation/jms/4.0/dev-js/p_dev_js_client.html
[14]:	https://www.rabbitmq.com/tutorials/amqp-concepts.html
[15]:	http://www.enterpriseintegrationpatterns.com/patterns/messaging/DurableSubscription.html
