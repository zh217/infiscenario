"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
exports.UNFILTERED = '';
class ManagedState {
    constructor(proxied) {
        this.proxied = proxied;
        this.callbackMap = {};
        this.pendingChanges = new Set();
        this.pendingDeletions = new Set();
        this.pendingFlush = null;
        this.old = null;
        const initKeys = Object.keys(proxied);
        this.allowedStateKeys = new Set(initKeys);
    }
    watch(callback, filters) {
        if (!filters) {
            filters = [exports.UNFILTERED];
        }
        for (const filter of filters) {
            if (typeof this.callbackMap[filter] === 'undefined') {
                this.callbackMap[filter] = new Set();
            }
            this.callbackMap[filter].add(callback);
        }
        return callback;
    }
    unwatch(callback) {
        for (const k in this.callbackMap) {
            if (this.callbackMap.hasOwnProperty(k)) {
                this.callbackMap[k].delete(callback);
            }
        }
    }
    set(target, prop, value) {
        this.checkRestriction(prop);
        if (this.old === null) {
            this.old = lodash_clonedeep_1.default(target);
        }
        this.pendingDeletions.delete(prop);
        if (!lodash_isequal_1.default(value, target[value])) {
            this.pendingChanges.add(prop);
        }
        this.queueUpdate();
        target[prop] = value;
        return true;
    }
    checkRestriction(prop, deletion = false) {
        if (!this.allowedStateKeys.size) {
            return;
        }
        if (this.allowedStateKeys.has(prop)) {
            if (deletion) {
                throw Error(`Cannot delete restricted state ${prop}`);
            }
        }
        else {
            throw Error(`Cannot operate unknown state ${prop}`);
        }
    }
    queueUpdate() {
        if (this.pendingFlush) {
            cancelRunSoon(this.pendingFlush);
        }
        this.pendingFlush = runSoon(() => this.flushChanges());
    }
    flushChanges() {
        if (!this.pendingChanges.size && !this.pendingDeletions.size) {
            this.old = null;
            this.pendingFlush = null;
            return;
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
    deleteProperty(target, prop) {
        this.checkRestriction(prop, true);
        if (this.old === null) {
            this.old = lodash_clonedeep_1.default(target);
        }
        this.pendingChanges.delete(prop);
        if (target.hasOwnProperty(prop)) {
            this.pendingDeletions.add(prop);
        }
        delete target[prop];
        return true;
    }
}
exports.ManagedState = ManagedState;
function runSoon(func) {
    return setTimeout(func, 0);
}
function cancelRunSoon(handle) {
    clearTimeout(handle);
}
function makeStateProxy(obj) {
    const manager = new ManagedState(obj);
    const state = new Proxy(obj, manager);
    return { state, manager };
}
exports.makeStateProxy = makeStateProxy;
