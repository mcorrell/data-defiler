
var bootstrap = function(data, statistic, numSamples = 1000){
  //Statistic is a function that we use to reduce the data.
  //For instance, "dl.mean" would return the mean of each bootstapped sample.
  let n = data.length;

  let sampler = function(){
    return data[~~(Math.random() * n)];
  };

  let oneSample = function(){
    return statistic(dl.zeros(n).map(sampler));
  };

  return  dl.zeros(numSamples).map(oneSample);
}

var kde = function(data,samples){
  let n = data.length;
  let sigma = dl.stdev(data);
  let extent = dl.extent(data);
  //prep for KDE
  let bandwidth = Math.pow((4*Math.pow(sigma,5)/(3*n)),0.2);
  bandwidth/=4;
  let kernel = dl.random.normal(0,bandwidth);
  samples = samples ? samples : 100;

  //run KDE
  let xScale = d3.scaleLinear().domain(extent);
  let density = xScale.ticks(samples).map( x => [x, d3.mean(data, d => kernel.pdf(x-d))]);
  return density;
}

var standardize = function(data,x){
  let vals = x ? data.map(d => d[x]) : data;
  let sigma = dl.stdev(vals);
  let mu = dl.mean(vals);
  return vals.map(d => (d-mu)/sigma);
}

var validateTrend = function(data,x,y,numSamples){
  //robustness of a linear trend between x and y
  let statistic = function(d){
    return dl.linearRegression(d,x,y);
  }
  let samples = bootstrap(data,statistic,numSamples);
  //generate a marginal histogram of the last values
  let lastX = dl.max(data,x);
  let lastXs = samples.map( d => d.intercept + (d.slope*lastX));
  return {"lastX": dl.histogram(lastXs), "slope": dl.histogram(samples.map(d => d.slope))};
}

var validateOutlier = function(data,x,alpha,numSamples){
  //robustness of the outlier fences
  alpha = alpha ? alpha : 0.95;
  let cutoffZ = dl.random.normal().icdf(1 - ((1-alpha)/2));
  let statistic = function(d){
    let sigma = dl.stdev(d,x);
    let mu = dl.mean(d,x);
    let c0 = mu - (cutoffZ*sigma);
    let c1 = mu + (cutoffZ*sigma);
    return {"c0": c0, "c1": c1 };
  }
  let samples = bootstrap(data,statistic,numSamples);
  return {"c0": dl.histogram(samples.map(d => d.c0)), "c1": dl.histogram(samples.map(d => d.c1))};
}

var vaidateDifference = function(data,x1,x2,agg,numSamples){
  
}
