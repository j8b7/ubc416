// Express & socket.io dependencies/interaction
var express = require('express');
var redis = require('redis');


var app = module.exports = express.createServer(express.logger());
var socketio = require('socket.io');

var url = require('url');
var passport = require('passport');
var RedisStore = require('connect-redis')(express);
var ioManager = require('./server/js/ioManager');
var router = require('./server/js/router');
var authentication = require('./server/js/authentication');
var http = require('http');
var app = express();

var server = http.createServer(app);
var io = socketio.listen(server);


var app = express.createServer(express.logger());

var io = socketio.listen(app);

var dbClient = require('./server/js/redisManager').getClient();
var graphManager = require('./server/js/graphManager').getGraphManager();

var users = [];

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
        store: new RedisStore({
            client: dbClient
        })
    }));

	// Static file management
	app.use('/js', express.static(__dirname + '/client/js'));
});

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

app.get('/', function(request, response) {
	response.sendfile(__dirname + '/client/html/index.html');
});

	// Static file management
	app.use('/css', express.static(__dirname + '/client/css'));
	app.use('/html', express.static(__dirname + '/client/html'));
	app.use('/js', express.static(__dirname + '/client/js'));




    // Hard-coded graph for testing purposes
    dbClient.flushdb();
    
    var roomId = 1;
    graphManager.createGraph(roomId, function(err, graph) {
        if (!err) {
            console.log('graph id is: ' + graph.id);
        }
    });

io.sockets.on('connection', function (socket) {
	// Save the user
	users.push(socket);
	
	// Broadcast message to all users
	socket.on('message', function (data) {
		users.map( function(user) {
			user.emit('message', data);
		});
	});

//configure the socket io interactions
ioManager.configureIO(io, expressStore);



});

	socket.on('disconnect', function() {
		// Remove the user
		var index = users.indexOf(this);
		if (index != -1) {
			users.splice(index, 1);
		}		
	});

//configure the routes
router.setRoutes(app, passport);

//configure the socket io interactions
ioManager.configureIO(io, graphManager);

//configure the routes
router.setRoutes(app, passport);

var port = process.env.PORT || 5000;
server.listen(port, function() {
	console.log("Listening on " + port);
});
