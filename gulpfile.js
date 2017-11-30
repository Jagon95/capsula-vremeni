let gulp = require('gulp');
let connect = require('gulp-connect');
let cssMin = require('gulp-clean-css');
let concat = require('gulp-concat');

gulp.task('connect', () => {
    connect.server({
        livereload: true,
        port: 1488,
        root: '.'
    });
});


gulp.task('reloader', () => {
    gulp.src(['css/*.css', 'index.html'])
        .pipe(connect.reload());
});

gulp.task('watch', (() => {
    gulp.watch(['css/*.css', 'index.html'], ['reloader']);
}));

// gulp.task('buildjs', () => {
//     gulp.src(['node_modules/jquery/dist/jquery.js'])
// });

gulp.task('build-css', () => {
    gulp.src(['node_modules/semantic-ui/dist/semantic.css', 'node_modules/bootstrap/dist/css/bootstrap.css'])
        .pipe(cssMin())
        .pipe(concat('libs.min.css'))
        .pipe(gulp.dest('css'))
});


gulp.task('default', ['connect', 'watch']);