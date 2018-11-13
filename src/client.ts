export interface Client<Q> {
    authenticated: boolean;

    setAuthToken(token: string | null): void;

    graphql(query: Q, variables?: { [key: string]: any }, options?: { [key: string]: any }): any;

    http(): any;

    makeQuery(rawQuery: string): Q;
}