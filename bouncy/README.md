# Bouncy Ball

This repository contains Bouncy Ball Application demonstrating the ball bouncing between multiple screens. For more information visit [Bouncy Ball Demo on Kaazing Web Site](http://developer.kaazing.com/portfolio/bouncy-ball).

## Obtaining and configuring Kaazing Gateways and related Servers
The application requires that the Kaazing WebSocket Gateway (KWG) JMS edition to be installed on one or more servers.

- Download JMS Gateway (Gateway + Demos) from  [JMS Gateway Download Site][7] as a ZIP file
	**This package also contains JMS server Apache ActiveMQ**, see - [Apache ActiveMQ][8] for more information.
- Unzip downloaded package to _\<your installation directory\>_
- **_By default Gateway is configured to restrict communications only to/from the scripts that are running on its embedded servers_**. This may not be convenient for Web Development. In order to remove this restriction, please:
	- Open __gateway\_config.xml__
	- Locate lines  
		    _\<allow-origin>http://${gateway.hostname}:${gateway.extras.port}\</allow-origin>_
and replace them with 
    		_\<allow-origin>
	    	\*\</allow-origin>_
- **_By default Gateway is configured to run on localhost with JMS service running on port 8001_**. This will not allow the demo to run from any other host. In order to change it:
	- Determine IP address of your host that is accessible from your mobile device
	- Goto _\<your installation directory\>/kaazing-websocket-gateway-jms-4.0.9/conf _
	- Open __gateway\_config.xml__
        - Replace "localhost" with an IP address that's accessible from your mobile device.
          **Note** By default JMS service is configured to run on port 8001. Make sure that this port on your is accessible from the outside or change the port settings by modifying the value of _gateway.extras.port_ property.
- Make sure that you have Java 7 or greater installed
- Open terminal window at _\<your installation directory\>/kaazing-websocket-gateway-jms-4.0.9/bin _ and start gateway  
		`./gateway.start`
- Open terminal window at  _\<your installation directory\>/apache-activemq-5.10.0/bin _ and start Apache Active MQ JMS server  
		`./activemq start`
- **Note**: to stop:
		- Gateway: execute _Ctrl-C_ on the relevant terminal windows or just close it.
		- Apache ActiveMQ JMS Server: open terminal window at  _\<your installation directory\>/apache-activemq-5.10.0/bin _ and execute  
			`./activemq stop`

## Installing and running the demo
- Install the necessary JavaScript components

    ```
    cd <application directory>
    npm install
    ```
- Open <application directory>/js/bouncy.js and set the value of _host_ variable to the host your application is running on. 
    **Node** If you modified the port settings of the gateway by changing the value of _gateway.extras.port_ property, you will need to also modify the value of _port_ variable in bouncy.js
- Start NodeJS application 

    ```
    node index.js
    ```
- Use a browser on a desktop to open http://localhost:3000. DON'T move your mouse over the rectangles in the sidewall.
- Open the same URL in a mobile device.
- Hold the device up to the screen next to the browser image.
- On the phone, press the joining wall. Ball will go from one screen to another.
  **Note:** Alternative is to replace mobile device with another browser instance of tab pointing to the same URL.

