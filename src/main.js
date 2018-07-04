//Visual Summaries of fields in a dataset.

var summaryCard = function(svg,data,name){
  //Summary Card is a monopoly card that contains information about a field:
  //Name. Type. Summary Stats
  //KDE
  //Mean+error
  //Strip plot?

  //get summary stats
  let extent = dl.extent(data);
  let min = extent[0];
  let max = extent[1];
  let n = data.length;
  let sigma = dl.stdev(data);
  let mu = dl.mean(data);
  let ci = [mu-sigma,mu+sigma];

  //prep for KDE
  let bandwidth = Math.pow((4*Math.pow(sigma,5)/(3*n)),0.2);
  bandwidth/=4;
  let kernel = dl.random.normal(0,bandwidth);
  let samples = 100;

  //run KDE
  let xScale = d3.scaleLinear().domain(extent);
  let density = xScale.ticks(samples).map( x => [x, d3.mean(data, d => kernel.pdf(x-d))]);


  //prep for drawing
  let cWidth = svg ? parseFloat(svg.style("width")) : 150;
  cWidth = cWidth ? cWidth : parseFloat(svg.attr("width"));
  cHeight = svg ? parseFloat(svg.style("height")) : 50;
  cHeight = cHeight ? cHeight : parseFloat(svg.attr("height"));

  xScale.range([0,cWidth]);
  let yScale = d3.scaleLinear().domain(dl.extent(density,d => d[1])).range([cHeight-14,14]);

  svg.append("text")
    .attr("x",5)
    .attr("y","1em")
    .text(name);

  svg.append("line")
    .classed("ci_line",true)
    .attr("x1", xScale(ci[0]))
    .attr("y1",cHeight - 7)
    .attr("x2", xScale(ci[1]))
    .attr("y2",cHeight - 7);

  svg.append("circle")
    .classed("ci_circle",true)
    .attr("cx", xScale(mu))
    .attr("cy",cHeight-7)
    .attr("r", 5);

  let area = d3.area()
    .curve(d3.curveMonotoneX)
    .x(d => xScale(d[0]))
    .y0(yScale(0))
    .y1(d => yScale(d[1]));


  svg.append("path")
    .datum(density)
    .classed("ci_kde",true)
    .attr("d", area);

}

var data;
dl.csv("data/per_game_data.csv",doneLoading);

function doneLoading(err,d){
  if(err){
    console.log(err);
  }
  else{
    console.log("Successfully loaded "+d.length+" rows");
    data = d;
    let types = dl.type.all(data);
    //filter to only numeric fields for this prototype
    let keys = Object.keys(data[0]).filter(d => types[d]==="number");

    let cards = d3.select("#summaries").selectAll("svg").data(keys).enter().append("svg")
      .classed("summaryCard",true);

    cards.each(function(d){ summaryCard(d3.select(this), data.map(g => g[d]), d)});
  }
}
