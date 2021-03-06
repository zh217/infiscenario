import { Client } from './client';
import { State, StateCallback } from './state';
interface EventCallback {
    (event: string, payload: any): void;
}
declare type PluginMethod = Function;
export declare abstract class Scenario {
    static state: State;
    static events: string[];
    readonly state: State;
    readonly events: Set<string>;
    protected client: Client<any>;
    protected remote: {
        [key: string]: PluginMethod;
    };
    protected subscriptions: {
        [key: string]: PluginMethod;
    };
    private readonly stateManager;
    private readonly eventCallbackMap;
    constructor(client?: Client<any>);
    setState(newState: State): void;
    watchState(callback: StateCallback, filters?: string[]): StateCallback;
    unwatchState(callback: StateCallback): void;
    watchEvent(callback: EventCallback, filters?: string[]): EventCallback;
    unwatchEvent(callback: EventCallback): void;
    protected sendEvent(event: string, payload?: any): void;
    notifyEventOnce(filters?: string[]): Promise<{}>;
    private checkEventIsValid;
    private makeQueryMethods;
    private makeGraphqlRegistrationFunction;
    private makeGraphqlSubscriptionRegistrationFunction;
    private makeHttpRegistrationFunction;
}
export declare function setDefaultClient(client: Client<any> | undefined): void;
export { default as gql } from 'graphql-tag';
export declare function http(host: string, path: string, options: any): {
    host: string;
    path: string;
    type: string;
    opts: any;
};
export declare function httpGet(host: string, path: string, options?: any): {
    host: string;
    path: string;
    type: string;
    opts: any;
};
export declare function httpPost(host: string, path: string, options?: any): {
    host: string;
    path: string;
    type: string;
    opts: any;
};
export declare function httpPut(host: string, path: string, options?: any): {
    host: string;
    path: string;
    type: string;
    opts: any;
};
export declare function httpDelete(host: string, path: string, options?: any): {
    host: string;
    path: string;
    type: string;
    opts: any;
};
//# sourceMappingURL=scenario.d.ts.map