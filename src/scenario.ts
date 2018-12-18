import cloneDeep from 'lodash.clonedeep';

import {Client} from './client';
import {makeStateProxy, ManagedState, State, StateCallback, UNFILTERED} from './state';

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

    public setState(newState: State) {
        this.stateManager.setState(newState);
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
        return (variables?: any, options?: { [key: string]: any } | boolean) => {
            let opts;
            if (options === true) {
                opts = {fetchPolicy: 'cache-first'}
            } else if (options === false) {
                opts = {fetchPolicy: 'network-only'}
            } else {
                opts = options
            }
            return this.client.graphql(query, variables, opts)
        }
    }

    private makeGraphqlSubscriptionRegistrationFunction(query: any) {
        return (variables: any = {}, next: Function, error?: Function, complete?: Function, options?: any) => {
            if (!error) {
                error = (err: any) => {
                    console.error('Subscription has encountered an error', err, query)
                }
            }
            return this.client.graphqlSubscribe(query, variables, options).subscribe(next, error, complete);
        }
    }

    private makeHttpRegistrationFunction(schema: any) {
        const host = schema.host;
        const path = schema.path;
        const opts = {...schema.opts || {}};
        const queryParams = opts.queryParams;
        delete opts.queryParams;
        return (params: any) => {
            params = params || {};
            const providedQueryParams = params.queryParams || {};
            const providedUrlParams = params.urlParams || {};
            delete params.queryParams;
            delete params.urlParams;
            const combinedQueryParams = {...queryParams, ...providedQueryParams};
            const hostUrl = this.client.getHostUrl(host);
            const hasSlash = hostUrl[hostUrl.length - 1] === '/' || path[0] === '/';
            let completedUrl = hostUrl + (hasSlash ? '' : '/') + path;

            Object.keys(providedUrlParams).forEach(k => {
                completedUrl = completedUrl.replace(k, providedUrlParams[k]);
            });

            let hasParam = completedUrl.indexOf('?') !== -1;
            Object.keys(combinedQueryParams).forEach(key => {
                if (hasParam) {
                    hasParam = true;
                    completedUrl += '?'
                } else {
                    completedUrl += '&'
                }
                completedUrl += `${encodeURIComponent(key)}=${encodeURIComponent(combinedQueryParams[key])}`;
            });
            return this.client.http(completedUrl, {...opts, ...params})
        }
    }

}


let defaultClient: Client<any> | undefined = undefined;

export function setDefaultClient(client: Client<any> | undefined) {
    defaultClient = client;
}

export {default as gql} from 'graphql-tag';

export function http(host: string, path: string, options: any) {
    return {
        host, path,
        type: 'http',
        opts: options
    };
}

function isHttp(schema: any) {
    return schema.type === 'http';
}

function isGraphql(schema: any) {
    return schema.kind === 'Document'
}

export function httpGet(host: string, path: string, options?: any) {
    return http(host, path, {...options || {}, method: 'GET'});
}

export function httpPost(host: string, path: string, options?: any) {
    return http(host, path, {...options || {}, method: 'POST'});
}

export function httpPut(host: string, path: string, options?: any) {
    return http(host, path, {...options || {}, method: 'PUT'});
}

export function httpDelete(host: string, path: string, options?: any) {
    return http(host, path, {...options || {}, method: 'DELETE'});
}
