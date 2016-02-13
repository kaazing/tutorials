'use strict';

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
        if ($scope.protocol=="amqp") {
            AngularUniversalClient.connect("amqp",amqpWebSocketConfig.URL,amqpWebSocketConfig.username, amqpWebSocketConfig.password, amqpWebSocketConfig.TOPIC_PUB, amqpWebSocketConfig.TOPIC_SUB, true, $scope.processReceivedCommand, function(err){alert(err);}, $scope.logWebSocketMessage, null );
        }
        else if ($scope.protocol=="jms") {
            AngularUniversalClient.connect("jms",jmsWebSocketConfig.URL,jmsWebSocketConfig.username, jmsWebSocketConfig.password, jmsWebSocketConfig.TOPIC_PUB, jmsWebSocketConfig.TOPIC_SUB, true, $scope.processReceivedCommand, function(err){alert(err);}, $scope.logWebSocketMessage, null );
        }
        else{
            alert("Use: http://<host/port>/todo.html?<protocol>. Unknown protocol: "+$scope.protocol);
        }

        $scope.sendMessage = function(msg){
            // TODO: Send the message
            AngularUniversalClient.sendMessage(msg);
        }

        $( window ).unload(function() {
            // TODO: Disconnect
            AngularUniversalClient.disconnect();
        });
    });
