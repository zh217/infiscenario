export type FetchType = Function;

export interface Client<Q> {
    authenticated: boolean;

    setAuthToken(token: string | null): void;

    graphql(query: Q, variables?: { [key: string]: any }, options?: { [key: string]: any }): any;

    graphqlSubscribe(query: Q, variables?: { [key: string]: any }, options?: any): any;

    http(input?: Request | string | URL, init?: RequestInit): Promise<Response>;

    getGqlMainDef(schema: any): any;
}