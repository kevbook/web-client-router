
var pathToRegexp = require('path-to-regexp'),
  // qs = require('query-string'),
  // objectAssign = require('object-assign'),
  isArray = require('isarray');

module.exports = Router;


// Global Vars
var routerStarted = false;

function Router(routes, opts) {

  if (typeof window === 'undefined')
    throw new Error('This module can only be used in a web browser.');

  if ( !(window.location && window.history))
    throw new Error('history is not available, upgrade browser.');

  if (routerStarted)
    throw new Error('Router has already been started.');


  // Init things
  opts = opts || {};
  routerStarted = true;
  this.routes = [];

  // Set pointers
  this.location = window.location;
  this.history = window.history;

  // Add routes
  if (isArray(routes)) {

    for (var i=0, len=routes.length; i<len; i++)
      this.addRoute(routes[i]);
  }

  // If the server has already rendered the page,
  // and you don't want the initial route to be triggered
  // if (opts.silent !== true) this.initRoute();
};


Router.prototype.addRoute = function(route) {

  if (!(route && route.path && typeof route.handler === 'function'))
    return false;

  var params = [],
    keys = [],
    re = pathToRegexp(route.path, keys);

  for (var i=0, len=keys.length; i<len; i++)
    params.push([keys[i].name]);

  return this.routes.push({
    re: pathToRegexp(route.path),
    params: params,
    handler: route.handler,
    title: route.title || null
  });
};

Router.prototype.getFragment = function() {

  var fragment = this.location.pathname || '';
  return this.cleanFragment(fragment);
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

Router.prototype.getQuerystring = function() {
  return qs.parse(this.location.search || '');
};

Router.prototype.updateTitle = function(title) {
  document.title = title;
};

Router.prototype.matchPath = function(url, route) {

  var m = route.re.exec(url);
  if (!m) return false;


  var params = {};
  for (var i=0, len=m.length-1; i<len; i++) {
    params[route.params[i]] = m[i+1];
  }

  return { params: params };
};

Router.prototype.go = function(url, opts) {

  opts = opts || {};
  url = this.cleanFragment(url);

  for (var ret, i=0, len=this.routes.length; i<len; i++) {

    ret = this.matchPath(url, this.routes[i]);

    if (ret) {

      if (this.routes[i].title) this.updateTitle(this.routes[i].title);
      this.routes[i].handler(ret);

      // this.history[opts.replace
      //   ? 'replaceState'
      //   : 'pushState']({}, document.title, url);
      break;
    }
  }

  // // Force a path
  // if (opts.force) {
  //   this.history[opts.replace ? 'replaceState' : 'pushState']({}, document.title, url);
  // }
  //   return this.location.assign(url);
  // }
  // if (options.trigger) return this.loadUrl(fragment);
  // if (current === path && opts.force === false)
  //   return false;
};

var R = new Router([
  { path: '/abc', handler: function(r){ console.log(r) } },
  { path: '/abc/super', handler: function(r){ console.log(r) } },
  { path: '/abc/:kev/:kev2', handler: function(r){ console.log(r) } }
]);

window.R = R;

/*********

    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

**********/
