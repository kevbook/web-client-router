

console.log('Running tests.js');

var Router = require('..');

var handler = function(data) {
  console.log('-- In Hander --');
  console.debug(data);
  var el = document.getElementById('route');
  if (el) el.textContent = data.url;
};

var router = Router({
  '/': {
    title: 'Root Page',
    handler: handler,
    pre: function(route, next) {
      console.log('In Pre:', route);
      return next(null, 'some result');
    },
    get: '/'
  },

  '/abc': {
    title: 'Abc Page',
    handler: handler,
    pre: [
      function auth(route, next) {
        console.log('Route:', route);
        return next();
      },
      function(route, next) {
        console.log('Route:', route);
        return next(null, '2nd function man');
      }
    ]
  },

  '/abc/super': {
    title: 'Abc/Super Page',
    handler: handler
  },

  '/:cool': {
    title: 'Root Page',
    handler: handler,
    pre: function(route, next) {
      console.log('In Pre:', route);
      return next(null, 'some result');
    },
    get: '/'
  },

  '/abc/:a/:b': {
    title: 'Abc/Super/a/b Page',
    handler: handler,
    get: { name: '/{a}', man: '/hello' }
  },

  // Catch all 404 handler
  '/*': {
    handler: handler
  },

}, {

  xhr: {
    headers: {
      'Content-Tyoe': 'application/json'
    }
  },
  // silent: true,
  // root: 'public/search'
});


// Testing events
router.events.on('route_start', function(route) {
  console.log('route_start:', route)
});

router.events.on('route_complete', function(route) {
  console.log('route_complete:', route)
});

router.events.on('pre_complete', function(preData) {
  console.log('pre_complete:', preData)
});

router.events.on('get_complete', function(getData) {
  console.log('get_complete:', getData)
});

router.events.on('route_matched', function(url) {
  console.log('route_matched:', url)
});

router.events.on('route_error', function(err) {
  console.log('route_error:', err)
});

router.events.on('route_not_found', function(url) {
  console.log('route_not_found:', url)
});

window.r = window.router = window.Router = router;
router.start();
