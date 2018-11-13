import cloneDeep from 'lodash.clonedeep';

import {Client} from './client';
import {ManagedState, State, StateCallback, UNFILTERED} from './state';

export interface EventCallback {
    (event: string, payload: any): void
}

interface PluginMethod {
    (a: any, b?: any, c?: any): any
}

export abstract class Scenario {
    static state: State = {};
    static events: string[] = [];

    public readonly state: State;
    public readonly events: Set<string>;

    protected client: Client<any>;
    protected remote: { [key: string]: PluginMethod } = {};

    private readonly stateProxifier: ManagedState;
    private readonly eventCallbackMap: { [key: string]: Set<EventCallback> } = {};

    protected constructor(client?: Client<any>) {
        this.client = client || defaultClient!;

        const classConstructor = this.constructor as typeof Scenario;

        const proxied = cloneDeep(classConstructor.state);
        this.stateProxifier = new ManagedState(proxied);
        this.state = new Proxy(proxied, this.stateProxifier);
        if (typeof (this.constructor as typeof Scenario).events === 'undefined') {
            this.events = new Set();
        } else {
            this.events = new Set(classConstructor.events);
        }
        this.makeQueryMethods();
    }

// TODO
    private makeQueryMethods() {
    }

    public setClient(client: Client<any>) {
        this.client = client;
    }

    public watchState(callback: StateCallback, filters?: string[]) {
        return this.stateProxifier.watch(callback, filters);
    }

    public unwatchState(callback: StateCallback) {
        this.stateProxifier.unwatch(callback);
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

    unwatchEvent(callback: EventCallback) {
        for (const k in this.eventCallbackMap) {
            if (this.eventCallbackMap.hasOwnProperty(k)) {
                this.eventCallbackMap[k].delete(callback);
            }
        }
    }

    sendEvent(event: string, payload?: any) {
        this.checkEventIsValid(event);
        const toCall = [...(this.eventCallbackMap[event] || []), ...(this.eventCallbackMap[UNFILTERED] || [])];
        if (!toCall.length) {
            return;
        }
        for (const f of toCall) {
            f(payload, event);
        }
    }

    notifyEventOnce(filters?: string[]) {
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

}

let defaultClient: Client<any> | undefined = undefined;

export function setDefaultClient(client: Client<any> | undefined) {
    defaultClient = client;
}