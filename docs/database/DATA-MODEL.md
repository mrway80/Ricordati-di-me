# Data Model — Ricordati di Te (PostgreSQL / Supabase)

> **Versione**: 1.0  
> **Target**: PostgreSQL 15+ (Supabase)  
> **Principi**: RLS-first, UUID PK, timestamptz, soft delete, auditabilità, normalizzazione 3NF

---

## 1. Panoramica

Il database è progettato come un **social network memoriale** in cui:
- Ogni utente può avere un profilo (`profiles`).
- Un utente può creare memoriali (`memorials`) per persone care.
- Ogni memoriale ha un **custode principale** (`guardian`) e membri (`members`).
- I contenuti (`posts`, `life_events`, `media_assets`, `albums`) appartengono a un memoriale.
- Le interazioni sociali (`comments`, `reactions`, `follows`) sono per-memoriale.
- La moderazione (`content_reports`, `moderation_cases`, `moderation_actions`, `appeals`) garantisce la qualità.
- Le notifiche (`notifications`) e le preferenze (`notification_preferences`) completano l'esperienza utente.
- Gli eventi di audit (`audit_events`) e le richieste legali (`legal_requests`, `data_exports`, `deletion_requests`) assicurano conformità GDPR.
- La tabella `outbox_events` abilita il pattern Outbox per comunicazioni asincrone.

### Principi Architetturali

| Principio | Implementazione |
|---|---|
| **RLS-first** | Ogni tabella ha RLS abilitato; nessun accesso senza policy esplicita |
| **UUID PK** | `uuid` generato con `gen_random_uuid()` (pgcrypto) |
| **Timestamptz** | Tutti i timestamp usano `timestamptz` per timezone-safe |
| **Soft delete** | Colonne `deleted_at` / `is_deleted` per cancellazione logica |
| **Audit** | Tabella `audit_events` append-only per ogni azione significativa |
| **Ownership** | Ogni riga ha `created_by` che referenzia `profiles.id` |
| **Immutabilità** | Le revisioni (`post_revisions`, `comment_revisions`) sono append-only |
| **Idempotenza** | Tabella `idempotency_keys` per operazioni safe-at-least-once |

---

## 2. Enum PostgreSQL

```sql
memorial_status:
  draft                  -- Bozza, visibile solo al creatore
  verification_pending   -- In attesa di verifica identità del defunto
  active                 -- Attivo e visibile secondo le regole
  restricted             -- Limitato (richiesta verifica)
  disputed               -- Contestato (guardianato in disputa)
  suspended              -- Sospeso dalla piattaforma
  archived               -- Archiviato (solo lettura)
  deleted                -- Cancellato logicamente

content_status:
  draft                  -- Bozza salvata dall'autore
  uploading              -- Media in caricamento
  processing             -- Elaborazione (es. AI, transcoding)
  pending_family_review  -- In attesa di approvazione custodi
  pending_platform_review-- In attesa di moderazione piattaforma
  approved               -- Approvato, non ancora pubblicato
  published              -- Pubblicato e visibile
  rejected               -- Rifiutato
  hidden                 -- Nascosto (moderazione)
  removed                -- Rimosso (richiesta rimozione)
  deleted                -- Cancellato logicamente

membership_status:
  invited                -- Invito inviato
  requested              -- Richiesta di partecipazione
  pending                -- In attesa (cambio ruolo)
  approved               -- Approvato e attivo
  rejected               -- Richiesta rifiutata
  suspended              -- Sospeso temporaneamente
  revoked                -- Revocato permanentemente

moderation_status:
  open                   -- Caso aperto
  automated_review       -- In revisione automatica
  human_review           -- In revisione umana
  action_required        -- Richiesta azione
  resolved               -- Risolto
  appealed               -- In appello
  closed                 -- Chiuso

media_type:
  image
  video
  audio
  document

visibility:
  public                 -- Visibile a tutti gli utenti autenticati
  private                -- Solo membri approvati del memoriale
  invitation_only        -- Solo su invito (link privato)

reaction_type:
  candle
  flower
  heart
  prayer
  memory
  gratitude

notification_type:
  memorial_created
  content_pending
  content_approved
  member_invited
  member_joined
  anniversary
  report_submitted
  moderation_action
  guardianship_transferred
```

---

## 3. Tabelle

### 3.1 profiles

Rappresenta un utente della piattaforma. Estende `auth.users` di Supabase.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | — | Identico a auth.uid |
| `username` | `citext` | NOT NULL, UNIQUE, CHECK (length 3-30, regex `^[a-zA-Z0-9_]+$`) | — | Username pubblico |
| `display_name` | `text` | NOT NULL, CHECK (length 1-100) | — | Nome visualizzato |
| `email` | `text` | NOT NULL | — | Email (denormalizzata da auth.users) |
| `avatar_url` | `text` | — | — | URL avatar |
| `bio` | `text` | CHECK (length ≤ 500) | — | Biografia pubblica |
| `location` | `text` | — | — | Città / Regione |
| `is_verified` | `boolean` | NOT NULL | `false` | Account verificato |
| `is_active` | `boolean` | NOT NULL | `true` | Account attivo |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Creazione profilo |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | Ultimo aggiornamento |
| `deleted_at` | `timestamptz` | — | — | Soft delete |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (username)`
- `idx_profiles_username` — lookup login/ricerca
- `idx_profiles_created_at` — ordinamento

**RLS Note:** SELECT pubblico per username/display_name; UPDATE solo proprietario.

---

### 3.2 user_preferences

Preferenze utente per la piattaforma.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `user_id` | `uuid` | NOT NULL, UNIQUE, FK → `profiles(id)` ON DELETE CASCADE | — | — |
| `language` | `text` | NOT NULL, CHECK (length = 2) | `'it'` | Lingua interfaccia (ISO 639-1) |
| `timezone` | `text` | NOT NULL | `'Europe/Rome'` | Timezone preferita |
| `theme` | `text` | NOT NULL, CHECK (IN ('light','dark','system')) | `'system'` | Tema UI |
| `show_email` | `boolean` | NOT NULL | `false` | Visibilità email pubblica |
| `allow_tagging` | `boolean` | NOT NULL | `true` | Consenti tag in contenuti |
| `digest_frequency` | `text` | NOT NULL, CHECK (IN ('none','daily','weekly','monthly')) | `'weekly'` | Frequenza digest email |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (user_id)`

---

### 3.3 user_consents

