"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const scenario_1 = require("./scenario");
const apollo_client_ws_1 = require("./apollo_client_ws");
const server_1 = require("./test_server/server");
const node_fetch_1 = __importDefault(require("node-fetch"));
class TestScenario extends scenario_1.Scenario {
    async refresh() {
        const booksReuslt = await this.remote.getBooks();
        this.state.books = booksReuslt.data.books;
    }
    async addBook(author, title) {
        const addResult = await this.remote.addBook({ author, title });
        this.sendEvent('BOOK_ADDED', addResult.data.addBook);
    }
    startBookStream() {
        this.bookStreamSubscription = this.subscriptions.onNewBook({}, (result) => {
            this.sendEvent('BOOK_ARRIVAL', result.data.bookAdded);
        });
    }
    stopBookStream() {
        if (this.bookStreamSubscription) {
            this.bookStreamSubscription.unsubscribe();
        }
        delete this.bookStreamSubscription;
    }
    async pingServer() {
        const result = await this.remote.requestServer();
        return result.status;
    }
}
TestScenario.state = { books: [] };
TestScenario.events = ['BOOK_ARRIVAL', 'BOOK_ADDED'];
TestScenario.bookFragment = scenario_1.gql `
        fragment BookDetail on Book {
            title, author
        }
    `;
TestScenario.getBooks = scenario_1.gql `
        query GetBooks {
            books{
                ...BookDetail
            }
        }
        ${TestScenario.bookFragment}
    `;
TestScenario.addBook = scenario_1.gql `
        mutation AddBook($title: String, $author: String) {
            addBook(title: $title, author: $author) {
                ...BookDetail
            }
        }
        ${TestScenario.bookFragment}
    `;
TestScenario.onNewBook = scenario_1.gql `
        subscription{
            bookAdded{
                ...BookDetail
            }
        }
        ${TestScenario.bookFragment}
    `;
TestScenario.requestServer = scenario_1.httpGet('http://127.0.0.1:4002/whatever_that_is');
jest.setTimeout(30000);
beforeAll(async () => {
    await server_1.start(4002);
});
test('scenario integration test', async () => {
    scenario_1.setDefaultClient(new apollo_client_ws_1.ApolloHttpWsClient({
        uri: 'http://127.0.0.1:4002',
        fetch: node_fetch_1.default,
        wsUri: 'ws://127.0.0.1:4002/graphql',
        wsImpl: WebSocket
    }));
    const scenario = new TestScenario();
    scenario.startBookStream();
    // await new Promise(resolve => setTimeout(resolve, 100));
    expect(scenario.state.books).toEqual([]);
    await scenario.refresh();
    expect(scenario.state.books.length).toEqual(2);
    let listenResult = null;
    let arrivalResult = null;
    scenario.notifyEventOnce(['BOOK_ADDED']).then(added => listenResult = added);
    scenario.notifyEventOnce(['BOOK_ARRIVAL']).then(arrival => arrivalResult = arrival);
    await scenario.addBook('me', 'whatever');
    expect(listenResult.payload.author).toEqual('me');
    // await new Promise(resolve => setTimeout(resolve, 100));
    expect(arrivalResult.payload.author).toEqual('me');
    scenario.stopBookStream();
    expect(await scenario.pingServer()).toEqual(400);
});
//# sourceMappingURL=scenario.test.js.map