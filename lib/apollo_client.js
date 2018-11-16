"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_client_1 = require("apollo-client");
const apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
const apollo_link_http_1 = require("apollo-link-http");
const apollo_link_context_1 = require("apollo-link-context");
const apollo_link_error_1 = require("apollo-link-error");
const apollo_link_1 = require("apollo-link");
const apollo_utilities_1 = require("apollo-utilities");
class ApolloHttpClient {
    constructor({ uri, fetch, token, debug, wsUri, wsImpl, anonWs }) {
        this.wsEnabled = false;
        this.fetch = fetch || window.fetch;
        this.uri = uri;
        this.token = token || null;
        this.debug = !!debug;
        this.wsUri = wsUri;
        this.wsImpl = wsImpl;
        this.anonWs = !!anonWs;
        this.client = this.makeApolloClient();
    }
    makeApolloClient() {
        return new apollo_client_1.ApolloClient({
            link: this.makeApolloLink(),
            cache: this.makeApolloCache()
        });
    }
    makeApolloLink() {
        const debugLink = this.makeApolloDebugLink();
        const authLink = this.makeApolloAuthLink();
        const httpLink = this.makeApolloHttpLink();
        const wsLink = this.makeApolloWsLink();
        let networkLink;
        if (wsLink) {
            networkLink = apollo_link_1.split(({ query }) => {
                const { kind, operation } = apollo_utilities_1.getMainDefinition(query);
                return kind === 'OperationDefinition' && operation === 'subscription';
            }, wsLink, httpLink);
        }
        else {
            networkLink = httpLink;
        }
        const links = [networkLink];
        if (authLink) {
            links.unshift(authLink);
        }
        if (debugLink) {
            links.unshift(debugLink);
        }
        return apollo_link_1.ApolloLink.from(links);
    }
    makeApolloHttpLink() {
        return new apollo_link_http_1.HttpLink({
            uri: this.uri,
            fetch: this.fetch
        });
    }
    makeApolloWsLink() {
        return;
    }
    makeApolloAuthLink() {
        if (!this.token) {
            return;
        }
        return apollo_link_context_1.setContext((_, { headers }) => ({ headers: Object.assign({}, headers, { authorization: `Bearer ${this.token}` }) }));
    }
    makeApolloDebugLink() {
        if (!this.debug) {
            return;
        }
        return apollo_link_error_1.onError(({ graphQLErrors, networkError }) => {
            if (graphQLErrors)
                graphQLErrors.map(({ message, locations, path }) => console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`));
            if (networkError)
                console.error(`[Network error]: ${networkError}`);
        });
    }
    makeApolloCache() {
        return new apollo_cache_inmemory_1.InMemoryCache();
    }
    get authenticated() {
        return !!this.token;
    }
    setAuthToken(token) {
        this.token = token;
        this.client = this.makeApolloClient();
    }
    http(input, init) {
        return this.fetch(input, init);
    }
    graphql(query, variables, options) {
        const { operation } = apollo_utilities_1.getMainDefinition(query);
        switch (operation) {
            case 'mutation':
                return this.mutateGql(query, variables, options);
            case 'query':
                return this.queryGql(query, variables, options);
            default:
                throw Error(`No idea what to do with ${operation}`);
        }
    }
    async queryGql(query, variables, options) {
        variables = variables || {};
        options = options || {};
        return await this.client.query(Object.assign({}, options, { query, variables }));
    }
    async mutateGql(mutation, variables, options) {
        variables = variables || {};
        options = options || {};
        return await this.client.mutate(Object.assign({}, options, { mutation,
            variables }));
    }
    graphqlSubscribe(query, variables, options) {
        variables = variables || {};
        options = options || {};
        return this.client.subscribe(Object.assign({}, options, { query,
            variables }));
    }
    getGqlMainDef(schema) {
        return apollo_utilities_1.getMainDefinition(schema);
    }
    get isWsEnabled() {
        return this.wsEnabled;
    }
}
exports.ApolloHttpClient = ApolloHttpClient;
//# sourceMappingURL=apollo_client.js.map