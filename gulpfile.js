const gulp = require('gulp');
const imageSize = require('image-size-export');
const parallel = require('concurrent-transform');
const os = require('os');
const path = require('path');
const moduleImporter = require('sass-module-importer');
const loadPlugins = require('gulp-load-plugins')({
    rename: {
        'gulp-environments': 'env',
        'gulp-stream-to-promise': 'mkPromise'
    }
});

Object.assign(global, loadPlugins);

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

gulp.task('build-css', ['sass'], () => {
    gulp.src([
        'tmp/css/main.css'
    ])
        .pipe(concat('main.min.css'))
        .pipe(cssReplaceUrl({
            replace: ['./../themes/default/assets/fonts', 'fonts']
        }))
        .pipe(prod(csso()))
        .pipe(prod(cleanCss({
            level: 2
        })))
        // .pipe(prod(uncss({
        //     html: 'http://localhost:1488'
        // })))
        .pipe(prod(autoprefixer({browsers: '> 0.3%'})))
        .pipe(gulp.dest('build/css'))
        .pipe(dev(connect.reload()));
});

gulp.task('sass', () => {
    gulp.src(['src/scss/**/*.sass', 'src/scss/**/*.scss'])
        .pipe(sass({
            outputStyle: 'expanded',
            importer: moduleImporter()
        }).on('error', sass.logError))
        .pipe(gulp.dest('tmp/css'));
});

gulp.task('purify-css', () => {
    gulp.src([
        'libs/bootstrap/dist/css/bootstrap.css',
        'libs/semantic/dist/semantic.css'
    ])
        .pipe(purifycss(['index.html', 'js/main.js', 'node_modules/semantic-ui/dist/components/transition.js', 'node_modules/semantic-ui/dist/components/dimmer.js']))
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
        .pipe(data(() => require('./src/data/data.json')))
        .pipe(data(() => {
            return {
                products: require('./src/data/product.json'),
                gallery: require('./src/data/photos.json'),
                i18n: require('./src/data/i18n.json')
            };
        }))
        .pipe(pug({
            pretty: !!dev()
        }))
        .pipe(gulp.dest('build'))
        .pipe(connect.reload());
});


gulp.task('images', () => {
    const exclude = (array) => {
        return array.map((i) => `!**/${i}`);
    };

    const imageminConfig = [
        imagemin.jpegtran({progressive: true}),
        imagemin.optipng({optimizationLevel: 5}),
        imagemin.svgo({
            plugins: [
                {removeViewBox: true},
                {cleanupIDs: false}
            ]
        })
    ];

    const cores = os.cpus().length;

    let streams = [];
    let products = require('./src/data/product.json');
    let productsThumbnails = Object.values(products).reduce((r, a) => [...r, ...a.images], []);
    streams.push(gulp.src(productsThumbnails, {cwd: './img/photos/'})
        .pipe(changed('build/img/thumbnails'))
        .pipe(parallel(imageResize({
            width: 300,
            height: 300,
            upscale: false,
            crop: true,
            gravity: 'North'
        }), cores))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('build/img/thumbnails')));

    let photos = require('./src/data/photos.json');
    let photosThumbnails = photos.reduce((r, photo) => [...r, photo.image], []);
    streams.push(gulp.src(photosThumbnails, {cwd: './img/photos/'})
        .pipe(changed('build/img/thumbnails'))
        .pipe(parallel(imageResize({
            height: 450,
            upscale: false,
            crop: false
        }), cores))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('build/img/thumbnails')));

    const data = require('./src/data/data.json');
    const clientsImages = data.clients.reduce((r, client) => [...r, client.image], []);
    streams.push(gulp.src(clientsImages, {
        cwd: './img/photos',
        base: '.'
    })
        .pipe(changed('./build'))
        .pipe(parallel(gm((gmfile, done) => {
            const size = {
                w: 1920,
                h: 1920*.4
            };
            gmfile.size((err, val) => {
                const resizeRatio = Math.max(size.h / val.height, size.w / val.width);
                if(resizeRatio < 1) {
                    done(err, gmfile.resize(val.width * resizeRatio, val.height * resizeRatio).gravity('Center').crop(size.w, size.h));
                } else {
                    done(err, gmfile.gravity('Center').crop(size.w / resizeRatio, size.h / resizeRatio));
                }
            });
        }), cores))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('./build'))
    );

    const clientsIcons = data.clients.reduce((r, client) => [...r, client.icon], []);
    streams.push(gulp.src(clientsIcons, {
        cwd: './img/',
        base: '.'
    })
        .pipe(changed('./build/'))
        .pipe(parallel(imageResize({
            width: 140,
            height: 140,
            upscale: true,
            crop: true,
            gravity: 'Center'
        }), cores))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('./build/')));

    streams.push(gulp.src(['img/**/*.{jpg,jpeg,png}', ...exclude(clientsImages), ...exclude(clientsIcons), '!img/events/*.*'], {base: '.'})
        .pipe(changed('./build/'))
        .pipe(parallel(imageResize({
            width: 1920,
            height: 1080,
            upscale: false,
            crop: false
        }), cores))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('./build/')));

    streams.push(gulp.src(['img/events/*.*'])
        .pipe(changed('build/img/events'))
        .pipe(parallel(imageResize({
            height: 800,
            upscale: false,
            crop: false,
        }), cores))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('build/img/events')));

    let promises = streams.map(mkPromise);
    Promise.all(promises).then(() => {
        gulp.start('image-size');
    });
});

gulp.task('image-size', () => {
    imageSize.record({
        path: 'build/img/photos/*.jpg',
        output: "tmp/image_sizes.json",
        breakpointDelimiter: '/'
    });
});

gulp.task('copy', () => {
    gulp.src('libs/photoswipe/dist/default-skin/*.*').pipe(gulp.dest('build/css'));
    gulp.src('libs/semantic/dist/themes/default/**').pipe(gulp.dest('build/css/themes/default'));
});

gulp.task('gm', () => {
    const size = {
        h: 1000,
        w: 2500
    };

    gulp.src('build/img/photos/*.*')
        .pipe(gm(function (gmfile, done) {
            gmfile.size((err, val) => {
                const resizeRatio = Math.max(size.h / val.height, size.w / val.width);
                if(resizeRatio < 1) {
                    done(err, gmfile.resize(val.width * resizeRatio, val.height * resizeRatio).gravity('Center').crop(size.w, size.h));
                } else {
                    done(err, gmfile.gravity('Center').crop(size.w / resizeRatio, size.h / resizeRatio));
                }
            });
        }))
        .pipe(gulp.dest('tmp'));
});

gulp.task('set-dev', dev.task);
gulp.task('set-prod', prod.task);

gulp.task('default', sequence('set-dev', 'pug', 'build-css', 'connect', 'watch'));
gulp.task('build', sequence('set-prod', 'pug', /*'build-js',*/ ['copy', 'images'], 'image-size', 'build-css'));