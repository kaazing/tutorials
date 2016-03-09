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

		$scope.protocol=window.location.search.replace("?", "").split("&")[0];
		// TODO: Connect to the wire
        var connectionInfo=null;
        var noLocal=true;
        var TOPIC_PUB=null;
        var	TOPIC_SUB=null;
        if ($scope.protocol=="amqp") {
            connectionInfo = {
                url: "ws://localhost:8001/amqp",
                username: "guest",
                password: "guest"
            };
            TOPIC_PUB="todo";
            TOPIC_SUB="todo";
        }
        else if ($scope.protocol=="jms") {
            connectionInfo = {
                url: "ws://localhost:8001/jms",
                username: "",
                password: ""
            };
            TOPIC_PUB="/topic/Todo";
            TOPIC_SUB="/topic/Todo";
        }
        else{
            alert("Use: http://<host/port>/todo.html?<protocol>. Unknown protocol: "+$scope.protocol);
        }

		$scope.exceptionHandler=function(error){
			alert(error);
		}
		$scope.client=UniversalClientDef($scope.protocol);

		// Set the logger function
		$scope.client.loggerFuncHandle=$scope.logWebSocketMessage;

		$scope.client.connect(connectionInfo, $scope.exceptionHandler, function(connection){
			connection.subscribe(TOPIC_PUB, TOPIC_SUB,$scope.processReceivedCommand, noLocal, function(subscr){
				console.info("Subscription is created "+subscr);
				$scope.subscription=subscr;
			});
		});

        $scope.sendMessage = function(msg){
            // TODO: Send the message
            $scope.subscription.sendMessage(msg);
        }

        $( window ).unload(function() {
            // TODO: Disconnect
            $scope.client.disconnect();
        });
    });
