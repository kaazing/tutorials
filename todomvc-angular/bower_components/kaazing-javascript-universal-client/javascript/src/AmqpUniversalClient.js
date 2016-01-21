/**
 * Created by romans on 9/15/15.
 */

/**
 * Facade function that implements Kaazing WebSocket communications via AMQP server
  * @param logInformation function that is used for logging events in a format of function(severity, message).
 * @returns {{AmqpClient object that implements communication functions}}
 * @constructor
 */
var amqpClientFunction=function(logInformation){
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

    var handleException = function (e) {
        logInformation("ERROR","Error! " + e);
        if (typeof (errorFunction)!="undefined" && errorFunction!=null)
            errorFunction(e);
    }
    /**
     * Provides communication services with AMQP server. Created within amqpClientFunction constructor.
     * @class
     * @name AmqpClient
     */
    var AmqpClient = {connected:false};

    var messageReceivedFunc=null;
	var connectionEstablishedFunc=null;
    var errorFunction=null;
    var amqpClient=null;
    var publishChannel=null;
    var consumeChannel=null;


    var topicPub=null;
    var topicSub=null;
    var noLocalFlag=false;
    var user=null;

	var publishChannelOpened=$.Deferred();
	var consumeChannelOpened=$.Deferred();


    var publishChannelOpenHandler=function(){
        logInformation("INFO","OPENED: Publish Channel");

        publishChannel.declareExchange({exchange: topicPub, type: "fanout"});

        // Listen for these requests to return
        publishChannel.addEventListener("declareexchange", function() {
            logInformation("INFO","EXCHANGE DECLARED: " + topicPub);
            publishChannelOpened.resolve();
        });

        publishChannel.addEventListener("error", function(e) {
            handleException("CHANNEL ERROR: Publish Channel - " + e.message);
        });

        publishChannel.addEventListener("close", function() {
            logInformation("INFO","CHANNEL CLOSED: Publish Channel");
        });

    }

    var consumeChannelOpenHandler=function(){
        logInformation("INFO","OPENED: Consume Channel");

        consumeChannel.addEventListener("declarequeue", function() {
            logInformation("INFO","QUEUE DECLARED: " + queueName);
        });

        consumeChannel.addEventListener("bindqueue", function() {
            logInformation("INFO","QUEUE BOUND: " + topicSub+ " - " + queueName);
        });

        consumeChannel.addEventListener("consume", function() {
            logInformation("INFO","CONSUME FROM QUEUE: " + queueName);
            consumeChannelOpened.resolve();
        });

        consumeChannel.addEventListener("flow", function(e) {
            logInformation("INFO","FLOW: " + (e.args.active ? "ON" : "OFF"));
        });

        consumeChannel.addEventListener("close", function() {
            logInformation("INFO","CHANNEL CLOSED: Consume Channel");
        });

        consumeChannel.addEventListener("message", function(message) {
            var body = null;

            // Check how the payload was packaged since older browsers like IE7 don't
            // support ArrayBuffer. In those cases, a Kaazing ByteBuffer was used instead.
            if (typeof(ArrayBuffer) === "undefined") {
                body = message.getBodyAsByteBuffer().getString(Charset.UTF8);
            }
            else {
                body = arrayBufferToString(message.getBodyAsArrayBuffer())
            }
            logInformation("DEBUG","Received from the wire "+body);
            try{
                body= JSON.parse(body);
            }
            catch(e){
                logInformation("WARN", "Received object is not JSON");
            }
            messageReceivedFunc(body);
        });

        // The default value for noAck is true. Passing a false value for 'noAck' in
        // the AmqpChannel.consumeBasic() function means there should be be explicit
        // acknowledgement when the message is received. If set to true, then no
        // explicit acknowledgement is required when the message is received.
        consumeChannel.declareQueue({queue: queueName})
            .bindQueue({queue: queueName, exchange: topicSub, routingKey: routingKey })
            .consumeBasic({queue: queueName, consumerTag: appId, noAck: true, noLocal:noLocalFlag });
    }

    var openHandler=function(){
        logInformation("INFO","CONNECTED!!!");

        logInformation("INFO","OPEN: Publish Channel");
        publishChannel = amqpClient.openChannel(publishChannelOpenHandler);

        logInformation("INFO", "OPEN: Consume Channel");
        consumeChannel = amqpClient.openChannel(consumeChannelOpenHandler);
		$.when(publishChannelOpened, consumeChannelOpened).done(function(){
			AmqpClient.connected=true;
			if (typeof(connectionEstablishedFunc) != "undefined" && connectionEstablishedFunc!=null){
				connectionEstablishedFunc();
			}
		});
    }
    // Convert a string to an ArrayBuffer.
    //
    var stringToArrayBuffer = function(str) {
        var buf = new ArrayBuffer(str.length);
        var bufView = new Uint8Array(buf);
        for (var i=0, strLen=str.length; i<strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    // Convert an ArrayBuffer to a string.
    //
    var arrayBufferToString = function(buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    }

    // Create a WebSocketFactory which can be used for multiple AMQP clients if
    // required. This lets you defined the attributes of a WebSocket connection
    // just once – such as a ChallengeHandler – and reuse it.
    //
    var createWebSocketFactory = function() {

        webSocketFactory = new $gatewayModule.WebSocketFactory();
        return webSocketFactory;
    }
    /**
     * Connects to Kaazing WebSocket AMQP Gateway
     * @param url Connection URL
     * @param username User name to be used to establish connection
     * @param password User password to be used to establish connection
     * @param topicP Name of the publishing endpoint - AMQP exchange used for publishing.
     * @param topicS Name of the subscription endpoint - AMQP exchange used for subscription
     * @param noLocal Flag indicating whether the client wants to receive its own messages (true) or not (false). That flag should be used when publishing and subscription endpoints are the same.
     * @param messageDestinationFuncHandle Function that will be used to process received messages from subscription endpoint in a format: function(messageBody)
     * @param errorFuncHandle function that is used for error handling in a format of function(error)
     * @param connectFunctionHandle function this is called when connection is established in a format: function()
     */
    AmqpClient.connect=function(url,username, password, topicP, topicS, noLocal, messageDestinationFuncHandle, errorFunctionHandle, connectFunctionHandle){
        topicPub=topicP;
        topicSub=topicS;
        user=username;
        messageReceivedFunc=messageDestinationFuncHandle;
		connectionEstablishedFunc=connectFunctionHandle;
        errorFunction=errorFunctionHandle;
        noLocalFlag=noLocal;
        var amqpClientFactory = new AmqpClientFactory();
        var webSocketFactory;
        if ($gatewayModule && typeof($gatewayModule.WebSocketFactory) === "function") {
            webSocketFactory = createWebSocketFactory();
            amqpClientFactory.setWebSocketFactory(webSocketFactory);
        }
        else{
            handleException("Cannot create WebSocket factory - module is not loaded!");
        }
        amqpClient = amqpClientFactory.createAmqpClient();
        amqpClient.addEventListener("close", function() {
            logInformation("INFO","Connection closed.");
        });

        amqpClient.addEventListener("error", function(e) {
            handleException(e.message);
        });
        var credentials = {username: username, password: password};
        var options = {
            url: url,
            virtualHost: "/",
            credentials: credentials
        };
		try{
			amqpClient.connect(options, openHandler);
		}
        catch(e){
			handleException(e.message);
		}
    }

    /**
     * Sends messages to a publishing endpoint.
     * @param msg Message to be sent. As messages are sent in a text format msg will be converted to JSON if it is not a string.
     */
    AmqpClient.sendMessage=function(msg){
        if (typeof msg ==="object"){
            msg=JSON.stringify(msg);
        }
        var body = null;
        if (typeof(ArrayBuffer) === "undefined") {
            body = new ByteBuffer();
            body.putString(msg, Charset.UTF8);
            body.flip();
        }
        else {
            body = stringToArrayBuffer(msg);
        }
        var props = new AmqpProperties();
        props.setContentType("text/plain");
        props.setContentEncoding("UTF-8");
        props.setDeliveryMode("1");
        props.setMessageId((messageIdCounter++).toString());
        props.setPriority("6");
        props.setTimestamp(new Date());
        props.setUserId(user);

        publishChannel.publishBasic({body: body, properties: props, exchange: topicPub, routingKey: routingKey});
    }

    /**
     * Disconnects from Kaazing WebSocket AMQP Gateway
     */
    AmqpClient.disconnect=function(){
        amqpClient.disconnect();
    }

    return AmqpClient;
};
