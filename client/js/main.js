

    var arborManager = new ArborManager();
    arborManager.retrieveGraph();

function chatBox(userId, history, callbackchatfunction)
{
    var rturnval = '<div class="chatwindow" id="chatwindow' + userId +'" >';
    rturnval += '<div class="chatwindowheader"> <div class="headerinfo">...' + userId + '...</div>';
    rturnval += '<div class="chatwindowheaderminimize" id="minchat' + userId + '" onclick="minimizechat(120)"><b>\/</b>  </div>';
    rturnval += '<div class="chatwindowheadermaximize" id="maxchat' + userId + '" onclick="maximizechat(120)"><b>/\</b>  </div>';
    rturnval += '<div class="chatwindowheaderclose"  onclick="chatuseriddestroy(120)">X </div>';
    rturnval += '</div>';
    //    rturnval +=
    rturnval += '<div><textarea  class="msghistory" id="chat-area history' + userId + '" readonly="readonly">' + history + '</textarea></div>';
       // rturnval +=
	rturnval += '<input id="name-input" type="hidden" value="' + userId + '">';
    rturnval += '<input class="msgbox" id="message-input' + userId +'" type="text" placeholder="Enter message text">';
	rturnval += '<input class="msgbtn" id="message-button" type="submit" value="Send" onclick="' + callbackchatfunction +'('+ userId +')" >';
	rturnval += '</div>';


    return rturnval;
}

function newchat(userId, history, callbackchatfunction){
    if (history == null)
        history = "";
    $("#chatarea").append(chatBox(userId, history, callbackchatfunction));
}


	$('#newnode-button').on('click', function() {
		var gid = $('#newnode-gid').val();
		var name = $('#newnode-name').val();
		var data = $('#newnode-data').val();

    var arborManager = new ArborManager();
    arborManager.retrieveGraph();

		console.log('Adding node: ' + name + ': ' + data);
		socket.emit('add-node', {
			gid: gid,
			name: name,
			data: data
		});
	});

	$('#delnode-button').on('click', function() {
		var gid = $('#delnode-gid').val();
		var nid = $('#delnode-nid').val();

		console.log('Deleting node: ' + nid + ' from graph: ' + gid);
		socket.emit('del-node', {
			gid: gid,
			nid: nid
		});
	});

	$('#newnode-button').on('click', function() {
		var graphId = $('#newnode-gid').val();
		var name = $('#newnode-name').val();
		var data = $('#newnode-data').val();

		socket.emit('add-node-request', {
			graph: graphId,
			name: name,
			data: data
		});
	});

	$('#delnode-button').on('click', function() {
		var graphId = $('#delnode-gid').val();
		var nodeId = $('#delnode-nid').val();

		socket.emit('del-node-request', {
			graph: graphId,
			id: nodeId
		});
	});

	$('#newedge-button').on('click', function() {
		var graphId = $('#newedge-gid').val();
		var sourceId = $('#newedge-sid').val();
		var targetId = $('#newedge-tid').val();
		var name = $('#newedge-name').val();
		var data = $('#newedge-data').val();

		console.log('Adding edge: ' + name + ': ' + data);
		socket.emit('add-edge-request', {
			graph: graphId,
			source: sourceId,
			target: targetId,
			name: name,
			data: data
		});
	});

	$('#deledge-button').on('click', function() {
		var graphId = $('#deledge-gid').val();
		var edgeId = $('#deledge-eid').val();

		console.log('Deleting edge: ' + edgeId + ' from graph: ' + graphId);
		socket.emit('del-edge-request', {
			graph: graphId,
			id: edgeId
		});
	});

<<<<<<< BEGIN MERGE CONFLICT: local copy shown first <<<<<<<<<<<<<<<
// sample call back function
function sendchat(userId,callbackchatfunction){
    var cht = $("#message-input" + userId).val();
    // send it using socket
}

======= COMMON ANCESTOR content follows ============================
	socket.on('message', function(data) {
		console.log('Received message: ' + data.name + ': ' + data.message);
		$('#chat-textarea').append(data.name + ': ' + data.message + '\n');
	});

	socket.on('add-node-response', function(data) {
		if (data.err) {
			console.log('Error: ' + data.message);
		} else {
			arborManager.addNode(data.node);
		}
	});

	socket.on('del-node-response', function(data) {
		if (data.err) {
			console.log('Error: ' + data.message);
		} else {
            arborManager.removeNode(data.id);
		}
	});

	socket.on('add-edge-response', function(data) {
		if (data.err) {
			console.log('Error: ' + data.message);
		} else {
			arborManager.addEdge(data.edge);
		}
	});

	socket.on('del-edge-response', function(data) {
		if (data.err) {
			console.log('Error: ' + data.message);
		} else {
			arborManager.removeEdge(data.edge);
		}
	});
});
======= MERGED IN content follows ==================================
	socket.on('message', function(data) {
		console.log('Received message: ' + data.name + ': ' + data.message);
		$('#chat-textarea').append(data.name + ': ' + data.message + '\n');
	});

	socket.on('node-response', function(data) {
		if (data.err) {
			console.log('Error: ' + data.message);
		} else {
			//arborManager.retrieveGraph(data.gid);
			// Auto-redraw crashes the browser on the second node added (second only!)
			// Auto-redraw doesn't work for node delete
		}
	});
});
>>>>>>> END MERGE CONFLICT >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
