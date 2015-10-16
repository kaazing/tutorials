# Shared TODO Application using AngularJS
This repository contains tutorial for writing simple shared TODO application written with Javascript [AngularJS framework][1] that can be used with Kaazing AMQP or JMS brokers.

Application loads 5 todo items from JSON file and notifies other users when
- Item is marked complete/incomplete
- Item is being worked on by one client as being disabled on the others

Application uses [Kaazing Universal Clients for Javascript][2] open source library - for specifics how to use the library with AngularJS see [Kaazing JavaScript Universal Client for AngularJS][3]

## Tutorial
In this tutorial we will guide you through development of a simple shared TODO application using [AngularJS](http://angularjs.org). We assume that you are familiar with AngularJS framework and will mostly focus on WebSocket-related features of an application.

### Preparation
In order to develop an application we need to:
- Create directory structure:

	- _root_
		- js
		
			- controller
		- css
		- data
		
- Copy bower.json to your _root_ directory.	Open command line at your _root_ directory and execute the following command (note, you need to have NodeJS installed).

```bash
bower install
```
- Create _root_/data/todo.json file with todo items with the following or similar content:
```json
[
  {
    "id": 1,
    "action": "Get groceries",
    "complete": false
  },
  {
    "id": 2,
    "action": "Call plumber",
    "complete": false
  },
  {
    "id": 3,
    "action": "Buy running shoes",
    "complete": false
  },
  {
    "id": 4,
    "action": "Buy flowers",
    "complete": false
  },
  {
    "id": 5,
    "action": "Call family",
    "complete": false
  }
]	
```

- Install, configure and start Gateway and server as mentioned in [TODO Tutorials README]()

### Developing single-user TODO application
1. Create _root_/todo.html with the following code:

	```html
	<!DOCTYPE html>
	<html ng-app="webSocketApp">
	<head>
    	<title>WebSocket Test Application</title>
	    <script src="bower_components/angular/angular.js"></script>
    	<script src="bower_components/angularjs-scroll-glue/src/scrollglue.js"></script>
	    <script src="bower_components/requirejs/require.js"></script>
	    <script src="bower_components/jquery/dist/jquery.js"></script>
	    <link href="bower_components/bootstrap/dist/css/bootstrap.css" rel="stylesheet"/>
	    <link href="bower_components/bootstrap/dist/css/bootstrap-theme.css" rel="stylesheet"/>
	    <link href="css/app.css" rel="stylesheet"/>
	    <!-- Unfortunately, the library uses document.write that prevents it from being loaded 	dynamically!!! -->
	    <script src="bower_components/kaazing-jms-client-javascript/javascript/src/JmsClient.js"></script>
	    <script src="js/controller/app.js"></script>
    	<script src="bower_components/kaazing-javascript-universal-client/javascript/src/AngularUniversalClient.js"></script>
	</head>
	<body>
	<div id="todoPanel" class="panel" ng-controller="mainCtl">
    	<h3 class="panel-header">To Do List</h3>
	    <table class="table">
    	    <thead>
        	<tr>
            	<th>#</th>
	            <th>Action</th>
    	        <th>Done</th>
        	</tr>
	        </thead>
    	    <tr ng-repeat="item in todos" class="Blue">
        	    <td>{{item.id}}</td>
            	<td>{{item.action}}</td>
	            <td ng-class="getDoneColor(item)" ng-mouseenter="handleMouseoverEvent($event, item)" ng-mouseleave="handleMouseoverEvent($event, item)">
    	            <input type="checkbox" ng-model="item.complete" ng-change="itemClicked(item)" ng-disabled="!item.available">
        	    </td>
	        </tr>
    	</table>
	    <h4>Local Messages</h4>
    	<div class="msg-container" scroll-glue="glued">
        	<div ng-repeat="message in localMessages">
            	{{message.message}}
	        </div>
    	</div>
	    <h4>WebSocket Messages</h4>
    	<div class="msg-container" scroll-glue="glued">
        	<div ng-repeat="message in webSocketMessages">
            	<p ng-class="message.class">{{message.message}}</p>
	        </div>
    	</div>
	</div>

	</body>
	</html>

	```
	
	As you can see, the page consists of a table of items with checkboxes - that is where Todo items will go and two divs to log events.

2. Create _root_/css/app.css - the stylesheet for the application

	```css
	/* app css stylesheet */
	
	.menu {
		list-style: none;
		border-bottom: 0.1em solid black;
		margin-bottom: 2em;
		padding: 0 0 0.5em;
	}
	
	.menu:before {
		content: "[";
	}
	
	.menu:after {
		content: "]";
	}
	
	.menu > li {
		display: inline;
	}
	
	.menu > li:before {
		content: "|";
		padding-right: 0.3em;
	}
	
	.menu > li:nth-child(1):before {
		content: "";
		padding: 0;
	}
	
	tr.Red {background-color: lightcoral;}
	tr.Green {background-color: lightgreen;}
	tr.Blue {background-color: lightblue;}
	
	.Gray {background-color: lightgray;}
	.Yellow {background-color: lightgoldenrodyellow}
	.Blue {background-color: lightblue;}
	
	.Done {background-color: lightgreen;}
	.NotDone {background-color: lightcoral;}
	.MouseOverNotDone {background-color: lightsalmon}
	.MouseOverDone {background-color: lavender;}
	.Busy {background-color: gray;}
	
	.msg-container {
		width: 80%;
		height: 200px;
		overflow-y: scroll;
		overflow-x:hidden;
	}
	
	.msg-error {color:red}
	.msg-info {color:blue}
	.msg-sent {color:goldenrod}
	.msg-received {color:green}
	```

2. Create _root_/js/controller/app.js
	```javascript
	'use strict';
	
	angular.module("webSocketApp", [])
		.controller("mainCtl", function ($scope, $log, $timeout, $http) {
			$http.get('data/todo.json').
				success(function(data, status, headers, config) {
					$scope.todos = data;
					// Add 'available' attribute to be able to deal with the race condition
					for(var i=0;i<$scope.todos.length;i++){
						$scope.todos[i].available=true;
					}
				});
			$scope.mouseoverIndex = -1;
	
			$scope.handleMouseoverEvent = function (e, item) {
				$log.info("Event type " + e.type);
				$scope.mouseoverIndex = -1;
				if (e.type === "mouseover") {
					$scope.mouseoverIndex = item.id;
	
					//Send command "busy" for this item
					$scope.sendCommand(item, "busy");
				}
				else {
					//Send command "available" for this item
					$scope.sendCommand(item, "available");
				}
			}
			$scope.getDoneColor = function (item) {
				if (!item.available) {
					return "Busy";
				}
				else {
					if ($scope.mouseoverIndex == item.id) {
						if (item.complete)
							return 'MouseOverDone';
						else
							return 'MouseOverNotDone';
					}
					else if (item.complete)
						return 'Done';
					else
						return 'NotDone';
				}
			}
	
			$scope.itemClicked = function (item) {
				var msg = "Item " + item.id + " is now " + ((item.complete) ? "completed" : "incompleted!");
				$log.info(msg);
				var msgObj = {
					id: $scope.localMessages.length,
					message: msg
				}
				$scope.localMessages.push(msgObj);
	
				//Send command "complete" or "incomplete" for this item
				$scope.sendCommand(item, ((item.complete) ? "complete" : "incomplete"));
			}
	
			// Logging and error handling facilities
			$scope.localMessages = [];
				
			$scope.sendCommand = function (item, command) {
				var cmd = {
					command: command,
					item: item.id
				}
	
				// Send the message to the wire
				$scope.sendMessage(cmd);
			}
	
	
			// TODO: Connect to the wire
	
			$scope.sendMessage = function(msg){
				// TODO: Send the message
				
			}
	
			$( window ).unload(function() {
				// TODO: Disconnect
			});
		})
	;
	
	```
	This function creates AngularJS controller that does the following:
	- Loads todo items from _root_/data/todo.json into $scope.todos that is bound to the table. Initially all the items are considered to be available as no-one else could edit them yet.
	- Creates events for handling mouseover events to mark items are unavailable/available. The event handler uses function _sendCommand_ that, in turn calls function _sendMessage_ that currently does nothing.
	- Creates function to specify the css style for the item _getDoneColor_.
	- Creates a handler for item being checked/unchecked. 
	
Now we should have a complete single-user application.

### Developing multi-user TODO application with WebSockets
To make things easier, we are going to use [Kaazing Universal Client for Javascript library][2] that implements the facade for Kaazing JavaScript client libraries.

**All our changes will be done in app.js**

1. We need to add KaazingClientService service and create two configurations for connecting with Gateways - one for JMS and one for AMQP. 

	```javascript
	angular.module("webSocketApp", ['KaazingClientService'])
		.constant('amqpWebSocketConfig', {
			URL: "ws://localhost:8001/amqp",
			TOPIC_PUB: "todo",
			TOPIC_SUB: "todo",
			username: "guest",
			password: "guest"
		})
		.constant('jmsWebSocketConfig', {
			URL: "ws://localhost:8001/jms",
			TOPIC_PUB: "/topic/Todo",
			TOPIC_SUB: "/topic/Todo",
			username: "",
			password: ""
		})
	    .controller("mainCtl", function ($scope, $log, $timeout, $http, amqpWebSocketConfig, jmsWebSocketConfig,AngularUniversalClient) {	    	    
	```

2. Let's add the functionality to log WebSocket messages that will be returned from the Universal Client.
	
	```javascript
	      // Logging and error handling facilities
	      ...
        $scope.localMessages = [];
        $scope.webSocketMessages = [];
        $scope.logWebSocketMessageImpl = function (cls, msg) {
            if (cls === undefined || cls == null)
                cls = "info";
            $log.info("From WebSocket: " + msg);
            var msgObj = {
                id: $scope.webSocketMessages.length,
                class: "msg-" + cls,
                message: msg
            }
            $scope.webSocketMessages.push(msgObj);

        }
        $scope.logWebSocketMessage = function (cls, msg) {
            $timeout($scope.logWebSocketMessageImpl(cls.toLowerCase(),msg), 100);
        }

        $scope.sendCommand = function (item, command) {
		...
	```
	**Note:** Due to asynchronous nature of WebSocket libraries and AngularJS we will be using timer to add the messages to the log window.
3. Now we need to add the function that will be processing received messages.
	
	```javascript
	...
	 $scope.sendCommand = function (item, command) {
            var cmd = {
                command: command,
                item: item.id
            }

            // Send the message to the wire
            $scope.sendMessage(cmd);
        }

	 // Main function to process received messages
        $scope.processReceivedCommand=function(cmd){
            $scope.logWebSocketMessage("received","Received command: "+cmd.command+", item id: "+cmd.item)
            for(var i=0;i<$scope.todos.length;i++){
                if ($scope.todos[i].id===cmd.item){
                    if (cmd.command==="busy"){
                        $scope.todos[i].available=false;
                    }
                    else if (cmd.command==="available"){
                        $scope.todos[i].available=true;
                    }
                    else if (cmd.command==="complete"){
                        $scope.todos[i].complete=true;
                    }
                    else if (cmd.command==="incomplete"){
                        $scope.todos[i].complete=false;
                    }
                }
            }
        }	

	```
	
	As you can see from the code above function received and object that contains _command_ and _item_ (that contains id), locate the matching item and executes the command that could be \
	- 'busy' : somebody is working on the item (their mouse is over it).
	- 'available' : item is no longer worked on 
	- 'complete' : item is checked
	- 'incomplete' : item is unchecked
	
4. Now we need to establish connection with the Gateway. First we will detect which protocol to use (by using the first URL parameter and then establish appropriate connection):
	
	```javascript
	...
	  $scope.protocol=window.location.search.replace("?", "").split("&")[0];
        // TODO: Connect to the wire
        if ($scope.protocol=="amqp") {
            AngularUniversalClient.connect("amqp",amqpWebSocketConfig.URL,amqpWebSocketConfig.username, amqpWebSocketConfig.password, amqpWebSocketConfig.TOPIC_PUB, amqpWebSocketConfig.TOPIC_SUB, true, $scope.processReceivedCommand, function(err){alert(err);}, $scope.logWebSocketMessage, null );
        }
        else if ($scope.protocol=="jms") {
            AngularUniversalClient.connect("jms",jmsWebSocketConfig.URL,jmsWebSocketConfig.username, jmsWebSocketConfig.password, jmsWebSocketConfig.TOPIC_PUB, jmsWebSocketConfig.TOPIC_SUB, true, $scope.processReceivedCommand, function(err){alert(err);}, $scope.logWebSocketMessage, null );
        }
        else{
            alert("Use: http://<host/port>/todo.html?<protocol>. Unknown protocol: "+protocol);
        }
	...
	```
	As you can see we pass the to universal client the following parameters
		- protocol to use amqp/jms
		- URL
		- user name
		- user password 
		- name of publishing endpoint 
		- name of subscription endpoint - in our case it is the same as publishing
		- true flag indicating that we do not want to receive our own messages
		- function to receive and process messages
		- function to process errors
		- function to log WebSocket messages
		- null instead of the function name to indicate that we do not need to do any post-connect initializations.
		
5. In order to send messages, all we need to do is add AngularUniversalClient.sendMessage(msg) to our $scope.sendCommand function
	
	```javascript
	...	
        $scope.sendMessage = function(msg){
            // TODO: Send the message
            AngularUniversalClient.sendMessage(msg);
        }
	...
	```
	
6. And, finally, disconnect function to notify gateway when the application is closed.
	
	```javascript
	...
        $scope.sendMessage = function(msg){
            // TODO: Send the message
            AngularUniversalClient.sendMessage(msg);
        }

        $( window ).unload(function() {
            // TODO: Disconnect
            AngularUniversalClient.disconnect();
        });
    });
    ```

Now we have a fully functional shared TODO application that can be tested by opening multiple browser instances and using url 

	http://localhost:<your server port>/<path on your server/todo.html?amqp 
	
or 
	
	http://localhost:<your server port>/<path on your server/todo.html?jms

**Note:**
Default configuration for JMS and AMQP gateways uses the same port 8001 so you cannot run them at the same time. 

[1]:	https://angularjs.org/
[2]:	https://github.com/kaazing/universal-client/tree/develop/javascript
[3]:	https://github.com/kaazing/universal-client/blob/develop/javascript/AngularJSClient.md