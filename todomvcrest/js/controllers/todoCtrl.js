/*global angular */

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
angular.module('todomvc')
	.controller('TodoCtrl', function TodoCtrl($scope, $routeParams, $filter, store, WsRest, $log,$timeout ) {
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

		// Connect to WebSocket
		var connInfo={
			protocol:"amqp",
			url:"ws://localhost:8001/amqp",
			topic:"todomvc"
		}
		var promise=new WsRest(connInfo).promise;
		promise.then(function(wsRest){
			$scope.wsRest=wsRest;
			// Get items
			$scope.wsRest.on.put(function(item){
				$scope.saving = true;
				store.put(item)
						.then(function success() {
						})
						.finally(function () {
							$scope.saving = false;
						});
			}).on.delete(function(item){
				$scope.saving = true;
				store.delete(item)
						.then(function success() {
						})
						.finally(function () {
							$scope.saving = false;
						});

			}).on.post(function(item){
				store.insert(item)
						.then(function success() {
						})
						.finally(function () {
							$scope.saving = false;
						});
			}).on.error(function(error){
				alert("Error! "+error);
			})
			$scope.wsRest.get($scope.client).then(function(cmd){
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
			});
		});

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
					$scope.wsRest.post(null, newTodo);
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
			$scope.wsRest.put(todo1.id, todo1);
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
					if (todo.title){
						$scope.wsRest.put(todo.id, todo);
					}
					else{
						$scope.wsRest.delete(todo);
					}
				}, function error() {
					todo.title = $scope.originalTodo.title;
				})
				.finally(function () {
					$scope.editedTodo = null;
				});
		};

		$scope.revertEdits = function (todo) {
			todo.busy=false;
			$scope.wsRest.put(todo.id, todo);
			todos[todos.indexOf(todo)] = $scope.originalTodo;
			$scope.editedTodo = null;
			$scope.originalTodo = null;
			$scope.reverted = true;
		};

		$scope.removeTodo = function (todo) {
			store.delete(todo).then(function(item){
				$scope.wsRest.delete(todo);
			});
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
					$scope.wsRest.put(todo.id, todo);
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
			$scope.wsRest.put(todo1.id, todo1);
		}

		$scope.markAll = function (completed) {
			todos.forEach(function (todo) {
				if (todo.completed !== completed) {
					$scope.toggleCompleted(todo, completed);
				}
			});
		};
	});