Consensi GDPR dell'utente, append-only (aggiornamento = nuova riga).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | — |
| `consent_type` | `text` | NOT NULL, CHECK (length > 0) | — | Es. 'tos', 'privacy', 'cookies', 'marketing' |
| `version` | `text` | NOT NULL | — | Versione del documento accettato |
| `ip_address` | `inet` | — | — | IP al momento del consenso |
| `user_agent` | `text` | — | — | User agent |
| `granted` | `boolean` | NOT NULL | `true` | True = concesso, False = revocato |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_user_consents_user_type` — (user_id, consent_type, created_at DESC)

---

### 3.4 memorials

Il memoriale dedicato a una persona.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `slug` | `text` | NOT NULL, UNIQUE, CHECK (regex `^[a-z0-9-]+$`, length 3-100) | — | URL-friendly slug |
| `full_name` | `text` | NOT NULL, CHECK (length 1-200) | — | Nome completo del defunto |
| `birth_date` | `date` | — | — | Data di nascita |
| `death_date` | `date` | — | — | Data di decesso |
| `biography` | `text` | CHECK (length ≤ 10000) | — | Biografia / necrologio |
| `profile_image_url` | `text` | — | — | Foto profilo del memoriale |
| `status` | `memorial_status` | NOT NULL | `'draft'` | Stato del memoriale |
| `visibility` | `visibility` | NOT NULL | `'public'` | Visibilità |
| `created_by` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE SET NULL | — | Creatore iniziale |
| `primary_guardian_id` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Custode principale |
| `settings` | `jsonb` | NOT NULL, DEFAULT '{}' | `'{}'` | Configurazioni varie |
| `search_vector` | `tsvector` | — | — | Full-text search (generated) |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |
| `deleted_at` | `timestamptz` | — | — | Soft delete |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (slug)`
- `idx_memorials_status` — WHERE status = 'active' per liste pubbliche
- `idx_memorials_guardian` — (primary_guardian_id)
- `idx_memorials_created_by` — (created_by)
- `idx_memorials_search_vector` — GIN (search_vector) per FTS
- `idx_memorials_created_at` — ordinamento
- `idx_memorials_death_date` — per anniversari

**Check Constraints:**
- `ck_memorials_death_after_birth` — `death_date IS NULL OR death_date >= birth_date`

**Trigger:**
- `tr_memorials_search_vector` — aggiorna search_vector su INSERT/UPDATE di full_name, biography

---

### 3.5 memorial_guardians

Associazione tra custodi e memoriali (ruoli multipli).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | — |
| `role` | `text` | NOT NULL, CHECK (IN ('owner','guardian','collaborator','viewer')) | `'guardian'` | Ruolo nel memoriale |
| `is_primary` | `boolean` | NOT NULL | `false` | Custode principale |
| `can_edit` | `boolean` | NOT NULL | `false` | Permesso modifica contenuti |
| `can_manage_members` | `boolean` | NOT NULL | `false` | Permesso gestione membri |
| `can_moderate` | `boolean` | NOT NULL | `false` | Permesso moderazione |
| `granted_at` | `timestamptz` | NOT NULL | `now()` | Quando è stato nominato |
| `granted_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Chi ha nominato |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (memorial_id, user_id)` — un utente, un ruolo per memoriale
- `idx_guardians_memorial` — (memorial_id)
- `idx_guardians_user` — (user_id)
- `idx_guardians_primary` — WHERE is_primary = true

---

### 3.6 memorial_members

Membri del memoriale (familiari, amici).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `user_id` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Può essere NULL per inviti email |
| `email` | `text` | — | — | Email per invito non registrato |
| `status` | `membership_status` | NOT NULL | `'invited'` | Stato adesione |
| `relationship` | `text` | — | — | Relazione con il defunto (es. "figlio", "amico") |
| `invited_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `joined_at` | `timestamptz` | — | — | Quando è diventato membro |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (memorial_id, user_id)` — WHERE user_id IS NOT NULL
- `UNIQUE (memorial_id, email)` — WHERE email IS NOT NULL
- `idx_members_memorial_status` — (memorial_id, status)
- `idx_members_user` — (user_id)

**Check:**
- `ck_member_user_or_email` — `user_id IS NOT NULL OR email IS NOT NULL`

---

### 3.7 memorial_invitations

Inviti specifici al memoriale (token-based).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `token` | `text` | NOT NULL, UNIQUE | — | Token segreto per il link |
| `email` | `text` | — | — | Email specifica (opzionale) |
| `role` | `text` | NOT NULL, CHECK (IN ('member','guardian','collaborator')) | `'member'` | Ruolo proposto |
| `expires_at` | `timestamptz` | NOT NULL | `now() + interval '7 days'` | Scadenza |
| `used_at` | `timestamptz` | — | — | Quando è stato usato |
| `used_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Chi ha usato l'invito |
| `created_by` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (token)`
- `idx_invitations_memorial` — (memorial_id)
- `idx_invitations_token` — (token) per lookup rapido
- `idx_invitations_expires` — (expires_at) WHERE used_at IS NULL

---

### 3.8 relationship_claims

Richieste di rivendicazione relazione con il defunto.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | Richiedente |
| `claimed_relationship` | `text` | NOT NULL | — | Es. "fratello", "collega" |
| `proof_description` | `text` | — | — | Descrizione prova |
| `status` | `text` | NOT NULL, CHECK (IN ('pending','approved','rejected')) | `'pending'` | — |
| `reviewed_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `reviewed_at` | `timestamptz` | — | — | — |
| `rejection_reason` | `text` | — | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (memorial_id, user_id)` — una richiesta per utente
- `idx_relclaims_memorial` — (memorial_id, status)

---

### 3.9 guardianship_claims

Richieste per diventare custode di un memoriale.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | Richiedente |
| `motivation` | `text` | NOT NULL, CHECK (length ≥ 20) | — | Perché vuole essere custode |
| `proof_document_url` | `text` | — | — | Documento di prova |
| `status` | `text` | NOT NULL, CHECK (IN ('pending','approved','rejected')) | `'pending'` | — |
| `reviewed_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `reviewed_at` | `timestamptz` | — | — | — |
| `rejection_reason` | `text` | — | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (memorial_id, user_id)` — una richiesta per utente
- `idx_gclaims_memorial` — (memorial_id, status)

---

### 3.10 guardianship_disputes

Dispute sul guardianato (contestazioni).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `claimant_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | Chi contesta |
| `current_guardian_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | Custode attuale contestato |
| `reason` | `text` | NOT NULL, CHECK (length ≥ 20) | — | Motivazione disputa |
| `evidence` | `jsonb` | NOT NULL, DEFAULT '[]' | `'[]'` | Array di evidenze |
| `status` | `text` | NOT NULL, CHECK (IN ('open','under_review','resolved','dismissed')) | `'open'` | — |
| `resolution` | `text` | — | — | Es. 'guardian_changed', 'dismissed' |
| `resolved_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Moderatore che ha risolto |
| `resolved_at` | `timestamptz` | — | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (memorial_id, claimant_id)` — una disputa per utente per memoriale
- `idx_disputes_memorial` — (memorial_id, status)
- `idx_disputes_status` — (status) WHERE status = 'open'

