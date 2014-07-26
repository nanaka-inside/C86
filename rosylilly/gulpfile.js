var gulp = require('gulp');
var pandoc = require('gulp-pandoc');

gulp.task('default', function() {
  gulp.watch('*.mkd', function(event) {
    console.log("Build: " + event.path);

    gulp.src('*.mkd')
      .pipe(pandoc({
        from: 'markdown',
        to: 'rst',
        ext: '.rst',
        args: ['--smart']
      }))
      .pipe(gulp.dest('./'));
  });
});
