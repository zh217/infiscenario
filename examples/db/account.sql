CREATE TABLE infsc.account (
  id       SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE CHECK (length(username) < 20)
);

COMMENT ON TABLE infsc.account
IS E'@omit create,update,delete,all';

GRANT SELECT ON TABLE infsc.account TO infsc_anon, infsc_user;

CREATE TABLE infsc_priv.account_auth (
  id            INTEGER NOT NULL PRIMARY KEY REFERENCES infsc.account (id) ON DELETE CASCADE,
  password_hash TEXT    NOT NULL
);


CREATE FUNCTION infsc.register_account(username TEXT, password TEXT)
  RETURNS infsc.ACCOUNT AS $$
DECLARE
  created_account infsc.ACCOUNT;
BEGIN
  INSERT INTO infsc.account (username) VALUES ($1) RETURNING *
    INTO created_account;

  INSERT INTO infsc_priv.account_auth (id, password_hash)
  VALUES (created_account.id, crypt(password, gen_salt('bf')));

  RETURN created_account;
END;
$$
LANGUAGE plpgsql
STRICT
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION infsc.register_account(TEXT, TEXT) TO infsc_anon;


CREATE FUNCTION infsc.validate_account(username TEXT, password TEXT)
  RETURNS infsc.JWT_TOKEN AS $$
DECLARE
  found_account infsc.ACCOUNT;
  found_auth    infsc_priv.ACCOUNT_AUTH;
BEGIN
  SELECT * FROM infsc.account WHERE account.username = $1 INTO found_account;

  IF found_account IS NULL
  THEN RETURN NULL;
  END IF;

  SELECT * FROM infsc_priv.account_auth WHERE account_auth.id = found_account.id INTO found_auth;

  IF found_auth IS NULL
  THEN RETURN NULL;
  END IF;

  IF found_auth.password_hash = crypt(password, found_auth.password_hash)
  THEN RETURN ('infsc_user', found_auth.id) :: infsc.JWT_TOKEN;
  ELSE RETURN NULL;
  END IF;
END;
$$
LANGUAGE plpgsql
STRICT
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION infsc.validate_account(TEXT, TEXT) TO infsc_anon;


CREATE FUNCTION infsc.current_account()
  RETURNS infsc.ACCOUNT AS $$
SELECT *
FROM infsc.account
WHERE id = current_setting('jwt.claims.account_id') :: INTEGER
$$
LANGUAGE SQL
STABLE;

GRANT EXECUTE ON FUNCTION infsc.current_account() TO infsc_user;