---

### 3.11 memorial_settings

Impostazioni granulari per memoriale (pattern EAV in jsonb per flessibilità).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, UNIQUE, FK → `memorials(id)` ON DELETE CASCADE | — | 1:1 con memorials |
| `allow_public_posts` | `boolean` | NOT NULL | `true` | Chi può postare |
| `require_approval` | `boolean` | NOT NULL | `true` | Richiede approvazione custode |
| `allow_reactions` | `boolean` | NOT NULL | `true` | Reazioni abilitate |
| `allow_comments` | `boolean` | NOT NULL | `true` | Commenti abilitati |
| `allow_tributes` | `boolean` | NOT NULL | `true` | Tributi abilitati |
| `show_death_date` | `boolean` | NOT NULL | `true` | Mostra data decesso |
| `custom_css` | `text` | — | — | CSS personalizzato (futuro) |
| `theme_color` | `text` | CHECK (regex `^#[0-9A-Fa-f]{6}$`) | — | Colore tema |
| `font_preference` | `text` | — | — | Font scelto |
| `analytics_enabled` | `boolean` | NOT NULL | `false` | Analytics interne |
| `custom_settings` | `jsonb` | NOT NULL, DEFAULT '{}' | `'{}'` | Estensibilità |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (memorial_id)`

---

### 3.12 life_events

Eventi della vita del defunto (linea temporale).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `title` | `text` | NOT NULL, CHECK (length 1-200) | — | Titolo evento |
| `description` | `text` | CHECK (length ≤ 5000) | — | Descrizione |
| `event_date` | `date` | — | — | Data evento |
| `event_date_precision` | `text` | CHECK (IN ('exact','month','year','decade')) | `'exact'` | Precisione data |
| `location` | `text` | — | — | Luogo |
| `event_type` | `text` | NOT NULL | — | Categoria (es. 'birth', 'education', 'career') |
| `media_asset_id` | `uuid` | FK → `media_assets(id)` ON DELETE SET NULL | — | Allegato principale |
| `created_by` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_lifeevents_memorial` — (memorial_id)
- `idx_lifeevents_date` — (event_date)
- `idx_lifeevents_memorial_date` — (memorial_id, event_date) per timeline

---

### 3.13 places

Luoghi significativi nella vita del defunto.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `name` | `text` | NOT NULL | — | Nome luogo |
| `description` | `text` | — | — | Significato del luogo |
| `address` | `text` | — | — | Indirizzo |
| `latitude` | `decimal(10,8)` | — | — | — |
| `longitude` | `decimal(11,8)` | — | — | — |
| `place_type` | `text` | NOT NULL | — | 'birthplace', 'home', 'gravesite', etc. |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_places_memorial` — (memorial_id)
- `idx_places_coords` — per query geografiche future (PostGIS-ready)

**Check:**
- `ck_places_latitude` — `latitude BETWEEN -90 AND 90`
- `ck_places_longitude` — `longitude BETWEEN -180 AND 180`

---

### 3.14 posts

Post / contributi nel memoriale (storie, ricordi, omaggi).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `author_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `title` | `text` | CHECK (length ≤ 200) | — | Titolo opzionale |
| `content` | `text` | NOT NULL, CHECK (length 1-50000) | — | Contenuto testuale |
| `content_html` | `text` | — | — | Versione HTML processata |
| `status` | `content_status` | NOT NULL | `'draft'` | — |
| `visibility` | `visibility` | NOT NULL | `'public'` | Visibilità del post |
| `search_vector` | `tsvector` | — | — | Full-text search |
| `reaction_count` | `integer` | NOT NULL, DEFAULT 0 | `0` | Contatore denormalizzato |
| `comment_count` | `integer` | NOT NULL, DEFAULT 0 | `0` | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |
| `published_at` | `timestamptz` | — | — | Quando è stato pubblicato |
| `deleted_at` | `timestamptz` | — | — | Soft delete |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_posts_memorial` — (memorial_id)
- `idx_posts_author` — (author_id)
- `idx_posts_status` — (status) WHERE status = 'published'
- `idx_posts_memorial_status` — (memorial_id, status, created_at DESC) — lista post
- `idx_posts_search_vector` — GIN (search_vector) per FTS
- `idx_posts_created_at` — ordinamento

**Trigger:**
- `tr_posts_search_vector` — aggiorna search_vector su INSERT/UPDATE di title, content

---

### 3.15 post_revisions

Revisioni append-only dei post.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `post_id` | `uuid` | NOT NULL, FK → `posts(id)` ON DELETE CASCADE | — | — |
| `title` | `text` | — | — | Titolo alla revisione |
| `content` | `text` | NOT NULL | — | Contenuto alla revisione |
| `content_html` | `text` | — | — | — |
| `created_by` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE SET NULL | — | Chi ha editato |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_postrevs_post` — (post_id, created_at DESC)

---

### 3.16 media_assets

Asset multimediali (foto, video, audio, documenti).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `uploaded_by` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `media_type` | `media_type` | NOT NULL | — | Tipo file |
| `original_filename` | `text` | NOT NULL | — | Nome file originale |
| `mime_type` | `text` | NOT NULL | — | MIME type |
| `file_size` | `bigint` | NOT NULL, CHECK (file_size > 0) | — | Dimensione in bytes |
| `storage_path` | `text` | NOT NULL, UNIQUE | — | Path nello storage Supabase |
| `public_url` | `text` | — | — | URL pubblico (se abilitato) |
| `status` | `content_status` | NOT NULL | `'uploading'` | — |
| `metadata` | `jsonb` | NOT NULL, DEFAULT '{}' | `'{}'` | Es. dimensioni, durata, EXIF |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |
| `deleted_at` | `timestamptz` | — | — | Soft delete |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (storage_path)`
- `idx_media_memorial` — (memorial_id)
- `idx_media_type` — (media_type)
- `idx_media_status` — (status)
- `idx_media_uploaded_by` — (uploaded_by)

---

### 3.17 media_variants

Varianti di un asset (thumbnail, web-optimized, etc.).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `media_asset_id` | `uuid` | NOT NULL, FK → `media_assets(id)` ON DELETE CASCADE | — | — |
| `variant_name` | `text` | NOT NULL, CHECK (IN ('thumbnail','small','medium','large','original')) | — | Tipo variante |
| `storage_path` | `text` | NOT NULL | — | Path nello storage |
| `width` | `integer` | — | — | Larghezza in pixel |
| `height` | `integer` | — | — | Altezza in pixel |
| `file_size` | `bigint` | NOT NULL, CHECK (file_size > 0) | — | — |
| `mime_type` | `text` | NOT NULL | — | — |
| `public_url` | `text` | NOT NULL | — | URL accesso |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (media_asset_id, variant_name)`
- `idx_variants_asset` — (media_asset_id)

