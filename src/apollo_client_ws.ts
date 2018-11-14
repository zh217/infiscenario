import {ApolloHttpClient} from './apollo_client';
import {WebSocketLink} from "apollo-link-ws";

export class ApolloHttpWsClient extends ApolloHttpClient {
    protected makeApolloWsLink() {
        if (!this.wsUri || !this.wsImpl) {
            this.wsEnabled = false;
            return;
        }
        let wsEndpoint;
        if (this.token) {
            wsEndpoint = this.wsUri + '?token=' + this.token
        } else {
            wsEndpoint = this.wsUri
        }
        this.wsEnabled = true;
        return new WebSocketLink({
            uri: wsEndpoint,
            options: {
                reconnect: true
            },
            webSocketImpl: this.wsImpl
        });
    }
}