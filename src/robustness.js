
// create numSamples bootstrap samples and compute given statistic over each
//   * data: list of values
//   * statistic: scalar function of a list of values
//     e.g. "dl.mean" to get the mean from each sample as output
//   * numSamples: number of bootstrap samples to make
//  ** returns a list of values from running statistic over
//     each generated bootstrap sample: [ statistic(bootstrap_i(data)) ]
var bootstrap = function(data, statistic, numSamples = 1000){
  let n = data.length;
  let sampler = function(){
    return data[~~(Math.random() * n)]; // faster than floor?
  };

  let oneSample = function(){
    return statistic(dl.zeros(n).map(sampler));
  };

  return  dl.zeros(numSamples).map(oneSample);
}

// kernel density estimate (KDE) for a dataset
//   * data: list of values
//   * samples: number of samples desired
//     !! length of return may not equal number of samples
//  ** returns samples of the KDE (Gaussian) for this data, evenly spaced
//     [ [x, pdf(x)] ]
var kde = function(data,samples = 100){
  let n = data.length;
  let sigma = dl.stdev(data);
  let extent = dl.extent(data);
  //prep for KDE
  let bandwidth = Math.pow((4*Math.pow(sigma,5)/(3*n)),0.2);
  bandwidth/=4;
  let kernel = dl.random.normal(0,bandwidth);

  // kernel density estimate (KDE) based on the data
  // ! scaleLinear().ticks does not always give expected no. of samples
  // [kernel is computed per point x: the mean of gauss kernel distances to x]  
  let xScale = d3.scaleLinear().domain(extent);
  let density = xScale.ticks(samples).map( x => [x, d3.mean(data, d => kernel.pdf(x-d))]);
  return density;
}

// standardize dataset
//   * data: either a list of values or a list of dictionaries
//   * x: if data is a list of dictionaries, this specifies key to use
//  ** returns list of values, standardized
var standardize = function(data,x){
  let vals = x ? data.map(d => d[x]) : data;
  let sigma = dl.stdev(vals);
  let mu = dl.mean(vals);
  return vals.map(d => (d-mu)/sigma);
}

// evaluate the robustness of a linear trend between variables named
// x and y in data using numSamples bootstrapped samples of data
// subsets to only valid (dl.isValid) x,y pairs in data
//   * data: must be list of dictionaries (keys are var names)
//   * x,y: names of variables to use (y as trend of x)
//   * numSamples: number of bootstrap samples to use
//  ** 
var validateTrend = function(data,x,y,numSamples){
  let sanitizedData = data.filter(d => dl.isValid(d[x]) && dl.isValid(d[y]));
  
  // take numSamples bootstrapped samples and run statistic (linear regression)
  // return is, for each bootstrapped sample, {slope, intercept, R, rss}
  let statistic = function(d){ return dl.linearRegression(d,x,y); }
  let samples = bootstrap(sanitizedData,statistic,numSamples);

  //generate a marginal histogram of the last values
  let lastX = dl.max(sanitizedData,x);
  let lastXs = samples.map( d => d.intercept + (d.slope*lastX));
  return {"lastX": dl.histogram(lastXs), "slope": dl.histogram(samples.map(d => d.slope))};
}

var validateOutlier = function(data,x,alpha = 0.95,numSamples){
  //robustness of the outlier fences
  let statistic = function(d){
    let qs = dl.quartile(d,x);
    let iqr = qs[2] - qs[0];
    return {"c0": qs[0] - (1.5 * iqr), "c1": qs[2] + (1.5 * iqr) };
  }
  let samples = bootstrap(data,statistic,numSamples);
  return {"c0": dl.histogram(samples.map(d => d.c0)), "c1": dl.histogram(samples.map(d => d.c1))};
}

var validateDifference = function(data,x,x1,x2,y,numSamples){
  //robustness of a difference between two values x1 and x2 in a cateogrical field x,
  //where y is some function that is a statistic of interest, e.g.
  // function(d){ return dl.mean(d,"petal_width")}, say.
  let str = x1+"-"+x2;
  let statistic = function(d){
    let val1 = y(d.filter(d => d[x]==x1));
    let val2 = y(d.filter(d => d[x]==x2));
    let obj = {};
    obj[x1] = val1;
    obj[x2] = val2;
    obj[str] = val1-val2;
    return obj;
  }
  let samples = bootstrap(data,statistic,numSamples);
  let obj = {};
  obj[x1] = dl.histogram(samples.map(d => d[x1]));
  obj[x2] = dl.histogram(samples.map(d => d[x2]));
  obj[str] = dl.histogram(samples.map(d => d[str]))
  return obj;
}
