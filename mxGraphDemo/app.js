var graph = new mxGraph(document.getElementById('graphContainer'));

var socket = io.connect('http://localhost:3000');

var client = new ot.EditorSocketIO(socket);

client.addEditor(graph);

client.on('ack', function () {
    console.log('Acknowledged by server');
});

client.on('operation', function (operation) {
    console.log('Received operation: ' + operation);

    var state = JSON.parse(operation.state);

    for (var i = 0; i < state.length; i++) {
        var item = state[i];

        if (item.action == 'addVertex') {
            var v1 = graph.insertVertex(graph.getDefaultParent(), null, item.vertex.label, item.vertex.x, item.vertex.y, item.vertex.width, item.vertex.height);
            v1.setId(item.id);
        }

        if (item.action == 'addEdge') {
            var v1 = graph.getModel().getCell(item.edge.source);
            var v2 = graph.getModel().getCell(item.edge.target);
            var e1 = graph.insertEdge(graph.getDefaultParent(), null, item.edge.label, v1, v2);
            e1.setId(item.id);
        }

        if (item.action == 'deleteVertex') {
            var cell = graph.getModel().getCell(item.vertex.id);

            if (cell != null) {
                graph.getModel().remove(cell);
            }
        }

        if (item.action == 'deleteEdge') {
            var cell = graph.getModel().getCell(item.edge.id);

            if (cell != null) {
                graph.getModel().remove(cell);
            }
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

graph.getModel().addListener(mxEvent.CHANGE, function (sender, evt) {
    var changes = evt.getProperty('edit').changes;

    var server = client.serverAdapter;

    for (var i = 0; i < changes.length; i++) {
        var change = changes[i];

        if (change.constructor == mxCellInsertChange && change.cell.isVertex()) {
            var vertex = {
                id: change.cell.getId(),
                label: change.cell.getValue(),
                x: change.cell.getGeometry().x,
                y: change.cell.getGeometry().y,
                width: change.cell.getGeometry().width,
                height: change.cell.getGeometry().height
            };

            var operation = new ot.Operation(
                [
                    {
                        action: 'addVertex',
                        id: vertex.id,
                        vertex: vertex
                    }
                ],
                function (state) {
                    state.push({
                        action: 'addVertex',
                        id: vertex.id,
                        vertex: vertex
                    });
                },
                function (state) {
                    state.pop();
                }
            );

            server.submit(operation);
        }

        if (change.constructor == mxCellInsertChange && change.cell.isEdge()) {
            var edge = {
                id: change.cell.getId(),
                source: change.cell.source.id,
                target: change.cell.target.id,
                label: change.cell.getValue()
            };

            var operation = new ot.Operation(
                [
                    {
                        action: 'addEdge',
                        id: edge.id,
                        edge: edge
                    }
                ],
                function (state) {
                    state.push({
                        action: 'addEdge',
                        id: edge.id,
                        edge: edge
                    });
                },
                function (state) {
                    state.pop();
                }
            );

            server.submit(operation);
        }

        if (change.constructor == mxCellRemoveChange && change.child.isVertex()) {
            var vertex = {
                id: change.child.getId(),
                label: change.child.getValue(),
                x: change.child.getGeometry().x,
                y: change.child.getGeometry().y,
                width: change.child.getGeometry().width,
                height: change.child.getGeometry().height
            };

            var operation = new ot.Operation(
                [
                    {
                        action: 'deleteVertex',
                        vertex: vertex
                    }
                ],
                function (state) {
                    state.push({
                        action: 'deleteVertex',
                        vertex: vertex
                    });
                },
                function (state) {
                    state.pop();
                }
            );

            server.submit(operation);
        }

        if (change.constructor == mxCellRemoveChange && change.child.isEdge()) {
            var edge = {
                id: change.child.getId(),
                source: change.child.source.id,
                target: change.child.target.id,
                label: change.child.getValue()
            };

            var operation = new ot.Operation(
                [
                    {
                        action: 'deleteEdge',
                        edge: edge
                    }
                ],
                function (state) {
                    state.push({
                        action: 'deleteEdge',
                        edge: edge
                    });
                },
                function (state) {
                    state.pop();
                }
            );

            server.submit(operation);
        }
    }
});

graph.getSelectionModel().addListener(mxEvent.CHANGE, function (sender, evt) {
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
            function (state) {
                state.push({
                    action: 'editVertexStyle',
                    id: vertex.id,
                    vertex: vertex
                });
            },
            function (state) {
                state.pop();
            }
        );

        server.submit(operation);
    }
});

graph.addListener(mxEvent.CELLS_MOVED, function (sender, evt) {
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
                function (state) {
                    state.push({
                        action: 'moveVertex',
                        id: vertex.id,
                        vertex: vertex
                    });
                },
                function (state) {
                    state.pop();
                }
            );

            server.submit(operation);
        }
    }
});

socket.on('connect', function () {
    console.log('Connected to server');
});

socket.on('clear', function () {
    graph.getModel().clear();
});


