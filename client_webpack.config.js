const path = require('path');

module.exports = {
    entry: './lib/apollo_client.js',
    output: {
        filename: 'apollo_client.prod.js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: 'production'
};