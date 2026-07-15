-- Fix: operator does not exist: name = regconfig
-- Cause: memorials_search_vector_update compared pg_ts_config.cfgname (name)
-- against a regconfig variable. Use text for the lookup instead.

CREATE OR REPLACE FUNCTION public.memorials_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cfg_name text := 'italian';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = cfg_name) THEN
    cfg_name := 'simple';
  END IF;

  NEW.search_vector :=
    setweight(to_tsvector(cfg_name::regconfig, COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector(cfg_name::regconfig, COALESCE(NEW.biography, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.posts_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cfg_name text := 'italian';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = cfg_name) THEN
    cfg_name := 'simple';
  END IF;

  NEW.search_vector :=
    setweight(to_tsvector(cfg_name::regconfig, COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector(cfg_name::regconfig, COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$;
