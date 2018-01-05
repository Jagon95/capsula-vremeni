const path = require('path');
const webpack = require('webpack');

const isProd = process.env.NODE_ENV === 'production ';

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
                test: /main.js/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ['env', 'stage-3']
                        }
                    },
                    {
                        loader: "imports-loader"
                    }
                ]
            },
            {
                test: /\.json/,
                use: 'json-loader'
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
            'settings': (isProd ? 'data/prodSettings' : 'data/devSettings')
        })
    ],
    devtool: isProd && "hidden-source-map"
};

if(isProd) {
    config.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            parallel: 4,
        })
    )
}

module.exports = config;