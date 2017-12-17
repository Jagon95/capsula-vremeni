const gulp = require('gulp');
const connect = require('gulp-connect');
const cssMin = require('gulp-clean-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglifyjs');
const imageresize = require('gulp-image-resize');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const babel = require('gulp-babel');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const purify = require('gulp-purifycss');
const csso = require('gulp-csso');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const pug = require('gulp-pug');
const data = require('gulp-data');
const copy = require('gulp-copy');
const env = require('gulp-environments');

const dev = env.development;
const prod = env.production;


gulp.task('connect', () => {
    connect.server({
        livereload: true,
        port: 1488,
        root: 'build/'
    });
});

gulp.task('reloader', () => {
    connect.reload();
});

gulp.task('watch', (() => {
    gulp.watch(['src/js/**/*.js'], ['build-js']);
    gulp.watch(['src/scss/**/*.sass', 'src/scss/**/*.scss'], ['build-css']);
    gulp.watch(['src/pug/**/*.pug'], ['pug']);
}));

gulp.task('build-js', ['babel'], () => {
        gulp.src([
            'libs/jquery/dist/jquery.js',
            'libs/owl.carousel/dist/owl.carousel.js',
            'libs/photoswipe/dist/photoswipe.js',
            'libs/photoswipe/dist/photoswipe-ui-default.js',
            'libs/Headhesive.js/dist/headhesive.js',
            'libs/parallax.js/parallax.js',
            'libs/waypoints/lib/jquery.waypoints.js',
            'libs/semantic/dist/semantic.js',
            'tmp/js/babel-main.js'
        ])
        .pipe(concat('script.js'))
        .pipe(prod(uglify()))
        .pipe(gulp.dest('build/js'))
        .pipe(dev(connect.reload()));
});

gulp.task('build-css', ['sass'], () => {
    gulp.src([
        // 'tmp/css/purified.css',
        'libs/bootstrap/dist/css/bootstrap.css',
        'libs/semantic/dist/semantic.css',
        'libs/owl.carousel/dist/assets/owl.carousel.css',
        'libs/owl.carousel/dist/assets/owl.theme.default.css',
        'libs/photoswipe/dist/photoswipe.css',
        'libs/photoswipe/dist/default-skin/default-skin.css',
        // 'libs/animate.css/animate.css',
        'tmp/css/main.css'
    ])
        .pipe(concat('main.min.css'))
        .pipe(prod(csso()))
        // .pipe(cleanCSS({
        //     level: 2
        // }))
        .pipe(prod(autoprefixer({browsers: '> 1%'})))
        .pipe(gulp.dest('build/css'))
        .pipe(dev(connect.reload()));
});

gulp.task('sass', () => {
    gulp.src(['src/scss/**/*.sass', 'src/scss/**/*.scss'])
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(gulp.dest('tmp/css'));
});

gulp.task('purify-css', () => {
    gulp.src([
        'libs/bootstrap/dist/css/bootstrap.css',
        'libs/semantic/dist/semantic.css'
    ])
        .pipe(purify(['index.html', 'js/main.js']))
        .pipe(concat('purified.css'))
        .pipe(gulp.dest('tmp/css'));
});


gulp.task('babel', () => {
    gulp.src('src/js/main.js')
        .pipe(babel({
            presets: ['env', 'stage-3']
        }))
        .pipe(rename({
            prefix: 'babel-'
        }))
        .pipe(gulp.dest('tmp/js'));
});

gulp.task('pug', () => {
    gulp.src('src/pug/**/*.pug')
        .pipe(data(file => require('./src/data.json')))
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('build'))
        .pipe(connect.reload());
});


gulp.task('thumbnails', () => {
    gulp.src('img/photos/*')
        .pipe(imageresize({
            width: 300,
            height: 300,
            upscale: false,
            crop: false,
            gravity: 'North'
        }))
        .pipe(imagemin({
            progressive: true,
            // set this if you are using svg images
            // svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('build/img/thumbnails'));
});

gulp.task('copy', () => {
    gulp.src('img/**').pipe(gulp.dest('build/img'));        // TODO: not just copy, but also optimise
    gulp.src('libs/photoswipe/dist/default-skin/*.*').pipe(gulp.dest('build/css'));
    gulp.src('libs/semantic/dist/themes/default/**').pipe(gulp.dest('build/css/themes/default'));
});

gulp.task('set-dev', dev.task);

gulp.task('default', ['set-dev', 'connect', 'watch']);
gulp.task('build', ['pug', 'build-js', 'build-css', 'copy', 'thumbnails']);