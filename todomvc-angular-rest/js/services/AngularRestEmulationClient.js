/**
 * Created by romans on 10/26/15.
 */

angular.module('KaazingClientService')
	.factory('WsRest', function(AngularUniversalClient, $q){
		'use strict';
		var deferred=$q.defer();

		var WsRest=function(connectionInfo){
			this.promise=deferred.promise;
			this.getPromise=null;
			if (connectionInfo.url === undefined || connectionInfo.url===null){
				throw "connectionInfo must contain url property!";
			}
			if (connectionInfo.protocol !=='amqp' && connectionInfo.protocol !=='jms'){
				throw "connectionInfo.protocol is either not specified or not 'amqp' or 'jms'!";
			}
			if (connectionInfo.topic===undefined || connectionInfo.topic===null){
				throw "connectionInfo must contain topic property!";
			}

			if (connectionInfo.username === undefined || connectionInfo.username===null || connectionInfo.password ===undefined || connectionInfo.password===null){
				if (connectionInfo.protocol==='amqp'){
					connectionInfo.username="guest";
					connectionInfo.password="guest"
				}
				else{
					connectionInfo.username="";
					connectionInfo.password="";
				}
			}
			else{
				this.username=connectionInfo.username;
				this.password=connectionInfo.password;
			}
			var self=this;
			AngularUniversalClient.connect(
				connectionInfo.protocol,
				connectionInfo.url,
				connectionInfo.username,
				connectionInfo.password,
				connectionInfo.topic,
				connectionInfo.topic,
				true,
				function(message){
					if (message.command==="on.get"){
						if (self.getPromise!=null){
							self.getPromise.resolve(message.data);
						}
					}
					else if (message.command==="delete"){
						self.deleteCallback(message.parameters);
					}
					else if (message.command==="put"){
						self.putCallback(message.data);
					}
					else if (message.command==="post"){
						self.postCallback(message.data);
					}
				},
				function(error){
					self.reportError(error);
				},
				null, function(){
					angular.extend(self, {
						get:function(parameters){
							this.getPromise=$q.defer();
							var msg={
								command:"get",
								parameters:parameters
							}
							try{
								AngularUniversalClient.sendMessage(msg);
							}
							catch(ex){
								self.getPromise.reject(ex);
							}
							return self.getPromise.promise;
						},
						delete:function(parameters){
							var msg={
								command:"delete",
								parameters:parameters
							}
							try{
								AngularUniversalClient.sendMessage(msg);
							}
							catch(ex){
								self.reportError(ex);
							}
						},
						put:function(parameters,data){
							var msg={
								command:"put",
								parameters:parameters,
								data:data
							}
							try{
								AngularUniversalClient.sendMessage(msg);
							}
							catch(ex){
								self.reportError(ex);
							}
						},
						post:function(parameters,data){
							var msg={
								command:"post",
								parameters:parameters,
								data:data
							}
							try{
								AngularUniversalClient.sendMessage(msg);
							}
							catch(ex){
								self.reportError(ex);
							}
						},
						on:{
							post:function(postReceivedCallback){
								self.postCallback=postReceivedCallback;
								return self;
							},
							delete: function(deleteReceivedCallback){
								self.deleteCallback=deleteReceivedCallback;
								return self;
							},
							put: function(putReceivedCallback){
								self.putCallback=putReceivedCallback;
								return self;
							},
							error: function(onError){
								self.reportError=onError;
								return self;
							}
						}
					});
					deferred.resolve(self);
				});
		};
		return WsRest;
	});