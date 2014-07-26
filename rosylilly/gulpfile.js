var gulp = require('gulp');
var pandoc = require('gulp-pandoc');

gulp.task('default', function() {
  gulp.watch('*.mkd', ['build']);
});

gulp.task('build', function() {
  gulp.src('*.mkd')
  .pipe(pandoc({
    from: 'markdown_github',
    to: 'rst',
    ext: '.rst',
    args: ['--no-wrap']
  }))
  .pipe(gulp.dest('./'));
});
