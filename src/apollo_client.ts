import {ApolloClient} from 'apollo-client';
import {InMemoryCache} from "apollo-cache-inmemory";
import {HttpLink} from "apollo-link-http";
import {setContext} from "apollo-link-context";
import {onError} from "apollo-link-error";
import {ApolloLink, split} from "apollo-link";
import {getMainDefinition} from "apollo-utilities";

import {FetchType, Client} from "./client";

type TaggedGql = any;

export interface HttpClientOptions {
    uri: string
    fetch?: FetchType
    token?: string
    debug?: boolean
    wsUri?: string,
    wsImpl?: any,
    anonWs?: boolean
}

export class ApolloHttpClient implements Client<TaggedGql> {
    private fetch: FetchType;
    private readonly uri: string;
    private client: ApolloClient<any>;
    protected debug: boolean;
    protected token: string | null;
    protected wsUri?: string;
    protected wsImpl?: WebSocket;
    protected wsEnabled: boolean = false;
    protected anonWs: boolean;

    public constructor({uri, fetch, token, debug, wsUri, wsImpl, anonWs}: HttpClientOptions) {
        this.fetch = fetch || window.fetch;
        this.uri = uri;
        this.token = token || null;
        this.debug = !!debug;
        this.wsUri = wsUri;
        this.wsImpl = wsImpl;
        this.anonWs = !!anonWs;
        this.client = this.makeApolloClient();
    }

    private makeApolloClient() {
        return new ApolloClient({
            link: this.makeApolloLink(),
            cache: this.makeApolloCache()
        });
    }

    private makeApolloLink() {
        const debugLink = this.makeApolloDebugLink();
        const authLink = this.makeApolloAuthLink();
        const httpLink = this.makeApolloHttpLink();
        const wsLink = this.makeApolloWsLink();

        let networkLink;
        if (wsLink) {
            networkLink = split(
                ({query}) => {
                    const {kind, operation} = getMainDefinition(query) as any;
                    return kind === 'OperationDefinition' && operation === 'subscription';
                },
                wsLink,
                httpLink
            );
        } else {
            networkLink = httpLink;
        }

        const links: ApolloLink[] = [networkLink];

        if (authLink) {
            links.unshift(authLink);
        }
        if (debugLink) {
            links.unshift(debugLink);
        }

        return ApolloLink.from(links);
    }

    private makeApolloHttpLink() {
        return new HttpLink({
            uri: this.uri,
            fetch: this.fetch as any
        });
    }

    protected makeApolloWsLink(): ApolloLink | undefined {
        return
    }

    private makeApolloAuthLink() {
        if (!this.token) {
            return;
        }
        return setContext((_, {headers}) => ({headers: {...headers, authorization: `Bearer ${this.token}`}}));
    }

    private makeApolloDebugLink() {
        if (!this.debug) {
            return;
        }
        return onError(({graphQLErrors, networkError}) => {
            if (graphQLErrors)
                graphQLErrors.map(({message, locations, path}) =>
                    console.error(
                        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
                    )
                );
            if (networkError) console.error(`[Network error]: ${networkError}`);
        })
    }

    private makeApolloCache() {
        return new InMemoryCache();
    }

    public get authenticated() {
        return !!this.token;
    }

    public setAuthToken(token: string | null) {
        this.token = token;
        this.client = this.makeApolloClient();
    }


    http(input?: Request | string, init?: RequestInit) {
        return this.fetch(input, init);
    }

    public graphql(query: any, variables?: { [p: string]: any }, options?: { [p: string]: any }): any {
        const {operation} = getMainDefinition(query) as any;
        switch (operation) {
            case 'mutation':
                return this.mutateGql(query, variables, options);
            case 'query':
                return this.queryGql(query, variables, options);
            default:
                throw Error(`No idea what to do with ${operation}`);
        }
    }

    private async queryGql(query: TaggedGql, variables?: { [key: string]: any }, options?: any) {
        variables = variables || {};
        options = options || {};
        return await this.client.query({
            ...options,
            query, variables
        });
    }

    private async mutateGql(mutation: TaggedGql, variables?: { [key: string]: any }, options?: any) {
        variables = variables || {};
        options = options || {};
        return await this.client.mutate({
            ...options,
            mutation,
            variables
        });

    }

    public graphqlSubscribe(query: TaggedGql, variables?: { [key: string]: any }, options?: any) {
        variables = variables || {};
        options = options || {};
        return this.client.subscribe({
            ...options,
            query,
            variables
        });
    }

    public getGqlMainDef(schema: any) {
        return getMainDefinition(schema) as any;
    }

    public get isWsEnabled() {
        return this.wsEnabled;
    }

}