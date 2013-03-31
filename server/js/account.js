var passToHash = require('./authentication').passToHash,
	database = require('./database'),
	crypto = require('crypto');
// creates a new account but does not deal with any customizations
// such as selecting sex and nickname
function createAccount(username, password, type, done){
	var client = database.getClient();
	
	// in Google or Facebook accounts their google/facebook id is used
	// as a password			
	var salt = database.getSalt();
	var passHash = passToHash(password, salt);


	//verify if an account already exists for this username
	client.query('SELECT username FROM user WHERE username = ?',
				[username], function(err, result, fields){
		client.end();
		if (err)
		{
			console.log(err);
			done(err);
		}
		if (result.length !== 0)
		{
			done("USERNAME_TAKEN");
			return;
		}
		client = database.getClient();
		client.query('INSERT INTO user (username, password, type) VALUES( ?, ?, ?)',[username, passHash, type],
		function(err, info){
			if (err)
			{
				console.log('Database error when adding new account' +
							err);
				client.end();
				done(err);
				return;
			}
			console.log('user added to database: ' + username);
			client.end();
			done(null);
	});
	});

}

function updateCharacter(username, sex, nickname, health, battles_won, done){
	var client = database.getClient();
	
	client.query('UPDATE  user SET sex = ?, nickname = ?, current_health = ?, battles_won = ? WHERE username = ?',
		[sex, nickname, health, battles_won, username],
		function(err, info){
			if (err)
			{
				console.log('Database error when adding new account' +
							err);
				client.end();
				done(err);
				return;
			}
			console.log('Character updated for username: ' + username);
			client.end();
			done(null);
	});

}
exports.createAccount = createAccount;
exports.updateCharacter = updateCharacter;