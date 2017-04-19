// link https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172

var widthT=800, heightT=500;

var margin = {top: 20, right: 20, bottom: 110, left: 40},
    margin2 = {top: 430, right: 20, bottom: 30, left: 40},
    width = widthT - margin.left - margin.right,
    height = heightT - margin.top - margin.bottom,
    height2 = heightT - margin2.top - margin2.bottom,
    
    svg = d3.select("#area_intro") 
            .append("svg")
            .attr("width", widthT + margin.left + margin.right)
            .attr("height", heightT + margin.top + margin.bottom);

// var parseDate = d3.timeParse("%b %Y");
var parseDate = d3.timeParse("%m/%d/%Y");
var formatDate = d3.timeFormat("%Y");

var x = d3.scaleTime().range([0, width]),
    x2 = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    y2 = d3.scaleLinear().range([height2, 0]);

var xAxis = d3.axisBottom(x),
    xAxis2 = d3.axisBottom(x2),
    yAxis = d3.axisLeft(y);

var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);

var zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

var area = d3.area()
    // .curve(d3.curveMonotoneX)
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y0(height)
    .y1(function(d) { return y(d.tot_acc); });

var area2 = d3.area()
    // .curve(d3.curveMonotoneX)
    .curve(d3.curveBasis)
    .x(function(d) { return x2(d.date); })
    .y0(height2)
    .y1(function(d) { return y2(d.tot_acc); });

svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("class", "ts rect")
    .attr("width", width)
    .attr("height", height);

var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");


d3.json("data/ts_all.json", function(error, data) {
    data.forEach(function(d) {
      d.date = parseDate(d.date);
    });

    if (error) throw error;

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.tot_acc; })]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    // z.domain(cities.map(function(c) { return c.id; }));


    focus.append("path")
      .datum(data)
      .attr("class", "area")
      // .attr("d", area);
      .attr("d", function(d) { return area(d.tot_acc); })
      // .style("stroke", function(d) { return z(d.id); })
      ;

    focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    focus.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    context.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area2);

    context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

    context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

    svg.append("rect")
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(zoom);
});

function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert, x2));
  focus.select(".area").attr("d", area);
  focus.select(".x.axis").call(xAxis);
  svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
      .scale(width / (s[1] - s[0]))
      .translate(-s[0], 0));
}

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  var t = d3.event.transform;
  x.domain(t.rescaleX(x2).domain());
  focus.select(".area").attr("d", area);
  focus.select(".x.axis").call(xAxis);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}