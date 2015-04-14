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
npm install web-client-router --save
var Router = require('web-client-router');

// Handler
function handler(data) {
  console.log(data);
};

// Init the router
var router = new Router([
  {
  // Router path
    path: '/',

  // Optional to change document title
    title: 'Root Page',

    // Pre middleware is executed before handler is executed
    pre: function(route, next) {
      return next(null, 'some result');
    }

  handler: function(data) {
      console.log(data);
    }
  },

  {
    path: '/abc',

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
      console.log(data);
    }
  },

  {
  // Router path can also contain params just like express router
    path: '/abc/:paramA/:paramB',

  // After any pre middleware is executed, GET request is made to prefetch the data from a web api
    get: '/service/data.json',

  handler: function(data) {
      console.log(data);
    }
  },

  {
  // Router path can also contain params just like express router
    path: '/xyz/:paramA',

  // GET requests can be an object executed parallel-ly
  get: { profile: '/service/profile.json', account: '/service/acount.json'}

  handler: function(data) {
      console.log(data);
    }
  },

  {
  // Router path can also contain params just like express router
    path: '/xyz/:userid',

  // GET requests urls can have params as variables
  get: { profile: '/service/profile.json/{userid}', account: '/service/acount.json/{userid}'}

  handler: function(data) {
      console.log(data);
    }
  },

  // Catch all 404 handler
  {
    path: '/*',
  handler: function(data) {
      console.log(data);
    }  },

], {

  // Any customer request headers or options are passed to the xhr module
  xhr: {
    headers: {
      'Content-Tyoe': 'application/json'
    }
  }

  // If the server has already rendered the page, and you don't want the initial route to be triggered, pass silent: true.
  silent: true
});
```
