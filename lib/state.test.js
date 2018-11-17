"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var state_1 = require("./state");
test('initialization ok', function () {
    new state_1.ManagedState({});
    new state_1.ManagedState({ 'a': 2 });
});
test('state restriction', function () {
    var restrictedState = state_1.makeStateProxy({ a: undefined, b: 'asd' }).state;
    restrictedState.a = 2;
    restrictedState.b = [];
    expect(function () { return restrictedState.c = undefined; }).toThrow();
    expect(function () { return delete restrictedState.a; }).toThrow();
    expect(function () { return restrictedState.x; }).toThrow();
    var unrestrictedState = state_1.makeStateProxy({}).state;
    unrestrictedState.a = 2;
    unrestrictedState.b = 'a';
    delete unrestrictedState.a;
});
test('watching state change', function (done) {
    var _a = state_1.makeStateProxy({ a: 1, b: 2 }), state = _a.state, manager = _a.manager;
    manager.watch(function (newState, oldState) {
        expect(newState).toEqual({ a: 2, b: 3 });
        expect(oldState).toEqual({ a: 1, b: 2 });
        done();
    });
    state.a++;
    state.b++;
});
test('state change batching', function (done) {
    var _a = state_1.makeStateProxy({ a: 1, b: 2 }), state = _a.state, manager = _a.manager;
    var counter = 0;
    manager.watch(function () {
        counter++;
    });
    state.a++;
    state.b++;
    state.a++;
    state.b++;
    setTimeout(function () {
        expect(counter).toEqual(1);
        done();
    }, 0.1);
});
test('unwatching state change', function (done) {
    var _a = state_1.makeStateProxy({ a: 1, b: 2 }), state = _a.state, manager = _a.manager;
    var counter = 0;
    var handle = manager.watch(function () {
        counter++;
    });
    state.a++;
    state.b++;
    setTimeout(function () {
        expect(counter).toEqual(0);
        done();
    }, 0.1);
    manager.unwatch(handle);
    manager.unwatch(handle);
    manager.unwatch(handle);
});
test('bulk state change', function (done) {
    var _a = state_1.makeStateProxy({ a: 1, b: 2, c: 3 }), state = _a.state, manager = _a.manager;
    var counter = 0;
    var finalState = null;
    manager.watch(function (state) {
        counter++;
        finalState = state;
    });
    manager.setState({ a: 10, b: 20 });
    manager.setState({ b: 10, c: 10 });
    setTimeout(function () {
        expect(counter).toEqual(1);
        expect(finalState).toEqual({ a: 10, b: 10, c: 10 });
        done();
    }, 0.1);
});
//# sourceMappingURL=state.test.js.map