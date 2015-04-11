
/**
 * webpack.config.js
 **/

var webpack = require('webpack'),
  WebpackStrip = require('strip-loader');


exports.config = {
  cache: true,
  debug: true,
  // We are watching in the gulp.watch
  watch: false,
  entry: {
    router: ['./index'],
    tests: './test/tests'
  },
  output: {
    path: 'dist',
    filename: '[name].js' // Template based on keys in entry above
  },
  module: {
    noParse: /\.min\.js/
  },
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin()
  ],
  resolve: {
    // root: __dirname,
    extensions: ['', '.js', '.jsx'],
    modulesDirectories: ['bower_components', 'node_modules']
  },
  externals: [
    // /^[a-z\-0-9]+$/, // Every non-relative module
    'jquery'
  ]
};

// Prod config
exports.prodConfig = {
  cache: false,
  debug: false,
  // Remove debug and console statements on prod
  module: {
    loaders: [
      { test: /\.js$/,
        // exclude: /\/(node_modules|bower_components)\//,
        loader: WebpackStrip.loader('debug', 'console.log')
      },
      { test: /\.js$/,
        exclude: /\/(node_modules|bower_components)\//,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    new webpack.IgnorePlugin(/debug/),
    new webpack.optimize.AggressiveMergingPlugin(),
    // Prod build settings
    new webpack.DefinePlugin({
      'process.env': {
        // This has effect on the react lib size
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin()
  ]
};
