import { ApolloClient } from 'apollo-client';
import { ApolloLink } from "apollo-link";
import { FetchType, Client } from "./client";
declare type TaggedGql = any;
export interface HttpClientOptions {
    uri: string;
    fetch?: FetchType;
    token?: string;
    debug?: boolean;
    wsUri?: string;
    wsImpl?: any;
    anonWs?: boolean;
    httpServers?: {
        [key: string]: string;
    };
}
export declare class ApolloHttpClient implements Client<TaggedGql> {
    private readonly fetch;
    private readonly uri;
    private readonly httpServers;
    protected client: ApolloClient<any>;
    protected debug: boolean;
    protected token: string | null;
    protected wsUri?: string;
    protected wsImpl?: any;
    protected wsEnabled: boolean;
    protected anonWs: boolean;
    constructor(options: HttpClientOptions);
    private makeApolloClient;
    private makeApolloLink;
    private makeApolloHttpLink;
    protected makeApolloWsLink(): ApolloLink | undefined;
    private makeApolloAuthLink;
    private makeApolloDebugLink;
    private makeApolloCache;
    readonly authenticated: boolean;
    setAuthToken(token: string | null): void;
    currentToken(): string | null;
    http(input?: any | string, init?: any): any;
    graphql(query: any, variables?: {
        [p: string]: any;
    }, options?: {
        [p: string]: any;
    }): any;
    private queryGql;
    private mutateGql;
    graphqlSubscribe(query: TaggedGql, variables?: {
        [key: string]: any;
    }, options?: any): import("apollo-client/util/Observable").Observable<any>;
    getGqlMainDef(schema: any): any;
    readonly isWsEnabled: boolean;
    getHostUrl(host: string): string;
}
export {};
//# sourceMappingURL=apollo_client.d.ts.map