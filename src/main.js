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
  let ci = dl.z.ci(data);

  //prep for KDE
  let bandwidth = Math.pow((4*Math.pow(sigma,5)/(3*n)),0.2);
  bandwidth/=4;
  let kernel = dl.random.normal(0,bandwidth);
  let samples = 50;

  //run KDE
  let xScale = d3.scaleLinear().domain(extent);
  let density = xScale.ticks(samples).map( x => [x, d3.mean(data, d => kernel.pdf(x-d))]);


  //prep for drawing
  let cWidth = svg ? svg.style("width") : 150;
  cWidth = cWidth ? cWidth : svg.attr("width");
  cHeight = svg ? svg.style("height") : 50;
  cHeight = cHeight ? cHeight : svg.attr("height");

  xScale.range([0,cWidth]);
  let yScale = d3.scaleLinear().domain(dl.extent(density,d => d[1])).range([cHeight*0.75,0]);



}
