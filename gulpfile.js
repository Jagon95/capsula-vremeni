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

gulp.task('connect', () => {
    connect.server({
        livereload: true,
        port: 1488,
        root: '.'
    });
});

gulp.task('reloader', () => {
    connect.reload();
});

gulp.task('watch', (() => {
    // gulp.watch(['css/*.css', 'index.html', 'js/script.js'], ['reloader']);
    gulp.watch(['js/main.js'], ['build-js']);
    gulp.watch(['scss/**/*.sass', 'scss/**/*.scss'], ['build-css']);
    // gulp.watch(['scss/**/*.sass', 'scss/**/*.scss'], ['sass']);
}));

gulp.task('build-js', ['babel'], () => {
        gulp.src([
            'libs/jquery/dist/jquery.js',
            'libs/owl.carousel/dist/owl.carousel.js',
            'libs/photoswipe/dist/photoswipe.js',
            'libs/photoswipe/dist/photoswipe-ui-default.js',
            'libs/Headhesive.js/dist/headhesive.js',
            'js/babel-main.js'
        ])
        .pipe(concat('script.js'))
        .pipe(uglify())
        .pipe(gulp.dest('js'))
        .pipe(connect.reload());
});

gulp.task('build-css', ['sass'], () => {
    gulp.src([
        // 'css/purified.css',
        'libs/bootstrap/dist/css/bootstrap.css',
        'libs/semantic/dist/semantic.css',
        'libs/owl.carousel/dist/assets/owl.carousel.css',
        'libs/owl.carousel/dist/assets/owl.theme.default.css',
        'libs/photoswipe/dist/photoswipe.css',
        'libs/photoswipe/dist/default-skin/default-skin.css',
        'css/main.css'
    ])
        .pipe(concat('libs.min.css'))
        // .pipe(csso())
        // .pipe(cleanCSS({
        //     level: 2
        // }))
        .pipe(autoprefixer({browsers: '> 1%'}))
        .pipe(gulp.dest('css'))
        .pipe(connect.reload());
});

gulp.task('sass', () => {
    gulp.src(['scss/**/*.sass', 'scss/**/*.scss'])
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(gulp.dest('css'));
});

gulp.task('purify-css', () => {
    gulp.src([
        'libs/bootstrap/dist/css/bootstrap.css',
        'libs/semantic/dist/semantic.css'
    ])
        .pipe(purify(['index.html', 'js/main.js']))
        .pipe(concat('purified.css'))
        .pipe(gulp.dest('css'));
});


gulp.task('babel', () => {
    gulp.src('js/main.js')
        .pipe(babel({
            presets: ['env', 'stage-3']
        }))
        .pipe(rename({
            prefix: 'babel-'
        }))
        .pipe(gulp.dest('js/'));
});


gulp.task('thumbnails', () => {
    gulp.src('img/photos/*')
        .pipe(imageresize({
            width: 300,
            height: 300,
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