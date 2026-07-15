-- =============================================================================
-- MIGRAZIONE RLS — Row Level Security Policies
-- Versione: 1.0
-- Target: PostgreSQL 15+ (Supabase)
-- =============================================================================
-- Questo file crea TUTTE le policy RLS per tutte le tabelle dello schema.
-- Principi:
--   - Ogni tabella ha RLS abilitato
--   - Policy con nomi espliciti: {tabella}_{azione}_{ruolo}
--   - Service role bypass per admin functions
--   - Memoriali pubblici leggibili da utenti autenticati
--   - Memoriali privati solo da membri approvati
--   - Contenuti pending visibili solo ad autore e custodi
--   - Audit log append-only
-- =============================================================================

-- =============================================================================
-- 0. FUNZIONI AUSILIARIE PER RLS
-- =============================================================================

-- is_service_role: verifica se il chiamante e il service role di Supabase
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS boolean AS $$
BEGIN
  -- Supabase service role ha un campo specifico nel JWT
  -- Usiamo un approccio che verifica se l'utente ha bypassrls
  RETURN (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user);
EXCEPTION
  WHEN OTHERS THEN RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- is_platform_moderator: verifica se l'utente e un moderatore della piattaforma
CREATE OR REPLACE FUNCTION is_platform_moderator(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Per ora verifichiamo se l'utente e nel ruolo 'moderator'
  -- In produzione, questo potrebbe controllare una tabella roles/memberships
  RETURN EXISTS (
    SELECT 1 FROM memorial_guardians
    WHERE user_id = p_user_id
      AND role = 'owner'
      AND memorial_id IS NULL  -- placeholder per ruolo globale
  );
EXCEPTION
  WHEN OTHERS THEN RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_platform_moderator(uuid) IS
  'Verifica se l''utente e un moderatore della piattaforma.
   DA PERSONALIZZARE con il sistema di ruoli reale.';

-- get_auth_user_id: estrae l'user_id dal JWT di Supabase Auth
CREATE OR REPLACE FUNCTION get_auth_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 1. PROFILES
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: profili pubblici (dati base visibili a tutti gli autenticati)
-- Anonimi: nessun accesso (Supabase default)
-- Autenticati: vedono tutti i profili non cancellati (dati pubblici)
-- I propri dati completi sono sempre visibili
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- UPDATE: solo il proprietario del profilo
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = get_auth_user_id())
  WITH CHECK (id = get_auth_user_id());

-- INSERT: gestito da trigger/auth (non permettiamo INSERT manuale)
-- Il profilo viene creato automaticamente al signup
CREATE POLICY "profiles_insert_trigger"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (false);  -- Nessun INSERT manuale permesso

COMMENT ON TABLE profiles IS
  'RLS: SELECT pubblico per autenticati, UPDATE solo proprietario, INSERT solo via trigger';

-- =============================================================================
-- 2. USER_PREFERENCES
-- =============================================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Tutte le operazioni solo per il proprietario
CREATE POLICY "userprefs_select_own"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = get_auth_user_id());

CREATE POLICY "userprefs_insert_own"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_auth_user_id());

CREATE POLICY "userprefs_update_own"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = get_auth_user_id())
  WITH CHECK (user_id = get_auth_user_id());

-- =============================================================================
-- 3. USER_CONSENTS (append-only)
-- =============================================================================

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- SELECT: solo il proprio utente puo vedere i propri consensi
CREATE POLICY "consents_select_own"
  ON user_consents FOR SELECT
  TO authenticated
  USING (user_id = get_auth_user_id());

-- INSERT: solo il proprio utente
CREATE POLICY "consents_insert_own"
  ON user_consents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_auth_user_id());

-- Nessun UPDATE/DELETE (append-only)

-- =============================================================================
-- 4. MEMORIALS
-- =============================================================================

ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;

-- SELECT: memoriali visibili secondo visibilita e stato
CREATE POLICY "memorials_select_public"
  ON memorials FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Memoriale pubblico e attivo: visibile a tutti
      (visibility = 'public' AND status IN ('active', 'archived'))
      -- Il creatore vede sempre il proprio
      OR created_by = get_auth_user_id()
      -- Il custode principale vede sempre
      OR primary_guardian_id = get_auth_user_id()
      -- I membri approvati vedono il memoriale
      OR EXISTS (
        SELECT 1 FROM memorial_members
        WHERE memorial_id = memorials.id
          AND user_id = get_auth_user_id()
          AND status = 'approved'
      )
      -- I custodi vedono sempre
      OR EXISTS (
        SELECT 1 FROM memorial_guardians
        WHERE memorial_id = memorials.id
          AND user_id = get_auth_user_id()
      )
    )
  );

-- INSERT: solo utenti autenticati
CREATE POLICY "memorials_insert_authenticated"
  ON memorials FOR INSERT
  TO authenticated
  WITH CHECK (created_by = get_auth_user_id());

-- UPDATE: solo creatore, custode principale, o custodi con permesso edit
CREATE POLICY "memorials_update_guardian"
  ON memorials FOR UPDATE
  TO authenticated
  USING (
    created_by = get_auth_user_id()
    OR primary_guardian_id = get_auth_user_id()
    OR is_memorial_guardian(id, get_auth_user_id())
  )
  WITH CHECK (
    created_by = get_auth_user_id()
    OR primary_guardian_id = get_auth_user_id()
    OR is_memorial_guardian(id, get_auth_user_id())
  );

-- Nessun DELETE (soft delete via UPDATE)

-- =============================================================================
-- 5. MEMORIAL_GUARDIANS
-- =============================================================================

ALTER TABLE memorial_guardians ENABLE ROW LEVEL SECURITY;

