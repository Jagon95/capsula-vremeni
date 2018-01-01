const path = require('path');
const webpack = require('webpack');

const config = {
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
                use: 'raw-loader'
            }
        ],
        loaders: [
            {
                // test: /\.json$/,
                // loader: 'json-loader'
            }
        ]
    },
    resolve: {
        modules: [path.resolve(__dirname, "src"), "node_modules", path.resolve(__dirname, "tmp")],
        alias: {
            'waypoints': 'waypoints/lib/jquery.waypoints.js',
            // 'semantic-ui': 'semantic-ui/dist/semantic.js',
            'semantic': "semantic-ui/dist"
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
        // new webpack.optimize.UglifyJsPlugin({
        //     sourceMap: true,
        //     parallel: 4,
        // })
    ],
    // devtool: "source-map"
};

module.exports = config;