---

### 3.18 albums

Album fotografici / raccolte all'interno di un memoriale.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `title` | `text` | NOT NULL, CHECK (length 1-200) | — | — |
| `description` | `text` | CHECK (length ≤ 1000) | — | — |
| `cover_media_id` | `uuid` | FK → `media_assets(id)` ON DELETE SET NULL | — | Copertina |
| `item_count` | `integer` | NOT NULL, DEFAULT 0, CHECK (≥ 0) | `0` | Denormalizzato |
| `created_by` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |
| `deleted_at` | `timestamptz` | — | — | Soft delete |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_albums_memorial` — (memorial_id)

---

### 3.19 album_items

Associazione media_asset ↔ album (tabella ponte).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `album_id` | `uuid` | NOT NULL, FK → `albums(id)` ON DELETE CASCADE | — | — |
| `media_asset_id` | `uuid` | NOT NULL, FK → `media_assets(id)` ON DELETE CASCADE | — | — |
| `caption` | `text` | CHECK (length ≤ 500) | — | Didascalia |
| `sort_order` | `integer` | NOT NULL, DEFAULT 0 | `0` | Ordinamento |
| `added_by` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (album_id, media_asset_id)` — no duplicati
- `idx_albumitems_album` — (album_id, sort_order)
- `idx_albumitems_media` — (media_asset_id)

---

### 3.20 comments

Commenti ai post.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `post_id` | `uuid` | NOT NULL, FK → `posts(id)` ON DELETE CASCADE | — | — |
| `author_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `parent_id` | `uuid` | FK → `comments(id)` ON DELETE CASCADE | — | Per risposte annidate |
| `content` | `text` | NOT NULL, CHECK (length 1-10000) | — | — |
| `status` | `content_status` | NOT NULL | `'published'` | — |
| `is_edited` | `boolean` | NOT NULL, DEFAULT false | `false` | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |
| `deleted_at` | `timestamptz` | — | — | Soft delete |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_comments_post` — (post_id, created_at DESC)
- `idx_comments_author` — (author_id)
- `idx_comments_parent` — (parent_id) — per risposte
- `idx_comments_post_status` — (post_id, status, created_at DESC)

**Check:**
- `ck_comments_no_self_parent` — `parent_id <> id`

---

### 3.21 comment_revisions

Revisioni append-only dei commenti.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `comment_id` | `uuid` | NOT NULL, FK → `comments(id)` ON DELETE CASCADE | — | — |
| `content` | `text` | NOT NULL | — | — |
| `created_by` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_commentrevs_comment` — (comment_id, created_at DESC)

---

### 3.22 reactions

Reazioni ai post (candele, fiori, cuori, preghiere, ricordi, gratitudine).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `post_id` | `uuid` | NOT NULL, FK → `posts(id)` ON DELETE CASCADE | — | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | — |
| `reaction_type` | `reaction_type` | NOT NULL | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (post_id, user_id, reaction_type)` — una reazione per tipo per utente
- `idx_reactions_post` — (post_id, reaction_type)
- `idx_reactions_user` — (user_id)

---

### 3.23 support_messages

Messaggi di supporto / contatto inviati dagli utenti.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `sender_id` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | NULL per anonimi |
| `sender_email` | `text` | NOT NULL | — | Email per risposta |
| `sender_name` | `text` | NOT NULL | — | Nome mittente |
| `subject` | `text` | NOT NULL | — | Oggetto |
| `message` | `text` | NOT NULL | — | Corpo messaggio |
| `category` | `text` | NOT NULL | — | 'support', 'bug', 'feature', 'abuse' |
| `status` | `text` | NOT NULL, CHECK (IN ('new','in_progress','resolved','closed')) | `'new'` | — |
| `assigned_to` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Staff assegnato |
| `resolution` | `text` | — | — | Risoluzione |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_support_status` — (status) WHERE status IN ('new', 'in_progress')
- `idx_support_sender` — (sender_id)

---

### 3.24 memorial_follows

Seguaci di un memoriale (notifiche senza essere membri).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | NOT NULL, FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | — |
| `notify_on_new_post` | `boolean` | NOT NULL, DEFAULT true | `true` | — |
| `notify_on_anniversary` | `boolean` | NOT NULL, DEFAULT true | `true` | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (memorial_id, user_id)` — segui una volta
- `idx_follows_user` — (user_id)
- `idx_follows_memorial` — (memorial_id)

---

### 3.25 user_blocks

Blocchi utente (privacy / anti-molestie).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `blocker_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | Chi blocca |
| `blocked_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | Chi è bloccato |
| `reason` | `text` | — | — | Motivo (opzionale) |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (blocker_id, blocked_id)` — un blocco per coppia
- `idx_blocks_blocker` — (blocker_id)
- `idx_blocks_blocked` — (blocked_id)

**Check:**
- `ck_blocks_not_self` — `blocker_id <> blocked_id`

---

### 3.26 content_reports

Segnalazioni di contenuti inappropriati.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `reporter_id` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Chi segnala |
| `content_type` | `text` | NOT NULL, CHECK (IN ('post','comment','media','memorial','album')) | — | Tipo contenuto |
| `content_id` | `uuid` | NOT NULL | — | ID del contenuto segnalato |
| `reason` | `text` | NOT NULL | — | Categoria (spam, hate, harassment, etc.) |
| `description` | `text` | — | — | Descrizione aggiuntiva |
| `status` | `text` | NOT NULL, CHECK (IN ('pending','reviewing','resolved','dismissed')) | `'pending'` | — |
| `memorial_id` | `uuid` | FK → `memorials(id)` ON DELETE SET NULL | — | Contesto |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_reports_content` — (content_type, content_id)
- `idx_reports_status` — (status) WHERE status = 'pending'
- `idx_reports_reporter` — (reporter_id)
- `idx_reports_memorial` — (memorial_id)

---

### 3.27 moderation_cases

