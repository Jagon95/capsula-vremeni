const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const config = {
    entry: {
        main: "./src/js/main.js"
    },
    output: {
        path: path.resolve(__dirname, 'build/js'),
        filename: 'script.js',
        sourceMapFilename: 'script.map'
    },
    module: {
        rules: [
            {
                test: /\.js/,
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
            }
        ]
    },
    resolve: {
        alias: {
            'waypoints': 'waypoints/lib/jquery.waypoints.js',
            'semantic-ui': 'semantic-ui/dist/semantic.js'
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            "window.jQuery": "jquery",
            PhotoSwipe: 'photoswipe',
            PhotoSwipeUI_Default: 'photoswipe/src/js/ui/photoswipe-ui-default.js'
        }),
        new UglifyJsPlugin({
            sourceMap: true,
            parallel: true
        })
    ]
};

module.exports = config;