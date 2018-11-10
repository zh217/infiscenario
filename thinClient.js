class ThinClient {
    constructor(opts) {

    }

    setAuthToken(token) {

    }

    setUri(uri) {

    }

    isAuthenticated() {

    }

    fetch() {

    }

    call(q, vars, forceUpdate, opts) {
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
        return (typeof schema === 'string');
    }
}

function isMutation(schema) {
    return schema['definitions'][0]['operation'] === 'mutation';
}

function isQuery(schema) {
    return schema['definitions'][0]['operation'] === 'query';
}

setIsGql(isGql);

module.exports = {
    gql,
    GraphQlClient: ThinClient,
    isMutation,
    isQuery,
    isGql
};