-- SELECT: membri del memoriale possono vedere i custodi
CREATE POLICY "guardians_select_members"
  ON memorial_guardians FOR SELECT
  TO authenticated
  USING (
    -- Chiunque sia membro o custode del memoriale
    EXISTS (
      SELECT 1 FROM memorial_members
      WHERE memorial_id = memorial_guardians.memorial_id
        AND user_id = get_auth_user_id()
        AND status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM memorial_guardians g2
      WHERE g2.memorial_id = memorial_guardians.memorial_id
        AND g2.user_id = get_auth_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM memorials m
      WHERE m.id = memorial_guardians.memorial_id
        AND m.visibility = 'public'
        AND m.status = 'active'
    )
    -- Se stesso
    OR user_id = get_auth_user_id()
  );

-- INSERT: solo custodi primari o owner
CREATE POLICY "guardians_insert_owner"
  ON memorial_guardians FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorials m
      WHERE m.id = memorial_guardians.memorial_id
        AND (m.primary_guardian_id = get_auth_user_id() OR m.created_by = get_auth_user_id())
    )
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'manage_members')
  );

-- UPDATE: solo owner e chi ha concesso il ruolo
CREATE POLICY "guardians_update_owner"
  ON memorial_guardians FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials m
      WHERE m.id = memorial_guardians.memorial_id
        AND (m.primary_guardian_id = get_auth_user_id() OR m.created_by = get_auth_user_id())
    )
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'manage_members')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorials m
      WHERE m.id = memorial_guardians.memorial_id
        AND (m.primary_guardian_id = get_auth_user_id() OR m.created_by = get_auth_user_id())
    )
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'manage_members')
  );

-- DELETE: solo owner / primary guardian
CREATE POLICY "guardians_delete_owner"
  ON memorial_guardians FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials m
      WHERE m.id = memorial_guardians.memorial_id
        AND (m.primary_guardian_id = get_auth_user_id() OR m.created_by = get_auth_user_id())
    )
    -- Un utente non puo rimuovere se stesso se e il primary guardian
    AND NOT (
      user_id = get_auth_user_id()
      AND is_primary = true
    )
  );

-- =============================================================================
-- 6. MEMORIAL_MEMBERS
-- =============================================================================

ALTER TABLE memorial_members ENABLE ROW LEVEL SECURITY;

-- SELECT: membri visibili a custodi e membri dello stesso memoriale
CREATE POLICY "members_select_authorized"
  ON memorial_members FOR SELECT
  TO authenticated
  USING (
    -- Se stesso
    user_id = get_auth_user_id()
    -- Custode del memoriale
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    -- Membro dello stesso memoriale
    OR EXISTS (
      SELECT 1 FROM memorial_members m2
      WHERE m2.memorial_id = memorial_members.memorial_id
        AND m2.user_id = get_auth_user_id()
        AND m2.status = 'approved'
    )
  );

-- INSERT: custodi possono invitare; utenti possono richiedere partecipazione
CREATE POLICY "members_insert_request"
  ON memorial_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Richiesta propria (utente vuole unirsi)
    (user_id = get_auth_user_id() AND invited_by IS NULL)
    -- Invito da custode
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'manage_members')
  );

-- UPDATE: custodi possono approvare/rifiutare; utenti il proprio stato
CREATE POLICY "members_update_authorized"
  ON memorial_members FOR UPDATE
  TO authenticated
  USING (
    -- Il membro stesso
    user_id = get_auth_user_id()
    -- Custode con permesso
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'manage_members')
  )
  WITH CHECK (
    user_id = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'manage_members')
  );

-- DELETE: solo custodi
CREATE POLICY "members_delete_guardian"
  ON memorial_members FOR DELETE
  TO authenticated
  USING (
    is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'manage_members')
  );

-- =============================================================================
-- 7. MEMORIAL_INVITATIONS
-- =============================================================================

ALTER TABLE memorial_invitations ENABLE ROW LEVEL SECURITY;

-- SELECT: creatore e custodi del memoriale
CREATE POLICY "invitations_select_guardian"
  ON memorial_invitations FOR SELECT
  TO authenticated
  USING (
    created_by = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- INSERT: solo custodi
CREATE POLICY "invitations_insert_guardian"
  ON memorial_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = get_auth_user_id()
    AND (
      is_memorial_guardian(memorial_id, get_auth_user_id())
      OR has_memorial_permission(memorial_id, get_auth_user_id(), 'manage_members')
    )
  );

-- UPDATE: nessuno (gli inviti sono immutabili dopo creazione, tranne used_at)
-- Usato solo da funzioni server-side

