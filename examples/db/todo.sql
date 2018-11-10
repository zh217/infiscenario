CREATE SEQUENCE infsc.time_tick;

GRANT USAGE, SELECT ON SEQUENCE infsc.time_tick TO infsc_anon, infsc_user;


CREATE FUNCTION infsc.current_time()
  RETURNS BIGINT AS $$
SELECT last_value
FROM infsc.time_tick;
$$
LANGUAGE SQL
STABLE;

GRANT EXECUTE ON FUNCTION infsc.current_time() TO infsc_anon, infsc_user;


CREATE FUNCTION infsc.tick_time()
  RETURNS BIGINT AS $$
SELECT nextval('infsc.time_tick');
$$
LANGUAGE SQL
VOLATILE;


CREATE TABLE infsc.todo (
  id           SERIAL PRIMARY KEY,
  account      INTEGER NOT NULL REFERENCES infsc.account (id)
                                DEFAULT (current_setting('jwt.claims.account_id') :: INTEGER),
  description  TEXT    NOT NULL CHECK (length(description) < 80),
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_at BIGINT  NOT NULL
);

COMMENT ON COLUMN infsc.todo.id
IS E'@omit create,update';

COMMENT ON COLUMN infsc.todo.account
IS E'@omit create,update';

COMMENT ON COLUMN infsc.todo.completed
IS E'@omit create';

GRANT SELECT ON TABLE infsc.todo TO infsc_anon, infsc_user;
GRANT INSERT, UPDATE, DELETE ON TABLE infsc.todo TO infsc_user;

ALTER TABLE infsc.todo
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_todo
  ON infsc.todo FOR SELECT USING (TRUE);

CREATE POLICY update_todo
  ON infsc.todo FOR UPDATE USING (account = current_setting('jwt.claims.account_id') :: INTEGER);

CREATE POLICY delete_todo
  ON infsc.todo FOR DELETE USING (account = current_setting('jwt.claims.account_id') :: INTEGER);


CREATE FUNCTION infsc.todo_overdue(todo infsc.TODO)
  RETURNS BOOLEAN AS $$
SELECT (NOT todo.completed) AND (todo.scheduled_at < infsc.current_time())
$$
LANGUAGE SQL
STABLE;

GRANT EXECUTE ON FUNCTION infsc.todo_overdue(infsc .TODO) TO infsc_anon, infsc_user;

CREATE FUNCTION infsc_priv.todo_change_trigger()
  RETURNS TRIGGER AS $$
DECLARE
  changed infsc.TODO;
BEGIN
  IF (tg_op = 'DELETE')
  THEN
    changed := old;
  ELSE
    changed := new;
  END IF;

  PERFORM pg_notify('postgraphile:todo_change',
                    json_build_object('__node__', json_build_array('todos', changed.id)) :: TEXT);
  RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER infsc_todo_change
  AFTER INSERT OR UPDATE OR DELETE
  ON infsc.todo
  FOR EACH ROW EXECUTE PROCEDURE infsc_priv.todo_change_trigger();
