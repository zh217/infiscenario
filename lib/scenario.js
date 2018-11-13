const isEqual = require('lodash.isequal');
const cloneDeep = require('lodash.clonedeep');

function _runSoon(func) {
    return setTimeout(func, 0);
}

function _cancelRunSoon(handle) {
    clearTimeout(handle);
}

function _addFilteredCallback(callback, filters, target) {
    for (const filter of filters) {
        if (typeof target[filter] === 'undefined') {
            target[filter] = new Set();
        }
        target[filter].add(callback);
    }
}

function _removeCallback(callback, target) {
    for (const k in target) {
        if (target.hasOwnProperty(k)) {
            target[k].delete(callback);
        }
    }
}

class ScenarioStateProxifier {
    constructor(proxied, restrictions) {
        this._restrictions = restrictions;
        this._proxied = proxied;
        this._callback_map = {};
        this._pendingChanges = new Set();
        this._pendingDeletions = new Set();
        this._pendingFlush = null;
        this._old = null;
    }

    _queueUpdate() {
        if (this._pendingFlush) {
            _cancelRunSoon(this._pendingFlush);
        }
        this._pendingFlush = _runSoon(() => this._flushChanges())
    }

    _flushChanges() {
        if (!this._pendingChanges.size && !this._pendingDeletions.size) {
            this._old = null;
            this._pendingFlush = null;
            return
        }

        const toCall = new Set(this._callback_map[null]);
        for (const k of [...this._pendingChanges, ...this._pendingDeletions]) {
            for (const f of this._callback_map[k] || []) {
                toCall.add(f);
            }
        }

        this._pendingChanges.clear();
        this._pendingDeletions.clear();
        this._pendingFlush = null;

        for (const f of toCall) {
            f(this._proxied, this._old);
        }

        this._old = null;
    }

    watch(filters, callback) {
        if (typeof callback === 'undefined') {
            callback = filters;
            filters = null;
        }
        if (!Array.isArray(filters)) {
            filters = [filters];
        }
        _addFilteredCallback(callback, filters, this._callback_map);
        return callback;
    }

    unwatch(callback) {
        _removeCallback(callback, this._callback_map);
    };

    set(target, prop, value) {
        this._checkRestriction(prop);
        if (this._old === null) {
            this._old = cloneDeep(target);
        }
        this._pendingDeletions.delete(prop);
        if (!isEqual(value, target[value])) {
            this._pendingChanges.add(prop);
        }
        this._queueUpdate();
        target[prop] = value;
        return true
    }

    deleteProperty(target, prop) {
        this._checkRestriction(prop, true);
        if (this._old === null) {
            this._old = cloneDeep(target);
        }
        this._pendingChanges.delete(prop);
        if (target.hasOwnProperty(prop)) {
            this._pendingDeletions.add(prop);
        }
        delete target[prop];
        return true
    }

    _checkRestriction(prop, deletion) {
        if (this._restrictions === null) {
            return;
        }
        if (this._restrictions.has(prop)) {
            if (deletion) {
                throw Error(`Cannot delete restricted state ${prop}`);
            }
        } else {
            throw Error(`Cannot operate unknown state ${prop}`);
        }
    }
}

class Scenario {
    constructor(client) {
        client = client || defaultClient;
        if (!client) {
            throw Error('client must be provided when initializing Scenario, or run setDefaultClient beforehand');
        }
        const stateRestrictions = this._getStateRestrictions();
        const proxied = cloneDeep(this.constructor.initState);
        this._stateProxifier = new ScenarioStateProxifier(proxied, stateRestrictions);
        this.state = new Proxy(proxied, this._stateProxifier);
        this._evtCallbackMap = {};
        this.client = client;
        if (typeof this.constructor.events === 'undefined') {
            this.events = null;
        } else {
            this.events = new Set(this.constructor.events);
        }
        this._makeQueryMethods();
    }

