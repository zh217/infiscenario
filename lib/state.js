"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
exports.UNFILTERED = '';
var ManagedState = /** @class */ (function () {
    function ManagedState(proxied) {
        this.proxied = proxied;
        this.callbackMap = {};
        this.pendingChanges = new Set();
        this.pendingDeletions = new Set();
        this.pendingFlush = null;
        this.old = null;
        var initKeys = Object.keys(proxied);
        this.allowedStateKeys = new Set(initKeys);
    }
    ManagedState.prototype.watch = function (callback, filters) {
        var e_1, _a;
        if (!filters) {
            filters = [exports.UNFILTERED];
        }
        try {
            for (var filters_1 = __values(filters), filters_1_1 = filters_1.next(); !filters_1_1.done; filters_1_1 = filters_1.next()) {
                var filter = filters_1_1.value;
                if (typeof this.callbackMap[filter] === 'undefined') {
                    this.callbackMap[filter] = new Set();
                }
                if (filter !== exports.UNFILTERED) {
                    this.checkRestriction(filter);
                }
                this.callbackMap[filter].add(callback);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (filters_1_1 && !filters_1_1.done && (_a = filters_1.return)) _a.call(filters_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return callback;
    };
    ManagedState.prototype.unwatch = function (callback) {
        for (var k in this.callbackMap) {
            if (this.callbackMap.hasOwnProperty(k)) {
                this.callbackMap[k].delete(callback);
            }
        }
    };
    ManagedState.prototype.get = function (target, prop, receiver) {
        this.checkRestriction(prop);
        return Reflect.get(target, prop, receiver);
    };
    ManagedState.prototype.set = function (target, prop, value) {
        this.checkRestriction(prop);
        if (this.old === null) {
            this.old = lodash_clonedeep_1.default(target);
        }
        this.pendingDeletions.delete(prop);
        this.pendingChanges.add(prop);
        this.queueUpdate();
        target[prop] = value;
        return true;
    };
    ManagedState.prototype.setState = function (newState) {
        var e_2, _a;
        if (this.old === null) {
            this.old = lodash_clonedeep_1.default(this.proxied);
        }
        try {
            for (var _b = __values(Object.keys(newState)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var prop = _c.value;
                this.checkRestriction(prop);
                this.pendingDeletions.delete(prop);
                this.pendingChanges.add(prop);
                this.proxied[prop] = newState[prop];
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        this.queueUpdate();
    };
    ManagedState.prototype.checkRestriction = function (prop, deletion) {
        if (deletion === void 0) { deletion = false; }
        if (!this.allowedStateKeys.size) {
            return;
        }
        if (this.allowedStateKeys.has(prop)) {
            if (deletion) {
                throw Error("Cannot delete restricted state " + prop + " (allowed: " + __spread(this.allowedStateKeys) + ")");
            }
        }
        else {
            throw Error("Cannot operate unknown state " + prop + " (allowed: " + __spread(this.allowedStateKeys) + ")");
        }
    };
    ManagedState.prototype.queueUpdate = function () {
        var _this = this;
        if (this.pendingFlush) {
            cancelRunSoon(this.pendingFlush);
        }
        this.pendingFlush = runSoon(function () { return _this.flushChanges(); });
    };
    ManagedState.prototype.flushChanges = function () {
        var e_3, _a, e_4, _b, e_5, _c;
        if (!this.pendingChanges.size && !this.pendingDeletions.size) {
            this.old = null;
            this.pendingFlush = null;
            return;
        }
        var toCall = new Set(this.callbackMap['']);
        try {
            for (var _d = __values(__spread(this.pendingChanges, this.pendingDeletions)), _e = _d.next(); !_e.done; _e = _d.next()) {
                var k = _e.value;
                try {
                    for (var _f = __values(this.callbackMap[k] || []), _g = _f.next(); !_g.done; _g = _f.next()) {
                        var f = _g.value;
                        toCall.add(f);
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
            }
            finally { if (e_3) throw e_3.error; }
        }
        this.pendingChanges.clear();
        this.pendingDeletions.clear();
        this.pendingFlush = null;
        try {
            for (var toCall_1 = __values(toCall), toCall_1_1 = toCall_1.next(); !toCall_1_1.done; toCall_1_1 = toCall_1.next()) {
                var f = toCall_1_1.value;
                f(this.proxied, this.old);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (toCall_1_1 && !toCall_1_1.done && (_c = toCall_1.return)) _c.call(toCall_1);
            }
            finally { if (e_5) throw e_5.error; }
        }
        this.old = null;
    };
    ManagedState.prototype.deleteProperty = function (target, prop) {
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
    };
    return ManagedState;
}());
exports.ManagedState = ManagedState;
function runSoon(func) {
    return setTimeout(func, 0);
}
function cancelRunSoon(handle) {
    clearTimeout(handle);
}
function makeStateProxy(obj) {
    var manager = new ManagedState(obj);
    var state = new Proxy(obj, manager);
    return { state: state, manager: manager };
}
exports.makeStateProxy = makeStateProxy;
//# sourceMappingURL=state.js.map