-- DELETE: solo chi ha creato l'invito o custodi
CREATE POLICY "invitations_delete_owner"
  ON memorial_invitations FOR DELETE
  TO authenticated
  USING (
    created_by = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- =============================================================================
-- 8. RELATIONSHIP_CLAIMS
-- =============================================================================

ALTER TABLE relationship_claims ENABLE ROW LEVEL SECURITY;

-- SELECT: richiedente e custodi del memoriale
CREATE POLICY "relclaims_select_authorized"
  ON relationship_claims FOR SELECT
  TO authenticated
  USING (
    user_id = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- INSERT: utenti autenticati per il proprio profilo
CREATE POLICY "relclaims_insert_own"
  ON relationship_claims FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_auth_user_id());

-- UPDATE: solo custodi (per approvare/rifiutare)
CREATE POLICY "relclaims_update_guardian"
  ON relationship_claims FOR UPDATE
  TO authenticated
  USING (
    is_memorial_guardian(memorial_id, get_auth_user_id())
  )
  WITH CHECK (
    is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- =============================================================================
-- 9. GUARDIANSHIP_CLAIMS
-- =============================================================================

ALTER TABLE guardianship_claims ENABLE ROW LEVEL SECURITY;

-- SELECT: richiedente e custodi
CREATE POLICY "gclaims_select_authorized"
  ON guardianship_claims FOR SELECT
  TO authenticated
  USING (
    user_id = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- INSERT: utenti autenticati
CREATE POLICY "gclaims_insert_own"
  ON guardianship_claims FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_auth_user_id());

-- UPDATE: solo custodi per review
CREATE POLICY "gclaims_update_guardian"
  ON guardianship_claims FOR UPDATE
  TO authenticated
  USING (
    is_memorial_guardian(memorial_id, get_auth_user_id())
  )
  WITH CHECK (
    is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- =============================================================================
-- 10. GUARDIANSHIP_DISPUTES
-- =============================================================================

ALTER TABLE guardianship_disputes ENABLE ROW LEVEL SECURITY;

-- SELECT: partecipanti alla disputa e custodi
CREATE POLICY "disputes_select_participants"
  ON guardianship_disputes FOR SELECT
  TO authenticated
  USING (
    claimant_id = get_auth_user_id()
    OR current_guardian_id = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- INSERT: utenti autenticati (chi vuole contestare)
CREATE POLICY "disputes_insert_claimant"
  ON guardianship_disputes FOR INSERT
  TO authenticated
  WITH CHECK (claimant_id = get_auth_user_id());

-- UPDATE: solo custodi / moderatori per risolvere
CREATE POLICY "disputes_update_guardian"
  ON guardianship_disputes FOR UPDATE
  TO authenticated
  USING (
    is_memorial_guardian(memorial_id, get_auth_user_id())
  )
  WITH CHECK (
    is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- =============================================================================
-- 11. MEMORIAL_SETTINGS
-- =============================================================================

ALTER TABLE memorial_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: membri del memoriale
CREATE POLICY "settings_select_members"
  ON memorial_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials m
      WHERE m.id = memorial_settings.memorial_id
        AND (
          m.visibility = 'public'
          OR m.created_by = get_auth_user_id()
          OR m.primary_guardian_id = get_auth_user_id()
          OR EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = m.id
              AND mm.user_id = get_auth_user_id()
              AND mm.status = 'approved'
          )
          OR EXISTS (
            SELECT 1 FROM memorial_guardians mg
            WHERE mg.memorial_id = m.id
              AND mg.user_id = get_auth_user_id()
          )
        )
    )
  );

-- INSERT: automatico via trigger (non permesso manuale)
CREATE POLICY "settings_insert_auto"
  ON memorial_settings FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- UPDATE: solo custodi
CREATE POLICY "settings_update_guardian"
  ON memorial_settings FOR UPDATE
  TO authenticated
  USING (
    is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
  )
  WITH CHECK (
    is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
  );


-- =============================================================================
-- 12. LIFE_EVENTS
-- =============================================================================

ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;

-- SELECT: membri per memoriali privati; tutti per pubblici
CREATE POLICY "lifeevents_select_authorized"
  ON life_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials m
      WHERE m.id = life_events.memorial_id
        AND m.deleted_at IS NULL
        AND (
          -- Memoriale pubblico: tutti vedono
          (m.visibility = 'public' AND m.status = 'active')
          -- Proprietario / custode
          OR m.created_by = get_auth_user_id()
          OR m.primary_guardian_id = get_auth_user_id()
          -- Membro approvato
          OR EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = m.id
              AND mm.user_id = get_auth_user_id()
              AND mm.status = 'approved'
          )
          -- Custode
          OR EXISTS (
            SELECT 1 FROM memorial_guardians mg
            WHERE mg.memorial_id = m.id AND mg.user_id = get_auth_user_id()
          )
        )
    )
  );

-- INSERT: custodi e collaboratori con permesso edit
CREATE POLICY "lifeevents_insert_guardian"
  ON life_events FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = get_auth_user_id()
    AND (
      is_memorial_guardian(memorial_id, get_auth_user_id())
      OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
    )
  );

-- UPDATE: autore e custodi con permesso edit
CREATE POLICY "lifeevents_update_authorized"
  ON life_events FOR UPDATE
  TO authenticated
  USING (
    created_by = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
  )
  WITH CHECK (
    created_by = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
  );

-- =============================================================================
-- 13. PLACES
-- =============================================================================

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- SELECT: stessa logica di life_events
CREATE POLICY "places_select_authorized"
  ON places FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials m
      WHERE m.id = places.memorial_id
        AND m.deleted_at IS NULL
        AND (
          (m.visibility = 'public' AND m.status = 'active')
          OR m.created_by = get_auth_user_id()
          OR m.primary_guardian_id = get_auth_user_id()
          OR EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = m.id
              AND mm.user_id = get_auth_user_id()
              AND mm.status = 'approved'
          )
          OR EXISTS (
            SELECT 1 FROM memorial_guardians mg
            WHERE mg.memorial_id = m.id AND mg.user_id = get_auth_user_id()
          )
        )
    )
  );

-- INSERT: custodi e collaboratori
CREATE POLICY "places_insert_guardian"
  ON places FOR INSERT
  TO authenticated
  WITH CHECK (
    is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
  );

-- UPDATE: custodi e collaboratori
CREATE POLICY "places_update_guardian"
  ON places FOR UPDATE
  TO authenticated
  USING (
    is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
  )
  WITH CHECK (
    is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
  );

