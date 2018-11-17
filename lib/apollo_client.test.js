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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_client_1 = require("./apollo_client");
var server_1 = require("./test_server/server");
var node_fetch_1 = __importDefault(require("node-fetch"));
var graphql_tag_1 = __importDefault(require("graphql-tag"));
// jest.setTimeout(30000);
beforeAll(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, server_1.start(4001)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// afterAll(async () => stop());
test('making client', function () { return __awaiter(_this, void 0, void 0, function () {
    var client, req, result, mut, bookToAdd, mutRes;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                client = new apollo_client_1.ApolloHttpClient({ uri: 'http://127.0.0.1:4001', fetch: node_fetch_1.default });
                req = graphql_tag_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        query {\n            books{\n                title, author\n            }\n        }"], ["\n        query {\n            books{\n                title, author\n            }\n        }"])));
                return [4 /*yield*/, client.graphql(req)];
            case 1:
                result = _a.sent();
                expect(result.data.books.length).toBeGreaterThan(1);
                mut = graphql_tag_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n        mutation($title: String, $author: String) {\n            addBook(title: $title, author: $author) {\n                title, author\n            }\n        }\n    "], ["\n        mutation($title: String, $author: String) {\n            addBook(title: $title, author: $author) {\n                title, author\n            }\n        }\n    "])));
                bookToAdd = { title: 'aaa', author: 'bbb' };
                return [4 /*yield*/, client.graphql(mut, bookToAdd)];
            case 2:
                mutRes = _a.sent();
                expect(mutRes.data.addBook.author).toEqual(bookToAdd.author);
                expect(mutRes.data.addBook.title).toEqual(bookToAdd.title);
                return [2 /*return*/];
        }
    });
}); });
test('adding authentication', function () {
    var client = new apollo_client_1.ApolloHttpClient({ uri: 'http://127.0.0.1:4000', fetch: node_fetch_1.default });
    expect(client.authenticated).toBeFalsy();
    client.setAuthToken('123');
    expect(client.authenticated).toBeTruthy();
    client.setAuthToken(null);
    expect(client.authenticated).toBeFalsy();
});
var templateObject_1, templateObject_2;
//# sourceMappingURL=apollo_client.test.js.map