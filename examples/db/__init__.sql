CREATE SCHEMA IF NOT EXISTS infsc;
CREATE SCHEMA IF NOT EXISTS infsc_priv;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\ir 'role.sql'
\ir 'jwt.sql'
\ir 'privilege.sql'
\ir 'account.sql'
\ir 'todo.sql'
