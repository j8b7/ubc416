// Express & socket.io dependencies/interaction
var express = require('express');
var app = module.exports = express.createServer(express.logger());
var socketio = require('socket.io');
var io = socketio.listen(app);

// Redis dependencies
var redisManager = require('./server/js/redisManager'), 
    dbClient = redisManager.getClient(), 
    dbPub = redisManager.getPub(), 
    dbSub = redisManager.getSub();
var connect = require('express/node_modules/connect');
var RedisStore = require('connect-redis')(express);
var expressStore = new RedisStore({
    client : dbClient
});

// socket.io management
var ioManager = require('./server/js/ioManager');

// Facebook modules
var passport = require('passport');
var authentication = require('./server/js/authentication');

// Http request routing
var router = require('./server/js/router');

app.configure(function() {
    //configure passport
    authentication.configurePassport(passport);

	// Error handler
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));

    // HTML request body parsing
    app.use(express.bodyParser());

    // Cookie parsing
    app.use(express.cookieParser());

    // Session management
    app.use(express.session({
        secret: 'secret',
        key: 'express.sid',
        store: expressStore
    }));

    // Passport for Facebook login
	app.use(passport.initialize());
    app.use(passport.session());

	// Static file management
	app.use('/css', express.static(__dirname + '/client/css'));
	app.use('/html', express.static(__dirname + '/client/html'));
	app.use('/js', express.static(__dirname + '/client/js'));
});

//configure the socket io interactions
ioManager.configureIO(io, expressStore);

//configure the routes
router.setRoutes(app, passport);

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});