Casi di moderazione generati dai report o automaticamente.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `report_id` | `uuid` | FK → `content_reports(id)` ON DELETE SET NULL | — | Report che ha generato il caso |
| `content_type` | `text` | NOT NULL | — | Tipo contenuto |
| `content_id` | `uuid` | NOT NULL | — | ID contenuto |
| `memorial_id` | `uuid` | FK → `memorials(id)` ON DELETE SET NULL | — | — |
| `status` | `moderation_status` | NOT NULL | `'open'` | — |
| `priority` | `text` | NOT NULL, CHECK (IN ('low','medium','high','critical')) | `'medium'` | — |
| `ai_score` | `decimal(5,4)` | CHECK (ai_score BETWEEN 0 AND 1) | — | Score di rischio AI |
| `flags` | `jsonb` | NOT NULL, DEFAULT '[]' | `'[]'` | Flag automatici |
| `summary` | `text` | — | — | Riassunto moderatore |
| `assigned_to` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Moderatore assegnato |
| `resolved_at` | `timestamptz` | — | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (report_id)` — un caso per report
- `idx_modcases_status` — (status) WHERE status IN ('open','human_review','action_required')
- `idx_modcases_assigned` — (assigned_to, status)
- `idx_modcases_memorial` — (memorial_id)

---

### 3.28 moderation_actions

Azioni intraprese sui casi di moderazione.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `case_id` | `uuid` | NOT NULL, FK → `moderation_cases(id)` ON DELETE CASCADE | — | — |
| `action_type` | `text` | NOT NULL | — | 'hide', 'remove', 'warn', 'suspend', 'ban' |
| `action_details` | `jsonb` | NOT NULL, DEFAULT '{}' | `'{}'` | Dettagli specifici |
| `performed_by` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `reason` | `text` | NOT NULL | — | Motivazione |
| `reverted_at` | `timestamptz` | — | — | Se l'azione è stata annullata |
| `reverted_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_modactions_case` — (case_id)
- `idx_modactions_performed` — (performed_by)

---

### 3.29 appeals

Appelli contro azioni di moderazione.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `action_id` | `uuid` | NOT NULL, FK → `moderation_actions(id)` ON DELETE CASCADE | — | Azione contestata |
| `appellant_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | Chi fa appello |
| `reason` | `text` | NOT NULL, CHECK (length ≥ 20) | — | Motivazione appello |
| `status` | `text` | NOT NULL, CHECK (IN ('pending','under_review','upheld','overturned')) | `'pending'` | — |
| `reviewed_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `decision_reason` | `text` | — | — | Motivazione decisione |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |
| `resolved_at` | `timestamptz` | — | — | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (action_id, appellant_id)` — un appello per azione per utente
- `idx_appeals_status` — (status) WHERE status = 'pending'

---

### 3.30 notifications

Notifiche in-app e/o email.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | Destinatario |
| `type` | `notification_type` | NOT NULL | — | — |
| `title` | `text` | NOT NULL | — | Titolo notifica |
| `body` | `text` | NOT NULL | — | Corpo notifica |
| `data` | `jsonb` | NOT NULL, DEFAULT '{}' | `'{}'` | Payload strutturato |
| `actor_id` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Chi ha generato l'azione |
| `memorial_id` | `uuid` | FK → `memorials(id)` ON DELETE CASCADE | — | Contesto |
| `is_read` | `boolean` | NOT NULL, DEFAULT false | `false` | — |
| `read_at` | `timestamptz` | — | — | — |
| `email_sent` | `boolean` | NOT NULL, DEFAULT false | `false` | Stato invio email |
| `email_sent_at` | `timestamptz` | — | — | — |
| `action_url` | `text` | — | — | Link azione notifica |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_notifications_user` — (user_id, created_at DESC) — inbox
- `idx_notifications_user_unread` — (user_id) WHERE is_read = false — badge contatore
- `idx_notifications_memorial` — (memorial_id)
- `idx_notifications_email` — (email_sent) WHERE email_sent = false — batch email

---

### 3.31 notification_preferences

Preferenze notifiche per utente.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | — |
| `channel` | `text` | NOT NULL, CHECK (IN ('in_app','email','push')) | — | Canale |
| `notification_type` | `notification_type` | NOT NULL | — | Tipo notifica |
| `enabled` | `boolean` | NOT NULL, DEFAULT true | `true` | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (user_id, channel, notification_type)` — una preferenza per combinazione
- `idx_notifprefs_user` — (user_id)

---

### 3.32 audit_events

Log di audit append-only, immutabile.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `bigint` | PK GENERATED ALWAYS AS IDENTITY | — | — |
| `event_time` | `timestamptz` | NOT NULL, DEFAULT now() | `now()` | — |
| `actor_id` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Chi ha fatto l'azione |
| `actor_role` | `text` | — | — | Ruolo al momento dell'azione |
| `action` | `text` | NOT NULL | — | Es. 'memorial.create', 'post.publish' |
| `resource_type` | `text` | NOT NULL | — | Tabella / risorsa |
| `resource_id` | `uuid` | — | — | ID risorsa |
| `memorial_id` | `uuid` | — | — | Contesto memoriale |
| `details` | `jsonb` | NOT NULL, DEFAULT '{}' | `'{}'` | Dati aggiuntivi |
| `ip_address` | `inet` | — | — | IP sorgente |
| `user_agent` | `text` | — | — | — |
| `severity` | `text` | NOT NULL, CHECK (IN ('info','warning','critical')) | `'info'` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_audit_time` — (event_time DESC) — query temporali
- `idx_audit_actor` — (actor_id, event_time DESC)
- `idx_audit_action` — (action, event_time DESC)
- `idx_audit_resource` — (resource_type, resource_id)
- `idx_audit_memorial` — (memorial_id, event_time DESC)

---

### 3.33 legal_requests

Richieste legali (GDPR, DMCA, ordini giudiziari).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `request_type` | `text` | NOT NULL, CHECK (IN ('gdpr_access','gdpr_rectify','gdpr_erasure','gdpr_restrict','gdpr_portability','dmca','court_order','other')) | — | — |
| `requester_email` | `text` | NOT NULL | — | — |
| `requester_name` | `text` | NOT NULL | — | — |
| `requester_id` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | Se registrato |
| `description` | `text` | NOT NULL | — | — |
| `supporting_docs` | `jsonb` | NOT NULL, DEFAULT '[]' | `'[]'` | Documenti allegati |
| `status` | `text` | NOT NULL, CHECK (IN ('received','under_review','fulfilled','rejected','escalated')) | `'received'` | — |
| `assigned_to` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `deadline_at` | `timestamptz` | — | — | Scadenza legale |
| `fulfilled_at` | `timestamptz` | — | — | — |
| `notes` | `text` | — | — | Note interne |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_legal_status` — (status) WHERE status IN ('received','under_review')
- `idx_legal_deadline` — (deadline_at) WHERE fulfilled_at IS NULL
- `idx_legal_requester` — (requester_id)

