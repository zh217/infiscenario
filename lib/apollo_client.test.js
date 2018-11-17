"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_client_1 = require("./apollo_client");
const server_1 = require("./test_server/server");
const node_fetch_1 = __importDefault(require("node-fetch"));
const graphql_tag_1 = __importDefault(require("graphql-tag"));
// jest.setTimeout(30000);
beforeAll(async () => {
    await server_1.start(4001);
});
// afterAll(async () => stop());
test('making client', async () => {
    const client = new apollo_client_1.ApolloHttpClient({ uri: 'http://127.0.0.1:4001', fetch: node_fetch_1.default });
    const req = graphql_tag_1.default `
        query {
            books{
                title, author
            }
        }`;
    const result = await client.graphql(req);
    expect(result.data.books.length).toBeGreaterThan(1);
    const mut = graphql_tag_1.default `
        mutation($title: String, $author: String) {
            addBook(title: $title, author: $author) {
                title, author
            }
        }
    `;
    const bookToAdd = { title: 'aaa', author: 'bbb' };
    const mutRes = await client.graphql(mut, bookToAdd);
    expect(mutRes.data.addBook.author).toEqual(bookToAdd.author);
    expect(mutRes.data.addBook.title).toEqual(bookToAdd.title);
});
test('adding authentication', () => {
    const client = new apollo_client_1.ApolloHttpClient({ uri: 'http://127.0.0.1:4000', fetch: node_fetch_1.default });
    expect(client.authenticated).toBeFalsy();
    client.setAuthToken('123');
    expect(client.authenticated).toBeTruthy();
    client.setAuthToken(null);
    expect(client.authenticated).toBeFalsy();
});
//# sourceMappingURL=apollo_client.test.js.map