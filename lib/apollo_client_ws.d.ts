import { ApolloHttpClient } from './apollo_client';
import { WebSocketLink } from "apollo-link-ws";
export declare class ApolloHttpWsClient extends ApolloHttpClient {
    protected makeApolloWsLink(): WebSocketLink | undefined;
}
//# sourceMappingURL=apollo_client_ws.d.ts.map