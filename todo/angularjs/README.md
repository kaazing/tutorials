# TODO Application using AngularJS
This repository contains simple TODO application written with Javascript [AngularJS framework][1] that can be used with Kaazing AMQP or JMS brokers.

Application loads 5 todo items from JSON file and notifies other users when
- Item is marked complete/incomplete
- Item is being worked on by one client as being disabled on the others

Application uses [Kaazing Universal Clients for Javascript][2] open source library - for specifics how to use the library with AngularJS see [Kaazing JavaScript Universal Client for AngularJS][3]


[1]:	https://angularjs.org/
[2]:	https://github.com/kaazing/universal-client/tree/develop/javascript
[3]:	https://github.com/kaazing/universal-client/blob/develop/javascript/AngularJSClient.md