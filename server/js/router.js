var authentication = require('./authentication'), 
    roomManager = require('./roomManager.js').getRoomManager();
    facebook = require('./facebookManager.js');
    userManager = require('./userManager').getUserManager();
    reqGraphOperations = require('./reqGraphOperations');

module.exports.setRoutes = setRoutes;

function setRoutes(app, passport) {
    //  Home page
    app.get('/', authentication.redirectIfAuthenticated, function(request, response) {
        response.sendfile('./client/html/index.html');
    });

    // Facebook authentication request
    app.get('/auth/facebook', 
        passport.authenticate('facebook'), 
        function(req, res) {
        // Redirects to Facebook for authentication and is not directly called
    });

    // Facebook authentication callback
    app.get('/auth/facebook/callback', 
        passport.authenticate('facebook', { failureRedirect : '/'}), 
        function(req, res) {
        res.redirect('/setdisplayname');
    });
    //retrieve friends and create friends graph
    app.get('/getFriendsList', facebook.getFriendsList);
    app.get('/getFriendsGraph', facebook.createFriendsGraph, function(req,res){
        res.redirect('/');
        });
    // Set display name page
    app.get('/setdisplayname', authentication.ensureAuthenticated, function(req, res) {
	    res.sendfile('./client/html/setdisplayname.html');
    });

    // Main application page
    app.get('/app', authentication.ensureAuthenticated, function(req, res) {
	    if (req.user.displayName) {
            res.sendfile('./client/html/app.html');
	    } else {
            res.redirect('/setdisplayname');
	    }
    });

    // Anonymous login
    app.post('/login-anon', 
        passport.authenticate('local-anon'), 
        function(req, res) {
            res.json(req.user, 200);
    });

    // Set user display name
    app.post('/api/users/me/displayname', 
    authentication.ensureAuthenticated, 
    function(req, res) {
        // TODO Sanitize display name input
	    var displayName = req.param('displayName');
	    if (req.user.displayName !== displayName) {
		    req.user.displayName = displayName;
		    userManager.updateUser(req.user, function(err, user) {
			    if (err) {
				    res.json({
					    errorMessage: 'Internal server error. Try again later'
				    }, 500);
			    } else {
			        res.json(req.user, 200);
                }
		    });
	    } else {
		    res.json(req.user, 200);
	    }
    });

    // Create chat room
    app.post('/api/rooms', function(request, response) {
        var name = request.param('name');
        roomManager.createRoom(name, function(err, room) {
            var responseCode, message;
            if (err) {
                responseCode = 502;
                message = {
                    errorMessage: err.message,
                    details: err
                };
            } else {
                responseCode = 200;
                message = room;
            }
            // Write back the response
            response.writeHead(responseCode, {
                'Content-Type': 'application/json'
            });
            response.write( JSON.stringify(message) );
            response.end();  
        });
    });

    // Get all chat rooms
    app.get('/api/rooms', function(request, response) {
        roomManager.getRooms(function(err, rooms) {
            var responseCode, message;
            if (err) {
                responseCode = 502;
                message = {
                    errorMessage: err.message,
                    details: err
                };
            } else {
                responseCode = 200;
                message = rooms;
            }
            // Write back the response
            response.writeHead(responseCode, {
                'Content-Type': 'application/json'
            });
            response.write( JSON.stringify(message) );
            response.end();  
        });
    });
    
    // Retrieve graph
    app.get('/api/graphs/:graphId', reqGraphOperations.retrieveGraph);

    // Add node
    // Requires node object as request body
    app.post('/api/graphs/:graphId/nodes', reqGraphOperations.addNode);

    // Delete node
    app.post('/api/graphs/:graphId/nodes/:nodeId', reqGraphOperations.deleteNode);

    // Add edge
    app.post('/api/graphs/:graphId/edges', reqGraphOperations.addEdge);

    // Delete edge
    app.post('/api/graphs/:graphId/edges/:edgeId', reqGraphOperations.deleteEdge);
}
