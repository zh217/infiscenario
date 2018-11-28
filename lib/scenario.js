"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
var state_1 = require("./state");
var Scenario = /** @class */ (function () {
    function Scenario(client) {
        this.remote = {};
        this.subscriptions = {};
        this.eventCallbackMap = {};
        this.client = client || defaultClient;
        var classConstructor = this.constructor;
        var _a = state_1.makeStateProxy(lodash_clonedeep_1.default(classConstructor.state)), state = _a.state, manager = _a.manager;
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
    Scenario.prototype.setState = function (newState) {
        this.stateManager.setState(newState);
    };
    Scenario.prototype.watchState = function (callback, filters) {
        return this.stateManager.watch(callback, filters);
    };
    Scenario.prototype.unwatchState = function (callback) {
        this.stateManager.unwatch(callback);
    };
    Scenario.prototype.watchEvent = function (callback, filters) {
        var e_1, _a;
        if (!filters) {
            filters = [state_1.UNFILTERED];
        }
        try {
            for (var filters_1 = __values(filters), filters_1_1 = filters_1.next(); !filters_1_1.done; filters_1_1 = filters_1.next()) {
                var filter = filters_1_1.value;
                this.checkEventIsValid(filter);
                if (typeof this.eventCallbackMap[filter] === 'undefined') {
                    this.eventCallbackMap[filter] = new Set();
                }
                this.eventCallbackMap[filter].add(callback);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (filters_1_1 && !filters_1_1.done && (_a = filters_1.return)) _a.call(filters_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return callback;
    };
    Scenario.prototype.unwatchEvent = function (callback) {
        for (var k in this.eventCallbackMap) {
            if (this.eventCallbackMap.hasOwnProperty(k)) {
                this.eventCallbackMap[k].delete(callback);
            }
        }
    };
    Scenario.prototype.sendEvent = function (event, payload) {
        var e_2, _a;
        this.checkEventIsValid(event);
        var toCall = __spread((this.eventCallbackMap[event] || []), (this.eventCallbackMap[state_1.UNFILTERED] || []));
        if (!toCall.length) {
            return;
        }
        try {
            for (var toCall_1 = __values(toCall), toCall_1_1 = toCall_1.next(); !toCall_1_1.done; toCall_1_1 = toCall_1.next()) {
                var f = toCall_1_1.value;
                f(event, payload);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (toCall_1_1 && !toCall_1_1.done && (_a = toCall_1.return)) _a.call(toCall_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    Scenario.prototype.notifyEventOnce = function (filters) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var callback = function (event, payload) {
                resolve({ event: event, payload: payload });
                _this.unwatchEvent(callback);
            };
            _this.watchEvent(callback, filters);
        });
    };
    Scenario.prototype.checkEventIsValid = function (filter) {
        if (!filter || !this.events.size) {
            return;
        }
        if (!this.events.has(filter)) {
            throw Error("Undeclared event: " + filter + ". Valid values: " + __spread(this.events).join(', '));
        }
    };
    Scenario.prototype.makeQueryMethods = function () {
        var classConstructor = this.constructor;
        for (var k in classConstructor) {
            var staticValue = classConstructor[k];
            if (classConstructor.hasOwnProperty(k) && staticValue) {
                if (isGraphql(staticValue)) {
                    var gqlRequest = staticValue;
                    var mainDef = this.client.getGqlMainDef(gqlRequest);
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
    };
    Scenario.prototype.makeGraphqlRegistrationFunction = function (query) {
        var _this = this;
        return function (variables, options) {
            return _this.client.graphql(query, variables, options);
        };
    };
    Scenario.prototype.makeGraphqlSubscriptionRegistrationFunction = function (query) {
        var _this = this;
        return function (variables, next, error, complete, options) {
            if (variables === void 0) { variables = {}; }
            if (!error) {
                error = function (err) {
                    console.error('Subscription has encountered an error', err, query);
                };
            }
            return _this.client.graphqlSubscribe(query, variables, options).subscribe(next, error, complete);
        };
    };
    Scenario.prototype.makeHttpRegistrationFunction = function (schema) {
        var _this = this;
        var host = schema.host;
        var path = schema.path;
        var opts = __assign({}, schema.opts || {});
        var queryParams = opts.queryParams;
        delete opts.queryParams;
        return function (params) {
            params = params || {};
            var providedQueryParams = params.queryParams || {};
            delete params.queryParams;
            var combinedQueryParams = __assign({}, queryParams, providedQueryParams);
            var completedUrl = _this.client.getHostUrl(host) + '/' + path;
            var hasParam = completedUrl.indexOf('?') !== -1;
            Object.keys(combinedQueryParams).forEach(function (key) {
                if (hasParam) {
                    hasParam = true;
                    completedUrl += '?';
                }
                else {
                    completedUrl += '&';
                }
                completedUrl += encodeURIComponent(key) + "=" + encodeURIComponent(combinedQueryParams[key]);
            });
            return _this.client.http(completedUrl, __assign({}, opts, params));
        };
    };
    Scenario.state = {};
    Scenario.events = [];
    return Scenario;
}());
exports.Scenario = Scenario;
var defaultClient = undefined;
function setDefaultClient(client) {
    defaultClient = client;
}
exports.setDefaultClient = setDefaultClient;
var graphql_tag_1 = require("graphql-tag");
exports.gql = graphql_tag_1.default;
function http(host, path, options) {
    return {
        host: host, path: path,
        type: 'http',
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
function httpGet(host, path, options) {
    return http(host, path, __assign({}, options || {}, { method: 'GET' }));
}
exports.httpGet = httpGet;
function httpPost(host, path, options) {
    return http(host, path, __assign({}, options || {}, { method: 'POST' }));
}
exports.httpPost = httpPost;
function httpPut(host, path, options) {
    return http(host, path, __assign({}, options || {}, { method: 'PUT' }));
}
exports.httpPut = httpPut;
function httpDelete(host, path, options) {
    return http(host, path, __assign({}, options || {}, { method: 'DELETE' }));
}
exports.httpDelete = httpDelete;
//# sourceMappingURL=scenario.js.map