package com.kaazing.mqtt.client;

import java.util.concurrent.CountDownLatch;

import org.eclipse.paho.client.mqttv3.IMqttActionListener;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.IMqttToken;
import org.eclipse.paho.client.mqttv3.MqttAsyncClient;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.MqttPersistenceException;
import org.eclipse.paho.client.mqttv3.persist.MqttDefaultFilePersistence;

import com.kaazing.mqtt.websocket.KaazingMqttWebSocketAsyncClient;

public class MqttClientWrapper implements MqttCallback {
	private MqttAsyncClient client;
	private MqttConnectOptions conOpt;
	private boolean clean = true;
	private CountDownLatch waitLatch;
	private Throwable t = null;
	private final ClientListener listener;

	public MqttClientWrapper(String brokerUrl, String clientId, boolean cleanSession, ClientListener listener) throws ClientWrapperException {
		this.listener = listener;
		String tmpDir = System.getProperty("java.io.tmpdir");
		MqttDefaultFilePersistence dataStore = new MqttDefaultFilePersistence(tmpDir);
		conOpt = new MqttConnectOptions();
		conOpt.setCleanSession(clean);
		conOpt.setMqttVersion(MqttConnectOptions.MQTT_VERSION_3_1_1);

		// Construct the MqttClient instance
		try {
			client = new KaazingMqttWebSocketAsyncClient(brokerUrl, clientId, dataStore);

			// Set this wrapper as the callback handler
			client.setCallback(this);

			this.waitLatch = new CountDownLatch(1);
			this.t = null;
			client.connect(conOpt, null, new IMqttActionListener() {
				public void onSuccess(IMqttToken asyncActionToken) {
					waitLatch.countDown();
				}

				public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
					t = exception;
					waitLatch.countDown();
				}
			});
			this.waitLatch.await();
			if (t != null) {
				throw new ClientWrapperException("Unable to connect to url " + brokerUrl, t);
			}
		} catch (MqttException e) {
			throw new ClientWrapperException("Mqtt Exception connecting to " + brokerUrl, e);
		} catch (InterruptedException e) {
			throw new ClientWrapperException("Connection to " + brokerUrl + ": Wait latch interrupted!", e);
		}
	}

	public void subscribe(String topicName, int qos) throws ClientWrapperException {
		try {
			this.waitLatch = new CountDownLatch(1);
			this.t = null;
			client.subscribe(topicName, qos, null, new IMqttActionListener() {

				public void onSuccess(IMqttToken asyncActionToken) {
					waitLatch.countDown();
				}

				public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
					t = exception;
					waitLatch.countDown();
				}
			});
			this.waitLatch.await();
			if (t != null) {
				throw new ClientWrapperException("Unable to subscribe to topic " + topicName + " qos=" + qos, t);
			}

		} catch (MqttException e) {
			throw new ClientWrapperException("Mqtt Exception subscribing to " + topicName, e);
		} catch (InterruptedException e) {
			throw new ClientWrapperException("Subscription to" + topicName + ": Wait latch interrupted!", e);
		}
	}

	public void disconnect() throws ClientWrapperException {
		this.waitLatch = new CountDownLatch(1);
		this.t = null;
		try {
			client.disconnect(null, new IMqttActionListener() {
				public void onSuccess(IMqttToken asyncActionToken) {
					waitLatch.countDown();
				}

				public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
					t = exception;
					waitLatch.countDown();
				}
			});
			this.waitLatch.await();
			if (t != null) {
				throw new ClientWrapperException("Unable to disconnect!", t);
			}
		} catch (MqttException e) {
			throw new ClientWrapperException("Mqtt Exception disconnecting...", e);
		} catch (InterruptedException e) {
			throw new ClientWrapperException("Disconnect: Wait latch interrupted!", e);
		}

	}

	public void connectionLost(Throwable cause) {
		this.listener.onConnectionLost(cause);
	}

	public void messageArrived(String topic, MqttMessage message) throws Exception {
		this.listener.onMessage(topic, message);

	}

	public void deliveryComplete(IMqttDeliveryToken token) {
	}

	public void unsubscribe(String topic) throws ClientWrapperException {
		try {
			this.waitLatch = new CountDownLatch(1);
			this.t = null;
			this.client.unsubscribe(topic, null, new IMqttActionListener() {

				public void onSuccess(IMqttToken asyncActionToken) {
					waitLatch.countDown();

				}

				public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
					t = exception;
					waitLatch.countDown();

				}

			});
			this.waitLatch.await();
			if (t != null) {
				throw new ClientWrapperException("Unable to unsubscribe from topic " + topic, t);
			}
		} catch (MqttException e) {
			throw new ClientWrapperException("Mqtt Exception during unsubscribe from topic " + topic, e);
		} catch (InterruptedException e) {
			throw new ClientWrapperException("Interrupted: unsubscribe from topic " + topic, t);
		}
	}

	public void publish(String topic, MqttMessage msg) throws ClientWrapperException {
		try {
			this.waitLatch = new CountDownLatch(1);
			this.t = null;
			this.client.publish(topic, msg, null, new IMqttActionListener() {

				public void onSuccess(IMqttToken asyncActionToken) {
					waitLatch.countDown();
				}

				public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
					t = exception;
					waitLatch.countDown();
				}
			});
			this.waitLatch.await();
			if (t != null) {
				throw new ClientWrapperException("Unable to publish to a topic " + topic, t);
			}

		} catch (MqttPersistenceException e) {
			throw new ClientWrapperException("Mqtt Persistence Exception while publishing to a topic " + topic, t);
		} catch (MqttException e) {
			throw new ClientWrapperException("Mqtt Exception while publishing to a topic " + topic, t);
		} catch (InterruptedException e) {
			throw new ClientWrapperException("Interrupted: publishing to a topic " + topic, t);
		}
	}

}
