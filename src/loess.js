// This is based on science.js, pulled 25 AUG 2018
// (which was itself ased on org.apache.commons.math.analysis.interpolation.LoessInterpolator
// from http://commons.apache.org/math/ )
// The main change is to make it return an object after fitting that can be used
// to get predicted values of the smoothed function at domain values that weren't
// in the original data


loess = function() {
  // create a new loess object
  var newobj = {};

  // parameters to loess
  var bandwidth = .3,
      robustnessIters = 2,
      accuracy = 1e-12;

  // keep X data and some intermediate info used to fit model
  var _xvals, bandwidthInPoints;

  // storage of the models created during smoothing
  // [ { alpha, beta }] with list indices matching data
  var models = [],
      modelIsFit = false;

  //// these work as getters (by #arg check) and setters
  newobj.bandwidth = function(b) {
    if (!arguments.length) return bandwidth;
    bandwidth = b;
  }
  newobj.robustnessIters = function(r) {
    if (!arguments.length) return robustnessIters;
    robustnessIters = r;
  }
  newobj.accuracy = function(a) {
    if (!arguments.length) return accuracy;
    accuracy = a;
  }

  //// computational helper functions
  // Compute the tricube weight function.
  // http://en.wikipedia.org/wiki/Local_regression#Weight_function
  function science_stats_loessTricube(x) {
    return (x = 1 - x * x * x) * x * x;
  }

  // Given an index interval into xval that embraces a certain number of
  // points closest to xval[i-1], update the interval so that it embraces
  // the same number of points closest to xval[i], ignoring zero weights.
  function science_stats_loessUpdateBandwidthInterval(
    xval, weights, i, bandwidthInterval) {

    var left = bandwidthInterval[0],
        right = bandwidthInterval[1];

    // The right edge should be adjusted if the next point to the right
    // is closer to xval[i] than the leftmost point of the current interval
    var nextRight = science_stats_loessNextNonzero(weights, right);
    if ((nextRight < xval.length) && (xval[nextRight] - xval[i]) < (xval[i] - xval[left])) {
      var nextLeft = science_stats_loessNextNonzero(weights, left);
      bandwidthInterval[0] = nextLeft;
      bandwidthInterval[1] = nextRight;
    }
  }

  function science_stats_loessNextNonzero(weights, i) {
    var j = i + 1;
    while (j < weights.length && weights[j] === 0) j++;
    return j;
  }

  function science_stats_loessFiniteReal(values) {
    var n = values.length,
        i = -1;

    while (++i < n) if (!isFinite(values[i])) return false;

    return true;
  }

  function science_stats_loessStrictlyIncreasing(xval) {
    var n = xval.length,
        i = 0;

    while (++i < n) if (xval[i - 1] >= xval[i]) return false;

    return true;
  }

  //// calculated a smoothed version of the data
  // returns the smoothed version and saves models involved for 'predict'
  newobj.fit = function(xval, yval, weights) {
    _xvals = xval; // save data for use fitting models
    var n = xval.length,
        i;

    if (n !== yval.length) throw {error: "Mismatched array lengths"};
    if (n == 0) throw {error: "At least one point required."};

    if (arguments.length < 3) {
      weights = [];
      i = -1; while (++i < n) weights[i] = 1;
    }

    science_stats_loessFiniteReal(xval);
    science_stats_loessFiniteReal(yval);
    science_stats_loessFiniteReal(weights);
    science_stats_loessStrictlyIncreasing(xval);

    if (n == 1) return [yval[0]];
    if (n == 2) return [yval[0], yval[1]];

    bandwidthInPoints = Math.floor(bandwidth * n);

    if (bandwidthInPoints < 2) throw {error: "Bandwidth too small."};

    var res = [],
        residuals = [],
        robustnessWeights = [];

    // Do an initial fit and 'robustnessIters' robustness iterations.
    // This is equivalent to doing 'robustnessIters+1' robustness iterations
    // starting with all robustness weights set to 1.
    i = -1; while (++i < n) {
      res[i] = 0;
      residuals[i] = 0;
      robustnessWeights[i] = 1;
      models[i] = {}
    }

    var iter = -1;
    while (++iter <= robustnessIters) {
      var bandwidthInterval = [0, bandwidthInPoints - 1];
      // At each x, compute a local weighted linear regression
      var x;
      i = -1; while (++i < n) {
        x = xval[i];

        // Find out the interval of source points on which
        // a regression is to be made.
        if (i > 0) {
          science_stats_loessUpdateBandwidthInterval(xval, weights, i, bandwidthInterval);
        }

        var ileft = bandwidthInterval[0],
            iright = bandwidthInterval[1];

        // Compute the point of the bandwidth interval that is
        // farthest from x
        var edge = (xval[i] - xval[ileft]) > (xval[iright] - xval[i]) ? ileft : iright;

        // Compute a least-squares linear fit weighted by
        // the product of robustness weights and the tricube
        // weight function.
        // See http://en.wikipedia.org/wiki/Linear_regression
        // (section "Univariate linear case")
        // and http://en.wikipedia.org/wiki/Weighted_least_squares
        // (section "Weighted least squares")
        var sumWeights = 0,
            sumX = 0,
            sumXSquared = 0,
            sumY = 0,
            sumXY = 0,
            denom = Math.abs(1 / (xval[edge] - x));

        for (var k = ileft; k <= iright; ++k) {
          var xk   = xval[k],
              yk   = yval[k],
              dist = k < i ? x - xk : xk - x,
              w    = science_stats_loessTricube(dist * denom) * robustnessWeights[k] * weights[k],
              xkw  = xk * w;
          sumWeights += w;
          sumX += xkw;
          sumXSquared += xk * xkw;
          sumY += yk * w;
          sumXY += yk * xkw;
        }

        var meanX = sumX / sumWeights,
            meanY = sumY / sumWeights,
            meanXY = sumXY / sumWeights,
            meanXSquared = sumXSquared / sumWeights;

        var beta = (Math.sqrt(Math.abs(meanXSquared - meanX * meanX)) < accuracy)
            ? 0 : ((meanXY - meanX * meanY) / (meanXSquared - meanX * meanX));

        var alpha = meanY - beta * meanX;

        // store smoothed result at this index  & residual
        res[i] = beta * x + alpha;
        residuals[i] = Math.abs(yval[i] - res[i]);

        // store model learned for this index
        models[i] = {'beta': beta, 'alpha': alpha};
      }

      // No need to recompute the robustness weights at the last
      // iteration, they won't be needed anymore
      if (iter === robustnessIters) {
        break;
      }

      // Recompute the robustness weights.

      // Find the median residual.
      var medianResidual = median(residuals);

      if (Math.abs(medianResidual) < accuracy)
        break;

      var arg,
          w;
      i = -1; while (++i < n) {
        arg = residuals[i] / (6 * medianResidual);
        robustnessWeights[i] = (arg >= 1) ? 0 : ((w = 1 - arg * arg) * w);
      }
    }

    modelIsFit = true;
    return res;
  }


  // helper function to get index of closest x val in our data
  function closest(x, L, ileft, iright){
    let leftval = L[ileft],
        rightval = L[iright],
        gap = iright - ileft;

    if (leftval == x) return ileft;
    if (rightval == x) return iright;

    if (gap == 1) { // two items left
      console.log("gap" + leftval + " " + rightval);
      if (Math.abs(rightval - x) > Math.abs(leftval - x)) return ileft;
      return iright;
    }

    // closest item is either left, right, or inside of the gap
    let isplit = ileft + Math.floor(gap / 2),
        splitvalL = L[isplit],
        splitvalR = L[isplit+1];

    if (x < splitvalL) {
      console.log("x<split" + x + " " + L[isplit]);
      return closest(x, L, ileft, isplit);
    }
    if (x > splitvalR) {
      console.log("x>split+1" + x + " " + L[isplit+1]);
      return closest(x, L, isplit+1, iright);
    }
    console.log( "else: " + (splitvalR - x) + " " + isplit);
    return (Math.abs(splitvalR - x) > Math.abs(splitvalL - x)) ? isplit : Math.min(L.length-1,isplit+1);
  }

  // helper function for public predict that does it for a single value
  // NB: assumes models have been fit already (with 'fit')
  function predictPoint(x) {
    // Binary search to find index of closest point on either side.
    // Extend left and right boundaries to get to bandwidthInterval.
    // For each point in that interval, add weighted estimates to get new est.

  




    // Find out the interval of source points on which
    // a regression is to be made.
    //TODO: fix this to take not an index but a value
    var bandwidthInterval = [0, bandwidthInPoints - 1];
    science_stats_loessUpdateBandwidthInterval(xval, weights, i, bandwidthInterval);
    var ileft = bandwidthInterval[0],
        iright = bandwidthInterval[1];

    // Compute the point of the bandwidth interval that is
        // farthest from x
        var edge = (xval[i] - xval[ileft]) > (xval[iright] - xval[i]) ? ileft : iright;

        // Compute a least-squares linear fit weighted by
        // the product of robustness weights and the tricube
        // weight function.
        // See http://en.wikipedia.org/wiki/Linear_regression
        // (section "Univariate linear case")
        // and http://en.wikipedia.org/wiki/Weighted_least_squares
        // (section "Weighted least squares")
        var sumWeights = 0,
            sumX = 0,
            sumXSquared = 0,
            sumY = 0,
            sumXY = 0,
            denom = Math.abs(1 / (xval[edge] - x));

        for (var k = ileft; k <= iright; ++k) {
          var xk   = xval[k],
              yk   = yval[k],
              dist = k < i ? x - xk : xk - x,
              w    = science_stats_loessTricube(dist * denom) * robustnessWeights[k] * weights[k],
              xkw  = xk * w;
          sumWeights += w;
          sumX += xkw;
          sumXSquared += xk * xkw;
          sumY += yk * w;
          sumXY += yk * xkw;
        }







  }

  // takes a list of x values (or a single x value) and predicts the y value(s)
  // given the models saved during 'fit', which must be run first (else exception)
  newobj.predict = function(X) {
    if (!modelIsFit) throw( "Cannot use LOESS predict until model is fit.");

    if (Array.isArray(X)){
      return X.map(predictPoint);
    }
    return predictPoint(X);
  }

  return newobj;
};

// median function cobbled into one piece from science.js
function median(x) {

  // get quantiles
  // Uses R's quantile algorithm type=7.
  var d = x,
      quantiles = [.5];
  d = d.slice().sort((a,b) => a - b);
  var n_1 = d.length - 1;
  Qs = quantiles.map(function(q) {
    if (q === 0) return d[0];
    else if (q === 1) return d[n_1];
  
    var index = 1 + q * n_1,
      lo = Math.floor(index),
      h = index - lo,
      a = d[lo - 1];
  
    return h === 0 ? a : a + h * (d[lo] - a);
  });
  return Qs[0]
};

