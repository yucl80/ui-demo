var server = new ot.Server([]);

var graph = new mxGraph(document.getElementById('graphContainer'));
graph.setConnectable(true);
graph.setMultigraph(false);
graph.setAllowDanglingEdges(false);

var vertexStyle = 'shape=ellipse;perimeter=ellipsePerimeter;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;';
var edgeStyle = 'edgeStyle=orthogonalEdgeStyle;rounded=0;';

graph.getStylesheet().putDefaultVertexStyle(vertexStyle);
graph.getStylesheet().putDefaultEdgeStyle(edgeStyle);

var doc = new mxXmlDocument();
var node = doc.createElement('mxGraphModel');
doc.appendChild(node);

graph.setModel(new mxGraphModel());

var sessionIdInput = document.getElementById('sessionId');
var connectButton = document.getElementById('connectButton');
var disconnectButton = document.getElementById('disconnectButton');

var session;
var connection;

connectButton.addEventListener('click', function() {
  var sessionId = sessionIdInput.value.trim();

  if (sessionId != '') {
    connect(sessionId);
  }
});

disconnectButton.addEventListener('click', function() {
  disconnect();
});

function connect(sessionId) {
  var socket = io.connect();

  socket.on('connect', function() {
    console.log('Connected to server');
    connection = socket;
    session = OT.initSession(apiKey, sessionId);

    session.on('streamCreated', function(event) {
      console.log('Stream created: ', event.stream);

      var subscriber = session.subscribe(
        event.stream,
        'graphContainer',
        {
          insertMode: mxConstants.NONE
        },
        function(error) {
          if (error) {
            console.log('Error subscribing to stream: ', error);
          } else {
            console.log('Subscribed to stream');
          }
        }
      );

      subscriber.on('signal', function(event) {
        console.log('Received signal: ', event.type, event.data);

        if (event.type == 'ot' && event.data && event.data.operation) {
          server.receiveOperation(event.data.operation);
        }
      });
    });

    session.on('signal', function(event) {
      console.log('Received signal: ', event.type, event.data);

      if (event.type == 'ot' && event.data && event.data.operation) {
        server.receiveOperation(event.data.operation);
      }
    });

    session.connect(token, function(error) {
      if (error) {
        console.log('Error connecting to session: ', error);
      } else {
        console.log('Connected to session');
        connectButton.disabled = true;
        disconnectButton.disabled = false;
      }
    });
  });

  socket.on('disconnect', function() {
    console.log('Disconnected from server');
    connection = null;
    session.disconnect();
    connectButton.disabled = false;
    disconnectButton.disabled = true;
  });
}

function disconnect() {
  connection.disconnect();
}

graph.getSelectionModel().addListener(mxEvent.CHANGE, function(sender, evt) {
  var cell = evt.getProperty('cell');

  if (cell != null && cell.isVertex()) {
    var style = graph.getStylesheet().getCellStyle(cell.getStyle());
    var fillColor = style[mxConstants.STYLE_FILLCOLOR];
    var strokeColor = style[mxConstants.STYLE_STROKECOLOR];
    var strokeWidth = style[mxConstants.STYLE_STROKEWIDTH];

    var vertex = {
      id: cell.getId(),
      label: cell.getValue(),
      x: cell.getGeometry().x,
      y: cell.getGeometry().y,
      width: cell.getGeometry().width,
      height: cell.getGeometry().height,
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeWidth: strokeWidth
    };

    var operation = new ot.Operation(
      [
        {
          action: 'editVertexStyle',
          id: vertex.id,
          vertex: vertex
        }
      ],
      function(state) {
        state.push({
          action: 'editVertexStyle',
          id: vertex.id,
          vertex: vertex
        });
      },
      function(state) {
        state.pop();
      }
    );

    server.submit(operation);
  }
});

graph.addListener(mxEvent.CELLS_MOVED, function(sender, evt) {
  var cells = evt.getProperty('cells');

  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i];

    if (cell.isVertex()) {
      var vertex = {
        id: cell.getId(),
        label: cell.getValue(),
        x: cell.getGeometry().x,
        y: cell.getGeometry().y,
        width: cell.getGeometry().width,
        height: cell.getGeometry().height
      };

      var operation = new ot.Operation(
        [
          {
            action: 'moveVertex',
            id: vertex.id,
            vertex: vertex
          }
        ],
        function(state) {
          state.push({
            action: 'moveVertex',
            id: vertex.id,
            vertex: vertex
          });
        },
        function(state) {
          state.pop();
        }
      );

      server.submit(operation);
    }
  }
});

socket.on('operation', function(operation) {
  console.log('Received operation: ' + operation);

  var state = JSON.parse(operation.state);

  for (var i = 0; i < state.length; i++) {
    var item = state[i];

    if (item.action == 'addVertex') {
      // ...
    }

    if (item.action == 'addEdge') {
      // ...
    }

    if (item.action == 'deleteVertex') {
      // ...
    }

    if (item.action == 'deleteEdge') {
      // ...
    }

    if (item.action == 'editVertexStyle') {
      var cell = graph.getModel().getCell(item.vertex.id);

      if (cell != null) {
        cell.setValue(item.vertex.label);
        cell.setGeometry(new mxGeometry(item.vertex.x, item.vertex.y, item.vertex.width, item.vertex.height));
        cell.setStyle('fillColor=' + item.vertex.fillColor + ';strokeColor=' + item.vertex.strokeColor + ';strokeWidth=' + item.vertex.strokeWidth + ';');
      }
    }

    if (item.action == 'moveVertex') {
      var cell = graph.getModel().getCell(item.vertex.id);

      if (cell != null) {
        cell.setValue(item.vertex.label);
        cell.setGeometry(new mxGeometry(item.vertex.x, item.vertex.y, item.vertex.width, item.vertex.height));
      }
    }
  }
});
