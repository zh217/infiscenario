const path = require('path');

module.exports = {
    entry: './lib/index.js',
    output: {
        libraryTarget: 'commonjs',
        path: path.resolve(__dirname, 'dist'),
        filename: 'scenario.dist.js'
    }
};