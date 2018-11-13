const fetch = require('node-fetch');
const ApolloFetchClient = require('./apollo_client');

test('creating client ok', () => {
    const client = new ApolloFetchClient({fetch, uri: 'http://127.0.0.1:6000/graphql'});
});

test('creating client with Websocket ok', () => {
    const client = new ApolloFetchClient({
        fetch: fetch,
        uri: 'http://127.0.0.1:6000/graphql',
        wsUri: 'ws://127.0.0.1:6000/graphql'
    });
});
