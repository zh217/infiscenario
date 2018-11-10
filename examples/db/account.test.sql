BEGIN;

SELECT plan(4);

SET ROLE infsc_anon;
SELECT infsc.register_account('test_user1', 'test_pass');
SET ROLE postgres;

SELECT is((SELECT count(*) :: INT FROM infsc.account WHERE username = 'test_user1'), 1, 'insertion ok');

SELECT is((SELECT infsc.validate_account('test_user1', 'wrong_pass')), NULL, 'wrong pass');
SELECT is((SELECT infsc.validate_account('wrong_user', 'test_pass')), NULL, 'wrong user');
SELECT isnt((SELECT infsc.validate_account('test_user1', 'test_pass')), NULL, 'validate ok');

SELECT *
FROM finish();

ROLLBACK;
