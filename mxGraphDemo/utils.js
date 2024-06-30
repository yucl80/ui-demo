function toJsonStr(json_data) {
    var cache = [];
    var json_str = JSON.stringify(json_data, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return;
            }
            cache.push(value);
        }
        return value;
    });
    cache = null;
    return json_str;
}

function calculateControlPoints(points) {
    var controlPoints = [];
    for (var i = 0; i < points.length - 1; i++) {
        var p1 = points[i];
        var p2 = points[i + 1];
        var midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; // 中点
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        var angle = Math.atan2(dy, dx); // 计算角度
        var offset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.7; // 控制点偏移量，基于边段长度

        // 计算控制点，考虑转角大小的平滑度调整
        var cp1 = {
            x: midPoint.x - offset * Math.cos(angle - Math.PI / 2),
            y: midPoint.y - offset * Math.sin(angle - Math.PI / 2)
        };
        var cp2 = {
            x: midPoint.x + offset * Math.cos(angle + Math.PI / 2),
            y: midPoint.y + offset * Math.sin(angle + Math.PI / 2)
        };

        controlPoints.push(cp1, cp2); // 保存控制点对
    }

    return controlPoints;
}

mxEdgeStyle.quadraticBezierEdgeStyle = function (state, source, target, points, result) {
    sourcePoint = graph.view.getFloatingTerminalPoint(state.cell, source, target, true);
    targetPoint = graph.view.getFloatingTerminalPoint(state.cell, target, source, false);
    console.log(toJsonStr(sourcePoint) + ":" + toJsonStr(targetPoint));
    var pt1 = sourcePoint;
    var pt2 = targetPoint;

    var midPoint = { x: (pt1.x + pt2.x) / 2, y: (pt1.y + pt2.y) / 2 }; // Calculate midpoint
    var dx = pt2.x - pt1.x;
    var dy = pt2.y - pt1.y;
    var angle = Math.atan2(dy, dx); // Calculate angle
    var offset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.6; // Control point offset based on segment length

    // Calculate control point, considering smoothness adjustment based on corner size
    var cp = {
        x: midPoint.x - offset * Math.cos(angle - Math.PI / 2),
        y: midPoint.y - offset * Math.sin(angle - Math.PI / 2)
    };

    result.length = 0;
    result.push(new mxPoint(pt1.x, pt1.y));               
    result.push(cp);
    result.push(new mxPoint(pt2.x, pt2.y));
    console.log(result);
};

mxStyleRegistry.putValue('quadraticBezierEdgeStyle', mxEdgeStyle.quadraticBezierEdgeStyle);
