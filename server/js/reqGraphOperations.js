var graphManager = require('./graphManager').getGraphManager();

module.exports.retrieveGraph = retrieveGraph;
module.exports.addNode = addNode;
module.exports.deleteNode = deleteNode;
module.exports.addEdge = addEdge;
module.exports.deleteEdge = deleteEdge;

//retrieve graph
function retrieveGraph(request, response) {
    var responseCode, message, graphId;
    
    // Get the graph id from the request parameters
    graphId = request.params.graphId;
    
    // Retrieve the graph using the graph helper
    graphManager.getGraph(graphId, function(err, graph) {
        if (err) {
            // Reply with a status 502 server error code
            responseCode = 502;
            message = {
                errorMessage: err.message,
                details: err
            };
        } else {
            // Reply with a status 200 OK code
            responseCode = 200;
            message = graph;
        }        

        // Write back the response
        response.writeHead(responseCode, {
        'Content-Type': 'application/json'
      });
        response.write( JSON.stringify(message) );
        response.end();  
    });  
}

// Add node
// Requires node object as request body
function addNode(request, response) {

    // Set with -d option in CURL. These default to {}
    var name = request.param('name');
    var data = request.param('data');
    var gid = request.params.graphId;

    graphManager.addNode(gid, name, data, function(err, node) {
        var response_code, message;
        if (err) {
            response_code = 502;
            message = {
                errorMessage: err.message,
                details: err
            };
        } else {
            response_code = 200;
            message = node;
        }
        response.writeHead(response_code, {
            'application-type': 'application/json'
        });
        response.write(JSON.stringify(message));
        response.end();
    });
}

//Delete node
function deleteNode(request, response) {
    
    var gid = request.params.graphId;
    var nid = request.params.nodeId;

    graphManager.deleteNode(gid, nid, function(err, node) {
        var response_code, message;
        if (err) {
            response_code = 502;
            message = {
               errorMessage: err.message,
               details: err
            };
        } else {
            response_code = 200;
            message = node;
        }
        response.writeHeader(response_code, {
            'application-type': 'application/json'
        });
        response.write(JSON.stringify(message));
        response.end();
    });
}

//Add edge
function addEdge(request, response) {
    var responseCode, message, sourceId, targetId, graphId, name, data;

    graphId = request.params.graphId;   
    sourceId = request.param('sourceId');
    targetId = request.param('targetId');
    name = request.param('name');
    data = request.param('data');
    
    // Create edge using helper
    graphManager.addEdge(sourceId, targetId, graphId, name, data, function(err, edge) {
        if (err) {
            // Reply with a status 502 server error code
            responseCode = 502;
            message = {
                errorMessage: err.message,
                details: err
            };
        } else {
            // Reply with a status 200 OK code
            responseCode = 200;
            message = edge;
        }        

        // Write back the response
        response.writeHead(responseCode, {
            'Content-Type': 'application/json'
        });
        response.write( JSON.stringify(message) );
        response.end();  
    });
}

//Delete edge
function deleteEdge(request, response) {
    var responseCode, message, edgeId, graphId;

    edgeId = request.params.edgeId;
    graphId = request.params.graphId;
    
    graphManager.deleteEdge(edgeId, graphId, function(err, edge) {
        if (err) {
            // Reply with a status 502 server error code
            responseCode = 502;
            message = {
                errorMessage: err.message,
                details: err
            };
        } else {
            // Reply with a status 200 OK code
            responseCode = 200;
            message = edge;
        }        

        // Write back the response
        response.writeHead(responseCode, {
            'Content-Type': 'application/json'
        });
        response.write( JSON.stringify(message) );
        response.end();  
    });
}
