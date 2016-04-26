var connection;
var session;
var consumers = [];
var subscribers = [];
var inTransaction;
var locationURI;

var destination = "/topic/bouncy";
var message = "";
var locationURI = "ws://localhost:8001/jms";

function createDestination(name, session) {
	if (name.indexOf("/topic/") == 0) {
		return session.createTopic(name);
	} else if (name.indexOf("/queue/") == 0) {
		return session.createQueue(name);
	} else {
		throw new Error("Destination must start with /topic/ or /queue/");
	}
}

function handleConnect() {
	console.log("CONNECT: " + locationURI);

	var stompConnectionFactory = new JmsConnectionFactory(locationURI);

	try {
		var connectionFuture = stompConnectionFactory.createConnection("", "", function () {
			if (!connectionFuture.exception) {
				try {
					connection = connectionFuture.getValue();
					connection.setExceptionListener(handleException);

					console.log("CONNECTED");
					session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
					transactedSession = connection.createSession(true, Session.AUTO_ACKNOWLEDGE);
					connectedToGateway = true;

					connection.start(function () {
						handleSubscribe();
					});
				} catch (e) {
					handleException(e);
				}
			} else {
				handleException(connectionFuture.exception);
			}
		});
	} catch (e) {
		handleException(e);
	}
}

function handleException(e) {
	console.log("EXCEPTION: " + e);
}

function handleSubscribe() {

	console.log("SUBSCRIBE: " + destination);

	var dest = createDestination(destination, session);

	var consumer = session.createConsumer(dest);
	if (!consumers[name]) {
		consumers[name] = [];
	}
	consumers[name].push(consumer);

	consumer.setMessageListener(handleMessage);
}

function handleMessage(message) {
	console.log("handleMessage");
	if (message instanceof TextMessage) {
		if (deviceID == 0 && (message.getText() == 'top' || message.getText() == 'bottom' || message.getText() == 'left' || message.getText() == 'right')) {
			// Attaching the devices...
			snap = true;

			// attachPos: the position where the browsers are attached: left, right, top, bottom
			attachPos = message.getText();
			deviceID = 2;
		} //if

		if (message.getText().indexOf("y=") == 0) {
			//Attached along the X axis
			y1 = msgParse(message.getText(), "y=");
			dx1 = msgParse(message.getText(), "dx=");
			dy1 = msgParse(message.getText(), "dy=");

			if (msgParse(message.getText(), "deviceID=") == deviceID) {
				ballOnMySide = true;
				console.log("Ball coming my way... " + message.getText());
				if (attachPos == "right") {
					x1 = 10;
				}
				else if (attachPos == "left") {
					x1 = maxX1 - 10;
				}
			}
			else {
				ballOnMySide = false;
			}
		}
		else if (message.getText().indexOf("x=") == 0) {
			//Attached along the Y axis
			x1 = msgParse(message.getText(), "x=");
			dx1 = msgParse(message.getText(), "dx=");
			dy1 = msgParse(message.getText(), "dy=");
			if (msgParse(message.getText(), "deviceID=") == deviceID) {
				ballOnMySide = true;
				console.log("Ball coming my way... " + message.getText());
				if (attachPos == "top") {
					y1 = 5;
				}
				else if (attachPos == "bottom") {
					y1 = maxY1 - 5;
				}
			}
			else {
				ballOnMySide = false;
				console.log("Ball on the other side...");
			}
		}
	} //if
	else if (message instanceof BytesMessage) {
		console.log("Unexpected Binary Message!");
	}
}

function msgParse(msg, lookFor) {
	return parseInt(msg.substr(msg.indexOf(lookFor) + lookFor.length, 3).replace(/^\s+|\s+$/g, ''));
}

function handleSend() {
	var dest = createDestination(destination, session);
	var producer = session.createProducer(dest);

	var textMsg = session.createTextMessage(message);
	producer.send(textMsg, null);
	// Ball crossing
	console.log("SEND: " + message + " " + destination);

	producer.close();
}

