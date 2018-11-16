"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_client_1 = require("./apollo_client");
const apollo_link_ws_1 = require("apollo-link-ws");
class ApolloHttpWsClient extends apollo_client_1.ApolloHttpClient {
    makeApolloWsLink() {
        if (!this.wsUri || !this.wsImpl || (!this.anonWs && !this.authenticated)) {
            this.wsEnabled = false;
            return;
        }
        let wsEndpoint;
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
                reconnect: true
            },
            webSocketImpl: this.wsImpl
        });
    }
}
exports.ApolloHttpWsClient = ApolloHttpWsClient;
//# sourceMappingURL=apollo_client_ws.js.map