package com.kaazing.mqtt.pi;

import java.io.IOException;
import java.io.StringWriter;

import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.kaazing.mqtt.client.ClientListener;
import com.kaazing.mqtt.client.ClientWrapperException;
import com.kaazing.mqtt.client.MqttClientWrapper;
import com.pi4j.io.gpio.GpioController;
import com.pi4j.io.gpio.GpioFactory;
import com.pi4j.io.gpio.GpioPinDigitalInput;
import com.pi4j.io.gpio.GpioPinDigitalOutput;
import com.pi4j.io.gpio.PinPullResistance;
import com.pi4j.io.gpio.PinState;
import com.pi4j.io.gpio.RaspiPin;
import com.pi4j.io.gpio.event.GpioPinDigitalStateChangeEvent;
import com.pi4j.io.gpio.event.GpioPinListenerDigital;

public class Application {
	
	private static String topicListenName = "/Devices/command";
	private static String topicPublishName = "/Devices/status";
	private static int qos = 2;
	
	private static boolean fShuttingDown=false;

	private static Logger LOG = LoggerFactory.getLogger(Application.class);

	@SuppressWarnings("unchecked")
	public static void main(String[] args) throws InterruptedException, ClientWrapperException, IOException {
		if (args.length!=2){
			System.err.println("Use com.kaazing.mqtt.pi.Application <broker url> <client id>");
			System.exit(-1);
		}
		LOG.info("Configuring GPIO.");	
		final GpioController gpio = GpioFactory.getInstance();
		// We in fact will control GPIO 27
		final GpioPinDigitalOutput lightPin02 = gpio.provisionDigitalOutputPin(RaspiPin.GPIO_02, "Pin2", PinState.HIGH);
		lightPin02.setShutdownOptions(true, PinState.LOW);
		lightPin02.setState(PinState.LOW);

		// The button is in fact on GPIO 17
		final GpioPinDigitalInput button = gpio.provisionDigitalInputPin(RaspiPin.GPIO_00, PinPullResistance.PULL_DOWN);
		JSONParser parser = new JSONParser();
		String brokerUrl = args[0];
		String clientId = args[1];
		LOG.info("Connecting to "+brokerUrl+" with client ID "+clientId);
		
		final MqttClientWrapper client = new MqttClientWrapper(brokerUrl, clientId, true, new ClientListener() {

			public void onMessage(String topic, MqttMessage message) {
				String payload = new String(message.getPayload());
				LOG.debug("Received message on topic [" + topic + "]: " + payload);
				try {

					Object payloadObject = parser.parse(payload);
					JSONObject command = (JSONObject) payloadObject;
					if (!command.get("clientId").equals(clientId)){
						return;
					}
					String lightStatus = (String) command.get("maintenancelight");
					if (lightStatus == null) {
						LOG.error("Light status is not specified in the command: " + payload);
					}
					if (lightStatus.equals("on")) {
						lightPin02.setState(PinState.HIGH);
					} else if (lightStatus.equals("off")) {
						lightPin02.setState(PinState.LOW);
					} else {
						LOG.error("Unkonwn light status in the command: " + payload);
					}
				} catch (Exception e) {
					LOG.error("Cannot parse the message: " + payload);
				}
			}

			public void onConnectionLost(Throwable cause) {
				LOG.error("Connection is lost: " + cause.getMessage());

			}
		});

		JSONObject command = new JSONObject();
		command.put("button", "click");
		command.put("clientId", clientId);
		StringWriter out = new StringWriter();
		command.writeJSONString(out);
		String commandText = out.toString();
		button.addListener(new GpioPinListenerDigital() {

			@Override
			public void handleGpioPinDigitalStateChangeEvent(GpioPinDigitalStateChangeEvent event) {
				if (fShuttingDown){
					return;
				}
				if (event.getState() == PinState.HIGH) {
					LOG.debug("Button is clicked.");
					try {
						client.publish(topicPublishName, new MqttMessage(commandText.getBytes()));
						LOG.debug("Sent message to ["+topicPublishName+"]: "+commandText);
					} catch (ClientWrapperException e) {
						LOG.error("Cannot send command to a topic "+topicPublishName, e);
					}
				}
			}
		});
		LOG.info("Subscribing to "+topicListenName);
		try {
			client.subscribe(topicListenName, qos);
		} catch (Exception e) {
			LOG.error("Cannot subscibe to the topic "+topicListenName, e);
			client.disconnect();
			System.exit(-1);
		}		
		
		Runtime.getRuntime().addShutdownHook(new Thread() {
			public void run() {
				fShuttingDown=true;
				LOG.warn("Shutting down...");
				try {
					client.disconnect();
				} catch (ClientWrapperException e) {
					LOG.error("Shutting down exception!", e);
				}
			}
		});
		LOG.info("Ready...");
		// keep program running until user aborts (CTRL-C)
		for (;;) {
			Thread.sleep(500);
		}
	}

}
