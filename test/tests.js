
var Router = require('..');

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
