const config = require(process.env.CONFIG_FILE || './dev_config.json');

module.exports = {
    options: {
        connection: config.pg_uri,
        schema: ['infsc'],
        jwtSecret: "***_totally_rules!!!",
        defaultRole: "infsc_anon",
        jwtTokenIdentifier: "infsc.jwt_token",
        watch: false,
        port: config.server_port,
        cors: true,
        plugins: ['@graphile/plugin-supporter'],
        simpleSubscriptions: true,
        disableGraphiql: true
        // subscriptionAuthorizationFunction: 'infsc.validate_subscription'
    }
};
