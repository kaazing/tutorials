/**
 * Created by romans on 9/15/15.
 */
/**
 * Facade function that implements Kaazing WebSocket communications via JMS server
 * @param logInformation function that is used for logging events in a format of function(severity, message).
 * @returns {{JMSClient object that implements communication functions}}
 * @constructor
 */
var jmsClientFunction=function(logInformation){
    var queueName="client" + Math.floor(Math.random() * 1000000);
    var routingKey="broadcastkey";
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    var messageIdCounter = getRandomInt(1, 100000);

    var appId = (function () {
        var fmt = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        var ret=fmt.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return ret;
    })();


    var initialized=false;
     /**
     * Provides communication services with JMS server. Created within jmsClientFunction constructor.
     * @class
     * @name JMSClient
     */

    var JMSClient = {connected:false};

    var messageReceivedFunc=null;
	var connectionEstablishedFunc=null;

    var topicPub=null;
    var topicSub=null;
    var noLocalFlag=false;
    var user=null;
    var errorFunction;

    var handleException = function (e) {
        logInformation("ERROR","Error! " + e);
		if (typeof (errorFunction)!="undefined" && errorFunction!=null)
        	errorFunction(e);
    }
    var connection=null;
    var session=null;
    var producer=null;
    var consumer=null;

    var prepareSend = function () {
        var dest = session.createTopic(topicPub);
        producer = session.createProducer(dest);
        logInformation("INFO","Producer is ready! AppID=" + appId);
    }

    var prepareReceive = function (rcvFunction) {
        var dest = session.createTopic(topicSub);
        if (noLocalFlag)
            consumer = session.createConsumer(dest, "appId<>'" + appId + "'");
        else
            consumer = session.createConsumer(dest);
        consumer.setMessageListener(function (message) {
            var body=message.getText();
            logInformation("DEBUG","Received from the wire "+body);
            try{
                body=JSON.parse(body);
            }
            catch(e){
                logInformation("WARN","Received object is not JSON");
            }
            rcvFunction(body);
        });
        logInformation("INFO","Consumer is ready!");
    }

    /**
     * Connects to Kaazing WebSocket JMS Gateway
     * @param url Connection URL
     * @param username User name to be used to establish connection
     * @param password User password to be used to establish connection
     * @param topicP Name of the publishing endpoint - JMS topic used for publishing.
     * @param topicS Name of the subscription endpoint - AMQP topic used for subscription
     * @param noLocal Flag indicating whether the client wants to receive its own messages (true) or not (false). That flag should be used when publishing and subscription endpoints are the same.
     * @param messageDestinationFuncHandle Function that will be used to process received messages from subscription endpoint in a format: function(messageBody)
     * @param errorFuncHandle function that is used for error handling in a format of function(error)
     * @param connectFunctionHandle function this is called when connection is established in a format: function()
     */
    JMSClient.connect=function(url,username, password, topicP, topicS, noLocal, messageDestinationFuncHandle, errorFuncHandle, connectFunctionHandle){
        topicPub=topicP;
        topicSub=topicS;
        user=username;
        errorFunction=errorFuncHandle;
        messageReceivedFunc=messageDestinationFuncHandle;
		connectionEstablishedFunc=connectFunctionHandle;

        noLocalFlag=noLocal;
        logInformation("INFO","CONNECTING TO: " + url);

        var jmsConnectionFactory = new JmsConnectionFactory(url);

        try {
            var connectionFuture = jmsConnectionFactory.createConnection(username, password, function () {
                    if (!connectionFuture.exception) {
                        try {
                            connection = connectionFuture.getValue();
                            connection.setExceptionListener(handleException);

                            logInformation("INFO","CONNECTED");

                            session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);

                            connection.start(function () {
                                logInformation("INFO","JMS session created");
                                prepareSend();
                                prepareReceive(messageReceivedFunc);
                                JMSClient.connected=true;
								if (typeof(connectionEstablishedFunc) != "undefined" && connectionEstablishedFunc!=null){
									connectionEstablishedFunc();
								}
                            });
                        }
                        catch (e) {
                            handleException(e);
                        }
                    }
                    else {
                        handleException(connectionFuture.exception);
                    }
                });
        }
        catch (e) {
            handleException(e);
        }
    }

    /**
     * Sends messages to a publishing endpoint.
     * @param msg Message to be sent. As messages are sent in a text format msg will be converted to JSON if it is not a string.
     */
    JMSClient.sendMessage=function(msg){
        if (typeof msg ==="object"){
            msg=JSON.stringify(msg);
        }

        var textMsg = session.createTextMessage(msg);
        if (noLocalFlag)
            textMsg.setStringProperty("appId", appId);
        try {
            var future = producer.send(textMsg, function () {
                if (future.exception) {
                    handleException(future.exception);
                }
            });
        } catch (e) {
            handleException(e);
        }
        logInformation("sent","Send command " + msg, "sent");
    }

    /**
     * Disconnects from Kaazing WebSocket JMS Gateway
     */
    JMSClient.disconnect=function(){
        producer.close(function(){
            consumer.close(function(){
                session.close(function(){
                    connection.close(function(){

                    });
                });
            });
        });

    }

    return JMSClient;
};