---

### 3.34 data_exports

Esportazioni dati GDPR (richieste di portability).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | — |
| `legal_request_id` | `uuid` | FK → `legal_requests(id)` ON DELETE SET NULL | — | Se da richiesta legale |
| `status` | `text` | NOT NULL, CHECK (IN ('requested','generating','ready','expired','failed')) | `'requested'` | — |
| `file_size` | `bigint` | — | — | Dimensione archivio |
| `download_url` | `text` | — | — | URL temporaneo |
| `expires_at` | `timestamptz` | — | — | Scadenza download |
| `requested_scope` | `jsonb` | NOT NULL, DEFAULT '{}' | `'{}'` | Scope dati richiesti |
| `completed_at` | `timestamptz` | — | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_dataexports_user` — (user_id, created_at DESC)
- `idx_dataexports_status` — (status) WHERE status IN ('requested','generating')

---

### 3.35 deletion_requests

Richieste di cancellazione account / memoriale.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | — | — |
| `target_type` | `text` | NOT NULL, CHECK (IN ('account','memorial','content')) | — | — |
| `target_id` | `uuid` | — | — | ID del target (se non account) |
| `reason` | `text` | — | — | Motivazione |
| `scheduled_at` | `timestamptz` | NOT NULL | `now() + interval '30 days'` | Data effettiva cancellazione |
| `status` | `text` | NOT NULL, CHECK (IN ('pending','processing','completed','cancelled')) | `'pending'` | — |
| `cancelled_at` | `timestamptz` | — | — | — |
| `cancelled_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | — | — |
| `completed_at` | `timestamptz` | — | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (user_id, target_type, target_id)` WHERE status = 'pending'
- `idx_delreqs_scheduled` — (scheduled_at) WHERE status = 'pending'
- `idx_delreqs_user` — (user_id)

---

### 3.36 ai_processing_jobs

Job di elaborazione AI (generazione riassunti, moderazione, etc.).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `memorial_id` | `uuid` | FK → `memorials(id)` ON DELETE CASCADE | — | — |
| `content_type` | `text` | NOT NULL | — | Tipo contenuto input |
| `content_id` | `uuid` | — | — | ID contenuto input |
| `job_type` | `text` | NOT NULL | — | 'summary', 'moderation', 'face_recognition', 'transcription' |
| `status` | `text` | NOT NULL, CHECK (IN ('queued','processing','completed','failed')) | `'queued'` | — |
| `input_data` | `jsonb` | NOT NULL, DEFAULT '{}' | `'{}'` | Dati input |
| `output_data` | `jsonb` | NOT NULL, DEFAULT '{}' | `'{}'` | Risultato |
| `error_message` | `text` | — | — | Se fallito |
| `processing_time_ms` | `integer` | CHECK (processing_time_ms > 0) | — | Durata elaborazione |
| `attempts` | `integer` | NOT NULL, DEFAULT 0, CHECK (≥ 0) | `0` | Tentativi |
| `max_attempts` | `integer` | NOT NULL, DEFAULT 3 | `3` | — |
| `scheduled_at` | `timestamptz` | NOT NULL | `now()` | Quando processare |
| `started_at` | `timestamptz` | — | — | — |
| `completed_at` | `timestamptz` | — | — | — |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `idx_aijobs_status` — (status, scheduled_at) WHERE status = 'queued'
- `idx_aijobs_memorial` — (memorial_id)
- `idx_aijobs_content` — (content_type, content_id)

---

### 3.37 outbox_events

Pattern Outbox per eventi asincroni (notifiche, email, webhooks).

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `bigint` | PK GENERATED ALWAYS AS IDENTITY | — | — |
| `topic` | `text` | NOT NULL | — | 'notification', 'email', 'webhook' |
| `key` | `text` | NOT NULL | — | Chiave per deduplicazione |
| `payload` | `jsonb` | NOT NULL | — | Dati evento |
| `headers` | `jsonb` | NOT NULL, DEFAULT '{}' | `'{}'` | Metadati |
| `status` | `text` | NOT NULL, CHECK (IN ('pending','processing','completed','failed')) | `'pending'` | — |
| `attempts` | `integer` | NOT NULL, DEFAULT 0, CHECK (≥ 0) | `0` | — |
| `max_attempts` | `integer` | NOT NULL, DEFAULT 3 | `3` | — |
| `error` | `text` | — | — | Ultimo errore |
| `processed_at` | `timestamptz` | — | — | — |
| `created_at` | `timestamptz` | NOT NULL, `now()` | — | — |
| `scheduled_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (topic, key)` — deduplicazione base
- `idx_outbox_pending` — (status, scheduled_at, id) WHERE status = 'pending'
- `idx_outbox_topic` — (topic, status)

---

### 3.38 idempotency_keys

Chiavi di idempotenza per operazioni safe-at-least-once.

| Colonna | Tipo | Constraints | Default | Commento |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | — |
| `key` | `text` | NOT NULL | — | Chiave fornita dal client |
| `user_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE | — | — |
| `scope` | `text` | NOT NULL | — | Scope della chiave |
| `payload_hash` | `text` | NOT NULL | — | Hash del payload per verifica |
| `response_status` | `integer` | — | — | HTTP status salvato |
| `response_body` | `jsonb` | — | — | Risposta salvata |
| `expires_at` | `timestamptz` | NOT NULL | `now() + interval '24 hours'` | Scadenza |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |

**Indici:**
- `PRIMARY KEY (id)`
- `UNIQUE (key, scope)` — chiave univoca per scope
- `idx_idempotency_lookup` — (key, user_id, scope) — lookup rapido
- `idx_idempotency_expires` — (expires_at) — cleanup

---

## 4. Relazioni (Diagramma ER Testuale)

