# Universal Clients for JavaScript Applications
The [Kaazing JavaScript WebSocket Universal Clients][2] library that can be also used with AngularJS, ReactJS and so on.

Both implementation use the same underlying [JavaScript AMQP Client Libraries Facade][3] and [JavaScript JMS Client Libraries Facade][4] scripts for interaction with Kaazing AMQP and JMS client libraries.
Please, refer to the links above for the details about the details of the usage and implementations.

## Using the Client Libraries
### Using Client Libraries with Bower
#### Obtaining Libraries
- Install NodeJS - please refer to the [NodeJS downloads page][9] for the installer that is appropriate for your OS
- Update npm  
	`sudo npm update npm -g`
- Install bower:  
	`sudo npm install -g bower`

- Install Kaazing Universal Javascript client libraries
	`bower install kaazing-javascript-univeral-client`
	
__Note__: If you used prior versions of the library you may want to clean bower cache by running:
	`bower cache clean`
	
#### Using the library
Add the following to your main html page (index.html):
```
<script src="bower_components/requirejs/require.js"></script>
<script src="bower_components/kaazing-javascript-universal-client/javascript/src/JavascriptUniversalClient.js"></script>
```

***Note***: When using JMS, add the following line to your main html page:
```
<script src="bower_components/kaazing-jms-client-javascript/javascript/src/JmsClient.js"></script>	
```

### Using Client Libraries with NPM
#### Obtaining Libraries
- Install NodeJS - please refer to the [NodeJS downloads page][9] for the installer that is appropriate for your OS
- Update npm  
	`sudo npm update npm -g`
- Install Kaazing Universal Javascript client libraries
	`npm install kaazing-javascript-universal-client`
	
#### Using the library
Add the following to your main html page (index.html):
```
<script src="node_modules/requirejs/require.js"></script>
<script src="node_modules/kaazing-javascript-universal-client/javascript/src/JavascriptUniversalClientNPM.js"></script>
```

***Note***: When using JMS, add the following line to your main html page:
```
<script src="<script src="node_modules/kaazing-javascript-universal-client/node_modules/kaazing-javascript-jms-client/JmsClient.js"></script>"></script>	
```

### Obtaining and Configuring Kaazing Gateway
The Kaazing Universal WebSocket clients depend on the Kaazing WebSocket Gateway (KWG) being installed on one or more servers. KWG supports two protocols, AMQP and JMS. Read [Obtaining and configuring Kaazing Gateways and related Servers](https://github.com/kaazing/universal-client/blob/develop/ObtainingGateways.md) for more information.

### Documentation

### AMQP
- [How to Build JavaScript Clients Using Kaazing  WebSocket Gateway][10]
- [Use the Kaazing WebSocket Gateway JavaScript AMQP Client Library][11]

### JMS
- [Build JavaScript JMS Clients Using Kaazing WebSocket Gateway - JMS Edition](http://developer.kaazing.com/documentation/jms/4.0/dev-js/o_dev_js.html)
- [Use the Kaazing WebSocket Gateway JavaScript JMS Client API][13]


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



