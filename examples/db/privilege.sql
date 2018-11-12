ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

GRANT USAGE ON SCHEMA infsc TO infsc_anon, infsc_user;

CREATE FUNCTION
  infsc.validate_subscription(topic TEXT)
  RETURNS TEXT AS $$
BEGIN
  IF current_user = 'infsc_user' AND current_setting('jwt.claims.account_id', 't') IS NOT NULL
  THEN
    RETURN 'subscription:' || current_user :: TEXT || ':' || current_setting('jwt.claims.account_id');
  ELSE
    RAISE EXCEPTION 'cannot subscribe using role %', current_user;
  END IF;
END;
$$
LANGUAGE plpgsql
VOLATILE;

GRANT EXECUTE ON FUNCTION infsc.validate_subscription(TEXT) TO infsc_user, infsc_anon;
