/**
 * Created by romans on 10/26/15.
 */

angular.module('KaazingClientService')
	.factory('WsRest', function(AngularUniversalClient, $q){
		'use strict';
		var deferred=$q.defer();

		var WsRest=function(connectionInfo){
			this.promise=deferred.promise;
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
					if (message.command==="get"){
						self.getCallback(message.data);
					}
					else if (message.command==="delete"){
						self.deleteCallback(message.data);
					}
					else if (message.command==="put"){
						self.putCallback(message.data);
					}
					else if (message.command==="post"){
						self.postCallback(message.data);
					}
					else if (message.command==="message"){
						self.onMessageReceived(message.data);
					}
				},
				function(error){
					this.reportError(error);
				},
				null, function(){
					angular.extend(self, {
						get:function(parameters){
							var msg={
								command:"get",
								parameters:parameters
							}
							AngularUniversalClient.sendMessage(msg);
							return{
								then:function(callbackData,callbackError){
									self.getCallback=callbackData;
									self.reportError=callbackError;
								}
							};
						},
						delete:function(parameters){
							var msg={
								command:"delete",
								parameters:parameters
							}
							AngularUniversalClient.sendMessage(msg);
							return{
								then:function(callbackData,callbackError){
									self.deleteCallback=callbackData;
									self.reportError=callbackError;
								}
							};
						},
						put:function(parameters,data){
							var msg={
								command:"put",
								parameters:parameters,
								data:data
							}
							AngularUniversalClient.sendMessage(msg);
							return{
								then:function(callbackData,callbackError){
									self.putCallback=callbackData;
									self.reportError=callbackError;
								}
							};
						},
						post:function(parameters,data){
							var msg={
								command:"post",
								parameters:parameters,
								data:data
							}
							AngularUniversalClient.sendMessage(msg);
							return{
								then:function(callbackData,callbackError){
									self.postCallback=callbackData;
									self.reportError=callbackError;
								}
							};
						},
						onMessage:function(messageReceivedCallback){
							self.onMessageReceived=messageReceivedCallback;
						}
					});
					deferred.resolve(self);
				});
		};
		return WsRest;
	});