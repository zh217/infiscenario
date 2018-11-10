CREATE ROLE infsc_anon;
CREATE ROLE infsc_user;
CREATE ROLE infsc_server
  LOGIN
  PASSWORD 'infsc_rules!';

GRANT infsc_anon TO infsc_server;
GRANT infsc_user TO infsc_server;
