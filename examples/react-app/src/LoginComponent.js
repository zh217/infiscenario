import {Login, Registration} from 'example-scenario/src/auth';
import React, {Component} from 'react';

export class LoginComponent extends Component {
    constructor(props) {
        super(props);

        this.loginScenario = new Login().updateReactOnChange(this);
        this.registerScenario = new Registration().updateReactOnChange(this);

        this.loginScenario.watchEvent((vals, evt) => {
            console.log('login', evt, vals);
        });

        this.registerScenario.watchEvent((vals, evt) => {
            console.log('register', evt, vals);
        });

        this.state = {
            registerUsername: '',
            registerPassword: '',
            loginUsername: '',
            loginPassword: ''
        };

    }

    render() {
        return <div>
            Registration {JSON.stringify(this.registerScenario.state)}
            <div>
                username
                <input
                    type="text"
                    value={this.state.registerUsername}
                    onChange={e => this.setState({registerUsername: e.target.value})}
                />
                password
                <input
                    type="password"
                    value={this.state.registerPassword}
                    onChange={e => this.setState({registerPassword: e.target.value})}
                />
                <button onClick={() => this.submitRegister()}>xxx</button>
            </div>
            Login {JSON.stringify(this.loginScenario.state)}
            <div>
                username
                <input
                    type="text"
                    value={this.state.loginUsername}
                    onChange={e => this.setState({loginUsername: e.target.value})}
                />
                password
                <input
                    type="password"
                    value={this.state.loginPassword}
                    onChange={e => this.setState({loginPassword: e.target.value})}
                />
                <button onClick={() => this.submitLogin()}>xxx</button>
            </div>
        </div>;
    }

    submitRegister() {
        this.registerScenario.state.username = this.state.registerUsername;
        this.registerScenario.state.password = this.state.registerPassword;
        this.registerScenario.submit();
    }

    submitLogin() {
        this.loginScenario.state.username = this.state.loginUsername;
        this.loginScenario.state.password = this.state.loginPassword;
        this.loginScenario.submit();
    }
}
