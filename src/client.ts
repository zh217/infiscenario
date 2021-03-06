export type FetchType = Function;

export interface Client<Q> {
    authenticated: boolean;

    currentToken(): string | null;

    setAuthToken(token: string | null): void;

    graphql(query: Q, variables?: { [key: string]: any }, options?: { [key: string]: any }): any;

    graphqlSubscribe(query: Q, variables?: { [key: string]: any }, options?: any): any;

    http(input?: any | string | URL, init?: any): Promise<any>;

    getGqlMainDef(schema: any): any;

    getHostUrl(host: string): string;
}