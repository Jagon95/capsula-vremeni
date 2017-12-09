let gulp = require('gulp');
let connect = require('gulp-connect');
let cssMin = require('gulp-clean-css');
let concat = require('gulp-concat');
let uglify = require('gulp-uglify');

gulp.task('connect', () => {
    connect.server({
        livereload: true,
        port: 1488,
        root: '.'
    });
});


gulp.task('reloader', () => {
    gulp.src(['css/libs.min.css', 'index.html', 'js/script.js'])
        .pipe(connect.reload());
});

gulp.task('watch', (() => {
    // gulp.watch(['css/*.css', 'index.html', 'js/script.js'], ['reloader']);
    gulp.watch(['js/main.js'], ['build-js']);
}));

gulp.task('build-js', () => {
    gulp.src(['node_modules/jquery/dist/jquery.js', 'libs/OwlCarousel2-2.2.1/dist/owl.carousel.js', 'js/main.js'])
        .pipe(concat('script.js'))
        // .pipe(uglify())
        .pipe(gulp.dest('js'));
});

gulp.task('build-css', () => {
    gulp.src([
        'node_modules/semantic-ui/dist/semantic.css',
        'node_modules/bootstrap/dist/css/bootstrap.css',
        'libs/OwlCarousel2-2.2.1/dist/assets/owl.carousel.css',
        'libs/OwlCarousel2-2.2.1/dist/assets/owl.theme.default.css',
    ])
        .pipe(cssMin())
        .pipe(concat('libs.min.css'))
        .pipe(gulp.dest('css'))
});


gulp.task('default', ['connect', 'watch']);