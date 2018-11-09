const fetch = require('node-fetch');

const {gql, isMutation, GraphQlClient} = require('./graphQlClient');

test('singleton client', () => {
    const client = new GraphQlClient({fetch});
    expect(client).toBeTruthy()
});

test('mutation detection', () => {
    const q = gql`
        {
            authenticateUserWeb(input: {
                username: "admin",
                password: "infipipe_rules!"
            }) {
                jwtToken
            }
        }
    `;
    const m = gql`
        mutation GetLoginToken {
            authenticateUserWeb(input: {
                username: "admin",
                password: "infipipe_rules!"
            }) {
                jwtToken
            }
        }
    `;
    expect(isMutation(q)).toBe(false);
    expect(isMutation(m)).toBe(true);
});

test('plain request', async () => {
    const cl = new GraphQlClient({fetch});
    const rest = await cl.fetch('http://baidu.com', {});
    expect(rest.ok).toBeTruthy();
});

// test('client registration', async () => {
//     let err = null;
//     try {
//         await client.login.currentUser();
//     } catch (e) {
//         err = e
//     }
//     expect(err).toBeTruthy();
//
//     const badResult = await client.login.webLogin({username: 'admin', password: 'infipipe_rules!!'});
//     expect(badResult.data.authenticateUserWeb.jwtToken).toBe(null);
//     expect(client.isAuthenticated()).toBe(false);
//
//     const result = await client.login.webLogin({username: 'admin', password: 'infipipe_rules!'});
//     expect(result.data.authenticateUserWeb.jwtToken).toBeTruthy();
//     expect(client.isAuthenticated()).toBe(true);
//
//     const goodUser = await client.login.currentUser();
//     expect(goodUser.data.currentAccount.username).toBeTruthy()
// });