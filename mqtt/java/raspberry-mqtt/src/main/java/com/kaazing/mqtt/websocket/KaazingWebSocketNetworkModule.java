package com.kaazing.mqtt.websocket;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.URISyntaxException;

import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.internal.NetworkModule;
import org.eclipse.paho.client.mqttv3.logging.Logger;
import org.eclipse.paho.client.mqttv3.logging.LoggerFactory;
import org.kaazing.netx.http.HttpRedirectPolicy;
import org.kaazing.netx.ws.WebSocket;
import org.kaazing.netx.ws.WebSocketFactory;

public class KaazingWebSocketNetworkModule implements NetworkModule {
	private static final String CLASS_NAME = KaazingWebSocketNetworkModule.class.getName();
	private static final Logger log = LoggerFactory.getLogger(LoggerFactory.MQTT_CLIENT_MSG_CAT, CLASS_NAME);

	private final WebSocket ws;

	public KaazingWebSocketNetworkModule(URI wsUrl, String subProtocol, String clientId) throws URISyntaxException, IOException {
		log.setResourceName(clientId);
		 WebSocketFactory wsFactory = WebSocketFactory.newInstance();
		 this.ws=wsFactory.createWebSocket(wsUrl);
		 this.ws.setRedirectPolicy(HttpRedirectPolicy.ALWAYS);
	}

	public void start() throws IOException, MqttException {
		this.ws.connect();
	}

	public InputStream getInputStream() throws IOException {
		return this.ws.getInputStream();
	}

	public OutputStream getOutputStream() throws IOException {
		return this.ws.getOutputStream();
	}

	public void stop() throws IOException {
		this.ws.close();
	}

}
