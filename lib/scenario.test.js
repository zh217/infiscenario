"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const scenario_1 = require("./scenario");
const apollo_client_ws_1 = require("./apollo_client_ws");
const server_1 = require("./test_server/server");
const node_fetch_1 = __importDefault(require("node-fetch"));
class TestScenario extends scenario_1.Scenario {
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            const booksReuslt = yield this.remote.getBooks();
            this.state.books = booksReuslt.data.books;
        });
    }
    addBook(author, title) {
        return __awaiter(this, void 0, void 0, function* () {
            const addResult = yield this.remote.addBook({ author, title });
            this.sendEvent('BOOK_ADDED', addResult.data.addBook);
        });
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
    pingServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.remote.requestServer();
            return result.status;
        });
    }
    login() {
        this.client.setAuthToken('loginToken');
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
beforeAll(() => __awaiter(this, void 0, void 0, function* () {
    yield server_1.start(4002);
}));
test('scenario integration test', () => __awaiter(this, void 0, void 0, function* () {
    scenario_1.setDefaultClient(new apollo_client_ws_1.ApolloHttpWsClient({
        uri: 'http://127.0.0.1:4002',
        fetch: node_fetch_1.default,
        wsUri: 'ws://127.0.0.1:4002/graphql',
        wsImpl: WebSocket
    }));
    const scenario = new TestScenario();
    expect(() => scenario.startBookStream()).toThrow();
    scenario.login();
    scenario.startBookStream();
    // await new Promise(resolve => setTimeout(resolve, 100));
    expect(scenario.state.books).toEqual([]);
    yield scenario.refresh();
    expect(scenario.state.books.length).toEqual(2);
    let listenResult = null;
    let arrivalResult = null;
    scenario.notifyEventOnce(['BOOK_ADDED']).then(added => listenResult = added);
    scenario.notifyEventOnce(['BOOK_ARRIVAL']).then(arrival => arrivalResult = arrival);
    yield scenario.addBook('me', 'whatever');
    expect(listenResult.payload.author).toEqual('me');
    // await new Promise(resolve => setTimeout(resolve, 100));
    expect(arrivalResult.payload.author).toEqual('me');
    scenario.stopBookStream();
    expect(yield scenario.pingServer()).toEqual(400);
}));
//# sourceMappingURL=scenario.test.js.map