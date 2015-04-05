
var pathToRegexp = require('path-to-regexp'),
  isArray = require('isarray'),
  Emitter = require('tiny-emitter'),
  flow = require('kevbook.flow'),
  utils = require('./lib/utils');


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
  opts = opts || {};
  this.events = events;

  // Add routes
  if (isArray(Routes)) {

    for (var i=0, len=Routes.length; i<len; i++)
      this.addRoute(Routes[i]);
  }

  // Init the window listener
  window.addEventListener('popstate', this.onPopstate.bind(this), false);

  // If the server has already rendered the page,
  // and you don't want the initial route to be triggered
  if (opts.silent !== true) {

    // Emulating nextTick on the browser
    var that = this;
    setTimeout(function() {
      that.go(window.location.pathname || '');
    }, 0);
  }
};

Router.prototype.addRoute = function(route) {

  if (!(route && route.path && typeof route.handler === 'function'))
    return false;

  var params = [],
    keys = [],
    re = pathToRegexp(route.path, keys);

  for (var i=0, len=keys.length; i<len; i++)
    params.push([keys[i].name]);

  return routes.push({
    re: pathToRegexp(route.path),
    params: params,
    handler: route.handler,
    middleware: typeof route.middleware === 'function'
                  ? [route.middleware]
                  : route.middleware,
    title: route.title || null
  });
};

Router.prototype.cleanFragment = function(fragment) {

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

Router.prototype.matchPath = function(url, route) {

  var m = route.re.exec(url);
  if (!m) return false;


  var params = {};
  for (var i=0, len=m.length-1; i<len; i++) {
    params[route.params[i]] = m[i+1];
  }

  return { params: params, url: url };
};

Router.prototype.middleware = function(fns, cb) {
  return flow.series(fns, cb);
};

Router.prototype.onPopstate = function(e) {
  routerStarted = false;
  this.go(window.location.pathname || '');
};

Router.prototype.gotoRoute = function(url, route, data, opts) {

  if (route.title) utils.updateTitle(route.title);

  if (routerStarted) {
    window.history[opts.replace
      ? 'replaceState'
      : 'pushState']({}, document.title, url);
  }

  routerStarted = true;
  events.emit('route_complete', url);
  route.handler(data);
};

Router.prototype.go = function(url, opts) {

  opts = opts || {};
  url = this.cleanFragment(url);

  for (var ret, i=0, len=routes.length; i<len; i++) {

    ret = this.matchPath(url, routes[i]);

    if (ret) {

      events.emit('route_matched', url);

      if (routes[i].middleware) {

        this.middleware(routes[i].middleware, function(err) {
          if (err) events.emit('route_error', url);
          else this.gotoRoute(url, routes[i], ret, opts);
        });
      }

      else this.gotoRoute(url, routes[i], ret, opts);
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
