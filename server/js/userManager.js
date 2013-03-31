/* Helper for server-side user operations */

var redisManager = require('./redisManager.js');

module.exports.UserManager = UserManager;
module.exports.getUserManager = getUserManager;

function UserManager(options) {
    var self = this;
    options = options || {};

    this.usersIdCountKey = options.usersIdCountKey || 'counter:users';
    this.usersPrefix = options.usersPrefix || 'users:';
    this.authPrefix = options.authPrefix || 'auth:';
    this.sessionPrefix = options.sessionPrefix || 'sess:';
    this.dbClient = options.client || redisManager.getClient();
}

function getUserManager(options) {
    return new UserManager(options);
}

// Create a new user
UserManager.prototype.createUser = function(user, fn) {
    var self = this;
    // Generate a user id
    self.dbClient.incr(self.usersIdCountKey, function(err, userId) {
        if (err) {
            return fn(err, userId);
        } else {
            // Set the user id and save the user
            user.id = userId;
            self.updateUser(user, fn);
        }
    });
}

// Updates a user
UserManager.prototype.updateUser = function(user, fn) {
    var self = this;
    var key = self.usersPrefix + user.id;
    self.dbClient.set(key, JSON.stringify(user), function(err, reply) {
        return fn(err, user);
    });
}

// Store the authentication used by Facebook
UserManager.prototype.createAuth = function(auth, fn) {
    var self = this;
    var key = self.authPrefix + auth.type + ':' + auth.id;
    self.dbClient.set(key, JSON.stringify(auth), function(err, reply) {
        return fn(err, reply);
    });
}

// Get a user by user id
UserManager.prototype.findUser = function(userId, fn) {
    var self = this;
    var key = self.usersPrefix + userId;
    self.dbClient.get(key, function(err, user) {
        return fn(err, JSON.parse(user));
    });
}

// Get a user by session id
UserManager.prototype.findUserBySession = function(sessionId, fn) {
    var self = this;
    var key = self.sessionPrefix + sessionId;
    self.dbClient.get(key, function(err, session) {
        session = JSON.parse(session);
        if (err) {
            return fn(err, session);
        } else if (!session || !session.passport || !session.passport.user) {
            return fn({message: 'Unable to retrieve session for user'});
        } else {
            self.findUser(session.passport.user, function(err, user) {
                return fn(err, user);
            });
        }
    });
}

// Get a user by authentication
UserManager.prototype.findUserByAuth = function(auth, fn) {
    var self = this;
    var key = self.authPrefix + auth.type + ':' + auth.id;
    self.dbClient.get(key, function(err, reply) {
        if (err) {
            return fn(err, reply);
        } else if (!reply){
            return fn(err, null, auth)
        } else {
            auth = JSON.parse(reply);
            self.findUser(auth.userId, function(err, user) {
                return fn(err, user, auth);
            });
        }
    });
}

// Delete a user
UserManager.prototype.deleteUser = function(userId, fn) {
    var self = this;
    var key = self.usersPrefix + userId;
    self.dbClient.del(key, function(error, reply) {
        return fn(err, reply);
    });
}
UserManager.prototype.getUser = function(userId, fn) {
	
}