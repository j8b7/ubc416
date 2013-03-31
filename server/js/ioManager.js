var connect = require('express/node_modules/connect');
var parseCookie = connect.utils.parseCookie;
var Session = require('express/node_modules/connect').middleware.session.Session;

// Redis dependencies
var redis = require('socket.io/node_modules/redis');
var RedisStore = require('socket.io/lib/stores/redis');
var redisManager = require('./redisManager'), 
    dbClient = redisManager.getClient(), 
    dbPub = redisManager.getPub(), 
    dbSub = redisManager.getSub();
var socketStore = new RedisStore({
    redis : redis, 
    redisClient : dbClient,
    redisPub : dbPub,
    redisSub : dbSub
});

// Room management
var roomManager = require('./roomManager').getRoomManager();

// Graph management
var graphManager = require('./graphManager').getGraphManager();

module.exports.configureIO = configureIO;

function configureIO(io, expressStore) {
	// Heroku won't actually allow us to use WebSockets
	// so we have to setup polling instead.
	// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
	io.configure(function() {
		io.set("transports", ["xhr-polling"]);
		io.set("polling duration", 5);
		io.set('log level', 1);
		io.set('close timeout', 15);
        io.set('store', socketStore);
	});

    io.set('authorization', function (data, accept) {
        // check if there's a cookie header
        if (data.headers.cookie) {
            // if there is, parse the cookie
            data.cookie = parseCookie(data.headers.cookie);
            data.sessionID = data.cookie['express.sid'];
            
            // Check if the session is already stored in Redis
            expressStore.get(data.sessionID, function (err, session) {
                if (err || !session) {
                    // No matching session found
                    return accept('Error', false);
                } else {
                    // create a session object, passing data as request and our
                    // just acquired session data
                    data.session = new Session(data, session);
                    return accept(null, true);
                }
            });
        } else {
           // if there isn't, turn down the connection with a message
           // and leave the function.
           return accept('No cookie transmitted.', false);
        }
    });

	io.sockets.on('connection', function (socket) {
	console.log('socket with session id: ' + socket.handshake.sessionID + ' connected');

        // Subscribe the user to the global chat room
        socket.join('global-chat-room');
		
		// Broadcast message to all users
		socket.on('message', function (data) {
			// Notify all users in room including self about the message
            io.sockets.in('global-chat-room').emit('message', data);
		});

		// Add new node
		socket.on('add-node-request', function (request) {
			graphManager.addNode(request.graph, request.name, request.data, function (err, node) {
				var data = {
					err: err,
					node: node
				};
				if (err) {
					data.message = 'Error adding node';
				} else {
					data.message = 'Node Added';
				}                
				// Broadcast response to all users in the room
				io.sockets.in('global-chat-room').emit('add-node-response', data);
			});
		});

		// Delete node
		socket.on('del-node-request', function (request) {
			graphManager.deleteNode(request.graph, request.id, function (err, nodeId) {
				var data = {
					err: err,
					id: nodeId
				};
				if (err) {
					data.message = 'Error deleting node';
				} else {
					data.message = 'Node Deleted'
				}
                io.sockets.in('global-chat-room').emit('del-node-response', data);
			});
		});

		// Add an edge
		socket.on('add-edge-request', function (request) {
			graphManager.addEdge(request.source, request.target, request.graph, request.name, request.data, function (err, edge) {
				var data = {
					err: err,
                    edge: edge
				};
				if (err) {
					data.message = 'Error adding edge';
				} else {
					data.message = 'Edge Added';
				}
                io.sockets.in('global-chat-room').emit('add-edge-response', data);
			});
		});

		// Delete an edge
		socket.on('del-edge-request', function (request) {
			graphManager.deleteEdge(request.graph, request.id, function (err, edge) {
				var data = {
					err: err,
                    edge: edge
				};
				if (err) {
					data.message = 'Error deleting edge';
				} else {
					data.message = 'Edge Deleted'
				}
				io.sockets.in('global-chat-room').emit('del-edge-response', data);
			});
		});

        socket.on('join-room-request', function(data) {
            // TODO Subscribe the user to the room (using room id), ie. socket.join('<roomid>')
            // TODO Add the room to the set of rooms the user belongs to

            // roomManager.addUserToRoom...
        });


        socket.on('leave-room-request', function(data) {
            // Unsubscribe the user from the room (using room id), ie. socket.leave('<roomid>')
            // Remove the room from the set of rooms the user belongs to

            // roomManager.removeUserFromRoom...
        });

        // Leave chat room on disconnect
		socket.on('disconnect', function() {
			socket.leave('global-chat-room');

            // TODO Remove the user from all rooms they belong to

            // roomManager.removeUserFromAllRooms...

            // TODO Delete the user if they have no open socket connections
		});
	});
}
