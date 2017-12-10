let gulp = require('gulp');
let connect = require('gulp-connect');
let cssMin = require('gulp-clean-css');
let concat = require('gulp-concat');
let uglify = require('gulp-uglify');
let imageresize = require('gulp-image-resize');
let imagemin = require('gulp-imagemin');
let pngquant = require('imagemin-pngquant');

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
    gulp.watch(['css/main.css'], ['build-css']);
}));

gulp.task('build-js', () => {
    gulp.src([
        'libs/jquery/dist/jquery.js',
        'libs/owl.carousel/dist/owl.carousel.js',
        'libs/photoswipe/dist/photoswipe.js',
        'libs/photoswipe/dist/photoswipe-ui-default.js',
        'js/main.js'
    ])
        .pipe(concat('script.js'))
        // .pipe(uglify())
        .pipe(gulp.dest('js'));
});

gulp.task('build-css', () => {
    gulp.src([
        'libs/semantic/dist/semantic.css',
        'libs/bootstrap/dist/css/bootstrap.css',
        'libs/owl.carousel/dist/assets/owl.carousel.css',
        'libs/owl.carousel/dist/assets/owl.theme.default.css',
        'libs/photoswipe/dist/photoswipe.css',
        'libs/photoswipe/dist/default-skin/default-skin.css',
        'css/main.css'
    ])
        .pipe(cssMin())
        .pipe(concat('libs.min.css'))
        .pipe(gulp.dest('css'))
});



gulp.task('thumbnails', () => {
    gulp.src('img/photos/*')
        .pipe(imageresize({
            width: 200,
            height: 200,
            upscale: false,
            crop: true,
            gravity: 'North'
        }))
        .pipe(imagemin({
            progressive: true,
            // set this if you are using svg images
            // svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('img/thumbnails'));
});


gulp.task('default', ['connect', 'watch']);
gulp.task('build', ['build-js', 'build-css']);