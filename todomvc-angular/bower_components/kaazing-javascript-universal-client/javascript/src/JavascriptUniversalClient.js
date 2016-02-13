/**
 * Created by romans on 9/15/15.
 */
/**
 * Kaazing JavaScript Universal Client facade that communicates with the gateway based on specified protocol. Script downloads necessary libraries except of JmsClient.js - that script has to be added to the <head> section.
 * @param protocol Specifies protocol that should be used for communications: jms - for communication with Kaazing JMS Gateway, amqp - for communication with Kaazing AMQP Gateway.
 * @returns {{UniversalClient object that implements communication functions}}
 * @constructor
 */
var UniversalClientDef=function(protocol){
    /**
     * Provides communication services with JMS or AMQP server. Created within UniversalClientDef constructor.
     * @class
     * @name JavascriptUniversalClient
     */
    var JavascriptUniversalClient = {};
    var client = null;

    /**
     * Connects to Kaazing WebSocket Gateway (AMQP or JMS)
     * @param url Connection URL
     * @param username User name to be used to establish connection
     * @param password User password to be used to establish connection
     * @param topicP Name of the publishing endpoint - AMQP exchange used for publishing or JMS Topic.
     * @param topicS Name of the subscription endpoint - AMQP exchange used for subscription or JMS Topic.
     * @param noLocal Flag indicating whether the client wants to receive its own messages (true) or not (false). That flag should be used when publishing and subscription endpoints are the same.
     * @param messageDestinationFuncHandle Function that will be used to process received messages from subscription endpoint in a format: function(messageBody)
     * @param errorFuncHandle function that is used for error handling in a format of function(error)
     * @param loggerFuncHandle function that is used for logging events in a format of function(severity, message)
     * @param connectFunctionHandle function this is called when connection is established in a format: function()
     */
    JavascriptUniversalClient.connect = function (url, username, password, topicP, topicS, noLocal, messageDestinationFuncHandle, errorFuncHandle, loggerFuncHandle, connectFunctionHandle) {
        if (client!=null && client.connected)
            return;

        var logInformation = function (severity, message) {
            if (loggerFuncHandle !== null)
                loggerFuncHandle(severity, message);
            if (severity == "INFO") {
                console.info(message);
            }
            else if (severity == "ERROR") {
                console.error(message);
            }
            else if (severity == "WARN") {
                console.warn(message);
            }
            else
                console.trace(message);
        }
        if (protocol.toLowerCase() === "amqp") {
                requirejs(['bower_components/kaazing-amqp-0-9-1-client-javascript/javascript/WebSocket.js'],function(){
                    requirejs(['bower_components/jquery/dist/jquery.js','bower_components/kaazing-amqp-0-9-1-client-javascript/javascript/Amqp-0-9-1.js', 'bower_components/kaazing-javascript-universal-client/javascript/src/AmqpUniversalClient.js'], function () {
                        console.info("Using AMQP protocol!");
                        client = amqpClientFunction(logInformation);
                        client.connect(url, username, password, topicP, topicS, noLocal, messageDestinationFuncHandle, errorFuncHandle, connectFunctionHandle);
                    });
                });
        }
        else if (protocol.toLowerCase() === "jms") {
                requirejs(['bower_components/kaazing-jms-client-javascript/javascript/src/WebSocket.js','bower_components/kaazing-javascript-universal-client/javascript/src/JMSUniversalClient.js'], function () {
                console.info("Using JMS protocol!");
                client = jmsClientFunction(logInformation);
                client.connect(url, username, password, topicP, topicS, noLocal, messageDestinationFuncHandle, errorFuncHandle, connectFunctionHandle);
            });
        }
        else {
            alert("Unsupported protocol " + protocol);
        }
    }

    /**
     * Sends messages to a publishing endpoint.
     * @param msg Message to be sent. As messages are sent in a text format msg will be converted to JSON if it is not a string.
     */
    JavascriptUniversalClient.sendMessage = function (msg) {
        client.sendMessage(msg);
    }

    /**
     * Disconnects from Kaazing WebSocket Gateway
     */
    JavascriptUniversalClient.disconnect=function(){
        client.disconnect();
    }

    return JavascriptUniversalClient;

};
