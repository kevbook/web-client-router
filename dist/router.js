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

	module.exports = __webpack_require__(2);


/***/ },
/* 1 */
/***/ function(module, exports) {

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
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	
	var pathToRegexp = __webpack_require__(10),
	  utils = __webpack_require__(3),
	  Emitter = __webpack_require__(11);


	module.exports = Router;

	// Global Vars
	var routerStarted = false;
	var events = new Emitter();
	var routes = [];
	var lastFragment = null;
	var lastParams = {};
	var lastQs = {};
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

	  routerStarted = true;

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
	    name: route.name || null,

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
	  var loc = window.location.pathname;
	  Router.go(loc, { _firstTime: true });
	};


	Router.notFound = function(url, reason) {
	  events.emit('route_not_found', url);
	  throw new Error('Route not found.' + ' '.concat(reason));
	};


	Router.gotoRoute = function(url, route, data, Opts) {

	  if (Opts._firstTime) {
	    window.history['replaceState']({}, document.title, Opts.fullUrl.concat(Opts._qs || ''));
	  }

	  else if (lastFragment !== url) {
	    window.history[Opts.replace
	      ? 'replaceState'
	      : 'pushState']({}, document.title, Opts.fullUrl.concat(Opts._qs || ''));
	  }

	  else if (lastFragment === url && !utils.areEqualShallow(lastQs, utils.getQuerystring(Opts._qs))) {
	    window.history[Opts.replace
	      ? 'replaceState'
	      : 'pushState']({}, document.title, Opts.fullUrl.concat(Opts._qs || ''));
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
	  lastQs = utils.getQuerystring(Opts._qs);

	  // Keep other
	  data.title = route.title
	  data.name = route.name

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
	      : 'pushState']({}, document.title, Opts.fullUrl.concat(Opts._qs || ''));


	    // Match the route for params
	    for (var ret, i=0, len=routes.length; i<len; i++) {
	      ret = Router.matchPath(url, routes[i]);
	      if (ret) break;
	    }

	    ret = ret || { params: {} };
	    delete ret.params['undefined'];

	    // Update things for history
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


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	
	//,
	var flow = __webpack_require__(7),
	  xhr = __webpack_require__(13);


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

	    ret.params.__cache = String(Date.now()) +
	                          String(Math.random()).substr(12);

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

	Utils.getQuerystring = function(QS) {

	  var QsArr = (QS || '')
	                  .match(/[?&]?([^=]+)=([^&]*)/ig) || [];

	  for (var qs={}, res, i=0, len=QsArr.length; i<len; i++) {

	    res = /[?&]?([^=]+)=([^&]*)/i.exec(QsArr[i]);

	    if (res && res.length)
	      qs[ (res[1]||''.trim()).toLowerCase() ] =  (res[2]||'').trim();
	  }

	  return qs;
	};

	Utils.areEqualShallow = function(a, b) {
	  var key;
	  for(key in a) {
	    if(!(key in b) || a[key] !== b[key]) {
	      return false;
	    }
	  }
	  for(key in b) {
	    if(!(key in a) || a[key] !== b[key]) {
	      return false;
	    }
	  }
	  return true;
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var isFunction = __webpack_require__(1)

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
/* 5 */
/***/ function(module, exports) {

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
/* 6 */
/***/ function(module, exports) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 7 */
/***/ function(module, exports) {

	

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
/* 8 */
/***/ function(module, exports) {

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
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var trim = __webpack_require__(12)
	  , forEach = __webpack_require__(4)
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

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var isarray = __webpack_require__(6)

	/**
	 * Expose `pathToRegexp`.
	 */
	module.exports = pathToRegexp
	module.exports.parse = parse
	module.exports.compile = compile
	module.exports.tokensToFunction = tokensToFunction
	module.exports.tokensToRegExp = tokensToRegExp

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
	  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
	  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
	  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
	  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
	].join('|'), 'g')

	/**
	 * Parse a string for the raw tokens.
	 *
	 * @param  {String} str
	 * @return {Array}
	 */
	function parse (str) {
	  var tokens = []
	  var key = 0
	  var index = 0
	  var path = ''
	  var res

	  while ((res = PATH_REGEXP.exec(str)) != null) {
	    var m = res[0]
	    var escaped = res[1]
	    var offset = res.index
	    path += str.slice(index, offset)
	    index = offset + m.length

	    // Ignore already escaped sequences.
	    if (escaped) {
	      path += escaped[1]
	      continue
	    }

	    // Push the current path onto the tokens.
	    if (path) {
	      tokens.push(path)
	      path = ''
	    }

	    var prefix = res[2]
	    var name = res[3]
	    var capture = res[4]
	    var group = res[5]
	    var suffix = res[6]
	    var asterisk = res[7]

	    var repeat = suffix === '+' || suffix === '*'
	    var optional = suffix === '?' || suffix === '*'
	    var delimiter = prefix || '/'
	    var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?')

	    tokens.push({
	      name: name || key++,
	      prefix: prefix || '',
	      delimiter: delimiter,
	      optional: optional,
	      repeat: repeat,
	      pattern: escapeGroup(pattern)
	    })
	  }

	  // Match any characters still remaining.
	  if (index < str.length) {
	    path += str.substr(index)
	  }

	  // If the path exists, push it onto the end.
	  if (path) {
	    tokens.push(path)
	  }

	  return tokens
	}

	/**
	 * Compile a string to a template function for the path.
	 *
	 * @param  {String}   str
	 * @return {Function}
	 */
	function compile (str) {
	  return tokensToFunction(parse(str))
	}

	/**
	 * Expose a method for transforming tokens into the path function.
	 */
	function tokensToFunction (tokens) {
	  // Compile all the tokens into regexps.
	  var matches = new Array(tokens.length)

	  // Compile all the patterns before compilation.
	  for (var i = 0; i < tokens.length; i++) {
	    if (typeof tokens[i] === 'object') {
	      matches[i] = new RegExp('^' + tokens[i].pattern + '$')
	    }
	  }

	  return function (obj) {
	    var path = ''
	    var data = obj || {}

	    for (var i = 0; i < tokens.length; i++) {
	      var token = tokens[i]

	      if (typeof token === 'string') {
	        path += token

	        continue
	      }

	      var value = data[token.name]
	      var segment

	      if (value == null) {
	        if (token.optional) {
	          continue
	        } else {
	          throw new TypeError('Expected "' + token.name + '" to be defined')
	        }
	      }

	      if (isarray(value)) {
	        if (!token.repeat) {
	          throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
	        }

	        if (value.length === 0) {
	          if (token.optional) {
	            continue
	          } else {
	            throw new TypeError('Expected "' + token.name + '" to not be empty')
	          }
	        }

	        for (var j = 0; j < value.length; j++) {
	          segment = encodeURIComponent(value[j])

	          if (!matches[i].test(segment)) {
	            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
	          }

	          path += (j === 0 ? token.prefix : token.delimiter) + segment
	        }

	        continue
	      }

	      segment = encodeURIComponent(value)

	      if (!matches[i].test(segment)) {
	        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
	      }

	      path += token.prefix + segment
	    }

	    return path
	  }
	}

	/**
	 * Escape a regular expression string.
	 *
	 * @param  {String} str
	 * @return {String}
	 */
	function escapeString (str) {
	  return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
	}

	/**
	 * Escape the capturing group by escaping special characters and meaning.
	 *
	 * @param  {String} group
	 * @return {String}
	 */
	function escapeGroup (group) {
	  return group.replace(/([=!:$\/()])/g, '\\$1')
	}

	/**
	 * Attach the keys as a property of the regexp.
	 *
	 * @param  {RegExp} re
	 * @param  {Array}  keys
	 * @return {RegExp}
	 */
	function attachKeys (re, keys) {
	  re.keys = keys
	  return re
	}

	/**
	 * Get the flags for a regexp from the options.
	 *
	 * @param  {Object} options
	 * @return {String}
	 */
	function flags (options) {
	  return options.sensitive ? '' : 'i'
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
	  var groups = path.source.match(/\((?!\?)/g)

	  if (groups) {
	    for (var i = 0; i < groups.length; i++) {
	      keys.push({
	        name: i,
	        prefix: null,
	        delimiter: null,
	        optional: false,
	        repeat: false,
	        pattern: null
	      })
	    }
	  }

	  return attachKeys(path, keys)
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
	  var parts = []

	  for (var i = 0; i < path.length; i++) {
	    parts.push(pathToRegexp(path[i], keys, options).source)
	  }

	  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options))

	  return attachKeys(regexp, keys)
	}

	/**
	 * Create a path regexp from string input.
	 *
	 * @param  {String} path
	 * @param  {Array}  keys
	 * @param  {Object} options
	 * @return {RegExp}
	 */
	function stringToRegexp (path, keys, options) {
	  var tokens = parse(path)
	  var re = tokensToRegExp(tokens, options)

	  // Attach keys back to the regexp.
	  for (var i = 0; i < tokens.length; i++) {
	    if (typeof tokens[i] !== 'string') {
	      keys.push(tokens[i])
	    }
	  }

	  return attachKeys(re, keys)
	}

	/**
	 * Expose a function for taking tokens and returning a RegExp.
	 *
	 * @param  {Array}  tokens
	 * @param  {Array}  keys
	 * @param  {Object} options
	 * @return {RegExp}
	 */
	function tokensToRegExp (tokens, options) {
	  options = options || {}

	  var strict = options.strict
	  var end = options.end !== false
	  var route = ''
	  var lastToken = tokens[tokens.length - 1]
	  var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken)

	  // Iterate over the tokens and create our regexp string.
	  for (var i = 0; i < tokens.length; i++) {
	    var token = tokens[i]

	    if (typeof token === 'string') {
	      route += escapeString(token)
	    } else {
	      var prefix = escapeString(token.prefix)
	      var capture = token.pattern

	      if (token.repeat) {
	        capture += '(?:' + prefix + capture + ')*'
	      }

	      if (token.optional) {
	        if (prefix) {
	          capture = '(?:' + prefix + '(' + capture + '))?'
	        } else {
	          capture = '(' + capture + ')?'
	        }
	      } else {
	        capture = prefix + '(' + capture + ')'
	      }

	      route += capture
	    }
	  }

	  // In non-strict mode we allow a slash at the end of match. If the path to
	  // match already ends with a slash, we remove it for consistency. The slash
	  // is valid at the end of a path match, not in the middle. This is important
	  // in non-ending mode, where "/test/" shouldn't match "/test//route".
	  if (!strict) {
	    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?'
	  }

	  if (end) {
	    route += '$'
	  } else {
	    // In non-ending mode, we need the capturing groups to match as much as
	    // possible by using a positive lookahead to the end or next path segment.
	    route += strict && endsWithSlash ? '' : '(?=\\/|$)'
	  }

	  return new RegExp('^' + route, flags(options))
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
	  keys = keys || []

	  if (!isarray(keys)) {
	    options = keys
	    keys = []
	  } else if (!options) {
	    options = {}
	  }

	  if (path instanceof RegExp) {
	    return regexpToRegexp(path, keys, options)
	  }

	  if (isarray(path)) {
	    return arrayToRegexp(path, keys, options)
	  }

	  return stringToRegexp(path, keys, options)
	}


/***/ },
/* 11 */
/***/ function(module, exports) {

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
	    function listener () {
	      self.off(name, listener);
	      callback.apply(ctx, arguments);
	    };

	    listener._ = callback
	    return this.on(name, listener, ctx);
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
	        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
	          liveEvents.push(evts[i]);
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
/* 12 */
/***/ function(module, exports) {

	
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

	"use strict";
	var window = __webpack_require__(5)
	var once = __webpack_require__(8)
	var isFunction = __webpack_require__(1)
	var parseHeaders = __webpack_require__(9)
	var xtend = __webpack_require__(14)

	module.exports = createXHR
	createXHR.XMLHttpRequest = window.XMLHttpRequest || noop
	createXHR.XDomainRequest = "withCredentials" in (new createXHR.XMLHttpRequest()) ? createXHR.XMLHttpRequest : window.XDomainRequest

	forEachArray(["get", "put", "post", "patch", "head", "delete"], function(method) {
	    createXHR[method === "delete" ? "del" : method] = function(uri, options, callback) {
	        options = initParams(uri, options, callback)
	        options.method = method.toUpperCase()
	        return _createXHR(options)
	    }
	})

	function forEachArray(array, iterator) {
	    for (var i = 0; i < array.length; i++) {
	        iterator(array[i])
	    }
	}

	function isEmpty(obj){
	    for(var i in obj){
	        if(obj.hasOwnProperty(i)) return false
	    }
	    return true
	}

	function initParams(uri, options, callback) {
	    var params = uri

	    if (isFunction(options)) {
	        callback = options
	        if (typeof uri === "string") {
	            params = {uri:uri}
	        }
	    } else {
	        params = xtend(options, {uri: uri})
	    }

	    params.callback = callback
	    return params
	}

	function createXHR(uri, options, callback) {
	    options = initParams(uri, options, callback)
	    return _createXHR(options)
	}

	function _createXHR(options) {
	    var callback = options.callback
	    if(typeof callback === "undefined"){
	        throw new Error("callback argument missing")
	    }
	    callback = once(callback)

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
	            evt = new Error("" + (evt || "Unknown XMLHttpRequest Error") )
	        }
	        evt.statusCode = 0
	        callback(evt, failureResponse)
	    }

	    // will load the data & process the response in a special response object
	    function loadFunc() {
	        if (aborted) return
	        var status
	        clearTimeout(timeoutTimer)
	        if(options.useXDR && xhr.status===undefined) {
	            //IE8 CORS GET successful response doesn't have a status field, but body is fine
	            status = 200
	        } else {
	            status = (xhr.status === 1223 ? 204 : xhr.status)
	        }
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

	    var xhr = options.xhr || null

	    if (!xhr) {
	        if (options.cors || options.useXDR) {
	            xhr = new createXHR.XDomainRequest()
	        }else{
	            xhr = new createXHR.XMLHttpRequest()
	        }
	    }

	    var key
	    var aborted
	    var uri = xhr.url = options.uri || options.url
	    var method = xhr.method = options.method || "GET"
	    var body = options.body || options.data || null
	    var headers = xhr.headers = options.headers || {}
	    var sync = !!options.sync
	    var isJson = false
	    var timeoutTimer

	    if ("json" in options) {
	        isJson = true
	        headers["accept"] || headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
	        if (method !== "GET" && method !== "HEAD") {
	            headers["content-type"] || headers["Content-Type"] || (headers["Content-Type"] = "application/json") //Don't override existing accept header declared by user
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
	    xhr.open(method, uri, !sync, options.username, options.password)
	    //has to be after open
	    if(!sync) {
	        xhr.withCredentials = !!options.withCredentials
	    }
	    // Cannot set timeout with sync request
	    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
	    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
	    if (!sync && options.timeout > 0 ) {
	        timeoutTimer = setTimeout(function(){
	            aborted=true//IE9 may still call readystatechange
	            xhr.abort("timeout")
	            var e = new Error("XMLHttpRequest timeout")
	            e.code = "ETIMEDOUT"
	            errorFunc(e)
	        }, options.timeout )
	    }

	    if (xhr.setRequestHeader) {
	        for(key in headers){
	            if(headers.hasOwnProperty(key)){
	                xhr.setRequestHeader(key, headers[key])
	            }
	        }
	    } else if (options.headers && !isEmpty(options.headers)) {
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
/* 14 */
/***/ function(module, exports) {

	module.exports = extend

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	function extend() {
	    var target = {}

	    for (var i = 0; i < arguments.length; i++) {
	        var source = arguments[i]

	        for (var key in source) {
	            if (hasOwnProperty.call(source, key)) {
	                target[key] = source[key]
	            }
	        }
	    }

	    return target
	}


/***/ }
/******/ ]);