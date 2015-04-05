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
/******/ ((function(modules) {
	// Check all modules for deduplicated modules
	for(var i in modules) {
		switch(typeof modules[i]) {
		case "number":
			// Module is a copy of another module
			modules[i] = modules[modules[i]];
			break;
		case "object":
			// Module can be created from a template
			modules[i] = (function(_m) {
				var args = _m.slice(1), fn = modules[_m[0]];
				return function (a,b,c) {
					fn.apply(null, [a,b,c].concat(args));
				};
			}(modules[i]));
		}
	}
	return modules;
}([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	var Router = __webpack_require__(1);

	var handler = function(data) {
	  console.log(data);
	  var el = document.getElementById('route')
	  el.textContent = data.url;
	};

	var router = new Router([
	  {
	    path: '/',
	    title: 'Root Page',
	    handler: handler
	  },

	  {
	    path: '/abc',
	    title: 'Abc Page',
	    handler: handler
	  },

	  {
	    path: '/abc/super',
	    title: 'Abc/Super Page',
	    handler: handler
	  },

	  {
	    path: '/abc/:a/:b',
	    title: 'Abc/Super/a/b Page',
	    handler: handler
	  },

	  // Catch all 404 handler
	  {
	    path: '/*',
	    handler: handler
	  },

	]);

	window.r = router;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	
	var pathToRegexp = __webpack_require__(5),
	  isArray = __webpack_require__(3),
	  Emitter = __webpack_require__(7),
	  flow = __webpack_require__(4),
	  utils = __webpack_require__(2);


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


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	
	// var xhr = require('xhr'),
	// qs = require('query-string'),
	// isArray = require('isarray');

	module.exports = Utils;

	function Utils(){}

	Utils.updateTitle = function(title) {
	  document.title = title;
	};

	// Utils.getQuerystring = function() {
	//   return qs.parse(window.location.search || '');
	// };


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

	var isArray = __webpack_require__(6);

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
3,
/* 7 */
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


/***/ }
/******/ ])));