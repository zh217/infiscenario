CREATE SEQUENCE infsc.time_tick;


CREATE FUNCTION infsc.current_time()
  RETURNS BIGINT AS $$
SELECT currval('infsc.time_tick');
$$
LANGUAGE SQL
STABLE;


CREATE FUNCTION infsc.tick_time()
  RETURNS BIGINT AS $$
SELECT nextval('infsc.time_tick');
$$
LANGUAGE SQL
VOLATILE;


CREATE TABLE infsc.todo (
  id           SERIAL PRIMARY KEY,
  account      INTEGER NOT NULL REFERENCES infsc.account (id),
  description  TEXT    NOT NULL CHECK (length(description) < 80),
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_at BIGINT  NOT NULL
);


CREATE FUNCTION infsc.todo_overdue(todo infsc.TODO)
  RETURNS BOOLEAN AS $$
SELECT (NOT todo.completed) AND (todo.scheduled_at < infsc.current_time())
$$
LANGUAGE SQL
STABLE;


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
                    json_build_object('__node__', json_build_array(changed.id)) :: TEXT);
  RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER infsc_todo_change
  AFTER INSERT OR UPDATE OR DELETE
  ON infsc.todo
  FOR EACH ROW EXECUTE PROCEDURE infsc_priv.todo_change_trigger();
