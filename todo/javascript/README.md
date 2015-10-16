
This repository contains simple TODO application written using plain Javascript that can be used with Kaazing AMQP or JMS brokers.

Application loads 5 todo items from JSON file and notifies other users when
- Item is marked complete/incomplete
- Item is being worked on by one client as being disabled on the others

Application uses [Kaazing Universal Clients for Javascript][1] open source library - for specifics how to use the library with plain Javascript see [Kaazing JavaScript Universal Client for Javascript][2]

[1]:	https://github.com/kaazing/universal-client/tree/develop/javascript
[2]:	https://github.com/kaazing/universal-client/blob/develop/javascript/JavaScriptClient.md

## Tutorial
In this tutorial we will guide you through development of a simple shared TODO application using [AngularJS](http://angularjs.org). We assume that you are familiar with AngularJS framework and will mostly focus on WebSocket-related features of an application.

### Preparation
In order to develop an application we need to:
- Create directory structure:

	- _root_
		- js
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
        <script src="bower_components/jquery/dist/jquery.js"></script>
        <script src="bower_components/requirejs/require.js"></script>
        <link href="bower_components/bootstrap/dist/css/bootstrap.css" rel="stylesheet"/>
        <link href="bower_components/bootstrap/dist/css/bootstrap-theme.css" rel="stylesheet"/>
        <link href="css/app.css" rel="stylesheet"/>
        <script src="bower_components/kaazing-jms-client-javascript/javascript/src/JmsClient.js"></script>
        <script src="bower_components/kaazing-javascript-universal-client/javascript/src/JavascriptUniversalClient.js"></script>
        <script src="js/main.js"></script>
    </head>
    <body>
    <div id="todoPanel" class="panel">
        <h3 class="panel-header">To Do List</h3>
        <table id="todoTable" class="table">
            <thead>
            <tr>
                <th>#</th>
                <th>Action</th>
                <th>Done</th>
            </tr>
            </thead>
            <tbody></tbody>
        </table>
        <h4>Local Messages</h4>
        <div id="localMessages" class="msg-container">
        </div>
        <h4>WebSocket Messages</h4>
        <div id="wsMessages" class="msg-container">
        </div>
    </div>
    
    </body>
    </html>

	```
	
	As you can see, the page consists of a table where we will be adding items with checkboxes - that is where Todo items will go and two divs for to log events.

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

2. Create _root_/js/main.js
    We will use some basic jQuery functions - for more information see [jQuery documentation](http://api.jquery.com/).
	```javascript
	var createTableRow = function (item) {
        var row = "<tr class='Blue'>";
        row += "<td>" + item.id + "</td>";
        row += "<td>" + item.action + "</td>";
        row += "<td class='action' id='"+item.id+"'>";
        row += "<input type='checkbox' id='"+item.id+"'>";
        row += "</td>";
        row += "</tr>";
        return row;
    }
    
    var selectedItemIndex=-1;
    
    var getDoneColor = function (item) {œ
        if (!item.available) {
            return "Busy";
        }
        else {
            if (item.id==selectedItemIndex) {
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
    
    var setItemColor=function(item){
        $('#'+item.id+".action").removeClass().addClass('action').addClass(getDoneColor(item));
    }
    var createTable=function(items){
        for(var i=0;i<items.length;i++){
            var row=createTableRow(items[i]);
            $('#todoTable > tbody:last-child').append(row);
        }
    }
    
    var todos=null;
    
    var findItem=function(id){
        for(var i=0;i<todos.length;i++){
            if (todos[i].id===id){
                return todos[i];
            }
        }
        return null;
    }
    
    
    
    
    var itemClicked = function (item) {
    	var msg = "Item " + item.id + " is now " + ((item.complete) ? "completed" : "incompleted!");
    	console.info(msg);
    
    	$('#localMessages').append("<div>"+msg+"</div>");
    
    	//Send command "complete" or "incomplete" for this item
    	sendCommand(item, ((item.complete) ? "complete" : "incomplete"));
    }
    
    
    var checkItem=function(item){
        $(":checkbox").filter("#"+item.id).prop('checked', item.complete);
    }
    
    var sendCommand=function(item, command){
    	var cmd = {
    		command: command,
    		item: item.id
    	}
    
    	sendMessage(cmd);
    }
    
    //TODO: Add code to create client
    
    var sendMessage=function(msg){
    	// TODO: Add code to send messages
    	
    }
    
    $(document).ready(function () {
        $.get('data/todo.json', function( r ) {
            todos=r;
            for(var i=0;i<todos.length;i++){
                todos[i].available=true;
            }
            createTable(todos);
            for(var i=0;i<todos.length;i++){
                setItemColor(todos[i]);
            }
            $(":checkbox").change(function() {
                var item=findItem(Number(this.id));
                item.complete=this.checked;
                itemClicked(item);
            });
    
            $(".action").mouseover(function(){
                var item=findItem(Number(this.id));
                selectedItemIndex=Number(this.id);
                setItemColor(item);
                sendCommand(item, "busy");
            });
    
            $(".action").mouseout(function(){
                var item=findItem(Number(this.id));
                selectedItemIndex=-1;
                setItemColor(item);
                sendCommand(item, "available");
            });
    
    		//TODO: Add code to connect
        });
    });
	```
	The does the following:
	- Create helper functions to
	    - Create table of items: _createTableRow_ and _createTable_
	    - Set item color: _getDoneColor_ and _setItemColor_
	    - Handle item being checked/unchecked: _itemClicked_. This function uses function _sendCommand_ that, in turn calls function _sendMessage_ that currently does nothing.
	- As soon the document is loaded    
	    - Loads todo items from _root_/data/todo.json into $scope.todos that is bound to the table. Initially all the items are considered to be available as no-one else could edit them yet.
	    - Once the items are successfully loaded:
	        - Creates table using the helper function and sets the initial color of each item.
	        - Creates event handler for mouseover and mouseout events. Event handlers use function _sendCommand_ that, in turn calls function _sendMessage_ that currently does nothing.
	
Now we should have a complete single-user application.

### Developing multi-user TODO application with WebSockets
To make things easier, we are going to use [Kaazing Universal Client for Javascript library](https://github.com/kaazing/universal-client/blob/develop/javascript/JavaScriptClient.md) that implements the facade for Kaazing JavaScript client libraries.

**All our changes will be done in main.js**

1. We need to create an instance of the Kaazing Universal Client for Javascript KaazingClientService service and create two configurations for connecting with Gateways - one for JMS and one for AMQP. We will detect which protocol to use by using the first URL parameter and then pass it to the Universal Client library. 

	```javascript

    ...
    //TODO: Add code to create client
    var protocol=window.location.search.replace("?", "").split("&")[0];
    
    var client=UniversalClientDef(protocol);
    var connectionInfo=null;
    if (protocol=="amqp") {
        connectionInfo = {
            URL: "ws://localhost:8001/amqp",
            TOPIC_PUB: "todo",
            TOPIC_SUB: "todo",
            username: "guest",
            password: "guest"
        };
    }
    else if (protocol=="jms") {
        connectionInfo = {
            URL: "ws://localhost:8001/jms",
            TOPIC_PUB: "/topic/Todo",
            TOPIC_SUB: "/topic/Todo",
            username: "",
            password: ""
        };
    }
    else{
        alert("Use: http://<host/port>/todo.html?<protocol>. Unknown protocol: "+protocol);
    }
    ...
    $(document).ready(...)
	```
    This code can be placed anywhere before $(document).ready function.
    
2. Let's add the functionality to log WebSocket messages that will be returned from the Universal Client.
	
	```javascript
    ...
    var logWebSocketMessage = function (cls, msg) {
        if (cls === undefined || cls == null)
            cls = "info";
        cls=cls.toLowerCase();
        console.info("From WebSocket: " + msg);
        $('#wsMessages').append("<div class='msg-"+cls+"'>"+msg+"</div>");
    }
    ...
    $(document).ready(...)

	```
	This code can be placed anywhere before $(document).ready function.

3. Now we need to add the function that will be processing received messages.
	
	```javascript
	...
    var processReceivedCommand=function(cmd){
        logWebSocketMessage("received","Received command: "+cmd.command+", item id: "+cmd.item)
        var item=findItem(cmd.item);
        if (cmd.command==="busy"){
            item.available=false;
        }
        else if (cmd.command==="available"){
            item.available=true;
        }
        else if (cmd.command==="complete"){
            item.complete=true;
        }
        else if (cmd.command==="incomplete"){
            item.complete=false;
        }
        setItemColor(item);
        checkItem(item);
    
    }

    ...
    $(document).ready(...)

	```
	This code can be placed anywhere before $(document).ready function.
	
	As you can see from the code above function received and object that contains _command_ and _item_ (that contains id), locate the matching item and executes the command that could be \
	- 'busy' : somebody is working on the item (their mouse is over it).
	- 'available' : item is no longer worked on 
	- 'complete' : item is checked
	- 'incomplete' : item is unchecked
	
	
4. Now we need to establish connection with the Gateway once the document is ready and the data is loaded.  
	
	```javascript
	...
	
    $(document).ready(function () {
        $.get('data/todo.json', function( r ) {
            ...
    
            //TODO: Add code to connect
            client.connect(connectionInfo.URL, connectionInfo.username, connectionInfo.password, connectionInfo.TOPIC_PUB, connectionInfo.TOPIC_SUB, true, processReceivedCommand,function(err){alert(err);}, logWebSocketMessage, null);
            
            $( window ).unload(function() {
                // TODO: Disconnect
            });
    
        });
	...
	```
	
	
	
	As you can see we pass to the _connect_ function the following parameters
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
 
    var sendMessage=function(msg){
        // TODO: Add code to send messages
        client.sendMessage(msg);
    }
    
    $(document).ready(...)
 
	...
	```
	
6. And, finally, disconnect function to notify gateway when the application is closed.
	
	```javascript
	...
    $(document).ready(function () {
        $.get('data/todo.json', function( r ) {
            ...
    
            //TODO: Add code to connect
            client.connect(connectionInfo.URL, connectionInfo.username, connectionInfo.password, connectionInfo.TOPIC_PUB, connectionInfo.TOPIC_SUB, true, processReceivedCommand,function(err){alert(err);}, logWebSocketMessage, null);
            
            $( window ).unload(function() {
                // TODO: Disconnect
                client.disconnect();
            });
    
        });
    ...
    ```
    	
Now we have a fully functional shared TODO application that can be tested by opening multiple browser instances and using url 

	http://localhost:<your server port>/<path on your server/todo.html?amqp 
	
or 
	
	http://localhost:<your server port>/<path on your server/todo.html?jms

**Note:**
Default configuration for JMS and AMQP gateways uses the same port 8001 so you cannot run them at the same time. 
