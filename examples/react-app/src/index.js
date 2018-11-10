import 'infiscenario/lib/scenario_react';
import {setDefaultClient} from 'infiscenario/lib/scenario';
import ApolloFetchClient from 'infiscenario/lib/apollo_client';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

setDefaultClient(new ApolloFetchClient({
    uri: 'http://127.0.0.1:5000/graphql',
    fetch: window.fetch
}));

ReactDOM.render(<App/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