//Size of the canvas used
maxX1 = 300;
maxY1 = 400;

// Whether the browser has successfully established a connection to the websocket gateway
var connectedToGateway = false;
//Context for the canvas
var context1;
//Coordinates of the ball
var x1 = 123;
var y1 = 234;
//Horizontal and vertical step size (between renditions of the ball)
var dx1 = 5;
var dy1 = 5;

//Location of the canvas in the browser window. (0,0) indicates top left corner
var offsetX1 = 0;
var offsetY1 = 0;

var logMsg = "Logging...\n";

var snap = false;

// attachPos: the position where the browsers are attached. Values: "left", "right", "top", "bottom", "none" (if not defined)
var attachPos = 'none';

// The speed of the ball
speed = 20;

// How accurately does the user have to tap to connect to the other device
var tapPrecision = 2500;

// The ID of the device this code is running on. Values: 1, 0. If undefined (before attaching the devices): 0.
var deviceID = 0;

// Just that: is the ball on my side: true/false
var ballOnMySide = true;

function init() {

	// Connecting to the WebSocket Gateway
	handleConnect();

	context1 = myCanvas1.getContext('2d');

	setInterval(draw, speed);

	myCanvas1.onmousemove = moveEventFunction;
}

function moveEventFunction(e) {
	if (!snap) {
		var p = getCoords(e);
		deviceID = 1;

		// Tapped on the top
		if ((p.x - maxX1 / 2) * (p.x - maxX1 / 2) + p.y * p.y < tapPrecision) {
			snap = true;
			attachPos = "top";
			message = "bottom";
			handleSend();
			console.log("DeviceID: " + deviceID);
		}
		// Tapped on the bottom
		if ((p.x - maxX1 / 2) * (p.x - maxX1 / 2) + (p.y - maxY1) * (p.y - maxY1) < tapPrecision) {
			snap = true;
			attachPos = "bottom";
			message = "top";
			handleSend();
			console.log("DeviceID: " + deviceID);
		}
		// Tapped on the right
		if (p.x * p.x + (p.y - maxY1 / 2) * (p.y - maxY1 / 2) < tapPrecision) {
			snap = true;
			attachPos = "right";
			message = "left";
			handleSend();
			console.log("DeviceID: " + deviceID);
		}
		// Tapped on the left
		if ((p.x - maxX1) * (p.x - maxX1) + (p.y - maxY1 / 2) * (p.y - maxY1 / 2) < tapPrecision) {
			snap = true;
			attachPos = "left";
			message = "right";
			handleSend();
			console.log("DeviceID: " + deviceID);
		}
	}
	return false;
	// Stop event bubbling up and doing other stuff (like pinch zoom or scroll)
}


function getCoords(e) {
	if (e.offsetX) {
		// Works in Chrome / Safari (except on iPad/iPhone)
		return {
			x: e.offsetX,
			y: e.offsetY
		};
	} else if (e.layerX) {
		// Works in Firefox
		return {
			x: e.layerX,
			y: e.layerY
		};
	}
}

function drawRectangle(topLeftX, topLeftY, width, height) {
	context1.save();
	context1.beginPath();
	context1.rect(topLeftX, topLeftY, width, height);
	context1.fillStyle = "FF0000";
	context1.fill();
	context1.strokeStyle = "red";
	context1.stroke();
	context1.restore();
}

function drawConnecting(pos) {
	context1.save();
	context1.font = '12px sans-serif';
	context1.fillStyle = '#f00';
	context1.textBaseline = "center";
	switch (pos) {
		case "top":
			context1.fillText("Connecting along this side...", maxX1 / 2 - 65, 20);
			break;
		case "bottom":
			context1.fillText("Connecting along this side...", maxX1 / 2 - 65, maxY1 - 15);
			break;
		case "left":
			context1.translate(maxX1 / 2, maxY1 / 2);
			context1.rotate(Math.PI / 2);
			context1.fillText("Connecting along this side...", -80, 96);
			break;
		case "right":
			context1.translate(maxX1 / 2, maxY1 / 2);
			context1.rotate(-Math.PI / 2);
			context1.fillText("Connecting along this side...", -80, 96);
			break;
		default:
			;
	}
	context1.restore();
}

