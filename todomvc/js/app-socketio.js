/*global angular */

/**
 * The main TodoMVC app module
 *
 * @type {angular.Module}
 */
angular.module('todomvc', ['ngRoute', 'ngResource'])
	.config(function ($routeProvider) {
		'use strict';

		var routeConfig = {
			controller: 'TodoCtrl',
			templateUrl: 'todomvc-index.html',
			reloadOnSearch: false,
			resolve: {
				store: function (todoStorage) {
					// Get the storage module
					return todoStorage.then(function (module) {
						return module;
					});
				}
			}
		};

		$routeProvider
			.when('/', routeConfig)
			.when('/:status', routeConfig)
			.otherwise({
				redirectTo: '/'
			});
	})
	.constant('todoMvcWebSocketConfig', {
		URL: "ws://localhost:8001/amqp",
		TOPIC_PUB: "todomvc",
		TOPIC_SUB: "todomvc",
		username: "guest",
		password: "guest"
	});
