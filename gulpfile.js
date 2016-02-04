var gulp = require('gulp'),
    cssnano = require('gulp-cssnano'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    karma = require('gulp-karma'),
    concat = require('gulp-concat'),
    connect = require('gulp-connect'),
    notify = require('gulp-notify');

gulp.task('webserver', function () {
  connect.server({
    livereload: true,
  });
});

gulp.task('test', function () {
  return gulp.src('spec/test.js')
    .pipe(jshint('.jshintrc'))
    .pipe(notify({ message: 'All Tests Have Passed Woohoo!!!' }));
});

gulp.task('watch', function () {
  gulp.watch('**/*.js', function (event) {
    gulp.run('webserver');
    gulp.run('test');
  });
});

gulp.task('default', function () {
  gulp.start('test');
});
