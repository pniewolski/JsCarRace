// webpack.config.js
var webpack = require('webpack');

module.exports = {
    entry: {
        entry: __dirname + '/src/js/main.js'
    },
    output: {
        filename: 'carsim.bundle.js'
    }
}