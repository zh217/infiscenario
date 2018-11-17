export interface State {
    [key: string]: any;
}
export interface StateCallback {
    (newState?: State, oldState?: State | null): void;
}
export declare const UNFILTERED = "";
export declare class ManagedState {
    private readonly proxied;
    private readonly allowedStateKeys;
    private readonly callbackMap;
    private readonly pendingChanges;
    private readonly pendingDeletions;
    private pendingFlush;
    private old;
    constructor(proxied: State);
    watch(callback: StateCallback, filters?: string[]): StateCallback;
    unwatch(callback: StateCallback): void;
    get(target: State, prop: string, receiver: any): any;
    set(target: State, prop: string, value: any): boolean;
    setState(newState: State): void;
    private checkRestriction;
    private queueUpdate;
    private flushChanges;
    deleteProperty(target: State, prop: string): boolean;
}
export declare function makeStateProxy(obj: State): {
    state: State;
    manager: ManagedState;
};
//# sourceMappingURL=state.d.ts.map