function draw() {

	// Drawing the canvas
	var lingrad1 = context1.createLinearGradient(0, 0, 0, maxY1);
	if (!connectedToGateway) {
		lingrad1.addColorStop(1, "#000");
		lingrad1.addColorStop(0, "#888");
	}
	else {
		if (!snap) {
			lingrad1.addColorStop(1, "#fff");
			lingrad1.addColorStop(0, "#aaf944");
		}
		else {
			lingrad1.addColorStop(1, "#fff");
			lingrad1.addColorStop(0, "#ffa500");
		}
	}

	context1.fillStyle = lingrad1;
	context1.fillRect(0, 0, maxX1, maxY1);

	/*
	 * Draw attach bars: left, right, top, bottom
	 */
	if (!snap) {
		drawRectangle(0, maxY1 / 2 - 50, 4, 100);
		drawRectangle(maxX1 - 5, maxY1 / 2 - 50, 4, 100);
		drawRectangle(maxX1 / 2 - 40, 0, 80, 4);
		drawRectangle(maxX1 / 2 - 40, maxY1 - 5, 80, 4);
	}
	else {
		// log ("x1: " + x1 + "y1: " + y1);
		switch (attachPos) {
			case "right":
				drawRectangle(0, maxY1 / 2 - 50, 4, 100);
				drawConnecting("left");
				break;
			case "left":
				drawRectangle(maxX1 - 5, maxY1 / 2 - 50, 4, 100);
				drawConnecting("right");
				break;
			case "top":
				drawRectangle(maxX1 / 2 - 40, 0, 80, 4);
				drawConnecting("top");
				break;
			default:
				drawRectangle(maxX1 / 2 - 40, maxY1 - 5, 80, 4);
				drawConnecting("bottom");
				break;
		}
	}

	if (ballOnMySide) {
		if (snap) {
			context1.beginPath();
			if (connectedToGateway) {
				context1.fillStyle = "#ff0000";
			}
			else {
				context1.fillStyle = "#ababab";
			}
			context1.arc(x1, y1, 10, 0, Math.PI * 2, true);
			context1.closePath();
			context1.fill();

			// Boundary Logic
			if (snap && ballOnMySide && (attachPos == "left" && x1 >= maxX1) || (attachPos == "right" && x1 <= 0)) {
				//switching sides
				ballOnMySide = false;
				message = "y=" + y1 + " " + "dx=" + dx1 + "  " + "dy=" + dy1 + "  " + "deviceID=" + (deviceID == "1" ? 2 : 1) + "  ";
				handleSend();
			} else if (snap && ballOnMySide && (attachPos == "bottom" && y1 >= maxY1) || (attachPos == "top" && y1 <= 0)) {
				ballOnMySide = false;
				message = "x=" + x1 + " " + "dx=" + dx1 + "  " + "dy=" + dy1 + "  " + "deviceID=" + (deviceID == "1" ? 2 : 1) + "  ";
				handleSend();
			}
			else {
				if (x1 < 0 || x1 > maxX1)
					dx1 = -dx1;
				if (y1 < 0 || y1 > maxY1)
					dy1 = -dy1;
				x1 += dx1;
				y1 += dy1;
			}

		}
		else
		// Drawing the ball - detached
		{
			context1.beginPath();
			if (connectedToGateway) {
				context1.fillStyle = "#ff0000";
			}
			else {
				context1.fillStyle = "#ababab";
			}
			// Draws a circle of radius 20 at the coordinates 100,100 on the canvas
			context1.arc(x1, y1, 10, 0, Math.PI * 2, true);
			context1.closePath();
			context1.fill();
			// Boundary Logic
			if (x1 < 0 || x1 > maxX1)
				dx1 = -dx1;
			if (y1 < 0 || y1 > maxY1)
				dy1 = -dy1;
			x1 += dx1;
			y1 += dy1;
		}
	}
}

