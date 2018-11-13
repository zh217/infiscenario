const {Scenario} = require('./scenario');

Scenario.prototype.updateReactOnChange = function updateReactOnChange(reactComponent, filters) {
    filters = filters || null;
    this.watchState(filters, () => reactComponent.forceUpdate());
    return this
};

function bindReactState(scenario, reactComponent) {
    reactComponent.state = scenario.state;
}
