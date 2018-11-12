const express = require('express');
const {postgraphile, makePluginHook} = require('postgraphile');
const jwt = require('jsonwebtoken');
const querystring = require('querystring');

const {
    default: PostGraphileSupporter,
} = require("@graphile/plugin-supporter/dist/patched");

const config = require('./dev_config');

function verifyJwtToken(jwtToken,
                        jwtSecret,
                        jwtVerifyOptions) {
    // Try to run `jwt.verify`. If it fails, capture the error and re-throw it
    // as a 403 error because the token is not trustworthy.
    try {
        // If a JWT token was defined, but a secret was not provided to the server
        // throw a 403 error.
        if (typeof jwtSecret !== 'string') throw new Error('Not allowed to provide a JWT token.');

        jwtClaims = jwt.verify(jwtToken, jwtSecret, {
            ...jwtVerifyOptions
        });

        const roleClaim = getPath(jwtClaims, jwtRole);

        // If there is a `role` property in the claims, use that instead of our
        // default role.
        if (typeof roleClaim !== 'undefined') {
            if (typeof roleClaim !== 'string')
                throw new Error(
                    `JWT \`role\` claim must be a string. Instead found '${typeof jwtClaims['role']}'.`,
                );

            role = roleClaim;
        }
    } catch (error) {
        // In case this error is thrown in an HTTP context, we want to add status code
        // Note. jwt.verify will add a name key to its errors. (https://github.com/auth0/node-jsonwebtoken#errors--codes)
        error.statusCode =
            'name' in error && error.name === 'TokenExpiredError'
                ? // The correct status code for an expired ( but otherwise acceptable token is 401 )
                401
                : // All other authentication errors should get a 403 status code.
                403;

        throw error;
    }
}


const pluginHook = makePluginHook([PostGraphileSupporter]);


const app = express();


app.use(postgraphile(config.pg_uri, config.schemata, {
    ...config.postgraphile_opts,
    pluginHook,
    websocketMiddlewares: [(req, res, next) => {
        const query = (req.url || req.originalUrl).split('?')[1];
        if (typeof query !== 'undefined') {
            const params = querystring.parse(query);
            const token = params['auth'];
            if (token) {
                // console.log('we have token', token);
                // try {
                //     console.log('claims', jwt.verify(token, config.postgraphile_opts.jwtSecret));
                // } catch (e) {
                //     console.error(e);
                // }
                req.headers['authorization'] = 'Bearer ' + token;
            }
        }
        next()
    }],
    pgSettings: async req => {
        console.log('setting', req);
        return {
            'role': 'infsc_anon'
            // 'user.id': `${req.session.passport.user}`,
            // 'http.headers.x-something': `${req.headers['x-something']}`,
            // 'http.method': `${req.method}`,
            // 'http.url': `${req.url}`,
            //...
        }
    },
}));

app.listen(config.server_port);