var express = require('express'),
    passport = require('passport'),
    http = require('http');
    router = require('./router');
    authentication = require('./authentication');
var app = express();

authentication.configurePassport(passport);

app.configure(function() {
	app.use(express.favicon());
	app.use(express.logger());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: process.env.SECRET || 'nodejs' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
	app.use(express.errorHandler());
	console.log("App configuration complete");
});

router.setRoutes(app, passport);

app.listen(process.env.VCAP_APP_PORT  || 3000);