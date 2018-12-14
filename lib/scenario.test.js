"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var scenario_1 = require("./scenario");
var apollo_client_ws_1 = require("./apollo_client_ws");
var server_1 = require("./test_server/server");
var node_fetch_1 = __importDefault(require("node-fetch"));
var TestScenario = /** @class */ (function (_super) {
    __extends(TestScenario, _super);
    function TestScenario() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TestScenario.prototype.refresh = function () {
        return __awaiter(this, void 0, void 0, function () {
            var booksReuslt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.remote.getBooks()];
                    case 1:
                        booksReuslt = _a.sent();
                        this.state.books = booksReuslt.data.books;
                        return [2 /*return*/];
                }
            });
        });
    };
    TestScenario.prototype.addBook = function (author, title) {
        return __awaiter(this, void 0, void 0, function () {
            var addResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.remote.addBook({ author: author, title: title })];
                    case 1:
                        addResult = _a.sent();
                        this.sendEvent('BOOK_ADDED', addResult.data.addBook);
                        return [2 /*return*/];
                }
            });
        });
    };
    TestScenario.prototype.startBookStream = function () {
        var _this = this;
        this.bookStreamSubscription = this.subscriptions.onNewBook({}, function (result) {
            _this.sendEvent('BOOK_ARRIVAL', result.data.bookAdded);
        });
    };
    TestScenario.prototype.stopBookStream = function () {
        if (this.bookStreamSubscription) {
            this.bookStreamSubscription.unsubscribe();
        }
        delete this.bookStreamSubscription;
    };
    TestScenario.prototype.pingServer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.remote.requestServer()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.status];
                }
            });
        });
    };
    TestScenario.prototype.login = function () {
        this.client.setAuthToken('loginToken');
    };
    TestScenario.state = { books: [] };
    TestScenario.events = ['BOOK_ARRIVAL', 'BOOK_ADDED'];
    TestScenario.bookFragment = scenario_1.gql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        fragment BookDetail on Book {\n            title, author\n        }\n    "], ["\n        fragment BookDetail on Book {\n            title, author\n        }\n    "])));
    TestScenario.getBooks = scenario_1.gql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n        query GetBooks {\n            books{\n                ...BookDetail\n            }\n        }\n        ", "\n    "], ["\n        query GetBooks {\n            books{\n                ...BookDetail\n            }\n        }\n        ", "\n    "])), TestScenario.bookFragment);
    TestScenario.addBook = scenario_1.gql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n        mutation AddBook($title: String, $author: String) {\n            addBook(title: $title, author: $author) {\n                ...BookDetail\n            }\n        }\n        ", "\n    "], ["\n        mutation AddBook($title: String, $author: String) {\n            addBook(title: $title, author: $author) {\n                ...BookDetail\n            }\n        }\n        ", "\n    "])), TestScenario.bookFragment);
    TestScenario.onNewBook = scenario_1.gql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n        subscription{\n            bookAdded{\n                ...BookDetail\n            }\n        }\n        ", "\n    "], ["\n        subscription{\n            bookAdded{\n                ...BookDetail\n            }\n        }\n        ", "\n    "])), TestScenario.bookFragment);
    TestScenario.requestServer = scenario_1.httpGet('default', 'http://127.0.0.1:4002/whatever_that_is');
    return TestScenario;
}(scenario_1.Scenario));
jest.setTimeout(30000);
beforeAll(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, server_1.start(4002)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
test('scenario integration test', function () { return __awaiter(_this, void 0, void 0, function () {
    var scenario, listenResult, arrivalResult, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                scenario_1.setDefaultClient(new apollo_client_ws_1.ApolloHttpWsClient({
                    uri: 'http://127.0.0.1:4002',
                    fetch: node_fetch_1.default,
                    wsUri: 'ws://127.0.0.1:4002/graphql',
                    wsImpl: WebSocket,
                    httpServers: {
                        'default': 'http://127.0.0.1:4002'
                    }
                }));
                scenario = new TestScenario();
                expect(function () { return scenario.startBookStream(); }).toThrow();
                scenario.login();
                scenario.startBookStream();
                // await new Promise(resolve => setTimeout(resolve, 100));
                expect(scenario.state.books).toEqual([]);
                return [4 /*yield*/, scenario.refresh()];
            case 1:
                _b.sent();
                expect(scenario.state.books.length).toEqual(2);
                listenResult = null;
                arrivalResult = null;
                scenario.notifyEventOnce(['BOOK_ADDED']).then(function (added) { return listenResult = added; });
                scenario.notifyEventOnce(['BOOK_ARRIVAL']).then(function (arrival) { return arrivalResult = arrival; });
                return [4 /*yield*/, scenario.addBook('me', 'whatever')];
            case 2:
                _b.sent();
                expect(listenResult.payload.author).toEqual('me');
                // await new Promise(resolve => setTimeout(resolve, 100));
                expect(arrivalResult.payload.author).toEqual('me');
                scenario.stopBookStream();
                _a = expect;
                return [4 /*yield*/, scenario.pingServer()];
            case 3:
                _a.apply(void 0, [_b.sent()]).toEqual(400);
                return [2 /*return*/];
        }
    });
}); });
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
//# sourceMappingURL=scenario.test.js.map