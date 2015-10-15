
This repository contains simple TODO application written using plain Javascript that can be used with Kaazing AMQP or JMS brokers.

Application loads 5 todo items from JSON file and notifies other users when
- Item is marked complete/incomplete
- Item is being worked on by one client as being disabled on the others

Application uses [Kaazing Universal Clients for Javascript][1] open source library - for specifics how to use the library with plain Javascript see [Kaazing JavaScript Universal Client for Javascript][2]

[1]:	https://github.com/kaazing/universal-client/tree/develop/javascript
[2]:	https://github.com/kaazing/universal-client/blob/develop/javascript/JavaScriptClient.md