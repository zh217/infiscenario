const {ApolloClient} = require('apollo-client');
const {createHttpLink} = require('apollo-link-http');
const {setContext} = require('apollo-link-context');
const {InMemoryCache} = require('apollo-cache-inmemory');
const gql = require('graphql-tag');


class GraphQlClient {
    constructor(opts) {
        this._opts = opts || {};
        this._initClient({})
    }

    _initClient(opts) {
        this._opts = {...this._opts, ...opts};
        this.http = this._opts.fetch;
        const link = this._createLink(this._opts.uri, this._opts.fetch);
        this._client = new ApolloClient({
            link: this._opts.token ? this._createAuthLink(this._opts.token).concat(link) : link,
            cache: new InMemoryCache()
        });
    }

    setAuthToken(token) {
        this._initClient({token});
    }

    setUri(uri) {
        this._initClient({uri});
    }

    isAuthenticated() {
        return !!(this._opts && this._opts.token)
    }

    _createLink(uri, fetch) {
        return createHttpLink({
            uri: uri,
            fetch: fetch || window.fetch
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

    _getFetchPolicy(p) {
        let fetchPolicy = null;
        if (p === true) {
            fetchPolicy = 'network-only';
        } else if (typeof p === 'string') {
            fetchPolicy = p
        }
        return fetchPolicy
    }

    graphql(q, vars, forceUpdate, opts) {
        if (isMutation(q)) {
            return this._mutate(q, vars, forceUpdate, opts);
        } else {
            return this._query(q, vars, forceUpdate, opts);
        }
    }

    async _query(q, vars, forceUpdate, opts) {
        return await this._client.query({
            query: q,
            variables: vars,
            fetchPolicy: this._getFetchPolicy(forceUpdate),
            ...(opts || {})
        });
    }

    async _mutate(mut, vars, forceUpdate, opts) {
        return await this._client.mutate({
            mutation: mut,
            variables: vars,
            fetchPolicy: this._getFetchPolicy(forceUpdate),
            ...(opts || {})
        });
    }

    isGql(schema) {
        try {
            return isQuery(schema) || isMutation(schema)
        } catch (e) {
            return false;
        }
    }

}

function isMutation(schema) {
    return schema['definitions'][0]['operation'] === 'mutation';
}

function isQuery(schema) {
    return schema['definitions'][0]['operation'] === 'query';
}

module.exports = {
    gql,
    GraphQlClient,
    isMutation,
    isQuery,
    isGql
};
