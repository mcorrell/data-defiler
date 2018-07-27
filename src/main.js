//Visual Summaries of fields in a dataset.

var summaryCard = function(svg,data,name,type){
  switch (type){
    case "number":
    summaryCardNumber(svg,data,name);
    break;

    case "integer":
    summaryCardInteger(svg,data,name);
    break;

    case "string":
    case "boolean":
    default:
    summaryCardCategorical(svg,data,name);
    break;
  }
}

var summaryCardNumber = function(svg,data,name){
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
  let xScale = d3.scaleLinear().domain(extent);

  let density = kde(data);


  //prep for drawing
  let margin = 14;
  let cWidth = svg ? parseFloat(svg.style("width"))-margin : 150-margin;
  cWidth = cWidth ? cWidth : parseFloat(svg.attr("width"));
  let cHeight = svg ? parseFloat(svg.style("height")) : 50;
  cHeight = cHeight ? cHeight : parseFloat(svg.attr("height"));

  xScale.range([margin,cWidth]);
  let yScale = d3.scaleLinear().domain(dl.extent(density,d => d[1])).range([(.9*cHeight)-margin,2*margin]);

  svg.append("text")
    .attr("x",5)
    .attr("y","1em")
    .text(name);

  svg.append("line")
    .classed("ci_line",true)
    .attr("x1", xScale(ci[0]))
    .attr("y1",cHeight - (margin/2))
    .attr("x2", xScale(ci[1]))
    .attr("y2",cHeight - (margin/2));

  svg.append("circle")
    .classed("ci_circle",true)
    .attr("cx", xScale(mu))
    .attr("cy",cHeight-(margin/2))
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

  let axis = d3.axisBottom(xScale);

  svg.append("g")
    .attr("transform","translate(0,"+( (cHeight*.9) - margin)+")")
    .classed("axis",true)
    .call(axis);

}

var summaryCardCategorical = function(svg,data,name){
  //Summary Card is a monopoly card that contains information about a field:
  //Name. Type. Summary Stats
  //Histogram

  //get summary stats
  let map = dl.count.map(data);
  let vals = Object.keys(map);
  if(vals.length>10){
    summaryCardBigCategorical(svg,data,name);
    return;
  }
  let maxCount = dl.max(vals.map(d => map[d]));
  //make our histograms
  let xScale = d3.scaleBand().domain(vals);

  //prep for drawing
  let margin = 14;
  let cWidth = svg ? parseFloat(svg.style("width"))-margin : 150-margin;
  cWidth = cWidth ? cWidth : parseFloat(svg.attr("width"));
  let cHeight = svg ? parseFloat(svg.style("height")) : 50;
  cHeight = cHeight ? cHeight : parseFloat(svg.attr("height"));

  xScale.range([margin,cWidth]);
  let bWidth = xScale.bandwidth();
  let yScale = d3.scaleLinear().domain([0,maxCount]).range([(.9*cHeight)-margin,2*margin]);

  svg.append("text")
    .attr("x",5)
    .attr("y","1em")
    .text(name);

  svg.append("g").selectAll("rect").data(vals).enter().append("rect")
    .attr("x",d => xScale(d))
    .attr("y",d => yScale(map[d]))
    .attr("width",bWidth)
    .attr("height",d => (.9*cHeight)-margin - yScale(map[d]) )
    .classed("histbar",true);

  let axis = d3.axisBottom(xScale);

  svg.append("g")
    .attr("transform","translate(0,"+( (cHeight*.9) - margin)+")")
    .classed("axis",true)
    .call(axis);
}

var summaryCardBigCategorical = function(svg,data,name){
  //Summary Card is a monopoly card that contains information about a field:
  //Name. Type. Summary Stats
  //Histogram

  //get summary stats
  let n = 5;
  let map = dl.count.map(data);
  let vals = Object.keys(map);
  let valCounts = vals.map(function(d){
    let obj = {"name": d, "count": map[d]};
    return obj;
  });
  valCounts.sort(dl.comparator("-count"));

  let topN = valCounts.filter((d,i) => i<=n-1);
  let maxCount = topN[0].count;
  //make our histograms
  let xScale = d3.scaleBand().domain(topN.map(d => d.name));

  //prep for drawing
  let margin = 14;
  let cWidth = svg ? parseFloat(svg.style("width"))-margin : 150-margin;
  cWidth = cWidth ? cWidth : parseFloat(svg.attr("width"));
  let cHeight = svg ? parseFloat(svg.style("height")) : 50;
  cHeight = cHeight ? cHeight : parseFloat(svg.attr("height"));

  xScale.range([margin,cWidth - 5*margin]);
  let bWidth = xScale.bandwidth();
  let yScale = d3.scaleLinear().domain([0,maxCount]).range([(.9*cHeight)-margin,2*margin]);

  svg.append("text")
    .attr("x",5)
    .attr("y","1em")
    .text(name);

  svg.append("g").selectAll("rect").data(topN).enter().append("rect")
    .attr("x",d => xScale(d.name))
    .attr("y",d => yScale(d.count))
    .attr("width",bWidth)
    .attr("height",d => (.9*cHeight)-margin - yScale(d.count))
    .classed("histbar",true);

  let axis = d3.axisBottom(xScale);

  svg.append("g")
    .attr("transform","translate(0,"+( (cHeight*.9) - margin)+")")
    .classed("axis",true)
    .call(axis);

  svg.append("text")
    .attr("x",cWidth-(4*margin))
    .attr("y",margin + (cHeight/2))
    .style("font-size","0.6em")
    .text(" ... "+(vals.length-n)+" more");
}

