const path = require('path');

module.exports = {
    entry: './src/apollo_client_ws.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        libraryTarget: "commonjs",
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
};
