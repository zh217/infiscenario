BEGIN;

SELECT plan(6);

DELETE
FROM infsc.todo;

SELECT infsc.register_account('tick_user', '');
INSERT INTO infsc.todo (account, description, completed, scheduled_at)
VALUES ((SELECT id FROM infsc.account WHERE username = 'tick_user'), 'whatever', FALSE, 10);

SELECT setval('infsc.time_tick', 10);

SELECT is((SELECT infsc.todo_overdue(infsc.todo.*) FROM infsc.todo), FALSE, 'not overdue');


SELECT is((SELECT infsc.current_time()), 10 :: BIGINT);
SELECT is((SELECT infsc.current_time()), 10 :: BIGINT);
SELECT is((SELECT infsc.tick_time()), 11 :: BIGINT);
SELECT is((SELECT infsc.current_time()), 11 :: BIGINT);

SELECT is((SELECT infsc.todo_overdue(infsc.todo.*) FROM infsc.todo), TRUE, 'overdue');

SELECT *
FROM finish();

ROLLBACK;
