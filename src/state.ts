import isEqual from 'lodash.isequal';
import cloneDeep from 'lodash.clonedeep';


export interface State {
    [key: string]: any
}

export interface StateCallback {
    (newState?: State, oldState?: State | null): void
}

export const UNFILTERED = '';

export class ManagedState {
    private readonly allowedStateKeys: Set<string> | null;
    private readonly callbackMap: { [key: string]: Set<StateCallback> } = {};
    private readonly pendingChanges: Set<any> = new Set();
    private readonly pendingDeletions: Set<any> = new Set();
    private pendingFlush: number | null = null;
    private old: State | null = null;

    public constructor(private readonly proxied: State) {
        const initKeys = Object.keys(proxied);
        if (!initKeys) {
            this.allowedStateKeys = null;
        } else {
            this.allowedStateKeys = new Set(initKeys);
        }
    }

    public watch(callback: StateCallback, filters?: string[]) {
        if (!filters) {
            filters = [UNFILTERED];
        }
        for (const filter of filters) {
            if (typeof this.callbackMap[filter] === 'undefined') {
                this.callbackMap[filter] = new Set<StateCallback>();
            }
            this.callbackMap[filter].add(callback);
        }
        return callback;
    }

    public unwatch(callback: StateCallback) {
        for (const k in this.callbackMap) {
            if (this.callbackMap.hasOwnProperty(k)) {
                this.callbackMap[k].delete(callback);
            }
        }
    }

    public set(target: State, prop: string, value: any) {
        this.checkRestriction(prop);
        if (this.old === null) {
            this.old = cloneDeep(target);
        }
        this.pendingDeletions.delete(prop);
        if (!isEqual(value, target[value])) {
            this.pendingChanges.add(prop);
        }
        this.queueUpdate();
        target[prop] = value;
        return true
    }

    private checkRestriction(prop: string, deletion: boolean = false) {
        if (this.allowedStateKeys === null) {
            return;
        }
        if (this.allowedStateKeys.has(prop)) {
            if (deletion) {
                throw Error(`Cannot delete restricted state ${prop}`);
            }
        } else {
            throw Error(`Cannot operate unknown state ${prop}`);
        }

    }

    private queueUpdate() {
        if (this.pendingFlush) {
            cancelRunSoon(this.pendingFlush);
        }
        this.pendingFlush = runSoon(() => this.flushChanges())

    }

    private flushChanges() {
        if (!this.pendingChanges.size && !this.pendingDeletions.size) {
            this.old = null;
            this.pendingFlush = null;
            return
        }

        const toCall = new Set(this.callbackMap['']);
        for (const k of [...this.pendingChanges, ...this.pendingDeletions]) {
            for (const f of this.callbackMap[k] || []) {
                toCall.add(f);
            }
        }

        this.pendingChanges.clear();
        this.pendingDeletions.clear();
        this.pendingFlush = null;

        for (const f of toCall) {
            f(this.proxied, this.old);
        }

        this.old = null;
    }

    public deleteProperty(target: State, prop: string) {
        this.checkRestriction(prop, true);
        if (this.old === null) {
            this.old = cloneDeep(target);
        }
        this.pendingChanges.delete(prop);
        if (target.hasOwnProperty(prop)) {
            this.pendingDeletions.add(prop);
        }
        delete target[prop];
        return true
    }
}

function runSoon(func: { (): void }) {
    return setTimeout(func, 0);
}

function cancelRunSoon(handle: number) {
    clearTimeout(handle);
}