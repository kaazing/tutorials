# Kaazing Universal Clients

Welcome to the Kaazing Universal Clients Repository!

This repository contains the code of the Open Source Kaazing Universal Client and *under the hood* explanations with details on how the protocol/technology clients are created.

## Introduction
Creating real-time applications requires the use of a publish/subscribe message bus to push messages to clients. This message bus might be a JMS server, or another popular choice, the AMQP protocol. The Kaazing WebSocket Gateway, when connected to a message bus, enables these messages to be delivered over Web protocols (HTTP/HTTPS/WS/WSS).

The goal of these libraries is to provide developers with a simple, *universal* WebSocket client library that is accessed the same way regardles of the underlying message protocol/technology. This library simplifies the development of Websocket client applications communicating with JMS or AMQP editions of the Kaazing WebSocket Gateway.

The Kaazing Universal Clients provide the facade for Kaazing-specific protocol/technology libraries. These clients:
* Implement basic publish-subscribe functionality to help developers get started with their WebSocket projects
* Provide developers with protocol/technology specific implementations for reference

## Available Universal Clients
(This list will grow as clients are added.)
- [Universal Clients for JavaScript applications][1]
- [Universal Clients for Java applications][2]

## Organization of the Universal Clients
Regardless of the client technology, all of the clients are organized as shown on the following diagram:

![][image-1]

[1]:	https://github.com/kaazing/universal-client/tree/develop/javascript "Universal Clients for JavaScript applications"
[2]:	https://github.com/kaazing/universal-client/tree/develop/javascript "Universal Clients for JavaScript applications"


[image-1]:	images/UniversalClients.png "Universal Clients"
