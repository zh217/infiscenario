const fetch = require('node-fetch');
const ApolloFetchClient = require('./apollo_client');
const {Scenario, gql, http, httpGet, httpPost, setDefaultClient} = require('./scenario');

class TestScenario extends Scenario {
}

TestScenario.testGql = gql`
    query Whatever {
        dontReallyCare
    }
`;

TestScenario.testGqlMutation = gql`
    mutation MyGod {
        thisIsCool
    }
`;

TestScenario.testHttp = http('http://whatever.com');
TestScenario.testHttpGet = httpGet('http://dontknow.com');
TestScenario.testHttpPost = httpPost('http://dontknow.com');

test('set default client', () => {
    expect(() => new TestScenario()).toThrow();
    const client = new ApolloFetchClient({uri: 'http://127.0.0.1', fetch});
    setDefaultClient(client);
    const s = new TestScenario();
    expect(typeof s.testGql).toEqual('function');
    expect(typeof s.testGqlMutation).toEqual('function');
    expect(typeof s.testHttp).toEqual('function');
    expect(typeof s.testHttpGet).toEqual('function');
    expect(typeof s.testHttpPost).toEqual('function');
});
