function ArborManager() {
    var self = this;
    this.sys = new arbor.ParticleSystem(); // create the system with sensible repulsion/stiffness/friction
    // 1000, 600, 0.5
    self.sys.parameters({gravity:true, friction: 0.8, repulsion: 50}); // use center-gravity to make the graph settle nicely (ymmv)
    self.sys.renderer = Renderer("#graph-canvas"); // our newly created renderer will have its .init() method called shortly by sys...
}

ArborManager.prototype.retrieveGraph = function(gid) {
    var gid = gid || '1';
    var self = this;

    // Make an ajax request to get graph 1
    var options = {
        type:		'GET',
		url:        '/api/graphs/' + gid, 
		dataType:	'json',
		error:		function(reply) {
						console.log("Error retrieving graph: " + JSON.stringify(reply));				
					},
		success:    function(reply) {
						console.log("Retrieved graph: " + JSON.stringify(reply));
                        self.loadGraph(reply);
					} 
    };
    $.ajax(options);   
}

ArborManager.prototype.loadGraph = function(graph) {
    var self = this;
    var nodes = graph.nodes;
    $.each(nodes, function(index, node) {
        self.sys.addNode(node.id, {label: node.name});
    });
    
    var edges = graph.edges;
    $.each(edges, function(index, edge) {
        var newEdge = self.sys.addEdge( edge.source, edge.target, {label: edge.name, id: edge.id, data: edge.data});
    });
}

ArborManager.prototype.addNode = function(node) {
    // Convert the node back to a json object (Nodes are stored as strings in Redis)
    node = JSON.parse(node);
    this.sys.addNode(node.id, {label: node.name, data: node.data})
}

ArborManager.prototype.removeNode = function(nodeId) {
	this.sys.pruneNode(nodeId);
}

ArborManager.prototype.addEdge = function(edge) {
    edge = JSON.parse(edge);
    this.sys.addEdge(edge.source, edge.target, {label: edge.name, id: edge.id, data: edge.data});
}

ArborManager.prototype.removeEdge = function(edge) { 
    // Convert the edge back to a json object
    edge = JSON.parse(edge);
    var self = this;

    // First retrieve the edges from source TO target (the same order used when adding edges)
    var edges = self.sys.getEdges(edge.source, edge.target);
    $.each(edges, function(index, e) {
        // Check if the edge ids match and remove the edge if they do
        if (e.data.id === edge.id) {
            self.sys.pruneEdge(e);
            return;
        }
    });
}