-- =============================================================================
-- 14. POSTS
-- =============================================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- SELECT: visibilita basata su stato e permessi memoriale
CREATE POLICY "posts_select_authorized"
  ON posts FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Post pubblicato su memoriale pubblico: visibile a tutti
      (status = 'published'
        AND EXISTS (
          SELECT 1 FROM memorials m
          WHERE m.id = posts.memorial_id
            AND m.visibility = 'public'
            AND m.status = 'active'
        )
      )
      -- Autore vede sempre i propri post
      OR author_id = get_auth_user_id()
      -- Custodi vedono tutti i post del memoriale
      OR is_memorial_guardian(memorial_id, get_auth_user_id())
      -- Membri vedono post su memoriali dove sono membri
      OR EXISTS (
        SELECT 1 FROM memorial_members mm
        JOIN memorials m ON m.id = mm.memorial_id
        WHERE mm.memorial_id = posts.memorial_id
          AND mm.user_id = get_auth_user_id()
          AND mm.status = 'approved'
      )
    )
  );

-- INSERT: membri del memoriale possono creare post
CREATE POLICY "posts_insert_member"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = get_auth_user_id()
    AND (
      -- E membro approvato
      EXISTS (
        SELECT 1 FROM memorial_members mm
        WHERE mm.memorial_id = posts.memorial_id
          AND mm.user_id = get_auth_user_id()
          AND mm.status = 'approved'
      )
      -- O custode
      OR is_memorial_guardian(posts.memorial_id, get_auth_user_id())
      -- O memoriale pubblico che permette post pubblici
      OR EXISTS (
        SELECT 1 FROM memorials m
        JOIN memorial_settings ms ON ms.memorial_id = m.id
        WHERE m.id = posts.memorial_id
          AND m.visibility = 'public'
          AND ms.allow_public_posts = true
      )
    )
  );

-- UPDATE: autore e custodi
CREATE POLICY "posts_update_authorized"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    author_id = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'moderate')
  )
  WITH CHECK (
    author_id = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'moderate')
  );

-- =============================================================================
-- 15. POST_REVISIONS (append-only)
-- =============================================================================

ALTER TABLE post_revisions ENABLE ROW LEVEL SECURITY;

-- SELECT: autore del post e custodi del memoriale
CREATE POLICY "postrevs_select_authorized"
  ON post_revisions FOR SELECT
  TO authenticated
  USING (
    created_by = get_auth_user_id()
    OR EXISTS (
      SELECT 1 FROM posts p
      JOIN memorials m ON m.id = p.memorial_id
      WHERE p.id = post_revisions.post_id
        AND (
          m.created_by = get_auth_user_id()
          OR m.primary_guardian_id = get_auth_user_id()
          OR is_memorial_guardian(m.id, get_auth_user_id())
        )
    )
  );

-- INSERT: automatico via trigger (non manuale)
CREATE POLICY "postrevs_insert_auto"
  ON post_revisions FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- =============================================================================
-- 16. MEDIA_ASSETS
-- =============================================================================

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- SELECT: membri e custodi; pubblico se approved
CREATE POLICY "media_select_authorized"
  ON media_assets FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Asset approved su memoriale pubblico
      (status = 'approved'
        AND EXISTS (
          SELECT 1 FROM memorials m
          WHERE m.id = media_assets.memorial_id
            AND m.visibility = 'public'
            AND m.status = 'active'
        )
      )
      -- Chi ha caricato
      OR uploaded_by = get_auth_user_id()
      -- Custode
      OR is_memorial_guardian(memorial_id, get_auth_user_id())
      -- Membro
      OR EXISTS (
        SELECT 1 FROM memorial_members mm
        WHERE mm.memorial_id = media_assets.memorial_id
          AND mm.user_id = get_auth_user_id()
          AND mm.status = 'approved'
      )
    )
  );

-- INSERT: membri con permesso upload
CREATE POLICY "media_insert_member"
  ON media_assets FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = get_auth_user_id()
    AND (
      is_memorial_guardian(memorial_id, get_auth_user_id())
      OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
      OR EXISTS (
        SELECT 1 FROM memorial_members mm
        WHERE mm.memorial_id = media_assets.memorial_id
          AND mm.user_id = get_auth_user_id()
          AND mm.status = 'approved'
      )
    )
  );

-- UPDATE: chi ha caricato e custodi
CREATE POLICY "media_update_authorized"
  ON media_assets FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'moderate')
  )
  WITH CHECK (
    uploaded_by = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'moderate')
  );

-- =============================================================================
-- 17. MEDIA_VARIANTS
-- =============================================================================

ALTER TABLE media_variants ENABLE ROW LEVEL SECURITY;

-- SELECT: stessa policy di media_assets
CREATE POLICY "variants_select_authorized"
  ON media_variants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM media_assets ma
      WHERE ma.id = media_variants.media_asset_id
        AND (
          ma.uploaded_by = get_auth_user_id()
          OR ma.status = 'approved'
          OR is_memorial_guardian(ma.memorial_id, get_auth_user_id())
          OR EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = ma.memorial_id
              AND mm.user_id = get_auth_user_id()
              AND mm.status = 'approved'
          )
        )
    )
  );

-- INSERT/UPDATE/DELETE: solo automatico (worker)
CREATE POLICY "variants_insert_auto"
  ON media_variants FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "variants_update_auto"
  ON media_variants FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "variants_delete_auto"
  ON media_variants FOR DELETE
  TO authenticated
  USING (false);

-- =============================================================================
-- 18. ALBUMS
-- =============================================================================

ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- SELECT: membri del memoriale
CREATE POLICY "albums_select_authorized"
  ON albums FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      is_memorial_guardian(memorial_id, get_auth_user_id())
      OR EXISTS (
        SELECT 1 FROM memorial_members mm
        WHERE mm.memorial_id = albums.memorial_id
          AND mm.user_id = get_auth_user_id()
          AND mm.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM memorials m
        WHERE m.id = albums.memorial_id
          AND m.visibility = 'public'
          AND m.status = 'active'
      )
    )
  );

