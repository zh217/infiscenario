const fetch = require('node-fetch');
const Scenario = require('./scenario');
const FakeClient = require('./fakeClient');
const {gql, GraphQlClient} = require('./graphQlClient');

const uselessClient = new FakeClient();

class UnrestrictedScenario extends Scenario {
}

UnrestrictedScenario.initState = {x: 1};

test('auto state restriction', () => {
    const es = new UnrestrictedScenario(uselessClient);
    expect(() => es.state.a = 1).toThrow();
    expect(() => delete es.state.b).toThrow();
    es.state.x = 2;
    expect(es.state.x).toBe(2);
});

class EmptyScenario extends Scenario {
}

EmptyScenario.restrictState = false;

test('empty scenario states', done => {
    const es = new EmptyScenario(uselessClient);
    es.state.c = -1;
    es.state.d = 1;
    expect(es.state).toEqual({c: -1, d: 1});
    es.watchState((changed, old) => {
        expect(changed).toEqual({a: 1, b: 2, c: -1});
        expect(old).toEqual({});
        done();
    });
    es.state.a = 0;
    es.state.a = 1;
    es.state.b = 2;
    delete es.state.d;
    expect(es.state).toEqual({a: 1, b: 2, c: -1});
});

class ScenarioWithInitial extends Scenario {
}

ScenarioWithInitial.initState = {a: 1, b: 2};

test('non-conflicting instances', () => {
    const es1 = new ScenarioWithInitial(uselessClient);
    es1.state.a = 3;
    expect(es1.state).toEqual({a: 3, b: 2});
    const es2 = new ScenarioWithInitial(uselessClient);
    expect(es2.state).toEqual({a: 1, b: 2});
    es2.state.b = 1;
    expect(es1.state).toEqual({a: 3, b: 2});
    expect(es2.state).toEqual({a: 1, b: 1});
});

test('unwatch works', done => {
    const es = new ScenarioWithInitial(uselessClient);
    let called = false;
    const handler = es.watchState((changed, old) => {
        console.log('callllled');
        called = true;
    });
    es.state.a = 2;
    es.unwatchState(handler);
    setTimeout(() => {
        expect(called).toEqual(false);
        done()
    }, 0.1);
});

class EventScenario extends Scenario {
    testEvent() {
        this.sendEvent('whatever', [1, 2, 3, 4]);
    }
}

EventScenario.events = ['whatever'];

test('event works', done => {
    const es = new EventScenario(uselessClient);
    es.watchEvent((payload, evt) => {
        expect(evt).toEqual('whatever');
        expect(payload).toEqual([1, 2, 3, 4]);
        done();
    });
    es.testEvent();
    expect(() => es.sendEvent('hello')).toThrow();
});

test('unwatch event works', done => {
    const es = new EventScenario(uselessClient);
    let called = false;
    const handler = es.watchEvent('whatever', (payload) => {
        called = true;
    });
    es.unwatchEvent(handler);
    es.testEvent();
    es.testEvent();
    es.testEvent();
    es.testEvent();
    setTimeout(() => {
        expect(called).toEqual(false);
        done()
    }, 0.1);
});

test('promiseEvent', done => {
    const es = new EventScenario(uselessClient);
    let called = 0;
    es.getEventPromise('whatever').then(res => {
        expect(res.payload).toEqual([1, 2, 3, 4]);
        expect(res.event).toEqual('whatever');
        called++;
    });
    es.testEvent();
    es.testEvent();
    es.getEventPromise('whatever').then(res => {
        expect(res.payload).toEqual([1, 2, 3, 4]);
        expect(res.event).toEqual('whatever');
        called++;
    });
    es.testEvent();
    es.testEvent();
    setTimeout(() => {
        expect(called).toEqual(2);
        done()
    }, 0.1);
});

class ScenarioWithClient extends Scenario {
}

ScenarioWithClient.callIt = gql`
    query Whatever {
        someQuery {
            id
        }
    }
`;

test('scenario with client', async () => {
    const client = new FakeClient({data: {someQuery: {id: 1}}});
    const es = new ScenarioWithClient(client);
    const result = await es.callIt({a: 1});
    expect(result._vars).toEqual({a: 1});
    expect(result.data).toEqual({someQuery: {id: 1}});
});

class ScenarioWithHttp extends Scenario {
}

ScenarioWithHttp.doHttp = {
    url: 'http://www.baidu.com',
    method: 'GET'
};

test('scenario with HTTP', async () => {
    const cl = new GraphQlClient({fetch});
    const s = new ScenarioWithHttp(cl);
    const result = await s.doHttp();
    expect(result.ok).toBeTruthy();
});