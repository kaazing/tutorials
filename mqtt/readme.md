# Kaazing Javascript & AngularJS TodoMVC over MQTT Example including Java application for Raspberry PI

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
The purpose of the application is to enhance AngularJS TodoMVC published on [TodoMVC site](http://todomvc.com/examples/angularjs/#/) with real-time capabilities using MQTT broker as well as to add interaction with an IoT device using MQTT via WebSocket.
The following diagram illustrates the architecture of an application:

![Application Architecture](application-architecture.png?raw=true "Application Architecture")

_AngularJS JavaScript component Application uses [Paho JavaScript MQTT client library](https://eclipse.org/paho/clients/js/) that runs on top of Kaazing WebSocket._

Kaazing WebSocket and MQTT enables the original application to use publish/subscribe model. Application notifies other instances when
- Item is created
- Item is complete/incomplete
- Item text is modified
- Item is ‘busy’ - somebody is working on it to help dealing with the race conditions.

Application contains java component for Raspberry Pie that emulates the IoT client. The client reads the clicks from the button that is connected to GPIO 2 and sends them to the server via MQTT over WebSocket. When the server decides that the IoT device needs maintenance it:
- Adds an entry to the Todo application
- Send the 'maintenance light on' message to the device. 
Upon receiving the message, the device turns on the LED connected to GPIO 0.
Once the Todo item is checked, server sends 'maintenance light off' message causing the java application to turn off the light. 
Java application is written using [Paho Java MQTT client](https://projects.drogon.net/raspberry-pi/wiringpi/pins/) that is upgraded to run over Kaazing WebSocket; interaction with with GPIO is implemented using [PI4J](http://pi4j.com) library.
 
![Circuit Diagram for Raspberry PI component](raspberry-wiring.png?raw=true "Circuit Diagram for Raspberry PI component")


Server logic is implemented using NodeJS backend components that connects to MQTT server and receives all messages thus maintaining the current state of the items. Once the connection is established Web clients can obtain all the items in their current state by sending initialization request. Server component also receives the messages from the IoT device and, once the number of clicks reaches certain limit, makes a decision to request maintenance on the device as described about. 
_Helper component that emulates socket.io behavior for backward compatibility with existing NodeJS socket.io implementations is located under **node/socketioalt.js**_



### Reference implementation with Socket.io
We also provide similar application that is written using [socket.io](http://socket.io) to illustrate the simplicity of the transition from socket.io to Kaazing WebSocket over MQTT. 
The files that are specific for this reference implementation are:
- serversocketio.js - NodeJS server component
- js/app-socketio.js - application module declaration that does not refer to Paho over Kaazing Client library (compare with app.js).
- js/controllers/todoCtrl-socketio.js - main controller that uses socket.io for communications (compare with todoCtrl.js).
- index-socketio.html - Main HTML page that contains references to so


## Installing and configuring Kaazing WebSocket Gateway and MQTT broker
- Download Kaazing Gateway 5.0.0 from [Kaazing Community downloads page][11] 
	**This package also contains AMQP server Apache QPID** see - [Apache QPID][12] for more information.
- Unzip downloaded package to _\<your installation directory\>_
- Copy [gateway-config.xml] to _\<your installation directory\>/conf_
- You need to configure the gateway to bind to your IP address (not localhost). To do that
	- Determine your IP address. If you have multiple network cards, make sure that you use the IP address of the card that is on the same subnet as Raspberry PI.
	- Go to _\<your installation directory\>/kaazing-websocket-gateway-amqp-4.0.6/conf _
	- Edit __gateway\-config.xml__
- Locate lines  
		_\<value>ADD YOUR IP ADDRESS HERE\</value>_
and replace them with your IP address
- Download and start MQTT broker.
	- We use [Open Source Mosquitto Broker](http://mosquitto.org/); look [here](http://mosquitto.org/download/) for downloads and installation instruction
	- Open terminal window and start Mosquitto with verbose output. 
	
	```bash
	mosquitto -v
	```
- Make sure that you have Java 8 or greater installed
- Open terminal window at _\<your installation directory\>/kaazing-websocket-gateway-amqp-4.0.6/bin_ and start gateway  

	```bash
	./gateway.start
	```
	
## Running the application
- Building JavaScript application
	- Install NodeJS as specified at [NodeJS Site](https://nodejs.org/en/)
	- Install required packages for JavaScript:

	```bash
	cd <application directory>/javascript
	npm install 
	```
- Build java application
	- Download Gradle as specified at [Gradle Downloads page](http://gradle.org/gradle-download/)
	- Install Gradle; follow the instructions at [Install Gradle page](https://docs.gradle.org/current/userguide/installation.html/)
	- Open terminal window and build the application
	
	```bash
	cd <application directory>/java/raspberry-mqtt
	gradle installDist
	```
	- Copy the contents of _\<application directory>/java/raspberry-mqtt/build/install/raspberry-mqtt_ to your Raspberry PI
	
	```bash
	cd _\<application directory>/java/raspberry-mqtt/build/install
	tar cvf raspberry-mqtt.tar raspberry-mqtt
	scp raspberry-mqtt.tar pi@<your Raspberry Pi address>:/home/pi
	```
	
	- Unzip the application on Raspberry PI
	
	```bash
	ssh pi@<your Raspberry Pi address>
	tar xvf raspberry-mqtt.tar
	```
	

- Start javascript application

```bash
cd <application directory>/javascript
node serverws.js
```

- Test the JavaScript application - open multiple instances of browser on __http://localhost:3000/?<address:port of your gateway>__; e.g. __http://localhost:3000/?192.168.6.153:8080__

- Start java application on Raspberry PI

```bash
ssh pi@<your Raspberry Pi address>
sudo raspberry-mqtt/bin/raspberry-mqtt ws://<address:port of your gateway>/mqtt <any device id>
e.g
sudo raspberry-mqtt/bin/raspberry-mqtt ws://192.168.6.153:8080/mqtt pi1
```

- Test the application:
	- Click on the button 10 times. You should see:
		- LED going on
		- An entry appearing in your Todo list: _Perform maintenance on <your device id>_; e.g. _Perform maintenance on pi1_
	- Check this entry as completed in your Todo list; LED on the device should go off.
	


### Running socket.io reference implementation
- Install required packages:

```bash
cd <application directory>
npm install socket.io
```
- Start the application

```bash
cd <application directory>/javascript
node serversocketio.js
```

- Test the application - open multiple instances of browser on http://localhost:3000/index-socketio.html



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
[11]:	http://kaazing.org/download/
[12]:	https://qpid.apache.org/
