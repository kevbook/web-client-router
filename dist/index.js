/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	var pathToRegexp = __webpack_require__(1),
	  // qs = require('query-string'),
	  // objectAssign = require('object-assign'),
	  isArray = __webpack_require__(2);

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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var isArray = __webpack_require__(3);

	/**
	 * Expose `pathToRegexp`.
	 */
	module.exports = pathToRegexp;

	/**
	 * The main path matching regexp utility.
	 *
	 * @type {RegExp}
	 */
	var PATH_REGEXP = new RegExp([
	  // Match escaped characters that would otherwise appear in future matches.
	  // This allows the user to escape special characters that won't transform.
	  '(\\\\.)',
	  // Match Express-style parameters and un-named parameters with a prefix
	  // and optional suffixes. Matches appear as:
	  //
	  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
	  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
	  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
	  // Match regexp special characters that are always escaped.
	  '([.+*?=^!:${}()[\\]|\\/])'
	].join('|'), 'g');

	/**
	 * Escape the capturing group by escaping special characters and meaning.
	 *
	 * @param  {String} group
	 * @return {String}
	 */
	function escapeGroup (group) {
	  return group.replace(/([=!:$\/()])/g, '\\$1');
	}

	/**
	 * Attach the keys as a property of the regexp.
	 *
	 * @param  {RegExp} re
	 * @param  {Array}  keys
	 * @return {RegExp}
	 */
	function attachKeys (re, keys) {
	  re.keys = keys;
	  return re;
	}

	/**
	 * Get the flags for a regexp from the options.
	 *
	 * @param  {Object} options
	 * @return {String}
	 */
	function flags (options) {
	  return options.sensitive ? '' : 'i';
	}

	/**
	 * Pull out keys from a regexp.
	 *
	 * @param  {RegExp} path
	 * @param  {Array}  keys
	 * @return {RegExp}
	 */
	function regexpToRegexp (path, keys) {
	  // Use a negative lookahead to match only capturing groups.
	  var groups = path.source.match(/\((?!\?)/g);

	  if (groups) {
	    for (var i = 0; i < groups.length; i++) {
	      keys.push({
	        name:      i,
	        delimiter: null,
	        optional:  false,
	        repeat:    false
	      });
	    }
	  }

	  return attachKeys(path, keys);
	}

	/**
	 * Transform an array into a regexp.
	 *
	 * @param  {Array}  path
	 * @param  {Array}  keys
	 * @param  {Object} options
	 * @return {RegExp}
	 */
	function arrayToRegexp (path, keys, options) {
	  var parts = [];

	  for (var i = 0; i < path.length; i++) {
	    parts.push(pathToRegexp(path[i], keys, options).source);
	  }

	  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));
	  return attachKeys(regexp, keys);
	}

	/**
	 * Replace the specific tags with regexp strings.
	 *
	 * @param  {String} path
	 * @param  {Array}  keys
	 * @return {String}
	 */
	function replacePath (path, keys) {
	  var index = 0;

	  function replace (_, escaped, prefix, key, capture, group, suffix, escape) {
	    if (escaped) {
	      return escaped;
	    }

	    if (escape) {
	      return '\\' + escape;
	    }

	    var repeat   = suffix === '+' || suffix === '*';
	    var optional = suffix === '?' || suffix === '*';

	    keys.push({
	      name:      key || index++,
	      delimiter: prefix || '/',
	      optional:  optional,
	      repeat:    repeat
	    });

	    prefix = prefix ? ('\\' + prefix) : '';
	    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

	    if (repeat) {
	      capture = capture + '(?:' + prefix + capture + ')*';
	    }

	    if (optional) {
	      return '(?:' + prefix + '(' + capture + '))?';
	    }

	    // Basic parameter support.
	    return prefix + '(' + capture + ')';
	  }

	  return path.replace(PATH_REGEXP, replace);
	}

	/**
	 * Normalize the given path string, returning a regular expression.
	 *
	 * An empty array can be passed in for the keys, which will hold the
	 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
	 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
	 *
	 * @param  {(String|RegExp|Array)} path
	 * @param  {Array}                 [keys]
	 * @param  {Object}                [options]
	 * @return {RegExp}
	 */
	function pathToRegexp (path, keys, options) {
	  keys = keys || [];

	  if (!isArray(keys)) {
	    options = keys;
	    keys = [];
	  } else if (!options) {
	    options = {};
	  }

	  if (path instanceof RegExp) {
	    return regexpToRegexp(path, keys, options);
	  }

	  if (isArray(path)) {
	    return arrayToRegexp(path, keys, options);
	  }

	  var strict = options.strict;
	  var end = options.end !== false;
	  var route = replacePath(path, keys);
	  var endsWithSlash = path.charAt(path.length - 1) === '/';

	  // In non-strict mode we allow a slash at the end of match. If the path to
	  // match already ends with a slash, we remove it for consistency. The slash
	  // is valid at the end of a path match, not in the middle. This is important
	  // in non-ending mode, where "/test/" shouldn't match "/test//route".
	  if (!strict) {
	    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
	  }

	  if (end) {
	    route += '$';
	  } else {
	    // In non-ending mode, we need the capturing groups to match as much as
	    // possible by using a positive lookahead to the end or next path segment.
	    route += strict && endsWithSlash ? '' : '(?=\\/|$)';
	  }

	  return attachKeys(new RegExp('^' + route, flags(options)), keys);
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ }
/******/ ]);