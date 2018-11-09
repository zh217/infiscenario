const {ApolloClient} = require('apollo-client');
const {createHttpLink} = require('apollo-link-http');
const {setContext} = require('apollo-link-context');
const {InMemoryCache} = require('apollo-cache-inmemory');
const gql = require("graphql-tag");
const _ = require('lodash');


class GraphQlClient {
    constructor(opts) {
        this._opts = opts || {};
        this._initClient({})
    }

    _initClient(opts) {
        this._opts = {...this._opts, ...opts};
        this.fetch = this._opts.fetch;
        const link = this._createLink(this._opts.uri, this.fetch);
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

    call(q, vars, forceUpdate, opts) {
        if (isMutation(q)) {
            return this._mutate(q, vars, forceUpdate, opts);
        } else {
            return this._query(q, vars, forceUpdate, opts);
        }
    }

    async _query(q, vars, forceUpdate, opts) {
        const result = await this._client.query({
            query: q,
            variables: vars,
            fetchPolicy: this._getFetchPolicy(forceUpdate),
            ...(opts || {})
        });
        return result;
    }

    async _mutate(mut, vars, forceUpdate, opts) {
        const result = await this._client.mutate({
            mutation: mut,
            variables: vars,
            fetchPolicy: this._getFetchPolicy(forceUpdate),
            ...(opts || {})
        });
        return result;
    }

    // register(path, q, hook) {
    //     const paths = path.split('.');
    //
    //     let level = this;
    //     let prevLevel;
    //     let curPath;
    //     for (const p of paths) {
    //         curPath = p;
    //         if (typeof level[curPath] === 'function') {
    //             throw Error(`A function already registered along path ${path}: ${level[curPath]}`);
    //         } else if (typeof level[curPath] === 'undefined') {
    //             level[curPath] = {}
    //         }
    //         prevLevel = level;
    //         level = level[curPath];
    //     }
    //     if (!_.isEmpty(level)) {
    //         throw Error(`Cannot register at existing path ${path}: ${level}`);
    //     }
    //     prevLevel[curPath] = this._makeGraphQlRegistrationFunction(q, isMutation(q), hook);
    // }
    //
    // _makeGraphQlRegistrationFunction(q, isMutation, hook) {
    //     if (isMutation) {
    //         return (vars, forceUpdate, opts) => {
    //             return this._mutate(q, vars, forceUpdate, opts, hook)
    //         }
    //     } else {
    //         return (vars, forceUpdate, opts) => {
    //             return this._query(q, vars, forceUpdate, opts, hook)
    //         }
    //     }
    // }
}

function isMutation(schema) {
    return schema['definitions'][0]['operation'] === 'mutation';
}

function isQuery(schema) {
    return schema['definitions'][0]['operation'] === 'query';
}

function isGql(schema) {
    try {
        return isQuery(schema) || isMutation(schema)
    } catch (e) {
        return false;
    }
}

// const client = new GraphQlClient({});
//
// client.register('login.webLogin', gql`
//     mutation login_webLogin ($username: String!, $password: String!) {
//         authenticateUserWeb(input: {
//             username: $username,
//             password: $password
//         }) {
//             jwtToken
//         }
//     }
// `, (result, client) => {
//     client.setAuthToken(result.data.authenticateUserWeb.jwtToken)
// });
//
// client.register('login.currentUser', gql`
//     query login_currentUser {
//         currentAccount {
//             id,
//             username,
//             display
//         }
//     }
// `);

module.exports = {
    gql,
    GraphQlClient,
    isMutation,
    isQuery,
    isGql
};