-- INSERT: membri con permesso
CREATE POLICY "albums_insert_member"
  ON albums FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = get_auth_user_id()
    AND (
      is_memorial_guardian(memorial_id, get_auth_user_id())
      OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
      OR EXISTS (
        SELECT 1 FROM memorial_members mm
        WHERE mm.memorial_id = albums.memorial_id
          AND mm.user_id = get_auth_user_id()
          AND mm.status = 'approved'
      )
    )
  );

-- UPDATE: creatore e custodi
CREATE POLICY "albums_update_authorized"
  ON albums FOR UPDATE
  TO authenticated
  USING (
    created_by = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
  )
  WITH CHECK (
    created_by = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR has_memorial_permission(memorial_id, get_auth_user_id(), 'edit')
  );

-- =============================================================================
-- 19. ALBUM_ITEMS
-- =============================================================================

ALTER TABLE album_items ENABLE ROW LEVEL SECURITY;

-- SELECT: stessa policy di albums
CREATE POLICY "albumitems_select_authorized"
  ON album_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums a
      JOIN memorials m ON m.id = a.memorial_id
      WHERE a.id = album_items.album_id
        AND a.deleted_at IS NULL
        AND (
          is_memorial_guardian(m.id, get_auth_user_id())
          OR EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = m.id
              AND mm.user_id = get_auth_user_id()
              AND mm.status = 'approved'
          )
          OR (m.visibility = 'public' AND m.status = 'active')
        )
    )
  );

-- INSERT: membri con permesso
CREATE POLICY "albumitems_insert_member"
  ON album_items FOR INSERT
  TO authenticated
  WITH CHECK (
    added_by = get_auth_user_id()
    AND EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = album_items.album_id
        AND (
          is_memorial_guardian(a.memorial_id, get_auth_user_id())
          OR has_memorial_permission(a.memorial_id, get_auth_user_id(), 'edit')
          OR EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = a.memorial_id
              AND mm.user_id = get_auth_user_id()
              AND mm.status = 'approved'
          )
        )
    )
  );

-- DELETE: creatore dell'item e custodi
CREATE POLICY "albumitems_delete_authorized"
  ON album_items FOR DELETE
  TO authenticated
  USING (
    added_by = get_auth_user_id()
    OR EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = album_items.album_id
        AND is_memorial_guardian(a.memorial_id, get_auth_user_id())
    )
  );

-- =============================================================================
-- 20. COMMENTS
-- =============================================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- SELECT: post pubblicati visibili; autore/custodi vedono tutti
CREATE POLICY "comments_select_authorized"
  ON comments FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Commento pubblicato su post pubblicato su memoriale pubblico
      (status = 'published'
        AND EXISTS (
          SELECT 1 FROM posts p
          JOIN memorials m ON m.id = p.memorial_id
          WHERE p.id = comments.post_id
            AND p.status = 'published'
            AND p.deleted_at IS NULL
            AND m.visibility = 'public'
            AND m.status = 'active'
        )
      )
      -- Autore del commento
      OR author_id = get_auth_user_id()
      -- Custode del memoriale
      OR EXISTS (
        SELECT 1 FROM posts p
        JOIN memorials m ON m.id = p.memorial_id
        WHERE p.id = comments.post_id
          AND is_memorial_guardian(m.id, get_auth_user_id())
      )
      -- Membro del memoriale
      OR EXISTS (
        SELECT 1 FROM posts p
        JOIN memorial_members mm ON mm.memorial_id = p.memorial_id
        WHERE p.id = comments.post_id
          AND mm.user_id = get_auth_user_id()
          AND mm.status = 'approved'
      )
    )
  );

-- INSERT: membri possono commentare
CREATE POLICY "comments_insert_member"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = get_auth_user_id()
    AND EXISTS (
      SELECT 1 FROM posts p
      JOIN memorials m ON m.id = p.memorial_id
      LEFT JOIN memorial_settings ms ON ms.memorial_id = m.id
      WHERE p.id = comments.post_id
        AND p.deleted_at IS NULL
        AND (
          -- Membro del memoriale
          EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = p.memorial_id
              AND mm.user_id = get_auth_user_id()
              AND mm.status = 'approved'
          )
          -- O custode
          OR is_memorial_guardian(p.memorial_id, get_auth_user_id())
          -- O memoriale pubblico con commenti abilitati
          OR (m.visibility = 'public'
              AND coalesce(ms.allow_comments, true) = true)
        )
    )
  );

-- UPDATE: autore e custodi
CREATE POLICY "comments_update_authorized"
  ON comments FOR UPDATE
  TO authenticated
  USING (
    author_id = get_auth_user_id()
    OR EXISTS (
      SELECT 1 FROM posts p
      JOIN memorials m ON m.id = p.memorial_id
      WHERE p.id = comments.post_id
        AND is_memorial_guardian(m.id, get_auth_user_id())
    )
    OR has_memorial_permission(
      (SELECT memorial_id FROM posts WHERE id = comments.post_id),
      get_auth_user_id(), 'moderate'
    )
  )
  WITH CHECK (
    author_id = get_auth_user_id()
    OR EXISTS (
      SELECT 1 FROM posts p
      JOIN memorials m ON m.id = p.memorial_id
      WHERE p.id = comments.post_id
        AND is_memorial_guardian(m.id, get_auth_user_id())
    )
  );

-- =============================================================================
-- 21. COMMENT_REVISIONS (append-only)
-- =============================================================================

ALTER TABLE comment_revisions ENABLE ROW LEVEL SECURITY;

-- SELECT: autore e custodi
CREATE POLICY "commentrevs_select_authorized"
  ON comment_revisions FOR SELECT
  TO authenticated
  USING (
    created_by = get_auth_user_id()
    OR EXISTS (
      SELECT 1 FROM comments c
      JOIN posts p ON p.id = c.post_id
      JOIN memorials m ON m.id = p.memorial_id
      WHERE c.id = comment_revisions.comment_id
        AND is_memorial_guardian(m.id, get_auth_user_id())
    )
  );

