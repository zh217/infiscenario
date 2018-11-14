import {ApolloHttpClient} from './apollo_client'
import {start, stop} from "./test_server/server";
import fetch from 'node-fetch';
import gql from 'graphql-tag';

// jest.setTimeout(30000);

beforeAll(async () => {
    await start(4001)
});

// afterAll(async () => stop());


test('making client', async () => {
    const client = new ApolloHttpClient({uri: 'http://127.0.0.1:4001', fetch});
    const req = gql`
        query {
            books{
                title, author
            }
        }`;
    const result = await client.graphql(req);
    expect(result.data.books.length).toBeGreaterThan(1);
    const mut = gql`
        mutation($title: String, $author: String) {
            addBook(title: $title, author: $author) {
                title, author
            }
        }
    `;
    const bookToAdd = {title: 'aaa', author: 'bbb'};
    const mutRes = await client.graphql(mut, bookToAdd);
    expect(mutRes.data.addBook.author).toEqual(bookToAdd.author);
    expect(mutRes.data.addBook.title).toEqual(bookToAdd.title);
});


test('adding authentication', () => {
    const client = new ApolloHttpClient({uri: 'http://127.0.0.1:4000', fetch});
    expect(client.authenticated).toBeFalsy();
    client.setAuthToken('123');
    expect(client.authenticated).toBeTruthy();
    client.setAuthToken(null);
    expect(client.authenticated).toBeFalsy();
});