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

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	
	var pathToRegexp = __webpack_require__(5),
	  utils = __webpack_require__(2),
	  Emitter = __webpack_require__(6);


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
	    ? Router.go(window.location.pathname || '', { firstTime: true })
	    : Router.go(window.location.pathname || '', { skip: true, replace: true });

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
	  routerStarted = false;
	  Router.go(window.location.pathname || '');
	};


	Router.gotoRoute = function(url, route, data, Opts) {

	  if (Opts.firstTime) {
	    window.history['replaceState']({}, document.title, url);
	  }

	  else if (routerStarted && lastFragment !== url) {
	    window.history[Opts.replace
	      ? 'replaceState'
	      : 'pushState']({}, document.title, url);
	  }

	  if (route && route.title) utils.updateTitle(route.title);

	  // Make data empty object if doesnt exist
	  data = data || {};

	  routerStarted = true;
	  data.lastUrl = lastFragment;
	  lastFragment = url;
	  data.qs = utils.getQuerystring();

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
	 *   - force (force router started)
	**/
	Router.go = function(url, Opts) {

	  Opts = Opts || {};

	  // Refresh the page
	  if (Opts.refresh)
	    return window.location.assign(url);


	  url = Router.cleanFragment(url);

	  // Skip the middleware and routing
	  if (Opts.skip) {

	    window.history[Opts.replace
	      ? 'replaceState'
	      : 'pushState']({}, document.title, url);

	    routerStarted =  true;
	    lastFragment = url;
	    return;
	  }

	  if (Opts.force)
	    routerStarted = true;


	  // Only emit when actually routing
	  events.emit('route_start', url);

	  for (var ret, i=0, len=routes.length; i<len; i++) {

	    ret = Router.matchPath(url, routes[i]);

	    if (ret) {

	      events.emit('route_matched', url);

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

	  if (!ret) {
	    events.emit('route_not_found', url);
	    throw new Error('Route not found.');
	  }
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	
	//,
	var flow = __webpack_require__(4),
	  xhr = __webpack_require__(7);


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

	  url = (url || '').trim().toLowerCase();
	  url = ~url.indexOf('?')
	    ? url.concat('&_={__cache}')
	    : url.concat('?_={__cache}');

	  return url;
	};

	Utils.cacheBust = function(get) {

	  if (get === null) return null;

	  for(var i in get)
	    get[i] = Utils.appendUrl(get[i]);

	  return get;
	};

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

	    console.log('GET Request %s', opts.url);

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

	  var QsArr = window.location.search
	                    .toLowerCase()
	                    .match(/[?&]?([^=]+)=([^&]*)/ig) || [];

	  for (var qs={}, res, i=0, len=QsArr.length; i<len; i++) {

	    res = /[?&]?([^=]+)=([^&]*)/i.exec(QsArr[i]);

	    if (res && res.length)
	      qs[ res[1]||''.trim() ] =  (res[2]||'').trim();
	  }

	  return qs;
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	

	module.exports = flow;
	function flow(){};


	/**
	 * Simple parallelize function
	 * Assumes fns array has function(err, callback) items and no nulls
	 * This is naive, but no error checking == fast
	 *
	 * cb should be a function(err, results[])
	 * where results will be an array containing the results of the fn call
	 */
	flow.parallel = function(fns, cb) {
	  var fnsLength = fns.length,
	    i = 0,
	    countingCallback = makeCountNCallback(fnsLength, cb);
	  for (i; i < fnsLength; ++i) {
	    fns[i](makeIndexedCallback(i, countingCallback));
	  }
	};

	/**
	 * Simple series function
	 * Assumes fns array has function(err, callback) items and no nulls
	 * This is naive, but no error checking == fast
	 *
	 * cb should be a function(err, results[])
	 * where results will be an array containing the results of the fn call
	 */
	flow.series = function(fns, cb) {
	  var fnsLength = fns.length,
	    i = 0,
	    results = [];
	  fns[i](makeChainedCallback(i, fns, results, cb));
	};

	/**
	 * Simple waterfall function
	 * Assumes fns array has function(args..., callback) items and no nulls
	 *
	 * cb should be a function(err, args...)
	 * where error is an error that occured
	 * and args is the expected results of the waterfall
	 *
	 * example:
	 * simpleAsync.waterfall([
	 *     function one(cb){
	 *         setTimeout(function(){
	 *             cb(null, 8);
	 *         }, 10);
	 *     },
	 *     function split(num, cb) {
	 *         setTimeout(function(){
	 *             cb(null, num / 4, num / 4);
	 *         }, 10);
	 *     },
	 *     function add(a, b, cb) {
	 *         setTimeout(function(){
	 *             cb(null, a + b);
	 *         }, 10);
	 *     },
	 *     function duplicatePlus1(num, cb) {
	 *         setTimeout(function(){
	 *             cb(null, num, num + 1);
	 *         }, 10);
	 *     }
	 * ], function(err, result1, result2){
	 *     assert.equal(result1, 4);
	 *     assert.equal(result2, 5);
	 *     assert.ok(err == null);
	 * });
	 */
	flow.waterfall = function(fns, cb) {
	  var fnsLength = fns.length,
	    i = 0;
	  fns[i](makeChainedWaterfallCallback(i, fns, cb));
	};

	/**
	 * Asynchronously map an array across a function
	 * and call callback when finished or error
	 *
	 * tasks are kicked off in parallel so may complete in
	 * any order but will be returned in order specified
	 *
	 * cb should be a function(err, mappedArray)
	 */
	flow.parallelMap = function(arr, fn, cb) {
	  var pipeline = [],
	    i = 0;
	  for (i; i < arr.length; ++i) {
	    pipeline[i] = fn.bind(null, arr[i]);
	  }
	  flow.parallel(pipeline, cb);
	};

	/**
	 * Asynchronously map an array across a function
	 * and call callback when finished or error
	 *
	 * tasks are kicked off in series so will be executed
	 * one after another
	 *
	 * cb should be a function(err, mappedArray)
	 */
	flow.seriesMap = function(arr, fn, cb) {
	  var pipeline = [],
	    i = 0;
	  for (i; i < arr.length; ++i) {
	    pipeline[i] = fn.bind(null, arr[i]);
	  }
	  flow.series(pipeline, cb);
	};

	/**
	 * Create a function that will call the next function in a chain
	 * with the results of the original function
	 * until the chain is finished
	 */
	function makeChainedWaterfallCallback(i, fns, cb) {
	  return function() {
	    var args = Array.prototype.slice.call(arguments);
	    if (args[0]) {
	      //ie. we had an error
	      return cb(args[0]);
	    }
	    if (fns[i + 1]) {
	      //remove error arg
	      args.shift();

	      // sometimes when there is no result passed
	      !args.length && args.push(null);

	      args.push(makeChainedWaterfallCallback(i + 1, fns, cb));
	      return fns[i + 1].apply(null, args);
	    } else {
	      return cb.apply(null, args);
	    }
	  };
	}

	/**
	 * Create a function that will call the next function in a chain
	 * when finished
	 */
	function makeChainedCallback(i, fns, results, cb) {
	  return function(err, result) {
	    if (err) {
	      return cb(err);
	    }
	    results[i] = result;
	    if (fns[i + 1]) {
	      return fns[i + 1](makeChainedCallback(i + 1, fns, results, cb));
	    } else {
	      return cb(null, results);
	    }
	  };
	}

	/**
	 * Create a function that will call a callback after n function calls
	 */
	function makeCountNCallback(n, cb) {
	  var count = 0,
	      results = [],
	      error;
	  return function(index, err, result) {
	    results[index] = result;
	    if (!error && err) {
	        error = err;
	        return cb(err);
	    }
	    if (!error && ++count == n) {
	        cb(null, results);
	    }
	  };
	}

	/**
	 * Create a function that will call a callback with a specified index
	 */
	function makeIndexedCallback(i, cb) {
	  return function(err, result) {
	      cb(i, err, result);
	  };
	}


/***/ },
/* 5 */
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
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	function E () {
		// Keep this empty so it's easier to inherit from
	  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
	}

	E.prototype = {
		on: function (name, callback, ctx) {
	    var e = this.e || (this.e = {});
	    
	    (e[name] || (e[name] = [])).push({
	      fn: callback,
	      ctx: ctx
	    });
	    
	    return this;
	  },

	  once: function (name, callback, ctx) {
	    var self = this;
	    var fn = function () {
	      self.off(name, fn);
	      callback.apply(ctx, arguments);
	    };
	    
	    return this.on(name, fn, ctx);
	  },

	  emit: function (name) {
	    var data = [].slice.call(arguments, 1);
	    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
	    var i = 0;
	    var len = evtArr.length;
	    
	    for (i; i < len; i++) {
	      evtArr[i].fn.apply(evtArr[i].ctx, data);
	    }
	    
	    return this;
	  },

	  off: function (name, callback) {
	    var e = this.e || (this.e = {});
	    var evts = e[name];
	    var liveEvents = [];
	    
	    if (evts && callback) {
	      for (var i = 0, len = evts.length; i < len; i++) {
	        if (evts[i].fn !== callback) liveEvents.push(evts[i]);
	      }
	    }
	    
	    // Remove event from queue to prevent memory leak
	    // Suggested by https://github.com/lazd
	    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

	    (liveEvents.length) 
	      ? e[name] = liveEvents
	      : delete e[name];
	    
	    return this;
	  }
	};

	module.exports = E;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var window = __webpack_require__(8)
	var once = __webpack_require__(9)
	var parseHeaders = __webpack_require__(13)


	var XHR = window.XMLHttpRequest || noop
	var XDR = "withCredentials" in (new XHR()) ? XHR : window.XDomainRequest

	module.exports = createXHR

	function createXHR(options, callback) {
	    function readystatechange() {
	        if (xhr.readyState === 4) {
	            loadFunc()
	        }
	    }

	    function getBody() {
	        // Chrome with requestType=blob throws errors arround when even testing access to responseText
	        var body = undefined

	        if (xhr.response) {
	            body = xhr.response
	        } else if (xhr.responseType === "text" || !xhr.responseType) {
	            body = xhr.responseText || xhr.responseXML
	        }

	        if (isJson) {
	            try {
	                body = JSON.parse(body)
	            } catch (e) {}
	        }

	        return body
	    }
	    
	    var failureResponse = {
	                body: undefined,
	                headers: {},
	                statusCode: 0,
	                method: method,
	                url: uri,
	                rawRequest: xhr
	            }
	    
	    function errorFunc(evt) {
	        clearTimeout(timeoutTimer)
	        if(!(evt instanceof Error)){
	            evt = new Error("" + (evt || "unknown") )
	        }
	        evt.statusCode = 0
	        callback(evt, failureResponse)
	    }

	    // will load the data & process the response in a special response object
	    function loadFunc() {
	        clearTimeout(timeoutTimer)
	        
	        var status = (xhr.status === 1223 ? 204 : xhr.status)
	        var response = failureResponse
	        var err = null
	        
	        if (status !== 0){
	            response = {
	                body: getBody(),
	                statusCode: status,
	                method: method,
	                headers: {},
	                url: uri,
	                rawRequest: xhr
	            }
	            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
	                response.headers = parseHeaders(xhr.getAllResponseHeaders())
	            }
	        } else {
	            err = new Error("Internal XMLHttpRequest Error")
	        }
	        callback(err, response, response.body)
	        
	    }
	    
	    if (typeof options === "string") {
	        options = { uri: options }
	    }

	    options = options || {}
	    if(typeof callback === "undefined"){
	        throw new Error("callback argument missing")
	    }
	    callback = once(callback)

	    var xhr = options.xhr || null

	    if (!xhr) {
	        if (options.cors || options.useXDR) {
	            xhr = new XDR()
	        }else{
	            xhr = new XHR()
	        }
	    }

	    var key
	    var uri = xhr.url = options.uri || options.url
	    var method = xhr.method = options.method || "GET"
	    var body = options.body || options.data
	    var headers = xhr.headers = options.headers || {}
	    var sync = !!options.sync
	    var isJson = false
	    var timeoutTimer

	    if ("json" in options) {
	        isJson = true
	        headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
	        if (method !== "GET" && method !== "HEAD") {
	            headers["Content-Type"] = "application/json"
	            body = JSON.stringify(options.json)
	        }
	    }

	    xhr.onreadystatechange = readystatechange
	    xhr.onload = loadFunc
	    xhr.onerror = errorFunc
	    // IE9 must have onprogress be set to a unique function.
	    xhr.onprogress = function () {
	        // IE must die
	    }
	    xhr.ontimeout = errorFunc
	    xhr.open(method, uri, !sync)
	    //has to be after open
	    xhr.withCredentials = !!options.withCredentials
	    
	    // Cannot set timeout with sync request
	    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
	    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
	    if (!sync && options.timeout > 0 ) {
	        timeoutTimer = setTimeout(function(){
	            xhr.abort("timeout");
	        }, options.timeout+2 );
	    }

	    if (xhr.setRequestHeader) {
	        for(key in headers){
	            if(headers.hasOwnProperty(key)){
	                xhr.setRequestHeader(key, headers[key])
	            }
	        }
	    } else if (options.headers) {
	        throw new Error("Headers cannot be set on an XDomainRequest object")
	    }

	    if ("responseType" in options) {
	        xhr.responseType = options.responseType
	    }
	    
	    if ("beforeSend" in options && 
	        typeof options.beforeSend === "function"
	    ) {
	        options.beforeSend(xhr)
	    }

	    xhr.send(body)

	    return xhr


	}


	function noop() {}


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {if (typeof window !== "undefined") {
	    module.exports = window;
	} else if (typeof global !== "undefined") {
	    module.exports = global;
	} else if (typeof self !== "undefined"){
	    module.exports = self;
	} else {
	    module.exports = {};
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = once

	once.proto = once(function () {
	  Object.defineProperty(Function.prototype, 'once', {
	    value: function () {
	      return once(this)
	    },
	    configurable: true
	  })
	})

	function once (fn) {
	  var called = false
	  return function () {
	    if (called) return
	    called = true
	    return fn.apply(this, arguments)
	  }
	}


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var isFunction = __webpack_require__(11)

	module.exports = forEach

	var toString = Object.prototype.toString
	var hasOwnProperty = Object.prototype.hasOwnProperty

	function forEach(list, iterator, context) {
	    if (!isFunction(iterator)) {
	        throw new TypeError('iterator must be a function')
	    }

	    if (arguments.length < 3) {
	        context = this
	    }
	    
	    if (toString.call(list) === '[object Array]')
	        forEachArray(list, iterator, context)
	    else if (typeof list === 'string')
	        forEachString(list, iterator, context)
	    else
	        forEachObject(list, iterator, context)
	}

	function forEachArray(array, iterator, context) {
	    for (var i = 0, len = array.length; i < len; i++) {
	        if (hasOwnProperty.call(array, i)) {
	            iterator.call(context, array[i], i, array)
	        }
	    }
	}

	function forEachString(string, iterator, context) {
	    for (var i = 0, len = string.length; i < len; i++) {
	        // no such thing as a sparse string.
	        iterator.call(context, string.charAt(i), i, string)
	    }
	}

	function forEachObject(object, iterator, context) {
	    for (var k in object) {
	        if (hasOwnProperty.call(object, k)) {
	            iterator.call(context, object[k], k, object)
	        }
	    }
	}


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = isFunction

	var toString = Object.prototype.toString

	function isFunction (fn) {
	  var string = toString.call(fn)
	  return string === '[object Function]' ||
	    (typeof fn === 'function' && string !== '[object RegExp]') ||
	    (typeof window !== 'undefined' &&
	     // IE8 and below
	     (fn === window.setTimeout ||
	      fn === window.alert ||
	      fn === window.confirm ||
	      fn === window.prompt))
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	
	exports = module.exports = trim;

	function trim(str){
	  return str.replace(/^\s*|\s*$/g, '');
	}

	exports.left = function(str){
	  return str.replace(/^\s*/, '');
	};

	exports.right = function(str){
	  return str.replace(/\s*$/, '');
	};


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var trim = __webpack_require__(12)
	  , forEach = __webpack_require__(10)
	  , isArray = function(arg) {
	      return Object.prototype.toString.call(arg) === '[object Array]';
	    }

	module.exports = function (headers) {
	  if (!headers)
	    return {}

	  var result = {}

	  forEach(
	      trim(headers).split('\n')
	    , function (row) {
	        var index = row.indexOf(':')
	          , key = trim(row.slice(0, index)).toLowerCase()
	          , value = trim(row.slice(index + 1))

	        if (typeof(result[key]) === 'undefined') {
	          result[key] = value
	        } else if (isArray(result[key])) {
	          result[key].push(value)
	        } else {
	          result[key] = [ result[key], value ]
	        }
	      }
	  )

	  return result
	}

/***/ }
/******/ ]);