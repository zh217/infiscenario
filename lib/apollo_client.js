const {split, ApolloLink} = require('apollo-link');
const {WebSocketLink} = require('apollo-link-ws');
const {ApolloClient} = require('apollo-client');
const {createHttpLink} = require('apollo-link-http');
const {setContext} = require('apollo-link-context');
const {InMemoryCache} = require('apollo-cache-inmemory');
const {getMainDefinition} = require('apollo-utilities');
const gql = require('graphql-tag');
const {onError} = require('apollo-link-error');


class ApolloFetchClient {
    constructor(opts) {
        this._opts = opts || {};
        this._initClient({})
    }

    _initClient(opts) {
        this._opts = {...this._opts, ...opts};
        this.http = this._opts.fetch;
        let link = this._createLink(this._opts.uri, this._opts.fetch, this._opts.wsUri, this._opts.wsImpl);
        if (this._opts.token) {
            link = this._createAuthLink(this._opts.token).concat(link);
        }
        if (this._opts.debug) {
            link = ApolloLink.from([onError(({graphQLErrors, networkError}) => {
                if (graphQLErrors)
                    graphQLErrors.map(({message, locations, path}) =>
                        console.error(
                            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
                        )
                    );
                if (networkError) console.error(`[Network error]: ${networkError}`);
            }), link]);
        }
        this._client = new ApolloClient({
            link: link,
            cache: new InMemoryCache()
        });
    }

    setAuthToken(token) {
        this._initClient({token});
    }

    isAuthenticated() {
        return !!(this._opts && this._opts.token)
    }

    _createLink(uri, fetch, wsUri, wsImpl) {
        const httpLink = this._createHttpLink(uri, fetch);
        if (!wsUri) {
            return httpLink;
        }
        const wsLink = this._createWsLink(wsUri, wsImpl);
        return split(
            ({query}) => {
                const {kind, operation} = getMainDefinition(query);
                return kind === 'OperationDefinition' && operation === 'subscription';
            },
            wsLink,
            httpLink
        )
    }

    _createHttpLink(uri, fetch) {
        return createHttpLink({
            uri: uri,
            fetch: fetch || window.fetch
        });
    }

    _createWsLink(wsUri, wsImpl) {
        return new WebSocketLink({
            uri: wsUri,
            options: {
                reconnect: true
            },
            webSocketImpl: wsImpl
        });
    }

    _createAuthLink(token) {
        return setContext((_, {headers}) => {
            return {
                headers: {
                    ...headers,
                    authorization: 'Bearer ' + token
                }
            }
        });
    }

    graphql(q, vars, opts) {
        const {kind, operation} = getMainDefinition(q);

        switch (operation) {
            case 'mutation':
                return this._mutate(q, vars, opts);
            case 'query':
                return this._query(q, vars, opts);
            case 'subscription':
                return this._subscribe(q, vars, opts);
            default:
                throw Error(`No idea what to do with ${kind} ${operation}`);
        }
    }

    async _query(q, vars, opts) {
        return await this._client.query({
            query: q,
            variables: vars,
            ...(opts || {})
        });
    }

    async _mutate(mut, vars, opts) {
        return await this._client.mutate({
            mutation: mut,
            variables: vars,
            ...(opts || {})
        });
    }

    _subscribe(subs, vars, opts) {
        return this._client.subscribe({
            query: subs,
            variables: vars,
            ...opts
        })
    }

    makeGqlQuery(rawQuery) {
        return gql(rawQuery);
    }
}

module.exports = ApolloFetchClient;
