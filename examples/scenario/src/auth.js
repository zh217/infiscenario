const {Scenario, gql} = require('infiscenario/lib/scenario');

class Registration extends Scenario {
    async submit() {
        try {
            await this.register({
                username: this.state.username,
                password: this.state.password
            }, {query: {errorPolicy: 'ignore'}});

            this.state.failed = false;
            this.state.password = '';

            this.sendEvent('REGISTRATION_SUCCESS');
        } catch (e) {
            this.state.failed = true;

            console.error(e.networkError);
            this.sendEvent('REGISTRATION_FAIL', e);
        }
    }
}

Registration.initState = {
    username: '',
    password: '',
    failed: false
};

Registration.register = gql`
    mutation Registration($username: String!, $password: String!) {
        registerAccount(input: {
            username: $username,
            password: $password
        }) {
            account{
                id,
                username
            }
        }
    }
`;

Registration.events = ['SERVER_ERROR', 'REGISTRATION_SUCCESS', 'REGISTRATION_FAIL', 'VALIDATION_ERROR'];


class Login extends Scenario {
    async login(params) {
        const result = await this._login(params);
        if (!result.data.validateAccount.jwtToken) {
            throw Error('Login failed');
        }
        this.client.setAuthToken(result.data.validateAccount.jwtToken);
        return result;
    }

    async submit() {
        try {
            await this.login({
                username: this.state.username,
                password: this.state.password
            });

            this.state.failed = false;
            this.state.username = '';
            this.state.password = '';

            this.sendEvent('LOGIN_SUCCESS');
        } catch (e) {
            this.state.failed = true;
            console.error(e);
            this.sendEvent('LOGIN_FAIL', e);
        }
    }
}

Login.initState = {
    username: '',
    password: '',
    failed: false
};

Login._login = gql`
    mutation Login($username: String!, $password: String!) {
        validateAccount(input: {
            username: $username,
            password: $password
        }) {
            jwtToken
        }
    }
`;

Login.events = ['SERVER_ERROR', 'LOGIN_SUCCESS', 'LOGIN_FAIL', 'VALIDATION_ERROR'];


module.exports = {
    Login, Registration
};