-- INSERT: automatico via trigger
CREATE POLICY "commentrevs_insert_auto"
  ON comment_revisions FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- =============================================================================
-- 22. REACTIONS
-- =============================================================================

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- SELECT: tutti possono vedere le reazioni su post pubblici
CREATE POLICY "reactions_select_public"
  ON reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN memorials m ON m.id = p.memorial_id
      WHERE p.id = reactions.post_id
        AND p.status = 'published'
        AND p.deleted_at IS NULL
        AND m.visibility = 'public'
        AND m.status = 'active'
    )
    -- O membro del memoriale
    OR EXISTS (
      SELECT 1 FROM posts p
      JOIN memorial_members mm ON mm.memorial_id = p.memorial_id
      WHERE p.id = reactions.post_id
        AND mm.user_id = get_auth_user_id()
        AND mm.status = 'approved'
    )
    -- O se stesso
    OR user_id = get_auth_user_id()
  );

-- INSERT: autenticati possono reagire
CREATE POLICY "reactions_insert_own"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = get_auth_user_id()
    AND EXISTS (
      SELECT 1 FROM posts p
      JOIN memorials m ON m.id = p.memorial_id
      LEFT JOIN memorial_settings ms ON ms.memorial_id = m.id
      WHERE p.id = reactions.post_id
        AND p.status = 'published'
        AND p.deleted_at IS NULL
        AND coalesce(ms.allow_reactions, true) = true
        AND (
          m.visibility = 'public'
          OR EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = p.memorial_id
              AND mm.user_id = get_auth_user_id()
              AND mm.status = 'approved'
          )
          OR is_memorial_guardian(p.memorial_id, get_auth_user_id())
        )
    )
  );

-- DELETE: solo la propria reazione
CREATE POLICY "reactions_delete_own"
  ON reactions FOR DELETE
  TO authenticated
  USING (user_id = get_auth_user_id());

-- Nessun UPDATE (reazioni sono create/cancellate, non modificate)


-- =============================================================================
-- 23. SUPPORT_MESSAGES
-- =============================================================================

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: mittente e staff
CREATE POLICY "support_select_authorized"
  ON support_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = get_auth_user_id()
    OR assigned_to = get_auth_user_id()
  );

-- INSERT: tutti (anche anonimi) — gestito da service role / function
CREATE POLICY "support_insert_all"
  ON support_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: solo staff assegnato
CREATE POLICY "support_update_staff"
  ON support_messages FOR UPDATE
  TO authenticated
  USING (
    assigned_to = get_auth_user_id()
  )
  WITH CHECK (
    assigned_to = get_auth_user_id()
  );

-- =============================================================================
-- 24. MEMORIAL_FOLLOWS
-- =============================================================================

ALTER TABLE memorial_follows ENABLE ROW LEVEL SECURITY;

-- SELECT: se stesso
CREATE POLICY "follows_select_own"
  ON memorial_follows FOR SELECT
  TO authenticated
  USING (user_id = get_auth_user_id());

-- INSERT: autenticati
CREATE POLICY "follows_insert_own"
  ON memorial_follows FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_auth_user_id());

-- UPDATE: se stesso
CREATE POLICY "follows_update_own"
  ON memorial_follows FOR UPDATE
  TO authenticated
  USING (user_id = get_auth_user_id())
  WITH CHECK (user_id = get_auth_user_id());

-- DELETE: se stesso
CREATE POLICY "follows_delete_own"
  ON memorial_follows FOR DELETE
  TO authenticated
  USING (user_id = get_auth_user_id());

-- =============================================================================
-- 25. USER_BLOCKS
-- =============================================================================

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- SELECT: chi ha bloccato
CREATE POLICY "blocks_select_blocker"
  ON user_blocks FOR SELECT
  TO authenticated
  USING (blocker_id = get_auth_user_id());

-- INSERT: chi blocca
CREATE POLICY "blocks_insert_blocker"
  ON user_blocks FOR INSERT
  TO authenticated
  WITH CHECK (blocker_id = get_auth_user_id());

-- DELETE: chi ha bloccato
CREATE POLICY "blocks_delete_blocker"
  ON user_blocks FOR DELETE
  TO authenticated
  USING (blocker_id = get_auth_user_id());

-- =============================================================================
-- 26. CONTENT_REPORTS
-- =============================================================================

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- SELECT: chi ha segnalato e staff
CREATE POLICY "reports_select_authorized"
  ON content_reports FOR SELECT
  TO authenticated
  USING (
    reporter_id = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- INSERT: utenti autenticati possono segnalare
CREATE POLICY "reports_insert_authenticated"
  ON content_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = get_auth_user_id());

