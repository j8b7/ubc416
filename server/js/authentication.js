var FacebookStrategy = require('passport-facebook').Strategy,
    LocalStrategy = require('passport-local').Strategy,
    userManager = require('./userManager.js').getUserManager(),
	passport = require('passport');

module.exports.configurePassport = configurePassport;
module.exports.ensureAuthenticated = ensureAuthenticated;
module.exports.redirectIfAuthenticated = redirectIfAuthenticated;

function configurePassport(passport) {
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {	
        userManager.findUser(id, function(err, user) {
            done(err, user);
        });
	});

    // Support for anonymous users
    passport.use('local-anon', 
        new LocalStrategy({
	        usernameField: 'displayName',
	        passwordField: 'hiddenUseless'
        }, function(displayName, hiddenUseless, done) {

        // TODO Sanitize displayName input?

	    var newUser = {
		    type: 'anonymous',
		    authProviders: ['local-anon'],
		    displayName: displayName
	    };

        // Create the user
	    userManager.createUser(newUser, function(err, user) {
		    if(err || !user) {
			    return done(null, false, {
				    message: 'Unable to create anonymous user'
			    });
		    } else {
		        var auth = {
			        type: 'local-anon',
			        id: user.id,
			        userId: user.id
		        };

                // Store the authentication used by the user
		        userManager.createAuth(auth, function(err, auth) {
			        return done(err, user);
		        });
            }
	    });
    }));

	// Support for Facebook users
	passport.use(new FacebookStrategy({
			clientID: "467723903281557",
			clientSecret: "759e0a3ef87517d0f85cc267d514034b",
			callbackURL: "http://ec2-54-241-221-63.us-west-1.compute.amazonaws.com:5000/auth/facebook/callback"
		}, function(accessToken, refreshToken, profile, done) {
            console.log("received facebook profile: " + profile.id + " " + profile.username);
            var auth = {
                type: 'facebook',
                id: profile.id,
                profile: profile
            }
			// Check if the user already exists
			userManager.findUserByAuth(auth, function(err, user, fullAuth) {
                if (err) {
                    // Datastore error
                    return done(err, user);
                } else if (user && fullAuth) {
                    // Match found, return the user
                    return done(err, user);
                } else {
                    // No match found, create a new user
                    var newUser = {
                        type: 'registered',
                        authProviders : ['facebook'],
                        facebookId : profile.id
                    }
                    userManager.createUser(newUser, function(err, user) {
                        if (err) {
                            return done(err, user);
                        } else {
                            // Set the user id
                            auth.userId = user.id;
                            // Save the auth
                            userManager.createAuth(auth, function(err, auth) {
                                return done(err, user);
                            });
                        }
                    });
                }
            });
        }
    ));
}

// Ensure a user is authenticated
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
    	return next(); 
	} else {
        res.redirect('/login');
    }
}

// Route the user to the app if already logged in
function redirectIfAuthenticated(req, res, next) {
    if (req.user) {
        res.redirect('/app');
    } else {
        return next();
    }
}
