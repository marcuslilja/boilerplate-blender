
'use strict';

var config = require('../config'),
  utils = require('../utils'),
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  gulpif = require('gulp-if'),
  uglify = require('gulp-uglify'),
  browserify = require('browserify'),
  watchify = require('watchify'),
  buffer = require('vinyl-buffer'),
  source = require('vinyl-source-stream'),
  chalk = require('chalk'),
  envify = require('envify/custom'),
  stripDebug = require('gulp-strip-debug');

var bundle = function (bundler) {
  return bundler
    .transform(envify(process.env))
    .bundle()
    .on('error', utils.handleError)
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(gulpif(config.production, stripDebug()))
    .pipe(gulpif(config.production, uglify()))
    .pipe(gulp.dest(config.scripts.dest));
};

gulp.task('browserify', function () {
  var bundler = browserify({
    entries: './' + config.scripts.src,
    debug: !config.production
  });

  return bundle(bundler);
});

gulp.task('watchify', ['lint'], function () {
  var bundler = browserify({
      entries: './' + config.scripts.src,
      debug: !config.production
    }, watchify.args),

    watcher = watchify(bundler),

    onUpdate = function (scripts) {
      var output, parsedScripts;

      parsedScripts = scripts
        .filter(function (id) {
          return id.substr(0, 2) !== './';
        })
        .map(function (id) {
          return chalk.blue(id.replace(__dirname, ''));
        });

      if (parsedScripts.length > 1) {
        output = parsedScripts.length +
          ' Scripts updated:\n* ' +
          parsedScripts.join('\n* ') +
          '\nrebuilding...';

        gutil.log(output);
      } else {
        output = parsedScripts[0] +
          ' updated, rebuilding...';

        gutil.log(output);
      }

      bundle(watcher);
    },

    onTime = function (time) {
      var output = 'Finished \'' +
        chalk.cyan('watchify') +
        '\' after ' +
        chalk.magenta((Math.round(time / 10) / 100) + ' s');

      gutil.log(output);
    };

  watcher
    .on('update', onUpdate)
    .on('time', onTime);

  return bundle(watcher);
});
