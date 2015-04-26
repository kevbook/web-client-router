# web-client-router
Express style client router for single page web apps


#### Usage
Uses [ExpressJs](http://expressjs.com) style routing on the client side. See [Routing Path Match Rules](https://github.com/pillarjs/path-to-regexp)

```
1. path = '/' // matches /
2. path = '/about' // matches /about
3. path = '/ab?cd' // matches abcd, abbcd, abbbcd, and so on
```


```js
$ npm install web-client-router --save
var Router = require('web-client-router');

// Create the router
var router = Router({

  '/': {

	  // To change document title (Optional)
    title: 'Landing Page',

    // Pre middleware is executed before handler is executed
    // @param {[Functions]} || {Function}
    pre: function(route, next) {
      return next(null, 'some result');
    },

 	  handler: function(data) {
 	   	// data.get , data.params , data.url , data.lastUrl
      console.log(data);
    }
  },

  '/abc': {
    // Pre middleware can be an array of functions executed in order
    pre: [
      function auth(route, next) {
        return next();
      },
      function(route, next) {
        return next();
      }
    ],

 	  handler: function(data) {
 	   // data.pre , data.params , data.url , data.lastUrl
      console.log(data);
    }
  },

  // Router path can also contain params just like express router
  '/abc/:paramA/:paramB': {

	  // After any pre middleware is executed, GET request is made
	  // to prefetch the data from a web api
    get: '/service/data.json',

 	  handler: function(data) {
 	    // data.get , data.params , data.url , data.lastUrl
      console.log(data);
    }
  },

    // Router path can also contain params just like express router
  '/xyz/:paramA': {

	  // GET requests can be an object executed parallel-ly
	  get: {
	    profile: '/service/profile.json',
	    account: '/service/acount.json'
	  },

 	  handler: function(data) {
 	   // data.get , data.params , data.url , data.lastUrl
      console.log(data);
    }
  },

  // Router path can also contain params just like express router
  '/xyz/:userid': {

	  // GET requests urls can have params as variables
	  get: {
	    profile: '/service/profile.json/{userid}',
	    account: '/service/acount.json/{userid}'
	  },

 	  handler: function(data) {
 	   // data.get , data.params , data.url , data.lastUrl
      console.log(data);
    }
  },

  // Catch all 404 handler
  '/*': {
    handler: function(data) {
      console.log(data);
    }
  },
}, {

  // Any xhr options are passed to the xhr module
  // See: https://github.com/Raynos/xhr
  xhr: {
    headers: {
      'Content-Tyoe': 'application/json'
    }
  }

  // If the server has already rendered the page,
  // and you don't want the initial route to be triggered, pass silent: true.
  silent: true
});

// Start the router
router.start();

// Go to a path
// @opts {Object} - optional
// opts.replace = true --> to replace history state instead of push state
router.go('/new-url', [opts])
```

#### More things

```js
// You can also listen to events
router.events.on('route_complete', function(url) {
  console.log(url)
});

router.events.on('route_matched', function(url) {
  console.log(url)
});

router.events.on('route_error', function(err) {
  console.log(err)
});

router.events.on('route_not_found', function(url) {
  console.log(url)
});

// You can also add a route later on
router.addRoute({
  path: '/some-route',
  handler: function(data) {
    console.log(data);
  }
});
```
