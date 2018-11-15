import cloneDeep from 'lodash.clonedeep';

import {Client} from './client';
import {makeStateProxy, ManagedState, State, StateCallback, UNFILTERED} from './state';
import {getMainDefinition} from "apollo-utilities";

interface EventCallback {
    (event: string, payload: any): void
}

type PluginMethod = Function;

export abstract class Scenario {
    static state: State = {};
    static events: string[] = [];

    public readonly state: State;
    public readonly events: Set<string>;

    protected client: Client<any>;
    protected remote: { [key: string]: PluginMethod } = {};
    protected subscriptions: { [key: string]: PluginMethod } = {};

    private readonly stateManager: ManagedState;
    private readonly eventCallbackMap: { [key: string]: Set<EventCallback> } = {};

    public constructor(client?: Client<any>) {
        this.client = client || defaultClient!;

        const classConstructor = this.constructor as typeof Scenario;
        const {state, manager} = makeStateProxy(cloneDeep(classConstructor.state));
        this.stateManager = manager;
        this.state = state;
        if (typeof (this.constructor as typeof Scenario).events === 'undefined') {
            this.events = new Set();
        } else {
            this.events = new Set(classConstructor.events);
        }
        this.makeQueryMethods();
    }

    public watchState(callback: StateCallback, filters?: string[]) {
        return this.stateManager.watch(callback, filters);
    }

    public unwatchState(callback: StateCallback) {
        this.stateManager.unwatch(callback);
    }

    public watchEvent(callback: EventCallback, filters?: string[]) {
        if (!filters) {
            filters = [UNFILTERED];
        }

        for (const filter of filters) {
            this.checkEventIsValid(filter);
            if (typeof this.eventCallbackMap[filter] === 'undefined') {
                this.eventCallbackMap[filter] = new Set();
            }
            this.eventCallbackMap[filter].add(callback);
        }

        return callback;
    }

    public unwatchEvent(callback: EventCallback) {
        for (const k in this.eventCallbackMap) {
            if (this.eventCallbackMap.hasOwnProperty(k)) {
                this.eventCallbackMap[k].delete(callback);
            }
        }
    }

    protected sendEvent(event: string, payload?: any) {
        this.checkEventIsValid(event);
        const toCall = [...(this.eventCallbackMap[event] || []), ...(this.eventCallbackMap[UNFILTERED] || [])];
        if (!toCall.length) {
            return;
        }
        for (const f of toCall) {
            f(event, payload);
        }
    }

    public notifyEventOnce(filters?: string[]) {
        return new Promise((resolve, reject) => {
            const callback = (event: string, payload: any) => {
                resolve({event, payload});
                this.unwatchEvent(callback);
            };
            this.watchEvent(callback, filters);
        });
    }

    private checkEventIsValid(filter: string) {
        if (!filter || !this.events.size) {
            return;
        }
        if (!this.events.has(filter)) {
            throw Error(`Undeclared event: ${filter}. Valid values: ${[...this.events].join(', ')}`);
        }
    }

    private makeQueryMethods() {
        const classConstructor = this.constructor as { [key: string]: any };
        for (const k in classConstructor) {
            const staticValue = classConstructor[k];
            if (classConstructor.hasOwnProperty(k) && staticValue) {
                if (isGraphql(staticValue)) {
                    const gqlRequest = staticValue;
                    const mainDef = this.client.getGqlMainDef(gqlRequest);
                    if (this.client.getGqlMainDef(staticValue).kind === 'OperationDefinition') {
                        switch (mainDef.operation) {
                            case 'subscription':
                                this.subscriptions[k] = this.makeGraphqlSubscriptionRegistrationFunction(gqlRequest);
                                break;
                            default:
                                this.remote[k] = this.makeGraphqlRegistrationFunction(gqlRequest);
                        }
                    }
                } else if (isHttp(staticValue)) {
                    this.remote[k] = this.makeHttpRegistrationFunction(staticValue);
                }
            }
        }
    }

    private makeGraphqlRegistrationFunction(query: any) {
        return (variables?: any, options?: { [key: string]: any }) => {
            return this.client.graphql(query, variables, options)
        }
    }

    private makeGraphqlSubscriptionRegistrationFunction(query: any) {
        return (variables: any = {}, next: Function, error: Function, options?: any) => {
            return this.client.graphqlSubscribe(query, variables, options).subscribe(next, error);
        }
    }

    private makeHttpRegistrationFunction(schema: any) {
        const url = schema.url;
        const opts = {...schema.opts || {}};
        const queryParams = opts.queryParams;
        delete opts.queryParams;
        return (params: any) => {
            params = params || {};
            const providedQueryParams = params.queryParams || {};
            delete params.queryParams;
            const combinedQueryParams = {...queryParams, ...providedQueryParams};
            const completedUrl = new URL(url);
            Object.keys(combinedQueryParams).forEach(key => url.searchParams.append(key, combinedQueryParams[key]));
            return this.client.http(completedUrl, {...opts, ...params})
        }
    }

}


let defaultClient: Client<any> | undefined = undefined;

export function setDefaultClient(client: Client<any> | undefined) {
    defaultClient = client;
}

export {default as gql} from 'graphql-tag';

export function http(url: string, options: any) {
    return {
        type: 'http',
        url: url,
        opts: options
    };
}

function isHttp(schema: any) {
    return schema.type === 'http';
}

function isGraphql(schema: any) {
    return schema.kind === 'Document'
}

export function httpGet(url: string, options?: any) {
    return http(url, {...options || {}, method: 'GET'});
}

export function httpPost(url: string, options?: any) {
    return http(url, {...options || {}, method: 'POST'});
}

export function httpPut(url: string, options?: any) {
    return http(url, {...options || {}, method: 'PUT'});
}

export function httpDelete(url: string, options?: any) {
    return http(url, {...options || {}, method: 'DELETE'});
}