package com.kaazing.mqtt.websocket;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttClientPersistence;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MqttDefaultFilePersistence;

public class KaazingMqttWebSocketClient extends MqttClient {

	public KaazingMqttWebSocketClient(String serverURI, String clientId, MqttClientPersistence persistence) throws MqttException {
		super("tcp://localhost:80", clientId, persistence);
		super.aClient=new KaazingMqttWebSocketAsyncClient(serverURI, clientId, persistence);
	}

	public KaazingMqttWebSocketClient(String serverURI, String clientId) throws MqttException {
		this(serverURI,clientId, new MqttDefaultFilePersistence());
	}

}
