var FB = require('fb'),
	graph = require('./graphManager').getGraphManager();

exports.getFriendsList = getFriendsList;
exports.createFriendsGraph = createFriendsGraph;

function getFriendsList(req, res)
{
	FB.setAccessToken(req.user.accessToken);
	FB.api(req.user.id, { fields: ['friends'] }, function (FBres) {
		
		if(!FBres || FBres.error) 
		{
			console.log(!FBres ? 'error occurred' : FBres.error);
			return;
		}

		res.end(JSON.stringify(FBres.friends));
	});
}


function createFriendsGraph(req, res)
{
		FB.setAccessToken(req.user.accessToken);
		graphId = 1;
		FB.api(req.user.id, { fields: ['friends'] }, function (FBres) {
			
			if(!FBres || FBres.error) 
			{
				console.log(!FBres ? 'error occurred' : FBres.error);
				return;
			}
			//add the node for current user
			graph.addNode(graphId, req.user.name, "data", function(err, mainNode){
				//add nodes for each friend along with an edge to current user
				for (var i = 0; i < FBres.friends.data.length; i++)
				{
					//add the node for the new friend
					graph.addNode(graphId, FBres.friends.data[i].name, " ", function(err, currNode){
						if (err)
							console.log("error when adding node");
						else
						{
							console.log("node added:" + currNode);
							//add the corresponding edge
							graph.addEdge(mainNode.id, currNode.id, graphId, " ", " ", function(err, edge)
								{
									if (err)
										console.log("error when adding node");
									else
										console.log("edge added successfully");
								});
						}
							
					});

					 //console.log(FBres.friends.data[i].name);
					 
				}
			});

		});

}