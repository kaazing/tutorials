'use strict';

angular.module("webSocketApp", ['KaazingClientService'])
    .constant('webSocketConfig', {
        URL: "ws://localhost:8001/jms",
        TOPIC_PUB: "/topic/Todo",
        TOPIC_SUB: "/topic/Todo",
        username: "",
        password: ""
    })
    .controller("mainCtl", function ($scope, $log, $timeout, $http, webSocketConfig, UniversalClient) {
        $http.get('data/todo.json').
            success(function(data, status, headers, config) {
                $scope.todos = data;
                // Add 'available' attribute to be able to deal with the race condition
                for(var i=0;i<$scope.todos.length;i++){
                    $scope.todos[i].available=true;
                }
            });
        $scope.mouseoverIndex = -1;
        $scope.data = {
            rowColor: "Blue"
        }

        $scope.handleMouseoverEvent = function (e, index, item) {
            $log.info("Event type " + e.type);
            $scope.mouseoverIndex = -1;
            if (e.type === "mouseover") {
                $scope.mouseoverIndex = index;

                //Send command "busy" for this item
                $scope.sendCommand(item, "busy");
            }
            else {
                //Send command "available" for this item
                $scope.sendCommand(item, "available");
            }
        }
        $scope.getDoneColor = function (item, index) {
            if (!item.available) {
                return "Busy";
            }
            else {
                if ($scope.mouseoverIndex == index) {
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
        $scope.logWebSocketMessageImpl = function (msg, cls) {
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
            $timeout($scope.logWebSocketMessageImpl(msg, cls.toLowerCase()), 100);
        }

        $scope.handleException = function (e) {
            $log.error(e);
            $scope.logWebSocketMessage("Error! " + e, "error");
        }

        $scope.logWebSocketMessageImpl = function (msg, cls) {
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

        $scope.sendCommand = function (item, command) {
            var cmd = {
                command: command,
                item: item.id
            }


            $scope.sendMessage(cmd);
        }

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


        UniversalClient.connect("jms",webSocketConfig.URL,webSocketConfig.username, webSocketConfig.password, webSocketConfig.TOPIC_PUB, webSocketConfig.TOPIC_SUB, true, $scope.processReceivedCommand, $scope.logWebSocketMessage );

        $scope.sendMessage = function(msg){
            UniversalClient.sendMessage(msg);
        }
    })
;