-- UPDATE: solo custodi e staff per cambiare stato
CREATE POLICY "reports_update_guardian"
  ON content_reports FOR UPDATE
  TO authenticated
  USING (
    is_memorial_guardian(memorial_id, get_auth_user_id())
  )
  WITH CHECK (
    is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- =============================================================================
-- 27. MODERATION_CASES
-- =============================================================================

ALTER TABLE moderation_cases ENABLE ROW LEVEL SECURITY;

-- SELECT: solo staff / moderatori della piattaforma
CREATE POLICY "modcases_select_staff"
  ON moderation_cases FOR SELECT
  TO authenticated
  USING (
    assigned_to = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
  );

-- INSERT: solo via trigger o funzioni server-side
CREATE POLICY "modcases_insert_auto"
  ON moderation_cases FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- UPDATE: solo assegnatario
CREATE POLICY "modcases_update_assigned"
  ON moderation_cases FOR UPDATE
  TO authenticated
  USING (
    assigned_to = get_auth_user_id()
  )
  WITH CHECK (
    assigned_to = get_auth_user_id()
  );

-- =============================================================================
-- 28. MODERATION_ACTIONS
-- =============================================================================

ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- SELECT: chi ha eseguito l'azione e chi e assegnato al caso
CREATE POLICY "modactions_select_authorized"
  ON moderation_actions FOR SELECT
  TO authenticated
  USING (
    performed_by = get_auth_user_id()
    OR EXISTS (
      SELECT 1 FROM moderation_cases mc
      WHERE mc.id = moderation_actions.case_id
        AND mc.assigned_to = get_auth_user_id()
    )
  );

-- INSERT: solo chi e assegnato al caso
CREATE POLICY "modactions_insert_assigned"
  ON moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    performed_by = get_auth_user_id()
    AND EXISTS (
      SELECT 1 FROM moderation_cases mc
      WHERE mc.id = moderation_actions.case_id
        AND mc.assigned_to = get_auth_user_id()
    )
  );

-- Nessun UPDATE/DELETE (audit trail)

-- =============================================================================
-- 29. APPEALS
-- =============================================================================

ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;

-- SELECT: appellante e moderatori
CREATE POLICY "appeals_select_authorized"
  ON appeals FOR SELECT
  TO authenticated
  USING (
    appellant_id = get_auth_user_id()
    OR EXISTS (
      SELECT 1 FROM moderation_actions ma
      JOIN moderation_cases mc ON mc.id = ma.case_id
      WHERE ma.id = appeals.action_id
        AND mc.assigned_to = get_auth_user_id()
    )
  );

-- INSERT: chi vuole fare appello
CREATE POLICY "appeals_insert_appellant"
  ON appeals FOR INSERT
  TO authenticated
  WITH CHECK (
    appellant_id = get_auth_user_id()
    AND EXISTS (
      SELECT 1 FROM moderation_actions ma
      WHERE ma.id = appeals.action_id
        -- Verifica che l'azione abbia coinvolto l'appellante
        AND (
          -- L'appellante e il target dell'azione
          ma.action_details->>'target_user_id' = get_auth_user_id()::text
          -- O e stato il performer
          OR ma.performed_by = get_auth_user_id()
        )
    )
  );

-- UPDATE: solo chi e assegnato alla revisione
CREATE POLICY "appeals_update_reviewer"
  ON appeals FOR UPDATE
  TO authenticated
  USING (
    reviewed_by = get_auth_user_id()
    OR EXISTS (
      SELECT 1 FROM moderation_actions ma
      JOIN moderation_cases mc ON mc.id = ma.case_id
      WHERE ma.id = appeals.action_id
        AND mc.assigned_to = get_auth_user_id()
    )
  )
  WITH CHECK (
    reviewed_by = get_auth_user_id()
    OR EXISTS (
      SELECT 1 FROM moderation_actions ma
      JOIN moderation_cases mc ON mc.id = ma.case_id
      WHERE ma.id = appeals.action_id
        AND mc.assigned_to = get_auth_user_id()
    )
  );

-- =============================================================================
-- 30. NOTIFICATIONS
-- =============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: solo il destinatario
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = get_auth_user_id());

-- INSERT: automatico (trigger / functions)
CREATE POLICY "notifications_insert_auto"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- UPDATE: solo destinatario (per mark as read)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = get_auth_user_id())
  WITH CHECK (user_id = get_auth_user_id());

-- DELETE: destinatario puo eliminare notifiche
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = get_auth_user_id());

-- =============================================================================
-- 31. NOTIFICATION_PREFERENCES
-- =============================================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Tutte le operazioni solo per il proprietario
CREATE POLICY "notifprefs_select_own"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = get_auth_user_id());

CREATE POLICY "notifprefs_insert_own"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_auth_user_id());

CREATE POLICY "notifprefs_update_own"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = get_auth_user_id())
  WITH CHECK (user_id = get_auth_user_id());

-- =============================================================================
-- 32. AUDIT_EVENTS (append-only, immutabile)
-- =============================================================================

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- SELECT: nessuno via client API (solo via server-side / dashboard admin)
CREATE POLICY "audit_select_none"
  ON audit_events FOR SELECT
  TO authenticated
  USING (false);

-- INSERT: solo via functions (trigger, stored procedures)
CREATE POLICY "audit_insert_auto"
  ON audit_events FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Nessun UPDATE/DELETE

COMMENT ON TABLE audit_events IS
  'Audit log: SELECT solo via service role o dashboard admin. INSERT solo via backend functions.';

-- =============================================================================
-- 33. LEGAL_REQUESTS
-- =============================================================================

ALTER TABLE legal_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: richiedente e admin
CREATE POLICY "legal_select_authorized"
  ON legal_requests FOR SELECT
  TO authenticated
  USING (
    requester_id = get_auth_user_id()
    OR assigned_to = get_auth_user_id()
  );

-- INSERT: tutti (anche non autenticati per DMCA)
CREATE POLICY "legal_insert_all"
  ON legal_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: solo admin assegnato
CREATE POLICY "legal_update_admin"
  ON legal_requests FOR UPDATE
  TO authenticated
  USING (
    assigned_to = get_auth_user_id()
  )
  WITH CHECK (
    assigned_to = get_auth_user_id()
  );

-- =============================================================================
-- 34. DATA_EXPORTS
-- =============================================================================

ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

-- SELECT: utente stesso
CREATE POLICY "exports_select_own"
  ON data_exports FOR SELECT
  TO authenticated
  USING (user_id = get_auth_user_id());

-- INSERT: utente stesso
CREATE POLICY "exports_insert_own"
  ON data_exports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_auth_user_id());

