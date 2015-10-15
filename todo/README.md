# TODO Application
This repository contains simple TODO application that can be used with Kaazing AMQP or JMS brokers.

Application loads 5 todo items from JSON file and notifies other users when
- Item is marked complete/incomplete
- Item is being worked on by one client as being disabled on the others

Application uses [Kaazing Universal Clients for Javascript][1] open source library.

For technology specific implementations see:
- Javascript implementation
- AngularJS implementation  

## Obtaining and configuring Kaazing Gateways and related Servers
TODO application depend on the Kaazing WebSocket Gateway (KWG) being installed on one or more servers. KWG supports two protocols, AMQP and JMS.

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



[1]:	https://github.com/kaazing/universal-client/tree/develop/javascript
[5]:	http://developer.kaazing.com/downloads/amqp-edition-download/
[6]:	https://qpid.apache.org/
[7]:	http://developer.kaazing.com/downloads/jms-edition-download/
[8]:	http://activemq.apache.org/