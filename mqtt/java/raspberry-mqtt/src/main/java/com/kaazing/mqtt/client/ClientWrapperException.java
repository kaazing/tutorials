package com.kaazing.mqtt.client;

public class ClientWrapperException extends Exception {

	public ClientWrapperException(Throwable e) {
		super(e);
	}

	public ClientWrapperException(String msg, Throwable e) {
		super(msg, e);
	}

	/**
	 * 
	 */
	private static final long serialVersionUID = -1521495306504208718L;

}
