
//,
var flow = require('kevbook.flow'),
  xhr = require('xhr');


module.exports = Utils;

function Utils(){};


/*! taken from modernizr
 * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
 * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
 * changed to avoid false negatives for Windows Phones: https://github.com/rackt/react-router/issues/586
 */
Utils.supportsHistory = function() {
  var ua = navigator.userAgent;
  if ((ua.indexOf('Android 2.') !== -1 ||
      (ua.indexOf('Android 4.0') !== -1)) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1 &&
      ua.indexOf('Windows Phone') === -1) {
    return false;
  }
  return (window.history && 'pushState' in window.history);
};


Utils.appendUrl = function(url) {

  url = url || '';
  url = ~url.indexOf('?')
    ? url.concat('&_={__cache}')
    : url.concat('?_={__cache}');

  return url;
}

Utils.cacheBust = function(get) {

  if (get === null) return null;

  for(var i in get)
    get[i] = Utils.appendUrl(get[i]);

  return get;
}


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

  return flow.parallelMap(Object.keys(fns), function(key, next) {

    var opts = JSON.parse(JSON.stringify(xhrOpts));

    ret.params.__cache = new Date().getTime();
    opts.url = that.teml(fns[key], ret.params);

    console.log('GET %s', opts.url);

    xhr(opts, function(err, res) {

      res = res || {};
      try { res.body = JSON.parse(res.body) }
      catch(e) { res.body = res.body }

      return next(err, {
        statusCode: res.statusCode,
        data: res.body,
        key: key
      });

    });
  }, function(err, done) {

    if (done) {
      done = done.reduce(function(ret, o) {
        ret[o.key] = {
          statusCode: o.statusCode,
          data: o.data
        };
        return ret;
      }, {});
    }

    return cb(err, done);
  });
};


/*
 * Usage: http://www.140byt.es/keywords/string
 * var hello = teml("Hello, {name}!", {name: 'k' })
 */
Utils.teml = function (s, v) {
  return s && s.replace(/\{([^}]+)\}/g, function(f, k) {
    return v[k] ? v[k] : f;
  });

  return s;
};


Utils.getQuerystring = function() {
  var qs = window.location.search;
};
