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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_client_1 = require("apollo-client");
var apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
var apollo_link_http_1 = require("apollo-link-http");
var apollo_link_context_1 = require("apollo-link-context");
var apollo_link_error_1 = require("apollo-link-error");
var apollo_link_1 = require("apollo-link");
var apollo_utilities_1 = require("apollo-utilities");
var ApolloHttpClient = /** @class */ (function () {
    function ApolloHttpClient(options) {
        this.wsEnabled = false;
        this.fetch = options.fetch || window.fetch;
        this.uri = options.uri;
        this.token = options.token || null;
        this.debug = !!options.debug;
        this.wsUri = options.wsUri;
        this.wsImpl = options.wsImpl;
        this.anonWs = !!options.anonWs;
        this.client = this.makeApolloClient();
        this.httpServers = options.httpServers || {};
    }
    ApolloHttpClient.prototype.makeApolloClient = function () {
        return new apollo_client_1.ApolloClient({
            link: this.makeApolloLink(),
            cache: this.makeApolloCache()
        });
    };
    ApolloHttpClient.prototype.makeApolloLink = function () {
        var debugLink = this.makeApolloDebugLink();
        var authLink = this.makeApolloAuthLink();
        var httpLink = this.makeApolloHttpLink();
        var wsLink = this.makeApolloWsLink();
        var networkLink;
        if (wsLink) {
            networkLink = apollo_link_1.split(function (_a) {
                var query = _a.query;
                var _b = apollo_utilities_1.getMainDefinition(query), kind = _b.kind, operation = _b.operation;
                return kind === 'OperationDefinition' && operation === 'subscription';
            }, wsLink, httpLink);
        }
        else {
            networkLink = httpLink;
        }
        var links = [networkLink];
        if (authLink) {
            links.unshift(authLink);
        }
        if (debugLink) {
            links.unshift(debugLink);
        }
        return apollo_link_1.ApolloLink.from(links);
    };
    ApolloHttpClient.prototype.makeApolloHttpLink = function () {
        return new apollo_link_http_1.HttpLink({
            uri: this.uri,
            fetch: this.fetch
        });
    };
    ApolloHttpClient.prototype.makeApolloWsLink = function () {
        return;
    };
    ApolloHttpClient.prototype.makeApolloAuthLink = function () {
        var _this = this;
        if (!this.token) {
            return;
        }
        return apollo_link_context_1.setContext(function (_, _a) {
            var headers = _a.headers;
            return ({ headers: __assign({}, headers, { authorization: "Bearer " + _this.token }) });
        });
    };
    ApolloHttpClient.prototype.makeApolloDebugLink = function () {
        if (!this.debug) {
            return;
        }
        return apollo_link_error_1.onError(function (_a) {
            var graphQLErrors = _a.graphQLErrors, networkError = _a.networkError;
            if (graphQLErrors)
                graphQLErrors.map(function (err) {
                    return console.error("[GraphQL error]: " + JSON.stringify(err, null, 2));
                });
            if (networkError)
                console.error("[Network error]: " + networkError);
        });
    };
    ApolloHttpClient.prototype.makeApolloCache = function () {
        return new apollo_cache_inmemory_1.InMemoryCache();
    };
    Object.defineProperty(ApolloHttpClient.prototype, "authenticated", {
        get: function () {
            return !!this.token;
        },
        enumerable: true,
        configurable: true
    });
    ApolloHttpClient.prototype.setAuthToken = function (token) {
        this.token = token;
        this.client = this.makeApolloClient();
    };
    ApolloHttpClient.prototype.currentToken = function () {
        return this.token;
    };
    ApolloHttpClient.prototype.http = function (input, init) {
        var fetch = this.fetch;
        return fetch(input, init);
    };
    ApolloHttpClient.prototype.graphql = function (query, variables, options) {
        var operation = apollo_utilities_1.getMainDefinition(query).operation;
        switch (operation) {
            case 'mutation':
                return this.mutateGql(query, variables, options);
            case 'query':
                return this.queryGql(query, variables, options);
            default:
                throw Error("No idea what to do with " + operation);
        }
    };
    ApolloHttpClient.prototype.queryGql = function (query, variables, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        variables = variables || {};
                        options = options || {};
                        return [4 /*yield*/, this.client.query(__assign({}, options, { query: query, variables: variables }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ApolloHttpClient.prototype.mutateGql = function (mutation, variables, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        variables = variables || {};
                        options = options || {};
                        return [4 /*yield*/, this.client.mutate(__assign({}, options, { mutation: mutation,
                                variables: variables }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ApolloHttpClient.prototype.graphqlSubscribe = function (query, variables, options) {
        if (!this.isWsEnabled) {
            throw Error('WebSocket is not enabled for this client, so you cannot subscribe');
        }
        variables = variables || {};
        options = options || {};
        return this.client.subscribe(__assign({}, options, { query: query,
            variables: variables }));
    };
    ApolloHttpClient.prototype.getGqlMainDef = function (schema) {
        return apollo_utilities_1.getMainDefinition(schema);
    };
    Object.defineProperty(ApolloHttpClient.prototype, "isWsEnabled", {
        get: function () {
            return this.wsEnabled;
        },
        enumerable: true,
        configurable: true
    });
    ApolloHttpClient.prototype.getHostUrl = function (host) {
        return this.httpServers[host] || host;
    };
    return ApolloHttpClient;
}());
exports.ApolloHttpClient = ApolloHttpClient;
//# sourceMappingURL=apollo_client.js.map