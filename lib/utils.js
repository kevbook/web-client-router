
//,
var flow = require('kevbook.flow'),
  // qs = require('query-string'),
  xhr = require('xhr');


module.exports = Utils;

function Utils(){};

Utils.updateTitle = function(title) {
  document.title = title;
};


Utils.pre = function(ret, fns, cb) {

  return flow.seriesMap(fns, function(fn, next) {
    return fn(ret, next);
  }, cb);
};


Utils.get = function(xhrOpts, ret, fns, cb) {

  var that = this;

  return flow.seriesMap(fns, function(url, next) {

    var opts = JSON.parse(JSON.stringify(xhrOpts));
    opts.url = that.teml(url, ret.params);
    // window.x = url;
    console.log('GET %s', opts.url);
    // console.log(ret.params)

    xhr(opts, function(err, res) {

      res = res || {};
      try { res.body = JSON.parse(res.body) }
      catch(e) { res.body = res.body }

      return next(err, {
        statusCode: res.statusCode,
        data: res.body
      });

    });
  }, cb);
};


/*
 * Usage: http://www.140byt.es/keywords/string
 * var hello = teml("Hello, {name}!", {name: 'k' })
 */
Utils.teml = function (s, v) {
  return s.replace(/\{([^}]+)\}/g, function (f, k) {
    return v.hasOwnProperty(k) ? v[k] : f;
  });
};

// Utils.getQuerystring = function() {
//   return qs.parse(window.location.search || '');
// };
