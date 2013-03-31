/* Helper to connect to redis and perform data transactions */
var redis = require('socket.io/node_modules/redis');

// Used for Redis url parsing
var url = require('url');

module.exports = new RedisManager();

function RedisManager() {
    this.client = null;
    this.pub = null;
    this.sub = null;
    this.dbUrl = process.env.REDIS_DB_URL|| "redistogo:b3bc23e8c4178f7696d229cabb976abb@viperfish.redistogo.com:9345/";
}

RedisManager.prototype.getClient = function() {
    if (this.client) {
        // Return the existing redis client
        return this.client;
    } else {
        // Parse the redis url
        var redisUrl = url.parse(this.dbUrl),
            redisAuth = redisUrl.auth.split(':')[0];
        
        // Create a new redis client
        this.client = redis.createClient(redisUrl.port, redisUrl.hostname);
        this.client.auth(redisAuth, function(err, reply) {
            if (err) {
                console.log('Error authenticating with redis instance: ' + redisUrl.host);
            } else {
                console.log('Client connected to redis instance: ' + redisUrl.host);
            }
        });
        
        return this.client;
    }
};

RedisManager.prototype.getPub = function() {
    if (this.pub) {
        return this.pub;
    } else {
        // Parse the redis url
        var redisUrl = url.parse(this.dbUrl),
            redisAuth = redisUrl.auth.split(':')[0];
        
        // Create a pub client
        this.pub = redis.createClient(redisUrl.port, redisUrl.hostname);
        this.pub.auth(redisAuth, function(err, reply) {
            if (err) {
                console.log('Error authenticating with redis instance: ' + redisUrl.host);
            } else {
                console.log('Pub connected to redis instance: ' + redisUrl.host);
            }
        });
        return this.pub;
    }
};

RedisManager.prototype.getSub = function() {
    if (this.sub) {
        return this.sub;
    } else {
        // Parse the redis url
        var redisUrl = url.parse(this.dbUrl),
            redisAuth = redisUrl.auth.split(':')[0];
        
        // Create a sub client
        this.sub = redis.createClient(redisUrl.port, redisUrl.hostname);
        this.sub.auth(redisAuth, function(err, reply) {
            if (err) {
                console.log('Error authenticating with redis instance: ' + redisUrl.host);
            } else {
                console.log('Sub connected to redis instance: ' + redisUrl.host);
            }
        });
        return this.sub;
    }
};
