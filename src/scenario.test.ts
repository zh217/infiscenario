import {Scenario, gql, http, httpDelete, httpGet, httpPost, httpPut, setDefaultClient} from './scenario';
import {ApolloHttpWsClient} from './apollo_client_ws';
import {start, stop} from './test_server/server';
import fetch from "node-fetch";

class TestScenario extends Scenario {
    static state = {books: []};
    static events = ['BOOK_ARRIVAL', 'BOOK_ADDED'];

    static bookFragment = gql`
        fragment BookDetail on Book {
            title, author
        }
    `;

    static getBooks = gql`
        query GetBooks {
            books{
                ...BookDetail
            }
        }
        ${TestScenario.bookFragment}
    `;

    static addBook = gql`
        mutation AddBook($title: String, $author: String) {
            addBook(title: $title, author: $author) {
                ...BookDetail
            }
        }
        ${TestScenario.bookFragment}
    `;

    static onNewBook = gql`
        subscription{
            bookAdded{
                ...BookDetail
            }
        }
        ${TestScenario.bookFragment}
    `;

    static requestServer = httpGet('default', 'http://127.0.0.1:4002/whatever_that_is');

    bookStreamSubscription: any;

    async refresh() {
        const booksReuslt = await this.remote.getBooks();
        this.state.books = booksReuslt.data.books;
    }

    async addBook(author: string, title: string) {
        const addResult = await this.remote.addBook({author, title});
        this.sendEvent('BOOK_ADDED', addResult.data.addBook);
    }

    startBookStream() {
        this.bookStreamSubscription = this.subscriptions.onNewBook({}, (result: any) => {
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

    login() {
        this.client.setAuthToken('loginToken');
    }
}

jest.setTimeout(30000);

beforeAll(async () => {
    await start(4002);
});

test('scenario integration test', async () => {
    setDefaultClient(new ApolloHttpWsClient({
        uri: 'http://127.0.0.1:4002',
        fetch,
        wsUri: 'ws://127.0.0.1:4002/graphql',
        wsImpl: WebSocket,
        httpServers: {
            'default': 'http://127.0.0.1:4002'
        }
    }));

    const scenario = new TestScenario();
    expect(() => scenario.startBookStream()).toThrow();
    scenario.login();
    scenario.startBookStream();
    // await new Promise(resolve => setTimeout(resolve, 100));
    expect(scenario.state.books).toEqual([]);
    await scenario.refresh();
    expect(scenario.state.books.length).toEqual(2);
    let listenResult: any = null;
    let arrivalResult: any = null;
    scenario.notifyEventOnce(['BOOK_ADDED']).then(added => listenResult = added);
    scenario.notifyEventOnce(['BOOK_ARRIVAL']).then(arrival => arrivalResult = arrival);
    await scenario.addBook('me', 'whatever');
    expect(listenResult!.payload.author).toEqual('me');
    // await new Promise(resolve => setTimeout(resolve, 100));
    expect(arrivalResult!.payload.author).toEqual('me');
    scenario.stopBookStream();
    expect(await scenario.pingServer()).toEqual(400);
});