var summaryCardInteger = function(svg,data,name){
  //Summary Card is a monopoly card that contains information about a field:
  //Name. Type. Summary Stats
  //Histogram
  //Mean+error
  //Strip plot?

  //get summary stats
  let extent = dl.extent(data);
  let min = extent[0];
  let max = extent[1];
  let n = data.length;
  let mu = dl.mean(data);
  let sigma = dl.stdev(data);
  let ci = [mu-sigma,mu+sigma];
  let uniques = dl.count.valid(dl.unique(data));
  if(uniques<=2){
    summaryCardCategorical(svg,data,name);
    return;
  }
  //make our histograms
  let hist = dl.histogram(data);
  let xScale = d3.scaleLinear().domain([hist.bins.start,hist.bins.stop]);

  //prep for drawing
  let margin = 14;
  let cWidth = svg ? parseFloat(svg.style("width"))-margin : 150-margin;
  cWidth = cWidth ? cWidth : parseFloat(svg.attr("width"));
  let cHeight = svg ? parseFloat(svg.style("height")) : 50;
  cHeight = cHeight ? cHeight : parseFloat(svg.attr("height"));

  xScale.range([margin,cWidth]);
  let bWidth = Math.ceil(xScale(0+hist.bins.step)-xScale(0));
  let yScale = d3.scaleLinear().domain([0,dl.max(hist,d => d.count)]).range([(.9*cHeight)-margin,2*margin]);

  svg.append("text")
    .attr("x",5)
    .attr("y","1em")
    .text(name);

  svg.append("line")
    .classed("ci_line",true)
    .attr("x1", xScale(ci[0]))
    .attr("y1",cHeight - (margin/2))
    .attr("x2", xScale(ci[1]))
    .attr("y2",cHeight - (margin/2));

  svg.append("circle")
    .classed("ci_circle",true)
    .attr("cx", xScale(mu))
    .attr("cy",cHeight-(margin/2))
    .attr("r", 5);

  svg.append("g").selectAll("rect").data(hist).enter().append("rect")
    .attr("x",d => Math.floor(xScale(d.value)))
    .attr("y",d => yScale(d.count))
    .attr("width",bWidth)
    .attr("height",d => (.9*cHeight)-margin - yScale(d.count) )
    .classed("histbar",true);

  let axis = d3.axisBottom(xScale);
  if(xScale.ticks().length>uniques){
    axis = axis.tickArguments([uniques-1,"d"]);
  }
  else{
    axis.tickFormat(d3.format("d"));
  }


  svg.append("g")
    .attr("transform","translate(0,"+( (cHeight*.9) - margin)+")")
    .classed("axis",true)
    .call(axis);
}

var interactionCard = function(svg,data,x,y){
  //The Interaction Card is a monopoly card that cointains information
  //About the interaction between two fields.
  //It also contains some information about what might be weird or interesting
  //About the interaction.

  //Scatterplot
  //Marginal KDE
  //Trend line
  //Confidence band?

  //prep for drawing
  let cWidth = svg ? parseFloat(svg.style("width")) : 300;
  cWidth = cWidth ? cWidth : parseFloat(svg.attr("width"));
  let cHeight = svg ? parseFloat(svg.style("height")) : 300;
  cHeight = cHeight ? cHeight : parseFloat(svg.attr("height"));

  //want scatterplot to be square
  cHeight = Math.min(cHeight,cWidth);

  let scatter = svg.append("g");
  let margins = cHeight*0.1;
  let xScale = d3.scaleLinear().domain(dl.extent(data,x)).range([margins,cWidth-margins]);
  let yScale = d3.scaleLinear().domain(dl.extent(data,y)).range([cHeight-margins,margins]);
  let opacity = Math.min((1/Math.log2(data.length)),1);
  let xAxis = d3.axisBottom(xScale);
  let yAxis = d3.axisLeft(yScale);

  //draw scatterplot
  scatter.selectAll("circle").data(data).enter().append("circle")
    .classed("scatter",true)
    .attr("cx",d => xScale(d[x]))
    .attr("cy",d => yScale(d[y]))
    .attr("opacity",opacity)
    .attr("r","5px");



  svg.append("g")
    .attr("transform","translate(0,"+(cHeight-margins)+")")
    .classed("axis",true)
    .call(xAxis);

  svg.append("g")
      .classed("axis",true)
      .attr("transform","translate("+margins+",0)")
      .call(yAxis);
}


var data;
dl.csv("data/iris.csv",doneLoading);

function doneLoading(err,d){
  if(err){
    console.log(err);
  }
  else{
    console.log("Successfully loaded "+d.length+" rows");
    data = d;
    let types = dl.type.all(data);
    //filter to only numeric fields for this prototype
    let keys = Object.keys(data[0]).filter(d => types[d]!="date");

    let cards = d3.select("#summaries").selectAll("svg").data(keys).enter().append("svg")
      .classed("summaryCard",true);

    cards.each(function(d){ summaryCard(d3.select(this), data.map(g => g[d]), d, types[d])});
  }
}
