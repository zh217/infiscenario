const path = require('path');

module.exports = {
    entry: './lib/scenario.js',
    output: {
        filename: 'scenario.prod.js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: 'production'
};