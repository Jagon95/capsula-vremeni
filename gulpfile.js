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
const imageSize = require('image-size-export');
const uncss = require('gulp-uncss');
const sequence = require('gulp-sequence');
const mkPromise = require('gulp-stream-to-promise');

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
    // gulp.watch(['src/js/**/*.js'], ['build-js']);
    gulp.watch(['src/scss/**/*.sass', 'src/scss/**/*.scss'], ['build-css']);
    gulp.watch(['src/pug/**/*.pug'], ['pug']);
}));

// gulp.task('build-js', ['babel'], () => {
//         gulp.src([
//             'libs/jquery/dist/jquery.js',
//             'libs/owl.carousel/dist/owl.carousel.js',
//             'libs/photoswipe/dist/photoswipe.js',
//             'libs/photoswipe/dist/photoswipe-ui-default.js',
//             'libs/Headhesive.js/dist/headhesive.js',
//             'libs/parallax.js/parallax.js',
//             'libs/waypoints/lib/jquery.waypoints.js',
//             'libs/semantic/dist/semantic.js',
//             'tmp/js/babel-main.js'
//         ])
//         .pipe(concat('script.js'))
//         .pipe(prod(uglify()))
//         .pipe(gulp.dest('build/js'))
//         .pipe(dev(connect.reload()));
// });

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
        .pipe(prod(uncss({
            html: 'http://localhost:1488'
        })))
        .pipe(prod(autoprefixer({browsers: '> 0.3%'})))
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
        .pipe(purify(['index.html', 'js/main.js', 'node_modules/semantic-ui/dist/components/transition.js', 'node_modules/semantic-ui/dist/components/dimmer.js']))
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
    // imageSize.record({
    //     path: 'build/img/photos/*.jpg',
    //     output: "src/image_sizes.json",
    //     breakpointDelimiter: '/'
    // });

    gulp.src('src/pug/**/*.pug')
        .pipe(data(() => require('./src/data.json')))
        .pipe(data(() => {
            return {
                products: require('./src/product.json'),
                gallery: require('./src/photos.json')
            };
        }))
        // .pipe(data(() => {
        //     let data = require('./src/data.json');
        //     const arr = require('./tmp/image_sizes.json');
        //     let images = arr.reduce(function(obj,item){
        //         obj[item.name] = item;
        //         return obj;
        //     }, {});
        //
        //     Object.keys(data.products).forEach((name) => {
        //         data.products[name]['w'] = images[name];
        //     });
        //
        //     return {images};
        // }))
        .pipe(pug({
            pretty: !!dev
        }))
        .pipe(gulp.dest('build'))
        .pipe(connect.reload());
});


gulp.task('images', () => {
    let imageminConfig = [
        imagemin.jpegtran({progressive: true}),
        imagemin.optipng({optimizationLevel: 5}),
        imagemin.svgo({
            plugins: [
                {removeViewBox: true},
                {cleanupIDs: false}
            ]
        })
    ];

    let streams = [];
    let products = require('./src/product.json');
    let productsThumbnails = Object.values(products).reduce((r, a) => [...r, ...a.images], []);
    streams.push(gulp.src(productsThumbnails, {cwd: './img/photos/'})
        .pipe(imageresize({
            width: 300,
            height: 300,
            upscale: false,
            crop: true,
            gravity: 'North'
        }))
        .pipe(imagemin(imageminConfig))
        .pipe(gulp.dest('build/img/thumbnails')));

    let photos = require('./src/photos.json');
    let photosThumbnails = photos.reduce((r, photo) => [...r, photo.image], []);
    streams.push(gulp.src(photosThumbnails, {cwd: './img/photos/'})
        .pipe(imageresize({
            height: 450,
            upscale: false,
            crop: false,
        }))
        .pipe(imagemin(imageminConfig))
        .pipe(gulp.dest('build/img/thumbnails')));

    streams.push(gulp.src(['img/**/*.jpg', 'img/**/*.png', '!img/events/*.*'], {base: '.'})
        .pipe(imageresize({
            width: 1920,
            height: 1080,
            upscale: false,
            crop: false,
        }))
        .pipe(imagemin(imageminConfig))
        .pipe(gulp.dest('./build/')));

    streams.push(gulp.src(['img/events/*.*'])
        .pipe(imageresize({
            height: 800,
            upscale: false,
            crop: false,
        }))
        .pipe(imagemin(imageminConfig))
        .pipe(gulp.dest('build/img/events')));

    let promises = streams.map(mkPromise);
    Promise.all(promises).then(() => {
        gulp.start('image-size');
    });
});

gulp.task('image-size', () => {
    imageSize.record({
        path: 'build/img/photos/*.jpg',
        output: "src/image_sizes.json",
        breakpointDelimiter: '/'
    });
});

gulp.task('copy', () => {
    gulp.src('libs/photoswipe/dist/default-skin/*.*').pipe(gulp.dest('build/css'));
    gulp.src('libs/semantic/dist/themes/default/**').pipe(gulp.dest('build/css/themes/default'));
});

gulp.task('set-dev', dev.task);
gulp.task('set-prod', prod.task);

gulp.task('default', sequence('set-dev', 'pug', 'build-css', 'connect', 'watch'));
gulp.task('build', sequence('set-prod', 'pug', /*'build-js',*/ ['copy', 'images'], 'image-size', 'build-css'));