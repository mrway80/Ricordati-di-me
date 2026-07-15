-- Auto-create profile, preferences, and consents when a new auth user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username citext;
  display text;
  suffix int := 0;
BEGIN
  display := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  base_username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'));
  IF char_length(base_username) < 3 THEN
    base_username := base_username || 'usr';
  END IF;
  IF char_length(base_username) > 26 THEN
    base_username := left(base_username, 26);
  END IF;

  final_username := base_username::citext;

  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := (left(base_username, 30 - length(suffix::text) - 1) || '_' || suffix)::citext;
  END LOOP;

  INSERT INTO profiles (id, username, display_name, email)
  VALUES (NEW.id, final_username, display, NEW.email);

  INSERT INTO user_preferences (user_id, language, timezone)
  VALUES (NEW.id, 'it', 'Europe/Rome');

  INSERT INTO user_consents (user_id, consent_type, version, granted)
  VALUES
    (NEW.id, 'terms', '1.0', true),
    (NEW.id, 'privacy', '1.0', true);

  INSERT INTO audit_events (actor_id, action, resource_type, resource_id, details)
  VALUES (
    NEW.id,
    'user_registered',
    'profile',
    NEW.id,
    jsonb_build_object('email', NEW.email)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates profile, preferences, consents and audit log entry on auth signup';
