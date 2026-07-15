-- =============================================================================
-- MIGRAZIONE INIZIALE — Schema Completo "Ricordati di Te"
-- Versione: 1.0
-- Target: PostgreSQL 15+ (Supabase)
-- =============================================================================
-- Ordine di creazione:
--   1. Estensioni
--   2. Enum types
--   3. Funzioni helper
--   4. Tabelle core (senza FK circolari)
--   5. Tabelle dipendenti
--   6. Tabelle di servizio (audit, outbox, idempotenza)
--   7. Trigger (updated_at, search_vector, counter)
--   8. Views
-- =============================================================================

-- =============================================================================
-- 1. ESTENSIONI
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Commento: unaccent permette ricerche full-text che ignorano accenti.
-- Su Supabase è generalmente disponibile; se mancante, rimuovere il riferimento
-- nelle funzioni search_vector.

-- =============================================================================
-- 2. ENUM TYPES
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memorial_status') THEN
    CREATE TYPE memorial_status AS ENUM (
      'draft', 'verification_pending', 'active', 'restricted', 'disputed',
      'suspended', 'archived', 'deleted'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
    CREATE TYPE content_status AS ENUM (
      'draft', 'uploading', 'processing', 'pending_family_review',
      'pending_platform_review', 'approved', 'published', 'rejected',
      'hidden', 'removed', 'deleted'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
    CREATE TYPE membership_status AS ENUM (
      'invited', 'requested', 'pending', 'approved', 'rejected',
      'suspended', 'revoked'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN
    CREATE TYPE moderation_status AS ENUM (
      'open', 'automated_review', 'human_review', 'action_required',
      'resolved', 'appealed', 'closed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
    CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility') THEN
    CREATE TYPE visibility AS ENUM ('public', 'private', 'invitation_only');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reaction_type') THEN
    CREATE TYPE reaction_type AS ENUM (
      'candle', 'flower', 'heart', 'prayer', 'memory', 'gratitude'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'memorial_created', 'content_pending', 'content_approved',
      'member_invited', 'member_joined', 'anniversary',
      'report_submitted', 'moderation_action', 'guardianship_transferred'
    );
  END IF;
END $$;

-- =============================================================================
-- 3. FUNZIONI HELPER
-- =============================================================================

-- Funzione generica per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at() IS
  'Trigger function per aggiornare automaticamente la colonna updated_at';

-- Funzione: verifica se un utente e membro approvato di un memoriale
CREATE OR REPLACE FUNCTION is_memorial_member(p_memorial_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memorial_members
    WHERE memorial_id = p_memorial_id
      AND user_id = p_user_id
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_memorial_member(uuid, uuid) IS
  'Verifica se l''utente e membro approvato del memoriale';

-- Funzione: verifica se un utente e custode (owner o guardian) di un memoriale
CREATE OR REPLACE FUNCTION is_memorial_guardian(p_memorial_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memorial_guardians
    WHERE memorial_id = p_memorial_id
      AND user_id = p_user_id
      AND role IN ('owner', 'guardian')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_memorial_guardian(uuid, uuid) IS
  'Verifica se l''utente e custode (owner o guardian) del memoriale';

-- Funzione: verifica se un utente ha un permesso specifico sul memoriale
CREATE OR REPLACE FUNCTION has_memorial_permission(
  p_memorial_id uuid, p_user_id uuid, p_permission text
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memorial_guardians
    WHERE memorial_id = p_memorial_id
      AND user_id = p_user_id
      AND (
        role = 'owner'
        OR (p_permission = 'edit' AND can_edit = true)
        OR (p_permission = 'manage_members' AND can_manage_members = true)
        OR (p_permission = 'moderate' AND can_moderate = true)
      )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION has_memorial_permission(uuid, uuid, text) IS
  'Verifica se l''utente ha un permesso specifico sul memoriale';

-- Funzione: aggiorna search_vector per memorials
CREATE OR REPLACE FUNCTION memorials_search_vector_update()
RETURNS TRIGGER AS $$
DECLARE
  cfg_name text := 'italian';
BEGIN
  -- Fallback a 'simple' se 'italian' non e disponibile
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = cfg_name) THEN
    cfg_name := 'simple';
  END IF;

  NEW.search_vector :=
    setweight(to_tsvector(cfg_name::regconfig, COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector(cfg_name::regconfig, COALESCE(NEW.biography, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funzione: aggiorna search_vector per posts
CREATE OR REPLACE FUNCTION posts_search_vector_update()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. TABELLE CORE
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles: estende auth.users di Supabase
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      citext NOT NULL,
  display_name  text NOT NULL,
  email         text NOT NULL,
  avatar_url    text,
  bio           text,
  location      text,
  is_verified   boolean NOT NULL DEFAULT false,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,

  CONSTRAINT ck_profiles_username_length
    CHECK (char_length(username::text) BETWEEN 3 AND 30),
  CONSTRAINT ck_profiles_username_format
    CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT ck_profiles_display_name_length
    CHECK (char_length(display_name) BETWEEN 1 AND 100),
  CONSTRAINT ck_profiles_bio_length
    CHECK (bio IS NULL OR char_length(bio) <= 500)
);

CREATE UNIQUE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

COMMENT ON TABLE profiles IS
  'Profilo utente che estende auth.users di Supabase';
COMMENT ON COLUMN profiles.id IS
  'FK a auth.users(id) — identico all''auth.uid';
COMMENT ON COLUMN profiles.username IS
  'Username pubblico, URL-safe (solo lettere, numeri, underscore)';

-- ---------------------------------------------------------------------------
-- user_preferences: preferenze utente
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  language          text NOT NULL DEFAULT 'it'
    CONSTRAINT ck_prefs_language CHECK (char_length(language) = 2),
  timezone          text NOT NULL DEFAULT 'Europe/Rome',
  theme             text NOT NULL DEFAULT 'system'
    CONSTRAINT ck_prefs_theme CHECK (theme IN ('light', 'dark', 'system')),
  show_email        boolean NOT NULL DEFAULT false,
  allow_tagging     boolean NOT NULL DEFAULT true,
  digest_frequency  text NOT NULL DEFAULT 'weekly'
    CONSTRAINT ck_prefs_digest CHECK (digest_frequency IN ('none', 'daily', 'weekly', 'monthly')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_userprefs_user ON user_preferences(user_id);

-- ---------------------------------------------------------------------------
-- user_consents: consensi GDPR (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_consents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type  text NOT NULL
    CONSTRAINT ck_consents_type CHECK (char_length(consent_type) > 0),
  version       text NOT NULL,
  ip_address    inet,
  user_agent    text,
  granted       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_consents_user_type ON user_consents(user_id, consent_type, created_at DESC);

-- ---------------------------------------------------------------------------
-- memorials: il memoriale dedicato a una persona
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorials (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text NOT NULL,
  full_name             text NOT NULL,
  birth_date            date,
  death_date            date,
  biography             text,
  profile_image_url     text,
  status                memorial_status NOT NULL DEFAULT 'draft',
  visibility            visibility NOT NULL DEFAULT 'public',
  created_by            uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  primary_guardian_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  settings              jsonb NOT NULL DEFAULT '{}',
  search_vector         tsvector,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,

  CONSTRAINT ck_memorials_slug_length
    CHECK (char_length(slug) BETWEEN 3 AND 100),
  CONSTRAINT ck_memorials_slug_format
    CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT ck_memorials_full_name_length
    CHECK (char_length(full_name) BETWEEN 1 AND 200),
  CONSTRAINT ck_memorials_bio_length
    CHECK (biography IS NULL OR char_length(biography) <= 10000),
  CONSTRAINT ck_memorials_death_after_birth
    CHECK (death_date IS NULL OR death_date >= birth_date)
);

CREATE UNIQUE INDEX idx_memorials_slug ON memorials(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_memorials_status ON memorials(status) WHERE status = 'active';
CREATE INDEX idx_memorials_guardian ON memorials(primary_guardian_id);
CREATE INDEX idx_memorials_created_by ON memorials(created_by);
CREATE INDEX idx_memorials_death_date ON memorials(death_date);
CREATE INDEX idx_memorials_created_at ON memorials(created_at DESC);
CREATE INDEX idx_memorials_search_vector ON memorials USING GIN(search_vector);

COMMENT ON TABLE memorials IS
  'Memoriale dedicato a una persona scomparsa';

-- ---------------------------------------------------------------------------
-- memorial_guardians: custodi del memoriale con ruoli e permessi
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorial_guardians (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id         uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role                text NOT NULL DEFAULT 'guardian'
    CONSTRAINT ck_guardians_role CHECK (role IN ('owner', 'guardian', 'collaborator', 'viewer')),
  is_primary          boolean NOT NULL DEFAULT false,
  can_edit            boolean NOT NULL DEFAULT false,
  can_manage_members  boolean NOT NULL DEFAULT false,
  can_moderate        boolean NOT NULL DEFAULT false,
  granted_at          timestamptz NOT NULL DEFAULT now(),
  granted_by          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_guardians_memorial_user UNIQUE (memorial_id, user_id)
);

CREATE INDEX idx_guardians_memorial ON memorial_guardians(memorial_id);
CREATE INDEX idx_guardians_user ON memorial_guardians(user_id);
CREATE INDEX idx_guardians_primary ON memorial_guardians(memorial_id, user_id) WHERE is_primary = true;

-- ---------------------------------------------------------------------------
-- memorial_members: membri del memoriale (familiari, amici)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorial_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  email         text,
  status        membership_status NOT NULL DEFAULT 'invited',
  relationship  text,
  invited_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  joined_at     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ck_member_user_or_email
    CHECK (user_id IS NOT NULL OR email IS NOT NULL),
  CONSTRAINT uq_members_memorial_user UNIQUE NULLS NOT DISTINCT (memorial_id, user_id),
  CONSTRAINT uq_members_memorial_email UNIQUE NULLS NOT DISTINCT (memorial_id, email)
);

CREATE INDEX idx_members_memorial_status ON memorial_members(memorial_id, status);
CREATE INDEX idx_members_user ON memorial_members(user_id);

-- ---------------------------------------------------------------------------
-- memorial_settings: impostazioni granulari per memoriale
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorial_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id           uuid NOT NULL UNIQUE REFERENCES memorials(id) ON DELETE CASCADE,
  allow_public_posts    boolean NOT NULL DEFAULT true,
  require_approval      boolean NOT NULL DEFAULT true,
  allow_reactions       boolean NOT NULL DEFAULT true,
  allow_comments        boolean NOT NULL DEFAULT true,
  allow_tributes        boolean NOT NULL DEFAULT true,
  show_death_date       boolean NOT NULL DEFAULT true,
  custom_css            text,
  theme_color           text
    CONSTRAINT ck_settings_theme_color CHECK (
      theme_color IS NULL OR theme_color ~ '^#[0-9A-Fa-f]{6}$'
    ),
  font_preference       text,
  analytics_enabled     boolean NOT NULL DEFAULT false,
  custom_settings       jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- memorial_invitations: inviti token-based
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorial_invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE,
  email         text,
  role          text NOT NULL DEFAULT 'member'
    CONSTRAINT ck_invitations_role CHECK (role IN ('member', 'guardian', 'collaborator')),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at       timestamptz,
  used_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_memorial ON memorial_invitations(memorial_id);
CREATE INDEX idx_invitations_token ON memorial_invitations(token);
CREATE INDEX idx_invitations_expires ON memorial_invitations(expires_at) WHERE used_at IS NULL;

-- ---------------------------------------------------------------------------
-- relationship_claims: rivendicazione relazione con il defunto
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS relationship_claims (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id             uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  user_id                 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_relationship    text NOT NULL,
  proof_description       text,
  status                  text NOT NULL DEFAULT 'pending'
    CONSTRAINT ck_relclaims_status CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by             uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at             timestamptz,
  rejection_reason        text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_relclaims_memorial_user UNIQUE (memorial_id, user_id)
);

CREATE INDEX idx_relclaims_memorial ON relationship_claims(memorial_id, status);

-- ---------------------------------------------------------------------------
-- guardianship_claims: richiesta diventare custode
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guardianship_claims (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id         uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  motivation          text NOT NULL
    CONSTRAINT ck_gclaims_motivation CHECK (char_length(motivation) >= 20),
  proof_document_url  text,
  status              text NOT NULL DEFAULT 'pending'
    CONSTRAINT ck_gclaims_status CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at         timestamptz,
  rejection_reason    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_gclaims_memorial_user UNIQUE (memorial_id, user_id)
);

CREATE INDEX idx_gclaims_memorial ON guardianship_claims(memorial_id, status);

-- ---------------------------------------------------------------------------
-- guardianship_disputes: contestazioni sul guardianato
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guardianship_disputes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id           uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  claimant_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_guardian_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason                text NOT NULL
    CONSTRAINT ck_disputes_reason CHECK (char_length(reason) >= 20),
  evidence              jsonb NOT NULL DEFAULT '[]',
  status                text NOT NULL DEFAULT 'open'
    CONSTRAINT ck_disputes_status CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  resolution            text,
  resolved_by           uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_disputes_memorial_claimant UNIQUE (memorial_id, claimant_id)
);

CREATE INDEX idx_disputes_memorial ON guardianship_disputes(memorial_id, status);
CREATE INDEX idx_disputes_open ON guardianship_disputes(status) WHERE status = 'open';


-- =============================================================================
-- 5. TABELLE CONTENUTO
-- =============================================================================

-- ---------------------------------------------------------------------------
-- life_events: eventi della vita del defunto
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS life_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id         uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  title               text NOT NULL
    CONSTRAINT ck_lifeevents_title CHECK (char_length(title) BETWEEN 1 AND 200),
  description         text
    CONSTRAINT ck_lifeevents_desc CHECK (description IS NULL OR char_length(description) <= 5000),
  event_date          date,
  event_date_precision text DEFAULT 'exact'
    CONSTRAINT ck_lifeevents_precision CHECK (event_date_precision IN ('exact', 'month', 'year', 'decade')),
  location            text,
  event_type          text NOT NULL,
  media_asset_id      uuid,
  created_by          uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifeevents_memorial ON life_events(memorial_id);
CREATE INDEX idx_lifeevents_date ON life_events(event_date);
CREATE INDEX idx_lifeevents_memorial_date ON life_events(memorial_id, event_date);

COMMENT ON TABLE life_events IS
  'Eventi significativi nella vita del defunto, visualizzati su linea temporale';

-- ---------------------------------------------------------------------------
-- places: luoghi significativi
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS places (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  address       text,
  latitude      decimal(10,8),
  longitude     decimal(11,8),
  place_type    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ck_places_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT ck_places_longitude CHECK (longitude BETWEEN -180 AND 180)
);

CREATE INDEX idx_places_memorial ON places(memorial_id);
CREATE INDEX idx_places_coords ON places(latitude, longitude);

-- ---------------------------------------------------------------------------
-- posts: contributi / storie / ricordi nel memoriale
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id     uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  title           text
    CONSTRAINT ck_posts_title CHECK (title IS NULL OR char_length(title) <= 200),
  content         text NOT NULL
    CONSTRAINT ck_posts_content CHECK (char_length(content) BETWEEN 1 AND 50000),
  content_html    text,
  status          content_status NOT NULL DEFAULT 'draft',
  visibility      visibility NOT NULL DEFAULT 'public',
  search_vector   tsvector,
  reaction_count  integer NOT NULL DEFAULT 0,
  comment_count   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz,
  deleted_at      timestamptz
);

CREATE INDEX idx_posts_memorial ON posts(memorial_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status) WHERE status = 'published';
CREATE INDEX idx_posts_memorial_status ON posts(memorial_id, status, created_at DESC);
CREATE INDEX idx_posts_search_vector ON posts USING GIN(search_vector);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

COMMENT ON TABLE posts IS
  'Post, storie e ricordi condivisi nel memoriale';

-- ---------------------------------------------------------------------------
-- post_revisions: revisioni append-only dei posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_revisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  title           text,
  content         text NOT NULL,
  content_html    text,
  created_by      uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_postrevs_post ON post_revisions(post_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- media_assets: asset multimediali
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id       uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  uploaded_by       uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  media_type        media_type NOT NULL,
  original_filename text NOT NULL,
  mime_type         text NOT NULL,
  file_size         bigint NOT NULL,
  storage_path      text NOT NULL UNIQUE,
  public_url        text,
  status            content_status NOT NULL DEFAULT 'uploading',
  metadata          jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,

  CONSTRAINT ck_media_file_size CHECK (file_size > 0)
);

CREATE INDEX idx_media_memorial ON media_assets(memorial_id);
CREATE INDEX idx_media_type ON media_assets(media_type);
CREATE INDEX idx_media_status ON media_assets(status);
CREATE INDEX idx_media_uploaded_by ON media_assets(uploaded_by);

-- ---------------------------------------------------------------------------
-- media_variants: varianti processate degli asset
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_variants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id  uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  variant_name    text NOT NULL
    CONSTRAINT ck_variants_name CHECK (variant_name IN ('thumbnail', 'small', 'medium', 'large', 'original')),
  storage_path    text NOT NULL,
  width           integer,
  height          integer,
  file_size       bigint NOT NULL,
  mime_type       text NOT NULL,
  public_url      text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_variants_asset_name UNIQUE (media_asset_id, variant_name),
  CONSTRAINT ck_variants_file_size CHECK (file_size > 0)
);

CREATE INDEX idx_variants_asset ON media_variants(media_asset_id);

-- ---------------------------------------------------------------------------
-- albums: raccolte fotografiche
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS albums (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id     uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  title           text NOT NULL
    CONSTRAINT ck_albums_title CHECK (char_length(title) BETWEEN 1 AND 200),
  description     text
    CONSTRAINT ck_albums_desc CHECK (description IS NULL OR char_length(description) <= 1000),
  cover_media_id  uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  item_count      integer NOT NULL DEFAULT 0,
  created_by      uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,

  CONSTRAINT ck_albums_item_count CHECK (item_count >= 0)
);

CREATE INDEX idx_albums_memorial ON albums(memorial_id);

-- ---------------------------------------------------------------------------
-- album_items: associazione media_asset <-> album
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS album_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id        uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  media_asset_id  uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  caption         text
    CONSTRAINT ck_albumitems_caption CHECK (caption IS NULL OR char_length(caption) <= 500),
  sort_order      integer NOT NULL DEFAULT 0,
  added_by        uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_albumitems_album_media UNIQUE (album_id, media_asset_id)
);

CREATE INDEX idx_albumitems_album ON album_items(album_id, sort_order);
CREATE INDEX idx_albumitems_media ON album_items(media_asset_id);

-- ---------------------------------------------------------------------------
-- comments: commenti ai posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  parent_id     uuid REFERENCES comments(id) ON DELETE CASCADE,
  content       text NOT NULL
    CONSTRAINT ck_comments_content CHECK (char_length(content) BETWEEN 1 AND 10000),
  status        content_status NOT NULL DEFAULT 'published',
  is_edited     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE INDEX idx_comments_post ON comments(post_id, created_at DESC);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_post_status ON comments(post_id, status, created_at DESC);

COMMENT ON TABLE comments IS
  'Commenti ai post con supporto risposte annidate (parent_id)';

-- ---------------------------------------------------------------------------
-- comment_revisions: revisioni append-only dei commenti
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comment_revisions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  content     text NOT NULL,
  created_by  uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_commentrevs_comment ON comment_revisions(comment_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- reactions: reazioni ai post
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type   reaction_type NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_reactions_post_user_type UNIQUE (post_id, user_id, reaction_type)
);

CREATE INDEX idx_reactions_post ON reactions(post_id, reaction_type);
CREATE INDEX idx_reactions_user ON reactions(user_id);

-- ---------------------------------------------------------------------------
-- memorial_follows: seguaci di un memoriale
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorial_follows (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id             uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  user_id                 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notify_on_new_post      boolean NOT NULL DEFAULT true,
  notify_on_anniversary   boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_follows_memorial_user UNIQUE (memorial_id, user_id)
);

CREATE INDEX idx_follows_user ON memorial_follows(user_id);
CREATE INDEX idx_follows_memorial ON memorial_follows(memorial_id);

-- ---------------------------------------------------------------------------
-- user_blocks: blocchi utente
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_blocks_pair UNIQUE (blocker_id, blocked_id),
  CONSTRAINT ck_blocks_not_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON user_blocks(blocked_id);


-- =============================================================================
-- 6. TABELLE MODERAZIONE E SUPPORTO
-- =============================================================================

-- ---------------------------------------------------------------------------
-- support_messages: messaggi al supporto
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  sender_email  text NOT NULL,
  sender_name   text NOT NULL,
  subject       text NOT NULL,
  message       text NOT NULL,
  category      text NOT NULL
    CONSTRAINT ck_support_category CHECK (category IN ('support', 'bug', 'feature', 'abuse', 'other')),
  status        text NOT NULL DEFAULT 'new'
    CONSTRAINT ck_support_status CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  assigned_to   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolution    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_status ON support_messages(status)
  WHERE status IN ('new', 'in_progress');
CREATE INDEX idx_support_sender ON support_messages(sender_id);

-- ---------------------------------------------------------------------------
-- content_reports: segnalazioni contenuti
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content_type  text NOT NULL
    CONSTRAINT ck_reports_type CHECK (content_type IN ('post', 'comment', 'media', 'memorial', 'album')),
  content_id    uuid NOT NULL,
  reason        text NOT NULL,
  description   text,
  status        text NOT NULL DEFAULT 'pending'
    CONSTRAINT ck_reports_status CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  memorial_id   uuid REFERENCES memorials(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_content ON content_reports(content_type, content_id);
CREATE INDEX idx_reports_status ON content_reports(status) WHERE status = 'pending';
CREATE INDEX idx_reports_reporter ON content_reports(reporter_id);
CREATE INDEX idx_reports_memorial ON content_reports(memorial_id);

-- ---------------------------------------------------------------------------
-- moderation_cases: casi di moderazione
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS moderation_cases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     uuid UNIQUE REFERENCES content_reports(id) ON DELETE SET NULL,
  content_type  text NOT NULL,
  content_id    uuid NOT NULL,
  memorial_id   uuid REFERENCES memorials(id) ON DELETE SET NULL,
  status        moderation_status NOT NULL DEFAULT 'open',
  priority      text NOT NULL DEFAULT 'medium'
    CONSTRAINT ck_modcases_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  ai_score      decimal(5,4)
    CONSTRAINT ck_modcases_ai_score CHECK (ai_score BETWEEN 0 AND 1),
  flags         jsonb NOT NULL DEFAULT '[]',
  summary       text,
  assigned_to   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_modcases_status ON moderation_cases(status)
  WHERE status IN ('open', 'human_review', 'action_required');
CREATE INDEX idx_modcases_assigned ON moderation_cases(assigned_to, status);
CREATE INDEX idx_modcases_memorial ON moderation_cases(memorial_id);

-- ---------------------------------------------------------------------------
-- moderation_actions: azioni di moderazione
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS moderation_actions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         uuid NOT NULL REFERENCES moderation_cases(id) ON DELETE CASCADE,
  action_type     text NOT NULL
    CONSTRAINT ck_modactions_type CHECK (action_type IN ('hide', 'remove', 'warn', 'suspend', 'ban', 'restore')),
  action_details  jsonb NOT NULL DEFAULT '{}',
  performed_by    uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  reason          text NOT NULL,
  reverted_at     timestamptz,
  reverted_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_modactions_case ON moderation_actions(case_id);
CREATE INDEX idx_modactions_performed ON moderation_actions(performed_by);

-- ---------------------------------------------------------------------------
-- appeals: appelli contro azioni di moderazione
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appeals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id         uuid NOT NULL REFERENCES moderation_actions(id) ON DELETE CASCADE,
  appellant_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason            text NOT NULL
    CONSTRAINT ck_appeals_reason CHECK (char_length(reason) >= 20),
  status            text NOT NULL DEFAULT 'pending'
    CONSTRAINT ck_appeals_status CHECK (status IN ('pending', 'under_review', 'upheld', 'overturned')),
  reviewed_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  decision_reason   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  resolved_at       timestamptz,

  CONSTRAINT uq_appeals_action_appellant UNIQUE (action_id, appellant_id)
);

CREATE INDEX idx_appeals_status ON appeals(status) WHERE status = 'pending';

-- =============================================================================
-- 7. TABELLE NOTIFICHE
-- =============================================================================

-- ---------------------------------------------------------------------------
-- notifications: notifiche in-app
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           text NOT NULL,
  body            text NOT NULL,
  data            jsonb NOT NULL DEFAULT '{}',
  actor_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  memorial_id     uuid REFERENCES memorials(id) ON DELETE CASCADE,
  is_read         boolean NOT NULL DEFAULT false,
  read_at         timestamptz,
  email_sent      boolean NOT NULL DEFAULT false,
  email_sent_at   timestamptz,
  action_url      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_memorial ON notifications(memorial_id);
CREATE INDEX idx_notifications_email ON notifications(email_sent) WHERE email_sent = false;

-- ---------------------------------------------------------------------------
-- notification_preferences: preferenze notifiche
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel             text NOT NULL
    CONSTRAINT ck_notifprefs_channel CHECK (channel IN ('in_app', 'email', 'push')),
  notification_type   notification_type NOT NULL,
  enabled             boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_notifprefs_user_channel_type UNIQUE (user_id, channel, notification_type)
);

CREATE INDEX idx_notifprefs_user ON notification_preferences(user_id);

-- =============================================================================
-- 8. TABELLE AUDIT E LEGALI
-- =============================================================================

-- ---------------------------------------------------------------------------
-- audit_events: log di audit (append-only, immutabile)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_events (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_time      timestamptz NOT NULL DEFAULT now(),
  actor_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role      text,
  action          text NOT NULL,
  resource_type   text NOT NULL,
  resource_id     uuid,
  memorial_id     uuid,
  details         jsonb NOT NULL DEFAULT '{}',
  ip_address      inet,
  user_agent      text,
  severity        text NOT NULL DEFAULT 'info'
    CONSTRAINT ck_audit_severity CHECK (severity IN ('info', 'warning', 'critical'))
);

CREATE INDEX idx_audit_time ON audit_events(event_time DESC);
CREATE INDEX idx_audit_actor ON audit_events(actor_id, event_time DESC);
CREATE INDEX idx_audit_action ON audit_events(action, event_time DESC);
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_memorial ON audit_events(memorial_id, event_time DESC);

COMMENT ON TABLE audit_events IS
  'Log di audit append-only. Immutabile — nessun UPDATE o DELETE permesso via RLS.';

-- ---------------------------------------------------------------------------
-- legal_requests: richieste legali (GDPR, DMCA, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type        text NOT NULL
    CONSTRAINT ck_legal_type CHECK (request_type IN (
      'gdpr_access', 'gdpr_rectify', 'gdpr_erasure', 'gdpr_restrict',
      'gdpr_portability', 'dmca', 'court_order', 'other'
    )),
  requester_email     text NOT NULL,
  requester_name      text NOT NULL,
  requester_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  description         text NOT NULL,
  supporting_docs     jsonb NOT NULL DEFAULT '[]',
  status              text NOT NULL DEFAULT 'received'
    CONSTRAINT ck_legal_status CHECK (status IN ('received', 'under_review', 'fulfilled', 'rejected', 'escalated')),
  assigned_to         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  deadline_at         timestamptz,
  fulfilled_at        timestamptz,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_legal_status ON legal_requests(status)
  WHERE status IN ('received', 'under_review');
CREATE INDEX idx_legal_deadline ON legal_requests(deadline_at)
  WHERE fulfilled_at IS NULL;
CREATE INDEX idx_legal_requester ON legal_requests(requester_id);

-- ---------------------------------------------------------------------------
-- data_exports: esportazioni dati GDPR
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_exports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  legal_request_id  uuid REFERENCES legal_requests(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'requested'
    CONSTRAINT ck_export_status CHECK (status IN ('requested', 'generating', 'ready', 'expired', 'failed')),
  file_size         bigint,
  download_url      text,
  expires_at        timestamptz,
  requested_scope   jsonb NOT NULL DEFAULT '{}',
  completed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dataexports_user ON data_exports(user_id, created_at DESC);
CREATE INDEX idx_dataexports_status ON data_exports(status)
  WHERE status IN ('requested', 'generating');

-- ---------------------------------------------------------------------------
-- deletion_requests: richieste cancellazione
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deletion_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type     text NOT NULL
    CONSTRAINT ck_delreq_target CHECK (target_type IN ('account', 'memorial', 'content')),
  target_id       uuid,
  reason          text,
  scheduled_at    timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  status          text NOT NULL DEFAULT 'pending'
    CONSTRAINT ck_delreq_status CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  cancelled_at    timestamptz,
  cancelled_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_delreqs_pending ON deletion_requests(user_id, target_type, target_id)
  WHERE status = 'pending';
CREATE INDEX idx_delreqs_scheduled ON deletion_requests(scheduled_at)
  WHERE status = 'pending';
CREATE INDEX idx_delreqs_user ON deletion_requests(user_id);

-- =============================================================================
-- 9. TABELLE DI SERVIZIO
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ai_processing_jobs: job di elaborazione AI
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_processing_jobs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id         uuid REFERENCES memorials(id) ON DELETE CASCADE,
  content_type        text NOT NULL,
  content_id          uuid,
  job_type            text NOT NULL
    CONSTRAINT ck_aijobs_type CHECK (job_type IN (
      'summary', 'moderation', 'face_recognition', 'transcription', 'sentiment', 'tagging'
    )),
  status              text NOT NULL DEFAULT 'queued'
    CONSTRAINT ck_aijobs_status CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  input_data          jsonb NOT NULL DEFAULT '{}',
  output_data         jsonb NOT NULL DEFAULT '{}',
  error_message       text,
  processing_time_ms  integer
    CONSTRAINT ck_aijobs_time CHECK (processing_time_ms IS NULL OR processing_time_ms > 0),
  attempts            integer NOT NULL DEFAULT 0
    CONSTRAINT ck_aijobs_attempts CHECK (attempts >= 0),
  max_attempts        integer NOT NULL DEFAULT 3,
  scheduled_at        timestamptz NOT NULL DEFAULT now(),
  started_at          timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_aijobs_queued ON ai_processing_jobs(status, scheduled_at, id)
  WHERE status = 'queued';
CREATE INDEX idx_aijobs_memorial ON ai_processing_jobs(memorial_id);
CREATE INDEX idx_aijobs_content ON ai_processing_jobs(content_type, content_id);

-- ---------------------------------------------------------------------------
-- outbox_events: pattern Outbox per eventi asincroni
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outbox_events (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  topic           text NOT NULL,
  key             text NOT NULL,
  payload         jsonb NOT NULL,
  headers         jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'pending'
    CONSTRAINT ck_outbox_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts        integer NOT NULL DEFAULT 0
    CONSTRAINT ck_outbox_attempts CHECK (attempts >= 0),
  max_attempts    integer NOT NULL DEFAULT 3,
  error           text,
  processed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  scheduled_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_outbox_topic_key UNIQUE (topic, key)
);

CREATE INDEX idx_outbox_pending ON outbox_events(status, scheduled_at, id)
  WHERE status = 'pending';
CREATE INDEX idx_outbox_topic ON outbox_events(topic, status);

COMMENT ON TABLE outbox_events IS
  'Pattern Outbox per comunicazioni asincrone (notifiche, email, webhooks)';

-- ---------------------------------------------------------------------------
-- idempotency_keys: chiavi di idempotenza
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key               text NOT NULL,
  user_id           uuid REFERENCES profiles(id) ON DELETE CASCADE,
  scope             text NOT NULL,
  payload_hash      text NOT NULL,
  response_status   integer,
  response_body     jsonb,
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_idempotency_key_scope UNIQUE (key, scope)
);

CREATE INDEX idx_idempotency_lookup ON idempotency_keys(key, user_id, scope);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

COMMENT ON TABLE idempotency_keys IS
  'Chiavi di idempotenza per operazioni safe-at-least-once (POST, pagamenti, etc.)';


-- =============================================================================
-- 10. TRIGGER
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Trigger: update_updated_at su tutte le tabelle che lo richiedono
-- ---------------------------------------------------------------------------

CREATE TRIGGER tr_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- NOTA: user_consents e append-only. L'immutabilita e garantita dalle policy RLS
-- (nessun UPDATE permesso). Non serve un trigger per bloccare UPDATE.

CREATE TRIGGER tr_memorials_updated_at
  BEFORE UPDATE ON memorials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_memorial_guardians_updated_at
  BEFORE UPDATE ON memorial_guardians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_memorial_members_updated_at
  BEFORE UPDATE ON memorial_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_memorial_settings_updated_at
  BEFORE UPDATE ON memorial_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_relationship_claims_updated_at
  BEFORE UPDATE ON relationship_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_guardianship_claims_updated_at
  BEFORE UPDATE ON guardianship_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_guardianship_disputes_updated_at
  BEFORE UPDATE ON guardianship_disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_life_events_updated_at
  BEFORE UPDATE ON life_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_albums_updated_at
  BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_support_messages_updated_at
  BEFORE UPDATE ON support_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_content_reports_updated_at
  BEFORE UPDATE ON content_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_moderation_cases_updated_at
  BEFORE UPDATE ON moderation_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_appeals_updated_at
  BEFORE UPDATE ON appeals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_legal_requests_updated_at
  BEFORE UPDATE ON legal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_data_exports_updated_at
  BEFORE UPDATE ON data_exports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_deletion_requests_updated_at
  BEFORE UPDATE ON deletion_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_ai_processing_jobs_updated_at
  BEFORE UPDATE ON ai_processing_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: Full-Text Search
-- ---------------------------------------------------------------------------

CREATE TRIGGER tr_memorials_search_vector
  BEFORE INSERT OR UPDATE OF full_name, biography
  ON memorials
  FOR EACH ROW
  EXECUTE FUNCTION memorials_search_vector_update();

CREATE TRIGGER tr_posts_search_vector
  BEFORE INSERT OR UPDATE OF title, content
  ON posts
  FOR EACH ROW
  EXECUTE FUNCTION posts_search_vector_update();

-- ---------------------------------------------------------------------------
-- Trigger: aggiornamento counter reazioni su posts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET reaction_count = reaction_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_reactions_update_count
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

-- ---------------------------------------------------------------------------
-- Trigger: aggiornamento counter commenti su posts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' AND NEW.deleted_at IS NULL THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Cambio stato a published
    IF OLD.status <> 'published' AND NEW.status = 'published' AND NEW.deleted_at IS NULL THEN
      UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    -- Soft delete
    ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL AND NEW.status = 'published' THEN
      UPDATE posts SET comment_count = comment_count - 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' AND OLD.deleted_at IS NULL THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_comments_update_count
  AFTER INSERT OR UPDATE OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- ---------------------------------------------------------------------------
-- Trigger: aggiornamento counter album items
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_album_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE albums SET item_count = item_count + 1 WHERE id = NEW.album_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE albums SET item_count = item_count - 1 WHERE id = OLD.album_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_album_items_update_count
  AFTER INSERT OR DELETE ON album_items
  FOR EACH ROW EXECUTE FUNCTION update_album_item_count();

-- ---------------------------------------------------------------------------
-- Trigger: creazione automatica memorial_settings al CREATE memorial
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_create_memorial_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO memorial_settings (memorial_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_memorials_auto_settings
  AFTER INSERT ON memorials
  FOR EACH ROW EXECUTE FUNCTION auto_create_memorial_settings();

-- ---------------------------------------------------------------------------
-- Trigger: revisione automatica post al UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_save_post_revision()
RETURNS TRIGGER AS $$
BEGIN
  -- Salva revisione solo se contenuto e cambiato
  IF OLD.title IS DISTINCT FROM NEW.title OR OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO post_revisions (post_id, title, content, content_html, created_by)
    VALUES (OLD.id, OLD.title, OLD.content, OLD.content_html, coalesce(NEW.author_id, OLD.author_id));
    NEW.is_edited := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_posts_auto_revision
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION auto_save_post_revision();

-- ---------------------------------------------------------------------------
-- Trigger: revisione automatica comment al UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_save_comment_revision()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO comment_revisions (comment_id, content, created_by)
    VALUES (OLD.id, OLD.content, coalesce(OLD.author_id, NEW.author_id));
    NEW.is_edited := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_comments_auto_revision
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION auto_save_comment_revision();

-- ---------------------------------------------------------------------------
-- Trigger: creazione notifica su moderation action
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_on_moderation_action()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_memorial_id uuid;
BEGIN
  -- Cerca il proprietario del contenuto moderato
  SELECT memorial_id INTO v_memorial_id FROM moderation_cases WHERE id = NEW.case_id;

  INSERT INTO notifications (
    user_id, type, title, body, data, memorial_id
  ) VALUES (
    NEW.performed_by,
    'moderation_action',
    'Azione di moderazione eseguita',
    'E stata eseguita un''azione di moderazione sul contenuto segnalato.',
    jsonb_build_object('action_id', NEW.id, 'action_type', NEW.action_type),
    v_memorial_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_moderation_actions_notify
  AFTER INSERT ON moderation_actions
  FOR EACH ROW EXECUTE FUNCTION notify_on_moderation_action();

-- =============================================================================
-- 11. VIEWS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- memorials_with_stats: memoriali con contatori aggregati
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW memorials_with_stats AS
SELECT
  m.*,
  COUNT(DISTINCT p.id) AS post_count,
  COUNT(DISTINCT mg.user_id) AS guardian_count,
  COUNT(DISTINCT mm.user_id) AS member_count,
  COUNT(DISTINCT mf.user_id) AS follower_count
FROM memorials m
LEFT JOIN posts p ON p.memorial_id = m.id AND p.status = 'published' AND p.deleted_at IS NULL
LEFT JOIN memorial_guardians mg ON mg.memorial_id = m.id
LEFT JOIN memorial_members mm ON mm.memorial_id = m.id AND mm.status = 'approved'
LEFT JOIN memorial_follows mf ON mf.memorial_id = m.id
WHERE m.deleted_at IS NULL
GROUP BY m.id;

COMMENT ON VIEW memorials_with_stats IS
  'Memoriali con contatori aggregati per dashboard e liste';

-- ---------------------------------------------------------------------------
-- posts_with_author: post con informazioni autore denormalizzate
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW posts_with_author AS
SELECT
  p.*,
  pr.username AS author_username,
  pr.display_name AS author_display_name,
  pr.avatar_url AS author_avatar_url
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.author_id
WHERE p.deleted_at IS NULL;

COMMENT ON VIEW posts_with_author IS
  'Post con informazioni autore per evitare JOIN frequenti';

-- ---------------------------------------------------------------------------
-- memorial_members_with_profiles: membri con info profilo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW memorial_members_with_profiles AS
SELECT
  mm.*,
  pr.username,
  pr.display_name,
  pr.avatar_url
FROM memorial_members mm
LEFT JOIN profiles pr ON pr.id = mm.user_id;

COMMENT ON VIEW memorial_members_with_profiles IS
  'Membri memoriale con informazioni profilo';

-- =============================================================================
-- 12. FIX: aggiungi FK life_events -> media_assets (dopo creazione entrambe)
-- =============================================================================

ALTER TABLE life_events
  ADD CONSTRAINT fk_lifeevents_media
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id)
  ON DELETE SET NULL;

-- =============================================================================
-- MIGRAZIONE COMPLETATA
-- =============================================================================
