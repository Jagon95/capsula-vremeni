require('babel-polyfill');
const gulp = require('gulp');
const imageSize = require('image-size-export');
const parallel = require('concurrent-transform');
const os = require('os');
const path = require('path');
const moduleImporter = require('sass-module-importer');
const autoprefixer = require('autoprefixer');
const unCss = require('postcss-uncss');
const csso = require('postcss-csso');
const cssnano = require('cssnano');
const discardFont = require('postcss-discard-font-face');
const jpegRecompress = require('imagemin-jpeg-recompress');
const svgo = require('imagemin-svgo');
const mergeObj = require('object-assign-deep');
const loadPlugins = require('gulp-load-plugins')({
    rename: {
        'gulp-environments': 'env',
        'gulp-stream-to-promise': 'mkPromise'
    }
});
Object.assign(global, loadPlugins);

const dev = env.development;
const prod = env.production;


const commonSettings = require('./src/data/commonSettings');
const additionalSettings = (!!prod() ? require('./src/data/prodSettings') : require('./src/data/devSettings'));
const settings = mergeObj({}, commonSettings, additionalSettings);

gulp.task('connect', () => {
    connect.server({
        livereload: true,
        port: 1488,
        root: 'build/'
    });
});

gulp.task('reloader', () => {
    gulp.src('build')
        .pipe(connect.reload());
});

gulp.task('watch', (() => {
    gulp.watch(['build/js/**/*.js'], ['reloader']);
    gulp.watch(['src/scss/**/*.sass', 'src/scss/**/*.scss'], ['build-css']);
    gulp.watch(['src/pug/**/*.pug'], ['pug']);
}));

gulp.task('build-css', () => {
    gulp.src(['src/scss/main.sass'])
        .pipe(sass({
            outputStyle: !!prod() ? 'nested' : 'expanded',
            importer: moduleImporter()
        }).on('error', sass.logError))
        .pipe(cssReplaceUrl({           // todo: replace with postcss-url
            replace: ['./../themes/default/assets/fonts', 'fonts']
        }))
        .pipe(prod(purifycss(['build/index.html', 'build/js/script.js'])))
        .pipe(prod(postcss([
            csso({ restructure: false }),
            autoprefixer({browsers: ['> 0.3%']}),
            cssnano({
                preset: ['default', {
                    discardComments: {
                        removeAll: true,
                    },
                }]
            })
        ])))
        .pipe(rename('main.min.css'))
        .pipe(gulp.dest('build/css'))
        .pipe(dev(connect.reload()));


    if(prod()){
        const dataObj = Object.assign({}, require('./src/data/data.json'), {
            i18n: require('./src/data/i18n'),
            settings: settings
        });

        mkPromise(gulp.src('src/pug/firstLoaded.pug')
            .pipe(data(() => dataObj))
            .pipe(pug())
            .pipe(gulp.dest('tmp')))
        .then(gulp.src(['src/scss/main.sass'])
            .pipe(sass({
                importer: moduleImporter()
            }).on('error', sass.logError))
            .pipe(rmLines({
                filters: [/@import[^;]*;/i]
            }))
            .pipe(prod(postcss([
                discardFont(()=>false),
                unCss({
                    html: 'tmp/firstLoaded.html',
                }),
                csso({ restructure: false }),
                cssnano({
                    preset: ['default', {
                        discardComments: {
                            removeAll: true,
                        },
                    }]
                })
            ])))
            .pipe(rename('firstLoaded.css'))
            .pipe(gulp.dest('tmp')));
    }
});

gulp.task('pug', () => {

    const dataObj = Object.assign({}, require('./src/data/data.json'), {
        products: require('./src/data/product'),
        gallery: require('./src/data/photos'),
        i18n: require('./src/data/i18n'),
        cities: require('./src/data/cities'),
        settings: settings
    });

    gulp.src('src/pug/index.pug')
        .pipe(data(() => dataObj))
        .pipe(pug({
            pretty: !!dev()
        }))
        .pipe(prod(inlineSource({
            rootpath: './tmp'
        })))
        .pipe(gulp.dest('build'))
        .pipe(connect.reload());
});


gulp.task('images', () => {
    const exclude = (array) => {
        return array.map((i) => `!**/${i}`);
    };
    const imageminConfig = [
        jpegRecompress({
            loops:10,
            min: 40,
            max: 75,
            quality:'high',
            accurate: true,
            strip: true
        }),
        imagemin.optipng({optimizationLevel: 5}),
        // SVG
        svgo({
            plugins: [
                {removeViewBox: false}
            ]
        })
    ];

    const cores = os.cpus().length - 1;
    let streams = [];
    function getSizeSettings(maxSizes, multiples) {
        return multiples.reduce((res, multiple) => {
            return res.concat(Object.entries(maxSizes).map((breakpoint) => {
                return {
                    width: breakpoint[1] * multiple,
                    rename: {
                        suffix: `-${breakpoint[0]}@${multiple}x`
                    }
                }
            }));
        }, []);
    }

    const containerSizeSettings = getSizeSettings(settings.sizes.container, settings.sizes.multiplies);
    const screenSizeSenntigs = getSizeSettings(settings.sizes.screen, settings.sizes.multiplies);

    gulp.src(['main.{png,jpg}', 'parallax.{png,jpg}'], {cwd: './img/'})
        .pipe(changed('build/img'))
        .pipe(responsive({
            'main.*': containerSizeSettings,
            'parallax.*': screenSizeSenntigs
        }).on('error', (e) => {
            console.log(e.message);
        }))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('build/img'));

    let products = require('./src/data/product.json');
    let productsThumbnails = Object.values(products).reduce((r, a) => [...r, ...a.images], []);
    gulp.src(productsThumbnails, {cwd: './img/photos/'})
        .pipe(changed('build/img/thumbnails'))
        .pipe(parallel(imageResize({
            width: 300,
            height: 300,
            upscale: false,
            crop: false,
            gravity: 'North'
        }), cores))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('build/img/thumbnails'));

    let photos = require('./src/data/photos.json');
    let photosThumbnails = photos.reduce((r, photo) => [...r, photo.image], []);
    gulp.src(photosThumbnails, {cwd: './img/photos/'})
        .pipe(changed('build/img/thumbnails'))
        .pipe(parallel(imageResize({
            height: 350,
            upscale: false,
            crop: false
        }), cores))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('build/img/thumbnails'));

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

    const eventsImages = data.events.reduce((r, event) => [...r, event.image], []);
    streams.push(gulp.src([].concat(eventsImages, 'video_placeholder.jpg'), {
        cwd: './img/photos',
        base: '.'
    })
        .pipe(changed('./build/'))
        .pipe(parallel(imageResize({
            height: 800,
            upscale: false,
            crop: false,
        }), cores))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('build')));

    streams.push(gulp.src([
        'img/**/*.{jpg,jpeg,png}',
        ...exclude([].concat(clientsImages, clientsIcons, eventsImages)),
        '!img/favicon/*.*',
        '!img/parallax.jpg',
        '!img/main.png',
        '!img/photos/video_placeholder.jpg'
    ], {base: '.'})
        .pipe(changed('./build/'))
        .pipe(parallel(imageResize({
            width: 1920,
            height: 1080,
            upscale: false,
            crop: false
        }), cores))
        .pipe(parallel(imagemin(imageminConfig), cores))
        .pipe(gulp.dest('./build/')));

    gulp.src('img/favicon/*.*')
        .pipe(changed('./build/img/favicon'))
        .pipe(gulp.dest('./build/img/favicon'));


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
gulp.task('build', sequence('set-prod', ['copy', 'images'], 'build-css', 'pug'));