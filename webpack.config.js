const path = require('path');
const webpack = require('webpack');
const mergeObj = require('object-assign-deep');
const isProd = process.env.NODE_ENV === 'production ';
console.log((isProd ? "production" : "development") + " mode");
const commonSettings = require('./src/data/commonSettings');
const additionalSettings = (isProd ? require('./src/data/prodSettings') : require('./src/data/devSettings'));

const stringifyRecursive = (obj) => {
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') obj[key] = stringifyRecursive(obj[key]);
        else obj[key] = JSON.stringify(obj[key]);
    });
    return obj;
};

const settings = stringifyRecursive(mergeObj({}, commonSettings, additionalSettings));

let config = {
    entry: {
        main: "./src/js/main.js",
    },
    output: {
        path: path.resolve(__dirname, 'build/js'),
        filename: 'script.js',
        sourceMapFilename: 'script.map'
    },
    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.js$/,
                exclude: [/node_modules/],
                loader: 'eslint-loader'
            },
            {
                test: /\.js$/,
                exclude: [/node_modules/],
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ['env', 'stage-2']
                        }
                    },
                    {
                        loader: "imports-loader"
                    }
                ]
            },
            {
                test: /\.json/,
                use:  "json-loader"
            },
            {
                test: /product\.json$/,
                use: "./src/js/productTranslator"
            }
        ]
    },
    resolve: {
        modules: [path.resolve(__dirname, "src"), "node_modules", path.resolve(__dirname, "tmp"), path.resolve(__dirname, "data")],
        alias: {
            'waypoints': 'waypoints/lib/jquery.waypoints.js',
            'semantic': "semantic-ui/dist",
            'bootstrap': "bootstrap/js/dist"
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            "window.jQuery": "jquery",
            Util: 'exports-loader?Util!bootstrap/util',
            PhotoSwipe: 'photoswipe',
            PhotoSwipeUI_Default: 'photoswipe/src/js/ui/photoswipe-ui-default.js',
        }),
        new webpack.DefinePlugin({
            settings
        })
    ],
    devtool: isProd && "hidden-source-map"
};

if (isProd) {
    config.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            parallel: 4,
        })
    )
}

module.exports = config;