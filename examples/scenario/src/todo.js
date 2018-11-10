const {Scenario, gql} = require('infiscenario/lib/scenario');

class TodoListing extends Scenario {
}

TodoListing.allTodo = gql`
    query AllTodo {
        
    }
`;
