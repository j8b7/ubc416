/* Helper for server-side chat room operations */

var redisManager = require('./redisManager.js');
var graph = require('./graphManager.js');

module.exports.RoomManager = RoomManager;
module.exports.getRoomManager = getRoomManager;

function RoomManager(options) {
    var self = this;
    options = options || {};

    this.roomsIdCountKey = options.roomsIdCountKey || 'counter:rooms';
    this.roomsKey = options.roomsKey || 'rooms';
    this.roomsPrefix = options.roomsPrefix || 'rooms:';
    this.roomsSuffix = options.roomsSuffix || ':rooms';
    this.usersPrefix = options.usersPrefix || 'users:';
    this.roomsMemberSuffix = options.roomsMemberSuffix || ':members';
    this.dbClient = options.client || redisManager.getClient();
    this.graphManager = options.graphManager || graph.getGraphManager();
}

function getRoomManager(options) {
    return new RoomManager(options);
}

RoomManager.prototype.createRoom = function(roomName, fn) {
    var self = this;

    // TODO sanitize roomName input

    // Generate a room id
    self.generateRoomId(function (err, roomId) {
        if (err) {
            return fn(err, {});
        } else {
            // Create the graph for the room id
            self.graphManager.createGraph(roomId, function(err, graphId) {
                if (err) {
                    return fn(err, {});
                } else {
                    // Save the room
                    var room = {
                        id : roomId,
                        name: roomName,
                        graph: graphId
                    };
                    var key = self.roomsPrefix + roomId;
                    self.dbClient.hmset(self.roomsKey, roomId, JSON.stringify(room), function(err, reply) {
                        if (err) {
                            return fn(err, {});
                        } else {
                            // Return the JSON room object on success
                            return fn(err, room);
                        }
                    });
                }
            });
        }
    });
}

RoomManager.prototype.generateRoomId = function(fn) {
    var self = this;
    self.dbClient.incr(self.roomsIdCountKey, function(err, reply) {
        return fn(err, reply);
    });
}

RoomManager.prototype.getRooms = function(fn) {
    var self = this;
    self.dbClient.hvals(self.roomsKey, function(err, reply) {
        // Construct a json array out of the returned rooms
        reply = '[' + reply + ']';
        return fn(err, reply);
    });    
}

RoomManager.prototype.addUserToRoom = function(userId, roomId, fn) {
    var self = this;

    var user = userManager.getUser(userId, function(err,user){
        if (err) {
            return fn(err, null);
        } else {
            var multi = self.dbClient.multi();
            var key = self.roomsPrefix + roomId + self.roomsMemberSuffix;
            multi.hmset(key, userId, JSON.stringify(user));
            key = usersPrefix + userId + roomsSuffix;
            multi.sadd(usersPrefix, roomId);
            multi.exec(function(err, replies) {
                if (err) {
                    return fn(err, replies);
                } else {
                    return fn(err, user);
                }
            });
        }
    });
}

RoomManager.prototype.removeUserFromRoom = function(userId, roomId, fn) {
    var self = this;

    var multi = self.dbClient.multi();
    var key = self.roomsPrefix + roomId + self.roomsMemberSuffix;
    multi.hdel(key, userId);
    key = self.usersPrefix + userId + self.roomsSuffix;
    multi.srem(key, roomId);
    multi.exec(function(err, replies) {
        if (err) {
            return fn(err,null);
        } else {
            return fn(err,replies);
        }
    });
}

RoomManager.prototype.removeUserFromAllRooms = function(userId, fn) {
    var self = this;

    var multi = self.dbClient.multi();
    var key = self.usersPrefix + userId + self.roomsSuffix;
    var rooms = self.dbClient.smembers(key, function(err,rooms) {
        if (err) {
            return fn(err,null);
        } else {
            for (var i = 0; i < rooms.length; i++){
                var roomId = rooms[i];
                self.removeUserFromRoom(userId,roomId, function(err,reply){
                    if (err) {
                        return fn(err,null);
                    }
                });
            }
            return fn(err,{});
        }
    });
}
