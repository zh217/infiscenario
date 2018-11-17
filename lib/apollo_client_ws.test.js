"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_client_ws_1 = require("./apollo_client_ws");
const server_1 = require("./test_server/server");
const node_fetch_1 = __importDefault(require("node-fetch"));
const graphql_tag_1 = __importDefault(require("graphql-tag"));
jest.setTimeout(30000);
beforeAll(async () => {
    await server_1.start(4000);
});
// afterAll(async () => {
//     await stop();
// });
test('making client', async () => {
    const clientNoWs = new apollo_client_ws_1.ApolloHttpWsClient({ uri: 'http://127.0.0.1:4000', fetch: node_fetch_1.default });
    expect(clientNoWs.isWsEnabled).toBeFalsy();
    const clientWithWs = new apollo_client_ws_1.ApolloHttpWsClient({
        uri: 'http://127.0.0.1:4000',
        fetch: node_fetch_1.default,
        wsUri: 'ws://127.0.0.1:4000/graphql',
        wsImpl: WebSocket
    });
    expect(clientWithWs.isWsEnabled).toBeFalsy();
    const subs = graphql_tag_1.default `
        subscription{
            bookAdded{
                title
                author
            }
        }
    `;
    const mut = graphql_tag_1.default `
        mutation($title: String, $author: String) {
            addBook(title: $title, author: $author) {
                title, author
            }
        }
    `;
    expect(() => clientWithWs.graphqlSubscribe(subs).subscribe((x) => {
        calledData = x.data.bookAdded;
    })).toThrow();
    clientWithWs.setAuthToken('some token');
    expect(clientWithWs.isWsEnabled).toBeTruthy();
    let calledData = null;
    const subResult = clientWithWs.graphqlSubscribe(subs).subscribe((x) => {
        calledData = x.data.bookAdded;
    });
    await clientWithWs.graphql(mut, { author: 'a', title: '1' });
    await clientWithWs.graphql(mut, { author: 'b', title: '2' });
    await clientWithWs.graphql(mut, { author: 'c', title: '3' });
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(calledData).toBeTruthy();
    // IMPORTANT: must subscribe!!!
    subResult.unsubscribe();
});
//# sourceMappingURL=apollo_client_ws.test.js.map