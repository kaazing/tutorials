var createTableRow = function (item) {
    var row = "<tr class='Blue'>";
    row += "<td>" + item.id + "</td>";
    row += "<td>" + item.action + "</td>";
    row += "<td class='action' id='"+item.id+"'>";
    row += "<input type='checkbox' id='"+item.id+"'>";
    row += "</td>";
    row += "</tr>";
    return row;
}

var createTable=function(items){
	for(var i=0;i<items.length;i++){
		var row=createTableRow(items[i]);
		$('#todoTable > tbody:last-child').append(row);
	}
}


var selectedItemIndex=-1;

var getDoneColor = function (item) {œ
    if (!item.available) {
        return "Busy";
    }
    else {
        if (item.id==selectedItemIndex) {
            if (item.complete)
                return 'MouseOverDone';
            else
                return 'MouseOverNotDone';
        }
        else if (item.complete)
            return 'Done';
        else
            return 'NotDone';
    }
}

var setItemColor=function(item){
    $('#'+item.id+".action").removeClass().addClass('action').addClass(getDoneColor(item));
}

var todos=null;

var findItem=function(id){
    for(var i=0;i<todos.length;i++){
        if (todos[i].id===id){
            return todos[i];
        }
    }
    return null;
}




var itemClicked = function (item) {
	var msg = "Item " + item.id + " is now " + ((item.complete) ? "completed" : "incompleted!");
	console.info(msg);

	$('#localMessages').append("<div>"+msg+"</div>");

	//Send command "complete" or "incomplete" for this item
	sendCommand(item, ((item.complete) ? "complete" : "incomplete"));
}

var checkItem=function(item){
	$(":checkbox").filter("#"+item.id).prop('checked', item.complete);
}


var logWebSocketMessage = function (cls, msg) {
    if (cls === undefined || cls == null)
        cls = "info";
    cls=cls.toLowerCase();
    console.info("From WebSocket: " + msg);
    $('#wsMessages').append("<div class='msg-"+cls+"'>"+msg+"</div>");
}


var sendCommand=function(item, command){
	var cmd = {
		command: command,
		item: item.id
	}

	sendMessage(cmd);
}


var processReceivedCommand=function(cmd){
	logWebSocketMessage("received","Received command: "+cmd.command+", item id: "+cmd.item)
	var item=findItem(cmd.item);
	if (cmd.command==="busy"){
		item.available=false;
	}
	else if (cmd.command==="available"){
		item.available=true;
	}
	else if (cmd.command==="complete"){
		item.complete=true;
	}
	else if (cmd.command==="incomplete"){
		item.complete=false;
	}
	setItemColor(item);
	checkItem(item);

}



//TODO: Add code to create client
var protocol=window.location.search.replace("?", "").split("&")[0];

var client=UniversalClientDef(protocol);
var connectionInfo=null;
if (protocol=="amqp") {
	connectionInfo = {
		URL: "ws://localhost:8001/amqp",
		TOPIC_PUB: "todo",
		TOPIC_SUB: "todo",
		username: "guest",
		password: "guest"
	};
}
else if (protocol=="jms") {
	connectionInfo = {
		URL: "ws://localhost:8001/jms",
		TOPIC_PUB: "/topic/Todo",
		TOPIC_SUB: "/topic/Todo",
		username: "",
		password: ""
	};
}
else{
	alert("Use: http://<host/port>/todo.html?<protocol>. Unknown protocol: "+protocol);
}

var sendMessage=function(msg){
	// TODO: Add code to send messages
	client.sendMessage(msg);
}

$(document).ready(function () {
    $.get('data/todo.json', function( r ) {
        todos=r;
        for(var i=0;i<todos.length;i++){
            todos[i].available=true;
        }
        createTable(todos);
        for(var i=0;i<todos.length;i++){
            setItemColor(todos[i]);
        }
        $(":checkbox").change(function() {
            var item=findItem(Number(this.id));
            item.complete=this.checked;
            itemClicked(item);
        });

        $(".action").mouseover(function(){
            var item=findItem(Number(this.id));
            selectedItemIndex=Number(this.id);
            setItemColor(item);
            sendCommand(item, "busy");
        });

        $(".action").mouseout(function(){
            var item=findItem(Number(this.id));
            selectedItemIndex=-1;
            setItemColor(item);
            sendCommand(item, "available");
        });

		//TODO: Add code to connect
        client.connect(connectionInfo.URL, connectionInfo.username, connectionInfo.password, connectionInfo.TOPIC_PUB, connectionInfo.TOPIC_SUB, true, processReceivedCommand,function(err){alert(err);}, logWebSocketMessage, null);
        $( window ).unload(function() {
            // TODO: Disconnect
            client.disconnect();
        });

    });
});