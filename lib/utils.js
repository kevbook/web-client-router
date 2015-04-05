
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