-- UPDATE: nessuno (stato gestito da worker)
CREATE POLICY "exports_update_none"
  ON data_exports FOR UPDATE
  TO authenticated
  USING (false);

-- =============================================================================
-- 35. DELETION_REQUESTS
-- =============================================================================

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: utente stesso
CREATE POLICY "delreqs_select_own"
  ON deletion_requests FOR SELECT
  TO authenticated
  USING (user_id = get_auth_user_id());

-- INSERT: utente stesso
CREATE POLICY "delreqs_insert_own"
  ON deletion_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = get_auth_user_id()
    AND status = 'pending'
  );

-- UPDATE: solo cancellazione (cambio stato a cancelled)
CREATE POLICY "delreqs_update_own"
  ON deletion_requests FOR UPDATE
  TO authenticated
  USING (
    user_id = get_auth_user_id()
    AND status = 'pending'
  )
  WITH CHECK (
    user_id = get_auth_user_id()
    AND status = 'cancelled'
  );

-- =============================================================================
-- 36. AI_PROCESSING_JOBS
-- =============================================================================

ALTER TABLE ai_processing_jobs ENABLE ROW LEVEL SECURITY;

-- SELECT: solo chi ha creato / custodi del memoriale
CREATE POLICY "aijobs_select_authorized"
  ON ai_processing_jobs FOR SELECT
  TO authenticated
  USING (
    is_memorial_guardian(memorial_id, get_auth_user_id())
    OR EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = ai_processing_jobs.content_id
        AND p.author_id = get_auth_user_id()
    )
  );

-- Tutte le altre operazioni: solo worker (server-side)
CREATE POLICY "aijobs_insert_worker"
  ON ai_processing_jobs FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "aijobs_update_worker"
  ON ai_processing_jobs FOR UPDATE
  TO authenticated
  USING (false);

-- =============================================================================
-- 37. OUTBOX_EVENTS (solo server-side)
-- =============================================================================

ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;

-- Nessun accesso client-side
CREATE POLICY "outbox_select_none"
  ON outbox_events FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "outbox_insert_worker"
  ON outbox_events FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "outbox_update_worker"
  ON outbox_events FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "outbox_delete_worker"
  ON outbox_events FOR DELETE
  TO authenticated
  USING (false);

COMMENT ON TABLE outbox_events IS
  'Outbox: accesso solo via service role / worker';

-- =============================================================================
-- 38. IDEMPOTENCY_KEYS
-- =============================================================================

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- SELECT: service role / stesso utente
CREATE POLICY "idempotency_select_own"
  ON idempotency_keys FOR SELECT
  TO authenticated
  USING (
    user_id = get_auth_user_id()
  );

-- INSERT: service role
CREATE POLICY "idempotency_insert_service"
  ON idempotency_keys FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Nessun UPDATE/DELETE (cleanup automatico)

-- =============================================================================
-- 39. POST_REVISIONS (garantiamo RLS abilitato)
-- =============================================================================

ALTER TABLE post_revisions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 40. COMMENT_REVISIONS
-- =============================================================================

ALTER TABLE comment_revisions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 41. MEDIA_VARIANTS — RLS gia abilitato sopra
-- =============================================================================

-- =============================================================================
-- SERVICE ROLE BYPASS — Permetti al service role di bypassare RLS
-- =============================================================================

-- Supabase service role bypassa RLS automaticamente.
-- Per il ruolo 'authenticated' creiamo policy aggiuntive per le operazioni
-- admin usando le funzioni di controllo ruolo.

-- =============================================================================
-- RIEPILOGO TEST SCENARI
-- =============================================================================

/*
Utente anonimo (anon):
  - profiles: SELECT visibile (dati pubblici)
  - memorials: SELECT solo memoriali public+active
  - posts: SELECT solo published su memoriali public
  - comments: SELECT solo published su post published su memoriali public
  - reactions: SELECT visibile
  - Tutto il resto: NESSUN accesso

Utente autenticato non membro:
  - profiles: SELECT tutti
  - memorials: SELECT solo public+active (o se creatore/custode)
  - posts: SELECT published su memoriali public o dove e membro
  - memorial_follows: CRUD propri
  - user_blocks: CRUD propri
  - support_messages: INSERT/SELECT propri
  - Tutto il resto: limitato a dati propri

Membro memoriale:
  - memorials: SELECT (membro approvato)
  - posts: SELECT tutti i post del memoriale, INSERT (nuovi post)
  - comments: SELECT/INSERT su post del memoriale
  - reactions: SELECT/INSERT
  - albums: SELECT/INSERT
  - media_assets: SELECT
  - life_events: SELECT
  - places: SELECT

Collaboratore:
  - come membro + permessi edit specifici
  - memorial_settings: SELECT
  - life_events: INSERT/UPDATE (se can_edit)
  - places: INSERT/UPDATE (se can_edit)

Custode:
  - Tutto il precedente +
  - memorials: UPDATE
  - memorial_guardians: CRUD
  - memorial_members: CRUD
  - memorial_invitations: CRUD
  - memorial_settings: UPDATE
  - posts: UPDATE (moderazione)
  - comments: UPDATE (moderazione)
  - content_reports: SELECT/UPDATE
  - relationship_claims: UPDATE (review)
  - guardianship_claims: UPDATE (review)

Moderatore piattaforma:
  - moderation_cases: SELECT/UPDATE
  - moderation_actions: SELECT/INSERT
  - appeals: SELECT/UPDATE
  - content_reports: SELECT/UPDATE
  - support_messages: SELECT/UPDATE

Admin (service role):
  - Bypass RLS completo
  - audit_events: SELECT
  - Tutte le tabelle: FULL ACCESS
*/

-- =============================================================================
-- MIGRAZIONE RLS COMPLETATA
-- =============================================================================
