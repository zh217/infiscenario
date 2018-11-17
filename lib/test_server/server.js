"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
var apollo_server_1 = require("apollo-server");
var pubsub = new apollo_server_1.PubSub();
// This is a (sample) collection of books we'll be able to query
// the GraphQL server for.  A more complete example might fetch
// from an existing data source like a REST API or database.
var books = [
    {
        title: 'Harry Potter and the Chamber of Secrets',
        author: 'J.K. Rowling',
    },
    {
        title: 'Jurassic Park',
        author: 'Michael Crichton',
    },
];
// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
var typeDefs = apollo_server_1.gql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    # Comments in GraphQL are defined with the hash (#) symbol.\n\n    # This \"Book\" type can be used in other type declarations.\n    type Book {\n        title: String\n        author: String\n    }\n\n    # The \"Query\" type is the root of all GraphQL queries.\n    # (A \"Mutation\" type will be covered later on.)\n    type Query {\n        books: [Book]\n    }\n\n    type Mutation {\n        addBook(title: String, author: String): Book\n    }\n\n    type Subscription {\n        bookAdded: Book\n    }\n"], ["\n    # Comments in GraphQL are defined with the hash (#) symbol.\n\n    # This \"Book\" type can be used in other type declarations.\n    type Book {\n        title: String\n        author: String\n    }\n\n    # The \"Query\" type is the root of all GraphQL queries.\n    # (A \"Mutation\" type will be covered later on.)\n    type Query {\n        books: [Book]\n    }\n\n    type Mutation {\n        addBook(title: String, author: String): Book\n    }\n\n    type Subscription {\n        bookAdded: Book\n    }\n"])));
var BOOK_ADDED = 'BOOK_ADDED';
// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
var resolvers = {
    Query: {
        books: function () { return books; },
    },
    Mutation: {
        addBook: function (obj, args, context, info) {
            pubsub.publish(BOOK_ADDED, { bookAdded: args });
            return args;
        }
    },
    Subscription: {
        bookAdded: {
            // Additional event labels can be passed to asyncIterator creation
            subscribe: function () { return pubsub.asyncIterator([BOOK_ADDED]); },
        },
    },
};
// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
var server = new apollo_server_1.ApolloServer({ typeDefs: typeDefs, resolvers: resolvers });
// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
function start(port) {
    return server.listen(port);
}
exports.start = start;
function stop(timeout) {
    if (timeout === void 0) { timeout = 0; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, timeout); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, server.stop()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.stop = stop;
if (require.main === module) {
    start(4000).then(function (_a) {
        var url = _a.url, subscriptionsUrl = _a.subscriptionsUrl;
        console.log("\uD83D\uDE80  Server ready at " + url + ", " + subscriptionsUrl);
    });
}
var templateObject_1;
//# sourceMappingURL=server.js.map