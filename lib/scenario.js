"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
const state_1 = require("./state");
class Scenario {
    constructor(client) {
        this.remote = {};
        this.subscriptions = {};
        this.eventCallbackMap = {};
        this.client = client || defaultClient;
        const classConstructor = this.constructor;
        const { state, manager } = state_1.makeStateProxy(lodash_clonedeep_1.default(classConstructor.state));
        this.stateManager = manager;
        this.state = state;
        if (typeof this.constructor.events === 'undefined') {
            this.events = new Set();
        }
        else {
            this.events = new Set(classConstructor.events);
        }
        this.makeQueryMethods();
    }
    watchState(callback, filters) {
        return this.stateManager.watch(callback, filters);
    }
    unwatchState(callback) {
        this.stateManager.unwatch(callback);
    }
    watchEvent(callback, filters) {
        if (!filters) {
            filters = [state_1.UNFILTERED];
        }
        for (const filter of filters) {
            this.checkEventIsValid(filter);
            if (typeof this.eventCallbackMap[filter] === 'undefined') {
                this.eventCallbackMap[filter] = new Set();
            }
            this.eventCallbackMap[filter].add(callback);
        }
        return callback;
    }
    unwatchEvent(callback) {
        for (const k in this.eventCallbackMap) {
            if (this.eventCallbackMap.hasOwnProperty(k)) {
                this.eventCallbackMap[k].delete(callback);
            }
        }
    }
    sendEvent(event, payload) {
        this.checkEventIsValid(event);
        const toCall = [...(this.eventCallbackMap[event] || []), ...(this.eventCallbackMap[state_1.UNFILTERED] || [])];
        if (!toCall.length) {
            return;
        }
        for (const f of toCall) {
            f(event, payload);
        }
    }
    notifyEventOnce(filters) {
        return new Promise((resolve, reject) => {
            const callback = (event, payload) => {
                resolve({ event, payload });
                this.unwatchEvent(callback);
            };
            this.watchEvent(callback, filters);
        });
    }
    checkEventIsValid(filter) {
        if (!filter || !this.events.size) {
            return;
        }
        if (!this.events.has(filter)) {
            throw Error(`Undeclared event: ${filter}. Valid values: ${[...this.events].join(', ')}`);
        }
    }
    makeQueryMethods() {
        const classConstructor = this.constructor;
        for (const k in classConstructor) {
            const staticValue = classConstructor[k];
            if (classConstructor.hasOwnProperty(k) && staticValue) {
                if (isGraphql(staticValue)) {
                    const gqlRequest = staticValue;
                    const mainDef = this.client.getGqlMainDef(gqlRequest);
                    if (this.client.getGqlMainDef(staticValue).kind === 'OperationDefinition') {
                        switch (mainDef.operation) {
                            case 'subscription':
                                this.subscriptions[k] = this.makeGraphqlSubscriptionRegistrationFunction(gqlRequest);
                                break;
                            default:
                                this.remote[k] = this.makeGraphqlRegistrationFunction(gqlRequest);
                        }
                    }
                }
                else if (isHttp(staticValue)) {
                    this.remote[k] = this.makeHttpRegistrationFunction(staticValue);
                }
            }
        }
    }
    makeGraphqlRegistrationFunction(query) {
        return (variables, options) => {
            return this.client.graphql(query, variables, options);
        };
    }
    makeGraphqlSubscriptionRegistrationFunction(query) {
        return (variables = {}, next, error, options) => {
            return this.client.graphqlSubscribe(query, variables, options).subscribe(next, error);
        };
    }
    makeHttpRegistrationFunction(schema) {
        const url = schema.url;
        const opts = Object.assign({}, schema.opts || {});
        const queryParams = opts.queryParams;
        delete opts.queryParams;
        return (params) => {
            params = params || {};
            const providedQueryParams = params.queryParams || {};
            delete params.queryParams;
            const combinedQueryParams = Object.assign({}, queryParams, providedQueryParams);
            const completedUrl = new URL(url);
            Object.keys(combinedQueryParams).forEach(key => url.searchParams.append(key, combinedQueryParams[key]));
            return this.client.http(completedUrl, Object.assign({}, opts, params));
        };
    }
}
Scenario.state = {};
Scenario.events = [];
exports.Scenario = Scenario;
let defaultClient = undefined;
function setDefaultClient(client) {
    defaultClient = client;
}
exports.setDefaultClient = setDefaultClient;
var graphql_tag_1 = require("graphql-tag");
exports.gql = graphql_tag_1.default;
function http(url, options) {
    return {
        type: 'http',
        url: url,
        opts: options
    };
}
exports.http = http;
function isHttp(schema) {
    return schema.type === 'http';
}
function isGraphql(schema) {
    return schema.kind === 'Document';
}
function httpGet(url, options) {
    return http(url, Object.assign({}, options || {}, { method: 'GET' }));
}
exports.httpGet = httpGet;
function httpPost(url, options) {
    return http(url, Object.assign({}, options || {}, { method: 'POST' }));
}
exports.httpPost = httpPost;
function httpPut(url, options) {
    return http(url, Object.assign({}, options || {}, { method: 'PUT' }));
}
exports.httpPut = httpPut;
function httpDelete(url, options) {
    return http(url, Object.assign({}, options || {}, { method: 'DELETE' }));
}
exports.httpDelete = httpDelete;
//# sourceMappingURL=scenario.js.map