```
[auth.users] 1 --- 1 [profiles] 1 --- 1 [user_preferences]
                                1 --- N [user_consents]
                                1 --- N [memorials] (created_by)
                                1 --- N [memorial_guardians]
                                1 --- N [memorial_members] (user_id)
                                1 --- N [memorial_invitations] (created_by, used_by)
                                1 --- N [relationship_claims] (user_id)
                                1 --- N [guardianship_claims] (user_id)
                                1 --- N [guardianship_disputes] (claimant_id)
                                1 --- N [posts] (author_id)
                                1 --- N [comments] (author_id)
                                1 --- N [reactions] (user_id)
                                1 --- N [memorial_follows] (user_id)
                                1 --- N [support_messages] (sender_id)
                                1 --- N [user_blocks] (blocker_id, blocked_id)
                                1 --- N [content_reports] (reporter_id)
                                1 --- N [notifications] (user_id, actor_id)
                                1 --- N [notification_preferences]
                                1 --- N [audit_events] (actor_id)
                                1 --- N [legal_requests] (requester_id)
                                1 --- N [data_exports]
                                1 --- N [deletion_requests]
                                1 --- N [moderation_cases] (assigned_to)
                                1 --- N [moderation_actions] (performed_by)
                                1 --- N [appeals] (appellant_id)
                                1 --- N [idempotency_keys]

[memorials] 1 --- 1 [memorial_settings]
            1 --- N [memorial_guardians]
            1 --- N [memorial_members]
            1 --- N [memorial_invitations]
            1 --- N [relationship_claims]
            1 --- N [guardianship_claims]
            1 --- N [guardianship_disputes]
            1 --- N [life_events]
            1 --- N [places]
            1 --- N [posts]
            1 --- N [media_assets]
            1 --- N [albums]
            1 --- N [memorial_follows]
            1 --- N [content_reports]
            1 --- N [moderation_cases]
            1 --- N [notifications]
            1 --- N [audit_events]
            1 --- N [ai_processing_jobs]

[posts] 1 --- N [post_revisions]
        1 --- N [comments]
        1 --- N [reactions]

[comments] 1 --- N [comment_revisions]
           1 --- N [comments] (parent_id) -- self-referencing

[media_assets] 1 --- N [media_variants]
               1 --- N [album_items]

[albums] 1 --- N [album_items]

[content_reports] 0..1 --- 1 [moderation_cases] (report_id)

[moderation_cases] 1 --- N [moderation_actions]

[moderation_actions] 1 --- N [appeals]

[legal_requests] 1 --- N [data_exports]
```

---

## 5. Indici Strategici

### Indici B-Tree (default)

| Tabella | Indice | Colonne | Giustificazione |
|---|---|---|---|
| profiles | `idx_profiles_username` | (username) | Login e ricerca |
| profiles | `idx_profiles_created_at` | (created_at DESC) | Ordinamento admin |
| memorials | `idx_memorials_status` | (status) | WHERE status = 'active' |
| memorials | `idx_memorials_guardian` | (primary_guardian_id) | Memoriali per custode |
| memorials | `idx_memorials_created_by` | (created_by) | Memoriali creati da utente |
| memorials | `idx_memorials_death_date` | (death_date) | Anniversari |
| memorial_guardians | `idx_guardians_memorial` | (memorial_id) | JOIN memoriali |
| memorial_guardians | `idx_guardians_user` | (user_id) | JOIN utenti |
| memorial_members | `idx_members_memorial_status` | (memorial_id, status) | Membri attivi per memoriale |
| memorial_members | `idx_members_user` | (user_id) | Membri per utente |
| posts | `idx_posts_memorial` | (memorial_id) | Post per memoriale |
| posts | `idx_posts_author` | (author_id) | Post per autore |
| posts | `idx_posts_status` | (status) WHERE published | Solo pubblicati |
| posts | `idx_posts_memorial_status` | (memorial_id, status, created_at DESC) | Feed memoriale |
| comments | `idx_comments_post` | (post_id, created_at DESC) | Commenti per post |
| comments | `idx_comments_parent` | (parent_id) | Risposte |
| reactions | `idx_reactions_post` | (post_id, reaction_type) | Conteggio reazioni |
| notifications | `idx_notifications_user` | (user_id, created_at DESC) | Inbox |
| notifications | `idx_notifications_user_unread` | (user_id) WHERE is_read = false | Badge contatore |
| notifications | `idx_notifications_email` | (email_sent) WHERE email_sent = false | Batch email |
| audit_events | `idx_audit_time` | (event_time DESC) | Query temporali |
| audit_events | `idx_audit_actor` | (actor_id, event_time DESC) | Azioni utente |
| outbox_events | `idx_outbox_pending` | (status, scheduled_at, id) | Polling worker |

### Indici GIN (Full-Text Search)

| Tabella | Indice | Colonne | Giustificazione |
|---|---|---|---|
| memorials | `idx_memorials_search_vector` | GIN(search_vector) | Ricerca full-text |
| posts | `idx_posts_search_vector` | GIN(search_vector) | Ricerca full-text |

### Indici GiST (futuro PostGIS)

| Tabella | Indice | Colonne | Giustificazione |
|---|---|---|---|
| places | `idx_places_coords` | (latitude, longitude) | Query geografiche (pre-PostGIS) |

### Indici Parziali (Partial)

| Tabella | Indice | Condizione | Giustificazione |
|---|---|---|---|
| memorials | `idx_memorials_status` | status = 'active' | Liste pubbliche |
| posts | `idx_posts_status` | status = 'published' | Feed pubblico |
| notifications | `idx_notifications_user_unread` | is_read = false | Contatore badge |
| outbox_events | `idx_outbox_pending` | status = 'pending' | Worker polling |

---

## 6. Full-Text Search

### Configurazione per memorials

La colonna `search_vector` è un `tsvector` che indicizza:
- `full_name` (peso A: massimo)
- `biography` (peso B: medio)

```sql
-- Funzione di aggiornamento
CREATE OR REPLACE FUNCTION memorials_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.biography, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER tr_memorials_search_vector
  BEFORE INSERT OR UPDATE OF full_name, biography
  ON memorials
  FOR EACH ROW
  EXECUTE FUNCTION memorials_search_vector_update();
```

### Configurazione per posts

```sql
CREATE OR REPLACE FUNCTION posts_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_posts_search_vector
  BEFORE INSERT OR UPDATE OF title, content
  ON posts
  FOR EACH ROW
  EXECUTE FUNCTION posts_search_vector_update();
```

### Ricerca

```sql
-- Esempio: ricerca memoriali
SELECT * FROM memorials
WHERE search_vector @@ plainto_tsquery('italian', 'mario rossi')
  AND status = 'active'
ORDER BY ts_rank(search_vector, plainto_tsquery('italian', 'mario rossi')) DESC;

-- Esempio: ricerca post
SELECT * FROM posts
WHERE search_vector @@ plainto_tsquery('italian', 'ricordo infanzia')
  AND status = 'published'
ORDER BY ts_rank(search_vector, plainto_tsquery('italian', 'ricordo infanzia')) DESC;
```

---

## 7. RLS Overview

### Policy Pattern per Tabella

