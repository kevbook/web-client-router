
var pathToRegexp = require('path-to-regexp'),
  utils = require('./lib/utils'),
  Emitter = require('tiny-emitter');


module.exports = Router;

// Global Vars
var routerStarted = false;
var events = new Emitter();
var routes = [];
var lastFragment = null;
var lastParams = {};
var opts;


function Router(routesMap, Opts) {

  if (typeof window === 'undefined')
    throw new Error('This module can only be used in a web browser.');

  if (!utils.supportsHistory())
    throw new Error('history is not available, upgrade browser.');

  if (routerStarted)
    throw new Error('Router has already been started.');


  // Init things
  opts = Opts || {};

  // Clean up root path
  if (opts.root) {
    opts.root = Router.cleanFragment(opts.root);
    opts.rootReg = new RegExp('^'+opts.root, 'ig');
  }

  // Add routes
  if (typeof routesMap === 'object') {

    for (var i in routesMap) {
      routesMap[i].path = i;
      Router.addRoute(routesMap[i]);
    }
  }

  // Init the window listener
  window.addEventListener('popstate', Router.onPopstate, false);


  // @public Api
  return {
    _routes: routes,
    start: Router.start,
    addRoute: Router.addRoute,
    go: Router.go,
    events: events
  };
};


Router.start = function() {

  // If the server has already rendered the page,
  // and you don't want the initial route to be triggered
  (opts.silent !== true)
    ? Router.go(window.location.pathname, { _firstTime: true })
    : Router.go(window.location.pathname, { _firstTime: true, skip: true, replace: true });

  return this;
};


Router.addRoute = function(route) {

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
      : Array.isArray(route.pre) ? route.pre : null,

    // @param {String} | {Object}
    get: utils.cacheBust( (typeof route.get === 'string')
          ? { 0: route.get }
          : typeof route.get === 'object' && !(route.get instanceof Array)
            ? route.get
            : null
        )
  });
};


Router.cleanFragment = function(fragment) {

  // Clean out any hashes
  fragment = fragment.replace(/#.*/, '');

  // Unicode characters in `location.pathname` are percent encoded so they're
  // decoded for comparison. `%25` should not be decoded since it may be part
  // of an encoded parameter.

  // Reference : https://github.com/jashkenas/backbone/blob/master/backbone.js#L1526-L1532
  fragment = decodeURI(fragment.replace(/%25/g, '%2525'));

  // Strip a leading hash/slash and trailing space.
  fragment = fragment.replace(/^[#\/]|\s+$/g, '');

  // Strip a trailing slash
  fragment = fragment.substr(-1) === '/'
    ? fragment.slice(0,-1)
    : fragment;

  return '/'+fragment;
};


Router.matchPath = function(url, route) {

  var m = route.re.exec(url);
  if (!m) return false;

  for (var params = {}, i = 0, len = m.length-1;
       i<len, params[route.params[i]] = m[i+1];
       i++);

  return { params: params, url: url };
};


Router.onPopstate = function(e) {
  // routerStarted = false;
  var loc = window.location.pathname + window.location.search;
  Router.go(loc, { _firstTime: true });
};


Router.notFound = function(url, reason) {
  events.emit('route_not_found', url);
  throw new Error('Route not found.' + ' '.concat(reason));
};


Router.gotoRoute = function(url, route, data, Opts) {

  if (Opts._firstTime) {
    window.history['replaceState']({}, document.title, Opts.fullUrl + window.location.search);
  }

  else if (lastFragment !== url) {
    window.history[Opts.replace
      ? 'replaceState'
      : 'pushState']({}, document.title, Opts.fullUrl + window.location.search);
  }

  if (route && route.title) utils.updateTitle(route.title);

  // Make data empty object if doesnt exist
  data = data || {};

  data.lastUrl = lastFragment;
  lastFragment = url;

  // Cleaning up params
  delete data.params['undefined'];
  delete data.params['__cache'];

  // Keep the last params
  data.lastParams = lastParams;
  lastParams = data.params;

  events.emit('route_complete', data);
  if (route && route.handler) route.handler(data);
};

/**
 * @ Opts {Object}
 *   - refresh (refresh the browser window)
 *   - replace (replace state instead of push)
 *   - skip (skip all middleware and routing,
 *           just push state, so browswers url is changed).
 *           Can be used in conjunction with "replace"
**/
Router.go = function(url, Opts) {

  // Init things
  Opts = Opts || {};
  routerStarted = true;


  // Strip out query-string
  if (Opts._firstTime) {
    Opts._qs = window.location.search;
  }
  else {
    var index = url.indexOf('?');
    if (index !== -1) {
      Opts._qs = url.substring(index);
      url = url.substring(0,index);
    }
  }

  // Clean up the url
  url = Router.cleanFragment(url);


  // Refresh the page
  if (Opts.refresh)
    return window.location.assign(url);


  // Build url and fullUrl
  if (opts.root) {

    if (Opts._firstTime) {
      Opts.fullUrl = url;
      url = Router.cleanFragment( url.replace(opts.rootReg, '') );
    }

    else {
      Opts.fullUrl = opts.root + url;
    }

  } else {
    Opts.fullUrl = url;
  }


  // Skip the middleware and routing
  if (Opts.skip) {

    window.history[Opts.replace
      ? 'replaceState'
      : 'pushState']({}, document.title, Opts.fullUrl + window.location.search);


    // Match the route for params
    for (var ret, i=0, len=routes.length; i<len; i++) {
      ret = Router.matchPath(url, routes[i]);
      if (ret) break;
    }

    ret = ret || { params: {} };
    delete ret.params['undefined'];

    // Update things for history
    routerStarted =  true;
    lastFragment = url;
    lastParams = ret.params;
    return;
  }


  // Only emit when actually routing
  events.emit('route_start', url);

  // Lets check for an edge case:
  // Root and first time, and there is no root
  if (opts.root && Opts._firstTime &&
      opts.rootReg.test(Opts.fullUrl) === false) {
     Router.notFound(url, 'Root did not match.');
  }

  for (var ret, i=0, len=routes.length; i<len; i++) {

    ret = Router.matchPath(url, routes[i]);

    if (ret) {
      events.emit('route_matched', url);

      // Parse query-string
      ret.qs = utils.getQuerystring(Opts._qs);

      var processRoute = function() {
        // Get request
        if (routes[i].get) {
          utils.get(opts.xhr, ret, routes[i].get,
            function(err, get) {
              if (err) {
                events.emit('route_error', err);
              }
              else {
                ret.get = get;
                events.emit('get_complete', get);
                Router.gotoRoute(url, routes[i], ret, Opts);
              }
          });
        }

        else {
          Router.gotoRoute(url, routes[i], ret, Opts);
        }
      };


      if (routes[i].pre) {

        utils.pre(ret, routes[i].pre, function(err, pre) {

          if (err) {
            events.emit('route_error', err);
          }
          else {
            ret.pre = pre;
            events.emit('pre_complete', pre);
            processRoute();
          }
        });
      }

      else processRoute();

      break;
    }
  }

  if (!ret) Router.notFound(url);
};
