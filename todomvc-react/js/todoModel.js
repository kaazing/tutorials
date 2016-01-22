/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
var app = app || {};

(function () {
	'use strict';

	var Utils = app.Utils;
	// Generic "model" object. You can use whatever
	// framework you want. For this application it
	// may not even be worth separating this logic
	// out, but we do this to demonstrate one way to
	// separate out parts of your application.
	app.TodoModel = function (key, wsClient) {
		this.key = key;
		this.todos = Utils.store(key);
		this.onChanges = [];
		this.wsClient=wsClient;
	};

	app.TodoModel.prototype.subscribe = function (onChange) {
		this.onChanges.push(onChange);
	};

	app.TodoModel.prototype.inform = function () {
		Utils.store(this.key, this.todos);
		this.onChanges.forEach(function (cb) { cb(); });
	};

	app.TodoModel.prototype.addTodo = function (title) {
		var newTodo={
			id: Utils.uuid(),
			title: title,
			completed: false,
			busy:false
		};
		this.todos = this.todos.concat(newTodo);
		var msg={
			command:"insert",
			item:newTodo
		};
		this.wsClient.sendMessage(msg);

		this.inform();
	};

	app.TodoModel.prototype.onMessage=function(cmd){
		console.log("Received command "+cmd.command);
		if (cmd.command==="insert"){
			this.todos = this.todos.concat(cmd.item);
			this.inform();
		}
		else if (cmd.command==="remove"){
			this.todos = this.todos.filter(function (candidate) {
				return candidate.id !== cmd.item.id;
			});
			this.inform();
		}
		else if (cmd.command==="update"){
			this.todos = this.todos.map(function (todo) {
				if (todo.id===cmd.item.id){
					return cmd.item;
				}
				else{
					return todo;
				}
			});
			this.inform();

		}
		else if (cmd.command==="initdata"){
			this.todos=cmd.items;
			this.inform();
		}
	};

	app.TodoModel.prototype.toggleAll = function (checked) {
		// Note: it's usually better to use immutable data structures since they're
		// easier to reason about and React works very well with them. That's why
		// we use map() and filter() everywhere instead of mutating the array or
		// todo items themselves.
		this.todos = this.todos.map(function (todo) {
			var todo1=Utils.extend({}, todo, {completed: checked});
			var msg={
				command:"update",
				item:todo1
			};
			this.wsClient.sendMessage(msg);
			return todo1;
		});

		this.inform();
	};

	app.TodoModel.prototype.toggle = function (todoToToggle) {
		this.todos = this.todos.map(function (todo) {
			return todo !== todoToToggle ?
				todo :
				Utils.extend({}, todo, {completed: !todo.completed});
		});
		todoToToggle.completed=!todoToToggle.completed;
		var msg={
			command:"update",
			item:todoToToggle
		};
		this.wsClient.sendMessage(msg);

		this.inform();
	};

	app.TodoModel.prototype.destroy = function (todo) {
		this.todos = this.todos.filter(function (candidate) {
			return candidate !== todo;
		});
		var msg={
			command:"remove",
			item:todo
		}
		this.wsClient.sendMessage(msg);
		this.inform();
	};

	app.TodoModel.prototype.save = function (todoToSave, text) {

		this.todos = this.todos.map(function (todo) {
			return todo !== todoToSave ? todo : Utils.extend({}, todo, {title: text});
		});
		todoToSave.title=text;
		var msg={
			command:"update",
			item:todoToSave
		};
		this.wsClient.sendMessage(msg);

		this.inform();
	};

	app.TodoModel.prototype.clearCompleted = function () {
		this.todos = this.todos.filter(function (todo) {
			if (todo.completed){
				if (sendMessage){
					var msg={
						command:"remove",
						item:todo
					}
					this.wsClient.sendMessage(msg);
				}
			}
			return !todo.completed;
		});

		this.inform();
	};

})();
