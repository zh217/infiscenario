SELECT infsc.register_account('test_user', 'test_password');

SELECT set_config('jwt.claims.account_id',
                  (SELECT id FROM infsc.account WHERE username = 'test_user') :: TEXT,
                  FALSE);

INSERT INTO infsc.todo (description, completed, scheduled_at)
VALUES ('test todo 1', FALSE, 1),
       ('test todo 2', TRUE, 2);
