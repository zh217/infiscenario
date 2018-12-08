"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_client_1 = require("./apollo_client");
var apollo_link_ws_1 = require("apollo-link-ws");
var ApolloHttpWsClient = /** @class */ (function (_super) {
    __extends(ApolloHttpWsClient, _super);
    function ApolloHttpWsClient() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ApolloHttpWsClient.prototype.makeApolloWsLink = function () {
        if (!this.wsUri || !this.wsImpl || (!this.anonWs && !this.authenticated)) {
            this.wsEnabled = false;
            return;
        }
        var wsEndpoint;
        if (this.token) {
            wsEndpoint = this.wsUri + '?token=' + this.token;
        }
        else {
            wsEndpoint = this.wsUri;
        }
        this.wsEnabled = true;
        return new apollo_link_ws_1.WebSocketLink({
            uri: wsEndpoint,
            options: {
                lazy: true,
                reconnect: true
            },
            webSocketImpl: this.wsImpl
        });
    };
    return ApolloHttpWsClient;
}(apollo_client_1.ApolloHttpClient));
exports.ApolloHttpWsClient = ApolloHttpWsClient;
//# sourceMappingURL=apollo_client_ws.js.map