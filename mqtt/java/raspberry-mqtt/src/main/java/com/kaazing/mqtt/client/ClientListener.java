package com.kaazing.mqtt.client;

import org.eclipse.paho.client.mqttv3.MqttMessage;

public interface ClientListener {

	void onMessage(String topic, MqttMessage message);

	void onConnectionLost(Throwable cause);

}
