# Kaazing Javascript & AngularJS TodoMVC Example using REST simulation

> Kaazing is the world's most scalable, secure, and robust WebSocket platform for real-time Web communication

> _[Kaazing - kaazing.com][1]_


## Using Kaazing Technology
The [Kaazing Developers website][2] is a great resource for getting started.

Here are some links you may find helpful:

* [WebSockets][3]
* [Kaazing Universal Client for Javascript][4]
* [API Reference][5]
* [Using Kaazing JavaScript AMQP Clients][6]
* [Forums][7]
* [Blog][8]
* [FAQ][9]


_If you have other helpful links to share, or find any of the links above no longer work, please [let us know][10]._

## Implementation
Application enhances AngularJS TodoMVC published on [TodoMVC site](http://todomvc.com/examples/angularjs/#/) with real-time capabilities.

Kaazing WebSocket enables Web application to use publish/subscribe model. Application notifies other instances when
- Item is created
- Item is complete/incomplete
- Item text is modified
- Item is ‘busy’ - somebody is working on it to help dealing with the race conditions.

Application also contains NodeJS backend components that connects to AMQP server and receives all messages thus maintaining the current state of the items. Once the connection is established Web clients can obtain all the items in their current state by sending initialization request.
_Helper component that emulates socket.io behavior for backward compatibility with existing NodeJS socket.io implementations is located under **node/socketioalt.js**

### REST simulation and reference implementation with Socket.io
To simplify transition from REST-based implementation we also provide a REST emulation client wrapper AngularJS service (js/services/AngularRestEmulationClient.js), Node.js back end REST emulator (restalt.js) and a reference application (serverrestem.js) to illustrate the simplicity of the transition from REST API to Kaazing WebSocket. 

## Installing Kaazing AMQP Gateway
- Download AMQP Gateway (Gateway + Documentation + Demos) from  [AMQP Gateway downloads page][11] as a ZIP file
	**This package also contains AMQP server Apache QPID** see - [Apache QPID][12] for more information.
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
	
## Running the application
- Install NodeJS as specified at [NodeJS Site][https://nodejs.org/en/]
- Install required packages:

```bash
cd <application directory>
npm install amqplib
npm install express
npm install http
bower install
```

- Start the application

```bash
node serverrestem.js
```

- Test the application - open multiple instances of browser on http://localhost:3000




[1]:	http://kaazing.com/
[2]:	http://developer.kaazing.com/
[3]:	http://websocket.org
[4]:	https://github.com/kaazing/universal-client/tree/develop/javascript
[5]:	http://developer.kaazing.com/documentation/amqp/4.0/apidoc/client/javascript/amqp/index.html
[6]:	http://developer.kaazing.com/documentation/amqp/4.0/dev-js/p_dev_js_client.html
[7]:	http://developer.kaazing.com/forums/
[8]:	http://blog.kaazing.com/
[9]:	http://developer.kaazing.com/documentation/faq.html
[10]:	https://github.com/kaazing/tutorials/issues
[11]:	http://developer.kaazing.com/downloads/amqp-edition-download/
[12]:	https://qpid.apache.org/
