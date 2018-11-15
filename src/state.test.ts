import {ManagedState, makeStateProxy} from "./state";

test('initialization ok', () => {
    new ManagedState({});
    new ManagedState({'a': 2});
});

test('state restriction', () => {
    let {state: restrictedState} = makeStateProxy({a: undefined, b: 'asd'});
    restrictedState.a = 2;
    restrictedState.b = [];
    expect(() => restrictedState.c = undefined).toThrow();
    expect(() => delete restrictedState.a).toThrow();
    expect(() => restrictedState.x).toThrow();

    let {state: unrestrictedState} = makeStateProxy({});
    unrestrictedState.a = 2;
    unrestrictedState.b = 'a';
    delete unrestrictedState.a;
});

test('watching state change', done => {
    let {state, manager} = makeStateProxy({a: 1, b: 2});
    manager.watch((newState, oldState) => {
        expect(newState).toEqual({a: 2, b: 3});
        expect(oldState).toEqual({a: 1, b: 2});
        done();
    });
    state.a++;
    state.b++;
});

test('state change batching', done => {
    let {state, manager} = makeStateProxy({a: 1, b: 2});
    let counter = 0;
    manager.watch(() => {
        counter++;
    });

    state.a++;
    state.b++;
    state.a++;
    state.b++;

    setTimeout(() => {
        expect(counter).toEqual(1);
        done();
    }, 0.1);
});

test('unwatching state change', done => {
    let {state, manager} = makeStateProxy({a: 1, b: 2});
    let counter = 0;
    const handle = manager.watch(() => {
        counter++;
    });
    state.a++;
    state.b++;
    setTimeout(() => {
        expect(counter).toEqual(0);
        done();
    }, 0.1);
    manager.unwatch(handle);
    manager.unwatch(handle);
    manager.unwatch(handle);
});