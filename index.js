
var pathToRegexp = require('path-to-regexp'),
  isArray = require('isarray'),
  utils = require('./lib/utils'),
  Emitter = require('tiny-emitter');


module.exports = Router;

// Global Vars
var routerStarted = false;
var events = new Emitter();
var routes = [];


function Router(Routes, opts) {

  if (typeof window === 'undefined')
    throw new Error('This module can only be used in a web browser.');

  if ( !(window.location && window.history))
    throw new Error('history is not available, upgrade browser.');

  if (routerStarted)
    throw new Error('Router has already been started.');


  // Init things
  this._opts = opts || {};
  this.events = events;
  this._lastFragment = null;
  var that = this;


  // Add routes
  if (isArray(Routes)) {

    for (var i=0, len=Routes.length; i<len; i++)
      this.addRoute(Routes[i]);
  }

  // Init the window listener
  window.addEventListener('popstate', this._onPopstate.bind(this), false);


  // Emulating nextTick on the browser
  setTimeout(function() {

    // If the server has already rendered the page,
    // and you don't want the initial route to be triggered
    (that._opts.silent !== true)
      ? that.go(window.location.pathname || '')
      : that._gotoRoute(window.location.pathname || '');

  }, 0);
};


Router.prototype.addRoute = function(route) {

  if (!(route && route.path && typeof route.handler === 'function'))
    return false;

  var params = [],
    keys = [],
    re = pathToRegexp(route.path, keys);

  for (var i=0, len=keys.length; i<len; i++)
    params.push([keys[i].name]);


  routes.push({
    re: pathToRegexp(route.path),
    params: params,
    handler: route.handler,
    title: route.title || null,

    // Handle variants of pre
    pre: typeof route.pre === 'function'
      ? [route.pre]
      : isArray(route.pre) ? route.pre : null,

    // @param {String} | {Object}
    get: utils.cacheBust( (typeof route.get === 'string')
          ? { 0: route.get }
          : typeof route.get === 'object' && !(route.get instanceof Array)
            ? route.get
            : null
        )
  });
};


Router.prototype._cleanFragment = function(fragment) {

  // Clean out any hashes
  fragment = fragment.replace(/#.*/, '');

  // Unicode characters in `location.pathname` are percent encoded so they're
  // decoded for comparison. `%25` should not be decoded since it may be part
  // of an encoded parameter.

  // Reference : https://github.com/jashkenas/backbone/blob/master/backbone.js#L1526-L1532
  fragment = decodeURI(fragment.replace(/%25/g, '%2525'));

  // Strip a leading hash/slash and trailing space.
  fragment = fragment.replace(/^[#\/]|\s+$/g, '');

  return '/'+fragment;
};


Router.prototype._matchPath = function(url, route) {

  var m = route.re.exec(url);
  if (!m) return false;

  for (var params = {}, i = 0, len = m.length-1;
       i<len, params[route.params[i]] = m[i+1];
       i++);

  return { params: params, url: url };
};


Router.prototype._onPopstate = function(e) {
  routerStarted = false;
  this.go(window.location.pathname || '');
};


Router.prototype._gotoRoute = function(url, route, data, opts) {

  if (route && route.title) utils.updateTitle(route.title);

  if (routerStarted) {
    window.history[opts.replace
      ? 'replaceState'
      : 'pushState']({}, document.title, url);
  }

  routerStarted = true;
  data.lastUrl = this._lastFragment;
  this._lastFragment = url;

  events.emit('route_complete', url);
  if (route && route.handler) route.handler(data);
};


Router.prototype.go = function(url, opts) {

  opts = opts || {};
  url = this._cleanFragment(url);
  var that = this;


  for (var ret, i=0, len=routes.length; i<len; i++) {

    ret = this._matchPath(url, routes[i]);

    if (ret) {

      events.emit('route_matched', url);

      var processRoute = function() {
        // Get request
        if (routes[i].get) {
          utils.get(that._opts.xhr, ret, routes[i].get,
            function(err, get) {
              if (err) {
                events.emit('route_error', err);
              }
              else {
                ret.get = get;
                that._gotoRoute(url, routes[i], ret, opts);
              }
          });
        }

        else {
          that._gotoRoute(url, routes[i], ret, opts);
        }
      };


      if (routes[i].pre) {

        utils.pre(ret, routes[i].pre, function(err, pre) {
          if (err) {
            events.emit('route_error', err);
          }
          else {
            ret.pre = pre;
            processRoute();
          }
        });
      }

      else processRoute();

      break;
    }
  }

  if (!ret) {
    events.emit('route_not_found', url);
    throw new Error('Route not found.');
  }

  // Force a path
  // if (opts.force) {
  //   window.history[opts.replace ? 'replaceState' : 'pushState']({}, document.title, url);
  // }
  //   return this.location.assign(url);
  // }
  // if (options.trigger) return this.loadUrl(fragment);
  // if (current === path && opts.force === false)
  //   return false;
};
