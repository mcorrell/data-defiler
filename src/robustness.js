
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
