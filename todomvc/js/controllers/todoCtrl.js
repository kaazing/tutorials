/*global angular */

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
angular.module('todomvc')
	.controller('TodoCtrl', function TodoCtrl($scope, $routeParams, $filter, store,todoMvcWebSocketConfig, AngularUniversalClient, $log,$timeout ) {
		'use strict';

		var todos = $scope.todos = store.todos;
		function getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}

		$scope.client="client"+getRandomInt(1,10000000);
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

		$scope.logWebSocketMessage=function(severity, msg){
			if (severity === undefined || severity == null)
				severity = "info";
			severity=severity.toLowerCase();
			if (severity==="debug")
				$log.debug(msg);
			else if (severity==="info")
				$log.info(msg);
			else if (severity==="warn")
				$log.warn(msg);
			else if (severity==="error")
				$log.error(msg);
		}


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
				if (cmd.client===$scope.client){
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

		$scope.loadData=function(){
			var msg={
				command:"init",
				client:$scope.client
			}
			AngularUniversalClient.sendMessage(msg);
			$log.info("Sent initialization!");
		}

		// Connect to WebSocket
		AngularUniversalClient.connect("amqp",todoMvcWebSocketConfig.URL,todoMvcWebSocketConfig.username, todoMvcWebSocketConfig.password, todoMvcWebSocketConfig.TOPIC_PUB, todoMvcWebSocketConfig.TOPIC_SUB, true, $scope.processReceivedCommand, function(e){alert(e);},$scope.logWebSocketMessage, $scope.loadData);


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
					AngularUniversalClient.sendMessage(msg);
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
			AngularUniversalClient.sendMessage(msg);
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
					AngularUniversalClient.sendMessage(msg);
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
			AngularUniversalClient.sendMessage(msg);
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
			AngularUniversalClient.sendMessage(msg);
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
					AngularUniversalClient.sendMessage(msg);
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
			AngularUniversalClient.sendMessage(msg);
		}

		$scope.markAll = function (completed) {
			todos.forEach(function (todo) {
				if (todo.completed !== completed) {
					$scope.toggleCompleted(todo, completed);
				}
			});
		};
	});
