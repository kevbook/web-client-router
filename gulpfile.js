
var gulp = require('gulp'),

  // Js Webpack
  webpack = require('webpack'),
  merge = require('merge').recursive,
  errorParser = require('error-parser'),

  // Js Polyfiller
  jsAutopolyfiller = require('gulp-autopolyfiller'),
  uglify = require('gulp-uglify');



// Build out CLI Args
var argv = require('yargs')
  .usage('Usage: -p [prod optimizations] ')
  .alias('p', 'prod')
  .argv;


// Default compiler
gulp.task('default', ['js']);

// Watcher
gulp.task('watch', function() {
  gulp.watch(['**/*.js'], ['js']);
});


gulp.task('js-polyfill', function() {

  return gulp.src('./public/js/*.js')
    .pipe(jsAutopolyfiller('polyfills.js', {
      browsers: ['last 3 versions'],
      exclude: ['Promise']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
});


var config = require('./webpack.config.js').config;
var prodConfig = require('./webpack.config.js').prodConfig;

gulp.task('js', function(cb) {

  // Add prod optimizations
  if (argv.prod === true) {
    config = merge(true, config, prodConfig);
  }

  webpack(config, function(err, stats) {

    try {
      // Handle errors
      var jsonStats = stats.toJson();

      if(err || jsonStats.errors.length) {
        console.log(errorParser(err || jsonStats.errors));
      }
    }

    catch(e){}
    return cb();
  });
});

