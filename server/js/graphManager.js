/* Helper to perform graph operations */

var redisManager = require('./redisManager.js');

module.exports.GraphManager = GraphManager;
module.exports.getGraphManager = getGraphManager;

function GraphManager(options) {
    var self = this;
    options = options || {};

    this.graphsIdCountKey = options.graphsIdCountKey || 'counter:graphs';
    this.graphsPrefix = options.graphsPrefix || 'graphs:';
    this.nodesPrefix = options.nodesPrefix || ':nodes';
    this.nodesCountKey = options.nodesCountKey || ':counter:nodes';
    this.edgesPrefix = options.edgesPrefix || ':edges';
	this.edgesCountKey = options.edgesCountKey || ':counter:edges';
    this.dbClient = options.client || redisManager.getClient(); 
}

function getGraphManager(options) {
    return new GraphManager(options);
}

GraphManager.prototype.createGraph = function(roomId, fn) {
    // Check that roomId is valid?
    // Check that a graph doesn't exist for the room already?
    var self = this;

    // Generate a new id for the graph
    this.generateGraphId(function(err, graphId) {
        if (err) {
            return fn(err, {});
        } else {
            var graph = {
                id: graphId,
                room: roomId
            };
            // Save the graph to Redis
            var key = self.graphsPrefix + graphId
            self.dbClient.set(key, JSON.stringify(graph), function(err, reply) {
                return fn(err, graph);
            });
        }
    });
}

GraphManager.prototype.generateGraphId = function(fn) {
    var self = this;
    
    // Updates the count for the graphs key
    this.dbClient.incr(this.graphsIdCountKey, function(err, reply) {
        return fn(err, reply);
    });
}

GraphManager.prototype.addNode = function(graphId, name, data, fn) {
    var self = this;
    
    this.generateNodeId(graphId, function(err, nodeId) {
	    if (err) {
	        return fn(err, {});
	    } else {
	        var node = {
                id: nodeId,
                name: name,
                data: data,
                graph: graphId
            };
            node = JSON.stringify(node);

	        var key = self.graphsPrefix + graphId + self.nodesPrefix;
	        self.dbClient.hset(key, nodeId, node, function(err, ret) {
		        if (err) {
		            return fn(err, {});
		        } else {
		            return fn(err, node);
		        }
	        });
	    }
    });
}

// Deletes a node and any edges connected to it
GraphManager.prototype.deleteNode = function(graphId, nodeId, fn) {
    var self = this;

    // Get the edge ids of edges connected to the node being deleted
    self.dbClient.hkeys(self.graphsPrefix + graphId + self.nodesPrefix + ':' + nodeId + self.edgesPrefix, function(err, reply) {
        if (err || !reply) {
            return fn(err, reply);
        } else {
            // Delete each edge connected to the node being deleted
            for (var i = 0; i < reply.length; i++) {
                self.deleteEdge(reply[i], graphId, function(err, reply) {
                    if (err) return fn(err, reply);            
                });
            }
            // Finally delete the node
            self.dbClient.hdel(self.graphsPrefix + graphId + self.nodesPrefix, nodeId, function(err, reply) {
	            if (err) {
	                return fn(err, {});
	            } else {
	                return fn(err, nodeId);
	            }
            });
        }

    });
}

GraphManager.prototype.generateNodeId = function(graphId, fn) {
    var self = this;
    var key = this.graphsPrefix + graphId + this.nodesCountKey;
    this.dbClient.incr(key, function(err, reply) {
        if (err) {
             return fn(err, reply);
	} else {
	     // Reply is the generated id
	     return fn(null, reply);
	}
    });
}

GraphManager.prototype.addEdge = function(sourceId, targetId, graphId, name, data, fn) {
    var self = this;

    // Generate a new id for the edge
    this.generateEdgeId(graphId, function(err, edgeId) {
        if (err) {
            return fn(err, {});
        } else {
            var edge = {
                id: edgeId,
				source: sourceId,
				target: targetId,
				name: name,
				data: data,
                graph: graphId
            };
            edge = JSON.stringify(edge);
            // Save the edge to Redis
			var multi = self.dbClient.multi();
            var key = self.graphsPrefix + graphId + self.edgesPrefix;
            multi.hset(key, edgeId, edge);
			//Save the edge-node connections to Redis
            key = self.graphsPrefix + graphId + self.nodesPrefix + ':' + sourceId + self.edgesPrefix;
            multi.hset(key, edgeId, edge);
            key = self.graphsPrefix + graphId + self.nodesPrefix + ':' + targetId + self.edgesPrefix;
            multi.hset(key, edgeId, edge);
			multi.exec(function(err, replies) {
				if (err) {
					return fn(err, replies);
				} else {
                    return fn(null, edge);
                }
			});
        }
    });
}

GraphManager.prototype.generateEdgeId = function(graphId, fn) {
    var self = this;
    
    // Updates the count for the edges of this graph
    this.dbClient.incr(this.graphsPrefix+graphId+this.edgesCountKey, function(err, reply) {
        if (err) {
            return fn(err, reply);
        } else {
            // Reply is the generated id
            return fn(null, reply);
        }
    });
}

GraphManager.prototype.deleteEdge = function(graphId, edgeId, fn) {
    var self = this;

    self.dbClient.hget(self.graphsPrefix + graphId + self.edgesPrefix, edgeId, function(err, edge) {
        if (err) {
            return fn(err, edge);
        } else {
            var oldEdge = JSON.parse(edge);
            var oldSourceId, oldTargetId;    
            oldSourceId = oldEdge.source;
	        oldTargetId = oldEdge.target;
            // Remove old edge-node connections
            var multi = self.dbClient.multi();
	        multi.hdel(self.graphsPrefix + graphId + self.nodesPrefix + ':' + oldSourceId + self.edgesPrefix, edgeId);
	        multi.hdel(self.graphsPrefix + graphId + self.nodesPrefix + ':' + oldTargetId + self.edgesPrefix, edgeId);
	        // Remove edge from Redis
	        multi.hdel(self.graphsPrefix + graphId + self.edgesPrefix, edgeId);
	        multi.exec(function(err, replies) {
                if (err) {
			        return fn(err, edge);
		        } else {
                    return fn(null, edge);
		        }
	        });
        }
    });	
}

GraphManager.prototype.getGraph= function(graphId, fn) {
    var self = this;

    // Node lookup key
    var key = this.graphsPrefix + graphId + this.nodesPrefix;

    // Retrieve nodes from Redis
    this.dbClient.hvals(key, function(err, nodes) {
        if (err) {
            return fn(err, {});
        } else {
            // Construct a json array out of the returned nodes
            nodes = '[' + nodes + ']';
            nodes = JSON.parse(nodes);

            // Edges lookup key
            key = self.graphsPrefix + graphId + self.edgesPrefix;
            
            // Retrieve edges from Redis                        
            self.dbClient.hvals(key, function(err, edges) {
                if (err) {
                    return fn(err, {});
                } else {
                    // Construct a json array out of the returned edges
                    edges = '[' + edges + ']';
                    edges = JSON.parse(edges);
                    // Create and return the graph object
                    var graph = {
                        id: graphId, 
                        nodes: nodes,
                        edges: edges
                    }
                    return fn(null, graph);
                }
            });
        }
    });
}
