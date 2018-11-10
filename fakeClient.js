const {setIsGql} = require('./scenario');

class FakeClient {
    constructor(returnValue, willThrow, isAuthenticated) {
        this._returnValue = returnValue;
        this._willThrow = willThrow;
        this._isAuthenticated = isAuthenticated
    }

    isAuthenticated() {
        return this._isAuthenticated;
    }

    async call(q, vars, forceUpdate, opts) {
        const retVal = {
            ...this._returnValue,
            _q: q,
            _vars: vars,
            _forceUpdate: forceUpdate,
            _opts: opts,
        };
        if (this._willThrow) {
            throw retVal;
        } else {
            return retVal;
        }
    }
}

module.exports = {
    FakeClient
};