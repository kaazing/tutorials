/*global angular */

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
angular.module('todomvc')
	.controller('TodoCtrl', function TodoCtrl($scope, $routeParams, $filter, store, $log ) {
		'use strict';

		var todos = $scope.todos = store.todos;
		function getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}

		$scope.client="mqttClient"+getRandomInt(1,10000000);
		$log.info("Client ID: "+$scope.client);
		$scope.newTodo = '';
		$scope.editedTodo = null;

		$scope.$watch('todos', function () {
			$scope.remainingCount = $filter('filter')(todos, { completed: false }).length;
			$scope.completedCount = todos.length - $scope.remainingCount;
			$scope.allChecked = !$scope.remainingCount;
		}, true);

		// Monitor the current route for changes and adjust the filter accordingly.
		$scope.$on('$routeChangeSuccess', function () {
			var status = $scope.status = $routeParams.status || '';
			$scope.statusFilter = (status === 'active') ?
				{ completed: false } : (status === 'completed') ?
				{ completed: true } : {};
		});

		$scope.processReceivedCommand=function(cmd){
			$log.info("Received command "+cmd.command);
			if (cmd.command==="insert"){
				$scope.saving = true;
				store.insert(cmd.item)
					.then(function success() {
					})
					.finally(function () {
						$scope.saving = false;
					});
			}
			else if (cmd.command==="remove"){
				$scope.saving = true;
				store.delete(cmd.item)
					.then(function success() {
					})
					.finally(function () {
						$scope.saving = false;
					});
			}
			else if (cmd.command==="update"){
				$scope.saving = true;
				store.put(cmd.item)
					.then(function success() {
					})
					.finally(function () {
						$scope.saving = false;
					});
			}
			else if (cmd.command==="initdata"){
				if (!$scope.initialized){
					$scope.initialized=true;
					$scope.saving = true;
					store.init(cmd.items)
						.then(function success() {
							$log.info("Initialized!");
						})
						.finally(function () {
							$scope.saving = false;
						});
				}
			}
		}

		$scope.initialized=false;
		$scope.loadData=function(){
			var msg={
				command:"init",
			}
			$scope.sendMessage(msg);
			$log.info("Sent initialization!");
		}

		var TOPIC_PUB="todomvc";
		var TOPIC_SUB="todomvc";

		// Connect to WebSocket
		window.WebSocket = Kaazing.Gateway.WebSocket;

		var hostPort=window.location.search.replace("?", "").split("&")[0];
		$scope.host=hostPort.split(":")[0];
		$scope.port=parseInt(hostPort.split(":")[1]);

		if (!$scope.host||!$scope.port){
			alert("Usage http://<your host>:3000/?<gateway host>:<gateway port>!");
		}
		$scope.mqttClient = new Paho.MQTT.Client($scope.host, $scope.port, $scope.client);
		// set callback handlers
		// called when the mqttClient loses its connection
		$scope.mqttClient.onConnectionLost = function(responseObject){
			if (responseObject.errorCode !== 0) {
				alert("Connection is lost!"+responseObject.errorMessage);
			}

		}
		$scope.mqttClient.onMessageArrived = function (message) {
			$log.debug("Message Arrived: from "+message.destinationName+":"+message.payloadString);
			var cmd=JSON.parse(message.payloadString);
			if (cmd.clientID!==$scope.client){
				$scope.processReceivedCommand(cmd);
			}
		};

		// called when the mqttClient connects
		$scope.onConnect=function () {
			$scope.mqttClient.subscribe(TOPIC_SUB);
			$scope.loadData();
		}

		// connect the mqttClient
		$scope.mqttClient.connect({onSuccess:$scope.onConnect});


		// Function to send messages
		$scope.sendMessage=function(cmd){
			cmd.clientID=$scope.client;
			var message = new Paho.MQTT.Message(JSON.stringify(cmd));
			message.destinationName = TOPIC_PUB;
			$scope.mqttClient.send(message);
		}

		$scope.addTodo = function () {
			var newTodo = {
				id: getRandomInt(1, 100000),
				title: $scope.newTodo.trim(),
				completed: false,
				busy: false
			};

			if (!newTodo.title) {
				return;
			}

			$scope.saving = true;
			store.insert(newTodo)
				.then(function success() {
					var msg={
						command:"insert",
						item:newTodo
					}
					$scope.sendMessage(msg);
					$scope.newTodo = '';
				})
				.finally(function () {
					$scope.saving = false;
				});
		};

		$scope.editTodo = function (todo, busy) {
			if (busy)
				return;
			var todo1=angular.extend({}, todo);
			todo1.busy=true;
			var msg={
				command:"update",
				item:todo1
			}
			$scope.sendMessage(msg);
			$scope.editedTodo = todo;
			// Clone the original todo to restore it on demand.
			$scope.originalTodo = angular.extend({}, todo);
		};

		$scope.saveEdits = function (todo, event) {
			// Blur events are automatically triggered after the form submit event.
			// This does some unfortunate logic handling to prevent saving twice.
			if (event === 'blur' && $scope.saveEvent === 'submit') {
				$scope.saveEvent = null;
				return;
			}

			$scope.saveEvent = event;

			if ($scope.reverted) {
				// Todo edits were reverted-- don't save.
				$scope.reverted = null;
				return;
			}

			todo.title = todo.title.trim();

			if (todo.title === $scope.originalTodo.title) {
				$scope.editedTodo = null;
				return;
			}

			todo.busy=false;
			store[todo.title ? 'put' : 'delete'](todo)
				.then(function success() {
					var msg={
						command:todo.title?"update":"remove",
						item:todo
					}
					$scope.sendMessage(msg);
				}, function error() {
					todo.title = $scope.originalTodo.title;
				})
				.finally(function () {
					$scope.editedTodo = null;
				});
		};

		$scope.revertEdits = function (todo) {
			todo.busy=false;
			var msg={
				command:"update",
				item:todo
			}
			$scope.sendMessage(msg);
			todos[todos.indexOf(todo)] = $scope.originalTodo;
			$scope.editedTodo = null;
			$scope.originalTodo = null;
			$scope.reverted = true;
		};

		$scope.removeTodo = function (todo) {
			var msg={
				command:"remove",
				item:todo
			}
			$scope.sendMessage(msg);
			store.delete(todo);
		};

		$scope.saveTodo = function (todo) {
			store.put(todo);
		};

		$scope.toggleCompleted = function (todo, completed) {
			if (angular.isDefined(completed)) {
				todo.completed = completed;
			}
			store.put(todo)
				.then(function success() {
					var msg={
						command:"update",
						item:todo
					}
					$scope.sendMessage(msg);
				}, function error() {
					todo.completed = !todo.completed;
				});
		};

		$scope.clearCompletedTodos = function () {
			store.clearCompleted();
		};

		$scope.itemBusy=function(todo, busy){
			var todo1=angular.extend({}, todo);
			todo1.busy=busy;
			var msg={
				command:"update",
				item:todo1
			}
			$scope.sendMessage(msg);
		}

		$scope.markAll = function (completed) {
			todos.forEach(function (todo) {
				if (todo.completed !== completed) {
					$scope.toggleCompleted(todo, completed);
				}
			});
		};
	});
