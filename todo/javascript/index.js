/**
 * Created by romans on 9/16/15.
 */
var amqp = require('amqp');

var connection = amqp.createConnection({ host: 'amqp://localhost:5672' });
var queueName="client" + Math.floor(Math.random() * 1000000);
// Wait for connection to become established.
connection.on('ready', function () {
    console.log("Connected...");
    // Use the default 'amq.topic' exchange
    connection.queue(queueName, function (q) {
        // Catch all messages
        q.bind('todo', queueName);

        // Receive messages
        q.subscribe(function (message) {
            var data=String.fromCharCode.apply(null, new Uint8Array(message.data));
            console.log("Received: "+data);
        });
    });
});