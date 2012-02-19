(function() {
  var join;

  join = function() {
    var J, callback, checkIfDone, order, requests, results;
    requests = [];
    results = [];
    order = [];
    callback = void 0;
    checkIfDone = function() {
      if (callback && (requests.length === results.length)) {
        return callback.apply(null, order.map(function(pos) {
          return results[pos];
        }));
      }
    };
    J = function() {
      var pos;
      requests.push(1);
      pos = requests.length - 1;
      return function() {
        results.push(arguments[0]);
        order.push(pos);
        return checkIfDone();
      };
    };
    J.results = function(cb) {
      callback = cb;
      return checkIfDone();
    };
    return J;
  };

  window.join = join;

}).call(this);