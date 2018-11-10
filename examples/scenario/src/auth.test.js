const fetch = require('node-fetch');
const ApolloFetchClient = require('infiscenario/lib/apollo_client');
const {Login, Registration} = require('./auth');

function genRandStr(n) {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, n);
}

test('registration and login', async () => {
    const client = new ApolloFetchClient({uri: 'http://127.0.0.1:5000/graphql', fetch, debug: true});

    const testUser = genRandStr(10);
    const testPass = '';

    const registration = new Registration(client);
    registration.state.username = testUser;
    registration.state.password = testPass;
    await registration.submit();
    expect(registration.state.failed).toBeFalsy();

    const login = new Login(client);
    login.state.username = testUser;
    login.state.password = testPass;
    await login.submit();
    expect(login.client.isAuthenticated()).toBeTruthy();
});