    _getStateRestrictions() {
        const hasRestrictionSet = this.constructor.hasOwnProperty('restrictState');
        if (hasRestrictionSet) {
            if (this.constructor.restrictState) {
                return new Set(Object.keys(this.constructor.initState));
            } else {
                return null
            }
        } else {
            if (this.constructor.initState) {
                return new Set(Object.keys(this.constructor.initState));
            } else {
                return null
            }
        }
    }

    setClient(client) {
        this.client = client;
    }

    watchState(filters, callback) {
        return this._stateProxifier.watch(filters, callback);
    }

    unwatchState(callback) {
        this._stateProxifier.unwatch(callback);
    }

    watchEvent(filters, callback) {
        if (typeof callback === 'undefined') {
            callback = filters;
            filters = null;
        }
        if (!Array.isArray(filters)) {
            filters = [filters];
        }
        for (const filter of filters) {
            this._checkEventIsValid(filter);
        }
        _addFilteredCallback(callback, filters, this._evtCallbackMap);
        return callback;
    }

    unwatchEvent(callback) {
        _removeCallback(callback, this._evtCallbackMap)
    }

    getEventPromise(filters) {
        return new Promise((resolve, reject) => {
            const callback = (payload, event) => {
                resolve({payload, event});
                this.unwatchEvent(callback);
            };
            this.watchEvent(filters || null, callback);
        });
    }

    sendEvent(evt, payload) {
        this._checkEventIsValid(evt);
        const toCall = [...(this._evtCallbackMap[evt] || []), ...(this._evtCallbackMap[null] || [])];
        if (!toCall.length) {
            return;
        }
        for (const f of toCall) {
            f(payload, evt);
        }
    }

    _checkEventIsValid(evt) {
        if (evt !== null && this.events !== null && !this.events.has(evt)) {
            throw Error(`Undeclared event: ${evt}. Valid values: ${[...this.events].join(', ')}`);
        }
    }

    _makeGraphQlRegistrationFunction(q) {
        q = this.client.makeGqlQuery(q.query);
        return (vars, opts) => {
            return this.client.http(q, vars, opts)
        }
    }

    _makeHttpRegistrationFunction(q) {
        const url = q.url;
        const opts = {...q.opts || {}};
        const queryParams = opts.queryParams;
        delete opts.queryParams;
        return (params) => {
            params = params || {};
            const providedQueryParams = params.queryParams || {};
            delete params.queryParams;
            const combinedQueryParams = {...queryParams, ...providedQueryParams};
            const completedUrl = new URL(url);
            Object.keys(combinedQueryParams).forEach(key => url.searchParams.append(key, combinedQueryParams[key]));
            return this.client.fetch(completedUrl, {...opts, ...params})
        }
    }

    _makeQueryMethods() {
        for (const k in this.constructor) {
            if (this.constructor.hasOwnProperty(k)) {
                if (this.constructor[k].type === 'scenario-gql') {
                    this[k] = this._makeGraphQlRegistrationFunction(this.constructor[k]);
                } else if (this.constructor[k].type === 'scenario-http') {
                    this[k] = this._makeHttpRegistrationFunction(this.constructor[k]);
                }
            }
        }
    }
}

Scenario.initState = {};

function gql(query) {
    return {
        type: 'scenario-gql',
        query: query
    }
}

function http(url, opts) {
    return {
        type: 'scenario-http',
        url: url,
        opts: opts
    }
}

function httpGet(url, opts) {
    return http(url, {...opts || {}, method: 'GET'})
}

function httpPost(url, opts) {
    return http(url, {...opts || {}, method: 'POST'})
}

function httpPut(url, opts) {
    return http(url, {...opts || {}, method: 'PUT'})
}

function httpDelete(url, opts) {
    return http(url, {...opts || {}, method: 'DELETE'})
}

let defaultClient = undefined;

function setDefaultClient(client) {
    defaultClient = client;
}

module.exports = {
    Scenario, gql, http, httpGet, httpPost, httpPut, httpDelete, setDefaultClient
};
