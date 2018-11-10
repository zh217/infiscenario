ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

GRANT USAGE ON SCHEMA infsc TO infsc_anon, infsc_user;

-- CREATE FUNCTION
--   infsc.validate_subscription(topic TEXT)
--   RETURNS TEXT AS $$
-- BEGIN
--   IF current_setting('jwt.claims.account_id') IS NULL
--   THEN
--     RETURN 'OK' :: TEXT;
--   ELSE
--     RAISE EXCEPTION 'Subscription denied';
--   END IF;
-- END;
-- $$
-- LANGUAGE plpgsql
-- VOLATILE
-- SECURITY DEFINER;
--
-- GRANT EXECUTE ON FUNCTION infsc.validate_subscription(TEXT) TO infsc_user, infsc_anon;
