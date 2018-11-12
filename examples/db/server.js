const querystring = require('querystring');
const {createServer} = require('http');
const express = require('express');
const {postgraphile, makePluginHook} = require('postgraphile');

const {
    default: PostGraphileSupporter,
    enhanceHttpServerWithSubscriptions
} = require("@graphile/plugin-supporter/dist/patched");

const config = require('./dev_config');


const pluginHook = makePluginHook([PostGraphileSupporter]);


const app = express();
const rawHTTPServer = createServer(app);

const postgraphileOptions = {
    ...config.postgraphile_opts,
    pluginHook
};


const postgraphileMiddleware = postgraphile(config.pg_uri, config.schemata, postgraphileOptions);

app.use(postgraphileMiddleware);

enhanceHttpServerWithSubscriptions(
    rawHTTPServer,
    postgraphileMiddleware,
    {
        websocketMiddlewares: [(req, res, next) => {
            const query = (req.url || req.originalUrl).split('?')[1];
            if (typeof query !== 'undefined') {
                const params = querystring.parse(query);
                const token = params['token'];
                if (token) {
                    req.headers['authorization'] = 'Bearer ' + token;
                }
            }
            next()
        }],
    }
);

rawHTTPServer.listen(config.server_port);
