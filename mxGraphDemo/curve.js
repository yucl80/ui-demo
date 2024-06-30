function curveBasis(context) {
  var x0, x1, x2,
    y0, y1, y2;

  function point(x, y) {
    x0 = x1; x1 = x2; x2 = x;
    y0 = y1; y1 = y2; y2 = y;
  }

  function line() {
    context.lineTo((x0 + 4 * x1 + x2) / 6, (y0 + 4 * y1 + y2) / 6);
  }

  function curve() {
    context.bezierCurveTo((2 * x0 + x1) / 3, (2 * y0 + y1) / 3, (x0 + 2 * x1) / 3, (y0 + 2 * y1) / 3, (x0 + 4 * x1 + x2) / 6, (y0 + 4 * y1 + y2) / 6);
  }

  function basis(points) {
    var i, n = points.length;
    if (n < 3) return void pointLine(points);
    point(points[0]);
    point(points[1]);
    for (i = 2; i < n; ++i) {
      point(points[i]);
      curve();
    }
    line();
    point(points[n - 1]);
    line();
  }

  return basis;
}

mxEdgeStyle.MyCurve = function (state, source, target, points, result) {
  var view = state.view;
  var pt = (points != null && points.length > 0) ? points[0] : null;
  var pts = state.absolutePoints;
  var p0 = pts[0];
  var pe = pts[pts.length - 1];

  if (pt != null) {
    var dx = pt.x - p0.x;
    var dy = pt.y - p0.y;

    result.push(new mxPoint(pt.x - dx / 2, pt.y - dy / 2));
    result.push(pt);
    result.push(new mxPoint(pt.x + dx / 2, pt.y + dy / 2));
  }
  else {
    result.push(new mxPoint(pe.x, pe.y));
  }
};

// 使用自定义的边样式
var style = graph.getStylesheet().getDefaultEdgeStyle();
style[mxConstants.STYLE_EDGE] = mxEdgeStyle.MyCurve;


var MyCurveBasis = mxCellPath.create(function (state, points, source, target) {
  var dx = target.x - source.x;
  var dy = target.y - source.y;
  var dist = Math.sqrt(dx * dx + dy * dy);
  var x0 = source.x + dx * 0.5;
  var y0 = source.y + dy * 0.5;
  var angle = Math.atan2(dy, dx);
  var s = Math.max(10, dist * 0.2);
  var dxs = s * Math.cos(angle + Math.PI / 2);
  var dys = s * Math.sin(angle + Math.PI / 2);
  var dxt = s * Math.cos(angle);
  var dyt = s * Math.sin(angle);
  var p0 = points[0];
  var pe = points[points.length - 1];
  p0.x = x0 - dxs;
  p0.y = y0 - dys;
  pe.x = target.x - dxt;
  pe.y = target.y - dyt;
  // 计算控制点
  var cp1x = p0.x + dxs * 0.25;
  var cp1y = p0.y + dys * 0.25;
  var cp2x = p0.x + dxs * 0.75;
  var cp2y = p0.y + dys * 0.75;
  var cp3x = pe.x - dxt * 0.75;
  var cp3y = pe.y - dyt * 0.75;
  var cp4x = pe.x - dxt * 0.25;
  var cp4y = pe.y - dyt * 0.25;
  points[1] = new mxPoint(cp1x, cp1y);
  points[2] = new mxPoint(cp2x, cp2y);
  points[points.length - 3] = new mxPoint(cp3x, cp3y);
  points[points.length - 2] = new mxPoint(cp4x, cp4y);
});