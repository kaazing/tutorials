# TODO Application using AngularJS
This repository contains a simple TODO application written with the Javascript [AngularJS framework][1] that can be used with Kaazing AMQP or JMS brokers.

The Application loads 5 todo items from JSON file and notifies other users when
- An item is marked complete/incomplete
- An item is being edited by a client. This disables editing on all other clients.

The application uses the [Kaazing Universal Clients for Javascript][2] open source library - for specifics how to use the library with AngularJS see [Kaazing JavaScript Universal Client for AngularJS][3]


[1]:	https://angularjs.org/
[2]:	https://github.com/kaazing/universal-client/tree/develop/javascript
[3]:	https://github.com/kaazing/universal-client/blob/develop/javascript/AngularJSClient.md