| Tabella | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| **profiles** | Pubblico (username, display_name, avatar, bio) | Proprietario (da auth trigger) | Proprietario | Nessuno (soft delete) |
| **user_preferences** | Proprietario | Proprietario | Proprietario | Nessuno |
| **user_consents** | Proprietario + Admin | Proprietario | Nessuno (append-only) | Nessuno |
| **memorials** | Pubblico se active+public; membri se private | Autenticati | Custodi | Nessuno (soft delete) |
| **memorial_guardians** | Membri del memoriale | Custodi primari | Custodi | Custodi primari |
| **memorial_members** | Custodi + membri stessi | Custodi + inviti | Custodi | Custodi |
| **memorial_invitations** | Creatore + custodi | Custodi | Nessuno | Creatore + custodi |
| **relationship_claims** | Richiedente + custodi | Autenticati | Custodi (review) | Nessuno |
| **guardianship_claims** | Richiedente + custodi | Autenticati | Admin (review) | Nessuno |
| **guardianship_disputes** | Partecipanti + admin | Autenticati | Admin (resolution) | Nessuno |
| **memorial_settings** | Membri | Auto (on memorial create) | Custodi | Nessuno |
| **life_events** | Membri (se private) / Tutti (se public) | Custodi + collaboratori | Edit-permission | Soft delete |
| **places** | Membri / Tutti | Custodi + collaboratori | Edit-permission | Soft delete |
| **posts** | Pubblico se published; autore+custodi se draft/pending | Membri | Autore + custodi | Autore + custodi (soft) |
| **post_revisions** | Autore + custodi | Auto (trigger) | Nessuno | Nessuno |
| **media_assets** | Membri / pubblico per approved | Membri con permesso upload | Autore + custodi | Autore + custodi (soft) |
| **media_variants** | Stessa policy di media_assets | Auto (worker) | Nessuno | Nessuno (cascade) |
| **albums** | Membri | Membri con permesso | Autore + custodi | Autore + custodi (soft) |
| **album_items** | Stessa policy di albums | Membri con permesso | Nessuno | Autore + custodi |
| **comments** | Pubblico se published | Membri | Autore | Autore + custodi (soft) |
| **comment_revisions** | Autore + custodi | Auto (trigger) | Nessuno | Nessuno |
| **reactions** | Pubblico | Autenticati | Nessuno | Reazione propria |
| **support_messages** | Mittente + staff | Tutti | Solo staff | Nessuno |
| **memorial_follows** | Utente stesso | Autenticati | Utente stesso | Utente stesso |
| **user_blocks** | Blocker | Autenticati | Nessuno | Blocker |
| **content_reports** | Reporter + staff | Autenticati | Solo staff | Nessuno |
| **moderation_cases** | Solo staff | Auto (trigger/report) | Solo staff | Nessuno |
| **moderation_actions** | Solo staff | Solo staff | Nessuno | Nessuno |
| **appeals** | Appellante + staff | Appellante | Solo staff | Nessuno |
| **notifications** | Destinatario | Auto (trigger/functions) | Destinatario (mark read) | Destinatario |
| **notification_preferences** | Proprietario | Auto (on signup) | Proprietario | Nessuno |
| **audit_events** | Solo admin | Auto (trigger/functions) | Nessuno | Nessuno (append-only) |
| **legal_requests** | Richiedente + admin | Tutti | Admin | Nessuno |
| **data_exports** | Utente stesso + admin | Utente stesso + admin | Nessuno (stato machine) | Nessuno |
| **deletion_requests** | Utente stesso + admin | Utente stesso | Nessuno (stato machine) | Nessuno |
| **ai_processing_jobs** | Staff | Auto (functions) | Auto (worker) | Nessuno |
| **outbox_events** | Nessuno (internal) | Auto (trigger) | Auto (worker) | Auto (cleanup) |
| **idempotency_keys** | Utente stesso + service role | Service role | Nessuno | Auto (cleanup) |

---

## 8. Funzioni Helper

### update_updated_at()
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### is_memorial_member(memorial_id, user_id)
```sql
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
```

### is_memorial_guardian(memorial_id, user_id)
```sql
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
```

### has_memorial_permission(memorial_id, user_id, permission)
```sql
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
```

---

## 9. Views

### memorials_with_stats
```sql
CREATE VIEW memorials_with_stats AS
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
```

### posts_with_author
```sql
CREATE VIEW posts_with_author AS
SELECT
  p.*,
  pr.username AS author_username,
  pr.display_name AS author_display_name,
  pr.avatar_url AS author_avatar_url
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.author_id
WHERE p.deleted_at IS NULL;
```

### memorial_members_with_profiles
```sql
CREATE VIEW memorial_members_with_profiles AS
SELECT
  mm.*,
  pr.username,
  pr.display_name,
  pr.avatar_url
FROM memorial_members mm
LEFT JOIN profiles pr ON pr.id = mm.user_id;
```

---

## 10. Decisioni di Design

1. **UUID su tutte le PK**: Scelta per non esporre informazioni sequenziali e per compatibilità con Supabase Auth.

2. **Separazione memorials/memorial_settings**: Le impostazioni sono spesso aggiornate indipendentemente; separarle riduce lock contention su memorials.

3. **Pattern revisioni (post_revisions, comment_revisions)**: Ogni modifica crea una nuova riga; il contenuto corrente resta nella tabella principale per query veloci.

4. **Counter denormalizzati (posts.reaction_count, posts.comment_count, albums.item_count)**: Aggiornati via trigger per evitare COUNT(*) frequenti sulle liste.

5. **Tabella places separata da life_events**: Un luogo può esistere senza un evento (es. luogo di sepoltura). Relazione many-to-many implicita.

6. **media_variants separata**: Un asset può avere N varianti (thumbnail, small, medium, large). Worker di elaborazione popola questa tabella.

7. **outbox_events con identity PK bigint**: Per performance di polling sequenziale e ordering garantito.

8. **audit_events con identity PK bigint**: Stesso ragionamento; tabelle ad alta frequenza di scrittura.

9. **Soft delete ovunque appropriato**: `deleted_at` su memorials, posts, comments, media_assets, albums. Le tabelle di join (reactions, album_items) usano DELETE CASCADE fisico.

10. **RLS-first**: Nessuna tabella accessibile senza policy esplicita. Le funzioni helper (is_memorial_member, etc.) sono SECURITY DEFINER per aggirare RLS nel contesto delle policy.

11. **Check constraint su username**: Regex `^[a-zA-Z0-9_]+$` per URL-safe e mention-safe.

12. **memorials.slug unique**: Per URL puliti `/m/:slug`.

13. **content_status 11 stati**: Copre tutto il lifecycle da draft a deleted, inclusi stati intermedi per approval workflow e moderazione.

14. **media_assets.storage_path UNIQUE**: Previene collisioni nello storage.

15. **Indici parziali per stato 'active'/'published'**: Ottimizzano le query più frequenti (liste pubbliche) scansionando solo le righe rilevanti.
