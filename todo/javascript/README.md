This repository contains a simple TODO application written using plain Javascript that can be used with Kaazing AMQP or JMS brokers.

The application loads 5 todo items from JSON file and notifies other users when
- An item is marked complete/incomplete
- An item is being edited by one client. This disables editing on all other clients.

The application uses the [Kaazing Universal Clients for Javascript][1] open source library - for specifics how to use the library with plain Javascript see [Kaazing JavaScript Universal Client for Javascript][2]

[1]:	https://github.com/kaazing/universal-client/tree/develop/javascript
[2]:	https://github.com/kaazing/universal-client/blob/develop/javascript/JavaScriptClient.md
