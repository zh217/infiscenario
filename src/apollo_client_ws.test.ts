import {ApolloHttpWsClient} from './apollo_client_ws'
import {start, stop} from "./test_server/server";
import fetch from 'node-fetch';
import gql from 'graphql-tag';

jest.setTimeout(30000);

beforeAll(async () => {
    await start(4000);
});

// afterAll(async () => {
//     await stop();
// });

test('making client', async () => {
    const clientNoWs = new ApolloHttpWsClient({uri: 'http://127.0.0.1:4000', fetch});
    expect(clientNoWs.isWsEnabled).toBeFalsy();
    const clientWithWs = new ApolloHttpWsClient({
        uri: 'http://127.0.0.1:4000',
        fetch,
        wsUri: 'ws://127.0.0.1:4000/graphql',
        wsImpl: WebSocket
    });

    expect(clientWithWs.isWsEnabled).toBeFalsy();

    const subs = gql`
        subscription{
            bookAdded{
                title
                author
            }
        }
    `;

    const wrongSubs = gql`
        subscription {
            whatever
        }
    `;

    const mut = gql`
        mutation($title: String, $author: String) {
            addBook(title: $title, author: $author) {
                title, author
            }
        }
    `;

    expect(() => clientWithWs.graphqlSubscribe(subs).subscribe((x: any) => {
        calledData = x.data.bookAdded;
    })).toThrow();

    clientWithWs.setAuthToken('some token');
    expect(clientWithWs.isWsEnabled).toBeTruthy();

    let calledData = null;
    const subResult = clientWithWs.graphqlSubscribe(subs).subscribe((x: any) => {
        calledData = x.data.bookAdded;
    });
    await clientWithWs.graphql(mut, {author: 'a', title: '1'});
    await clientWithWs.graphql(mut, {author: 'b', title: '2'});
    await clientWithWs.graphql(mut, {author: 'c', title: '3'});
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(calledData).toBeTruthy();

    // IMPORTANT: must subscribe!!!
    subResult.unsubscribe();
});
