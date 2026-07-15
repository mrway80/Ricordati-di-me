# Deployment Guide — Ricordati di Te

> **Versione**: 1.0  
> **Data**: 2025-06-01  
> **Ambiente Target**: Vercel + Supabase  

---

## Indice

1. [Ambienti](#1-ambienti)
2. [Supabase Setup](#2-supabase-setup)
3. [Vercel Deployment](#3-vercel-deployment)
4. [Database Migrations](#4-database-migrations)
5. [Seed Data](#5-seed-data)
6. [Environment Variables](#6-environment-variables)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Checklist Pre-Deploy](#8-checklist-pre-deploy)
9. [Rollback Procedure](#9-rollback-procedure)

---

## 1. Ambienti

### 1.1 Panoramica Ambienti

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │  Local   │───►│   Dev    │───►│  Preview │───►│  Staging │───► Prod  │
│   │  (dev)   │    │  (dev)   │    │  (vercel)│    │  (stage) │    (prod)  │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘            │
│        │               │               │               │                    │
│   Developer      Branch main      PR branches    Branch staging        Branch main
│   machine        local Supabase   Vercel auto    Supabase staging      Supabase prod
│                  supabase dev     preview        Vercel staging        Vercel prod
│                                                                              │
│   Flow:                                                                      │
│   Local ──git push──▶ Dev ──PR──▶ Preview ──merge──▶ Staging ──promote──▶ Prod  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Specifiche Ambienti

| Ambiente | URL Pattern | Supabase Project | Vercel Target | Accesso |
|----------|-------------|-----------------|---------------|---------|
| **Local** | `http://localhost:3000` | `ricordati-local` (Docker) | `next dev` | Solo developer |
| **Development** | `https://dev.ricordatidite.it` | `ricordati-dev` | Vercel (team) | Team interno |
| **Preview** | `https://<branch>--<project>.vercel.app` | `ricordati-dev` (shared) | Vercel (auto) | PR reviewers |
| **Staging** | `https://staging.ricordatidite.it` | `ricordati-staging` | Vercel (staging) | QA + stakeholder |
| **Production** | `https://ricordatidite.it` | `ricordati-prod` | Vercel (production) | Pubblico |

### 1.3 Ambiente Locale (Local)

```bash
# Requisiti
# - Node.js >= 20.x
# - pnpm >= 9.x (package manager)
# - Docker + Docker Compose (per Supabase locale)
# - Git

# 1. Clona il repository
git clone git@github.com:ricordatidite/platform.git
cd platform

# 2. Installa dipendenze
pnpm install

# 3. Avvia Supabase locale (include PostgreSQL, Auth, Storage, Edge Functions)
npx supabase start

# 4. Copia variabili d'ambiente
cp .env.local.example .env.local
# Modifica .env.local con i valori forniti da `npx supabase status`

# 5. Esegui migrazioni
npx supabase migration up

# 6. Popola dati di sviluppo
npx tsx scripts/seed.ts

# 7. Avvia il dev server
pnpm dev

# L'app è disponibile su http://localhost:3000
```

### 1.4 Supabase Status (dopo `npx supabase start`)

```
┌──────────────────────────────────────────────────────────┐
│  Supabase Status (locale)                                │
├──────────────────────────────────────────────────────────┤
│  API URL:            http://localhost:54321              │
│  GraphQL URL:        http://localhost:54321/graphql/v1   │
│  S3 Storage URL:     http://localhost:54321/storage/v1   │
│  DB URL:             postgresql://postgres:postgres@     │
│                      localhost:54322/postgres            │
│  Studio URL:         http://localhost:54323              │
│  Inbucket URL:       http://localhost:54324              │
│  JWT Secret:         <your-jwt-secret>                   │
│  Service Role Key:   <your-service-role-key>             │
│  Anon Key:           <your-anon-key>                     │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Supabase Setup

### 2.1 Progetti Supabase per Ambiente

| Proprietà | Dev | Staging | Production |
|-----------|-----|---------|------------|
| **Project Name** | `ricordati-dev` | `ricordati-staging` | `ricordati-prod` |
| **Region** | `eu-west-3` (Paris) | `eu-west-3` (Paris) | `eu-west-3` (Paris) |
| **DB Size** | Free/Pro | Pro | Pro |
| **Storage** | 1GB | 10GB | 100GB |
| **Realtime** | Enabled | Enabled | Enabled |
| **Auth** | Enabled | Enabled | Enabled |

> **Nota GDPR**: Tutti i progetti sono ospitati in `eu-west-3` (Parigi) per conformità al GDPR.

### 2.2 Configurazione Iniziale (per ogni progetto)

```bash
# 1. Link del progetto (esempio per staging)
npx supabase login
npx supabase link --project-ref <PROJECT_REF>

# 2. Verifica connessione
npx supabase status

# 3. Configura Auth Providers (GUI o CLI)
# - Email/Password: abilitato di default
# - Google OAuth: configurare Client ID e Secret
# - Apple OAuth: configurare per iOS (futuro)

# 4. Configura SMTP (per email transazionali)
# GUI: Authentication → SMTP Settings
# Host: smtp.resend.com
# Port: 587
# Username: resend
# Password: <RESEND_API_KEY>
# Sender: noreply@ricordatidite.it

# 5. Configura Storage Buckets
# Crea buckets: memorial-media, memorial-media-quarantine, memorial-avatars
# Imposta CORS per memorial-media
```

### 2.3 Storage Buckets

```sql
-- Creazione buckets (eseguire in SQL Editor per ogni progetto)

-- Bucket per media pubblici
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memorial-media',
  'memorial-media',
  true,
  104857600, -- 100MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/mp4']
);

-- Bucket per quarantena
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memorial-media-quarantine',
  'memorial-media-quarantine',
  false,
  104857600,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/mp4']
);

-- Bucket per avatar utenti
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memorial-avatars',
  'memorial-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

### 2.4 Row Level Security — Setup Iniziale

```sql
-- Abilita RLS su tutte le tabelle
ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE condolence_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE biography_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarantine_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

-- Storage RLS
CREATE POLICY "Public memorial media accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'memorial-media');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'memorial-media-quarantine' 
    AND auth.role() = 'authenticated'
  );
```

### 2.5 Edge Functions

| Function | Trigger | Scopo |
|----------|---------|-------|
| `quarantine-processor` | Storage upload + Cron | Processa file in quarantena |
| `recurrence-checker` | Cron (giornaliero, 06:00 UTC) | Verifica ricorrenze e invia notifiche |
| `digest-sender` | Cron (settimanale, lun 08:00 UTC) | Genera e invia digest settimanali |
| `cleanup-expired` | Cron (giornaliero, 02:00 UTC) | Pulisce inviti scaduti, contenuti rifiutati |
| `ai-moderation` | DB trigger (async) | Chiama API AI per moderazione |

```bash
# Deploy Edge Functions
npx supabase functions deploy quarantine-processor --project-ref <REF>
npx supabase functions deploy recurrence-checker --project-ref <REF>
npx supabase functions deploy digest-sender --project-ref <REF>
npx supabase functions deploy cleanup-expired --project-ref <REF>
npx supabase functions deploy ai-moderation --project-ref <REF>
```

---

## 3. Vercel Deployment

### 3.1 Progetti Vercel

| Proprietà | Development | Staging | Production |
|-----------|------------|---------|------------|
| **Project Name** | `ricordati-dev` | `ricordati-staging` | `ricordati-prod` |
| **Framework** | Next.js | Next.js | Next.js |
| **Build Command** | `pnpm build` | `pnpm build` | `pnpm build` |
| **Output Dir** | `.next` | `.next` | `.next` |
| **Install Command** | `pnpm install` | `pnpm install` | `pnpm install` |
| **Node Version** | 20.x | 20.x | 20.x |

### 3.2 Deploy da CLI

```bash
# 1. Installa Vercel CLI
pnpm add -g vercel

# 2. Login
vercel login

# 3. Link progetto (una tantum)
vercel link

# 4. Deploy Development
vercel --target=development

# 5. Deploy Staging
vercel --target=staging

# 6. Deploy Production
vercel --target=production --prod
```

### 3.3 Preview Branches (Automatico)

Ogni Pull Request su GitHub genera automaticamente un **Preview Deployment**:

```
┌─────────────────────────────────────────────────────────────┐
│  PR #123: feature/new-dashboard                              │
│                                                              │
│  GitHub ──▶ Vercel ──▶ https://feature-new-dashboard-       │
│           Bot             abc123-ricordati.vercel.app        │
│                                                              │
│  Variabili d'ambiente: ereditate da Development             │
│  Database:      ricordati-dev (condiviso con dev)           │
│  Scopo:         Review visuale, testing funzionale          │
│                                                              │
│  Commento automatico su PR con link al preview               │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Configurazione `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "regions": ["cdg1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(self)"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "private, no-cache, no-store, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "/api/sitemap"
    }
  ],
  "crons": [
    {
      "path": "/api/cron/recurrences",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/digests",
      "schedule": "0 8 * * 1"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## 4. Database Migrations

### 4.1 Workflow Versionato

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MIGRATION WORKFLOW                                                      │
│                                                                          │
│  1. Developer crea migration locale:                                     │
│     npx supabase migration new add_memorial_timeline                     │
│                                                                          │
│  2. Scrive SQL in:                                                       │
│     supabase/migrations/YYYYMMDDHHMMSS_add_memorial_timeline.sql         │
│                                                                          │
│  3. Testa localmente:                                                    │
│     npx supabase migration up                                            │
│     npx supabase db reset  # (per testare da zero)                       │
│                                                                          │
│  4. Commit e PR:                                                         │
│     git add supabase/migrations/                                         │
│     git commit -m "feat(db): add memorial timeline table"                │
│                                                                          │
│  5. Code Review (DB review obbligatorio)                                 │
│                                                                          │
│  6. Merge su staging → auto-deploy via CI                                │
│     npx supabase migration up --linked                                   │
│                                                                          │
│  7. Test su staging → Merge su main → auto-deploy produzione            │
│     npx supabase migration up --linked                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Convenzioni Nomenclatura

| Tipo | Pattern | Esempio |
|------|---------|---------|
| Nuova tabella | `create_<table_name>` | `create_memorials` |
| Aggiunta colonna | `add_<column>_to_<table>` | `add_biography_to_memorials` |
| Modifica colonna | `alter_<column>_on_<table>` | `alter_privacy_level_on_memorials` |
| Indice | `add_index_on_<table>_<column>` | `add_index_on_memorials_slug` |
| RLS Policy | `add_rls_<table>_<action>` | `add_rls_memorials_select` |
| Funzione | `create_fn_<name>` | `create_fn_check_custodian` |
| Trigger | `create_trg_<table>_<event>` | `create_trg_memorials_updated` |

### 4.3 Struttura Migrazioni

```sql
-- supabase/migrations/20250601120000_create_memorials.sql

-- ============================================
-- Migration: create_memorials
-- Created: 2025-06-01 12:00:00
-- Author: <nome-developer>
-- Ticket: RDT-123
-- ============================================

-- Tabella memorials
CREATE TABLE IF NOT EXISTS public.memorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE,
  death_date DATE NOT NULL,
  birthplace VARCHAR(200),
  deathplace VARCHAR(200),
  biography TEXT,
  profile_photo_url TEXT,
  privacy_level VARCHAR(20) NOT NULL DEFAULT 'PRIVATE' 
    CHECK (privacy_level IN ('PUBLIC', 'PRIVATE', 'INVITE_ONLY')),
  custodian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (death_date >= birth_date OR birth_date IS NULL)
);

-- Indici
CREATE INDEX idx_memorials_slug ON public.memorials(slug);
CREATE INDEX idx_memorials_custodian ON public.memorials(custodian_id);
CREATE INDEX idx_memorials_privacy ON public.memorials(privacy_level) WHERE is_active = true;
CREATE INDEX idx_memorials_names ON public.memorials USING gin(to_tsvector('italian', first_name || ' ' || last_name));

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_memorials_updated
  BEFORE UPDATE ON public.memorials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Abilita RLS
ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;

-- Commenti per documentazione
COMMENT ON TABLE public.memorials IS 'Memoriali digitali dedicati a persone decedute';
COMMENT ON COLUMN public.memorials.privacy_level IS 'PUBLIC: visibile a tutti, PRIVATE: solo membri, INVITE_ONLY: su richiesta';
```

### 4.4 Comandi Utili

```bash
# Crea nuova migrazione
npx supabase migration new <nome_migration>

# Applica migrazioni locali
npx supabase migration up

# Applica migrazioni su progetto linkato
npx supabase migration up --linked

# Rollback ultima migrazione (solo locale)
npx supabase migration repair --status reverted <timestamp>

# Reset database locale (applica tutte le migrazioni da zero)
npx supabase db reset

# Genera TypeScript types dal database
npx supabase gen types typescript --local > lib/database.types.ts
n
# Verifica migrazioni pendenti
npx supabase migration list

# Diff tra database locale e remote
npx supabase db diff --linked
```

### 4.5 Database Types Generation

```bash
# Genera types TypeScript per ogni ambiente

# Development
npx supabase gen types typescript --project-ref <DEV_REF> > lib/database.types.ts

# Staging
npx supabase gen types typescript --project-ref <STAGING_REF> > lib/database.types.staging.ts

# Production
npx supabase gen types typescript --project-ref <PROD_REF> > lib/database.types.prod.ts
```

---

## 5. Seed Data

### 5.1 Seed per Sviluppo

```typescript
// scripts/seed.ts

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker/locale/it';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log('🌱 Starting seed...');

  // 1. Crea utenti di test
  const users = await seedUsers(10);
  console.log(`✅ Created ${users.length} users`);

  // 2. Crea memoriali
  const memorials = await seedMemorials(users, 5);
  console.log(`✅ Created ${memorials.length} memorials`);

  // 3. Assegna ruoli
  await seedRoleAssignments(users, memorials);
  console.log('✅ Created role assignments');

  // 4. Crea posts e storie
  await seedContent(memorials, users, 30);
  console.log('✅ Created content');

  // 5. Crea messaggi di vicinanza
  await seedCondolenceMessages(memorials, users, 50);
  console.log('✅ Created condolence messages');

  // 6. Crea ricorrenze
  await seedRecurrences(memorials);
  console.log('✅ Created recurrences');

  console.log('🎉 Seed completed!');
}

async function seedUsers(count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const email = `test${i}@ricordatidite.local`;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: 'Test123!',
      email_confirm: true,
    });
    if (error) throw error;
    
    await supabase.from('user_profiles').insert({
      user_id: data.user!.id,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      display_name: faker.person.fullName(),
    });
    
    users.push(data.user!);
  }
  return users;
}

async function seedMemorials(users: any[], count: number) {
  const memorials = [];
  for (let i = 0; i < count; i++) {
    const custodian = users[i % users.length];
    const { data, error } = await supabase.from('memorials').insert({
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      birth_date: faker.date.birthdate({ min: 1920, max: 2000, mode: 'year' }),
      death_date: faker.date.between({ from: '2010-01-01', to: '2024-12-31' }),
      biography: faker.lorem.paragraphs(3),
      privacy_level: ['PUBLIC', 'PRIVATE', 'INVITE_ONLY'][i % 3],
      custodian_id: custodian.id,
    }).select().single();
    
    if (error) throw error;
    memorials.push(data);
  }
  return memorials;
}

// ... (altre funzioni seed similari)

seed().catch(console.error);
```

### 5.2 Esecuzione Seed

```bash
# Sviluppo locale
npx tsx scripts/seed.ts

# Con parametro di ambiente
NODE_ENV=development npx tsx scripts/seed.ts

# Reset + re-seed
npx supabase db reset && npx tsx scripts/seed.ts
```

### 5.3 Seed per Staging

```typescript
// scripts/seed-staging.ts
// Dati più realistici per demo con stakeholder

async function seedStaging() {
  console.log('🌱 Seeding staging environment...');
  
  // Memoriali con nomi italiani realistici
  const italianNames = [
    { first: 'Giuseppe', last: 'Rossi', birth: '1945-03-15', death: '2023-01-20' },
    { first: 'Maria', last: 'Bianchi', birth: '1950-07-22', death: '2022-11-05' },
    { first: 'Antonio', last: 'Ferrari', birth: '1938-11-30', death: '2024-03-12' },
  ];
  
  // Utenti fittizi ma coerenti
  const familyMembers = [
    { email: 'maria.rossi@example.com', name: 'Maria Rossi', role: 'CUSTODIAN' },
    { email: 'luca.rossi@example.com', name: 'Luca Rossi', role: 'CO_CUSTODIAN' },
    { email: 'giulia.rossi@example.com', name: 'Giulia Rossi', role: 'COLLABORATOR' },
  ];
  
  // ... implementazione seed staging
}
```

### 5.4 Dati Non-Seedati (Sempre Vuoti)

Le seguenti tabelle **non** vengono popolate dai seed:

| Tabella | Motivazione |
|---------|-------------|
| `audit_logs` | Popolata automaticamente dall'applicazione |
| `notifications` | Popolata dal notification service |
| `reports` | Popolata dagli utenti reali |
| `quarantine_jobs` | Popolata dalla pipeline |
| `ai_jobs` | Popolata dal moderation service |
| `search_index` | Popolata dall'indexer |

---

## 6. Environment Variables

### 6.1 Variabili Richieste per Ambiente

#### Local (.env.local)

```bash
# ============================================
# Local Environment Variables
# ============================================

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Ricordati di Te"

# Supabase (valori da `npx supabase status`)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret>

# Auth
NEXT_PUBLIC_AUTH_CALLBACK_URL=http://localhost:3000/auth/callback

# AI / Moderation
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_MODERATION_ENABLED=false          # Disabilitato in locale per costi
AI_MODERATION_THRESHOLD=0.8

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@ricordatidite.local
EMAIL_ENABLED=false                  # Disabilitato in locale

# Storage
STORAGE_BUCKET_MEMORIAL=memorial-media
STORAGE_BUCKET_QUARANTINE=memorial-media-quarantine
STORAGE_BUCKET_AVATARS=memorial-avatars

# Feature Flags
FEATURE_SEARCH_ENABLED=true
FEATURE_DIGEST_ENABLED=true
FEATURE_AI_MODERATION=false

# Logging
LOG_LEVEL=debug

# Security
RATE_LIMIT_ENABLED=false
```

#### Development

```bash
# ============================================
# Development Environment Variables
# (Configurate su Vercel: Project Settings → Environment Variables)
# ============================================

NEXT_PUBLIC_APP_URL=https://dev.ricordatidite.it
NEXT_PUBLIC_APP_NAME="Ricordati di Te [Dev]"

NEXT_PUBLIC_SUPABASE_URL=https://<dev-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<dev-service-role-key>

NEXT_PUBLIC_AUTH_CALLBACK_URL=https://dev.ricordatidite.it/auth/callback

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_MODERATION_ENABLED=true
AI_MODERATION_THRESHOLD=0.8

RESEND_API_KEY=re_...
EMAIL_FROM=noreply@dev.ricordatidite.it
EMAIL_ENABLED=true

FEATURE_SEARCH_ENABLED=true
FEATURE_DIGEST_ENABLED=true
FEATURE_AI_MODERATION=true

LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
```

#### Staging

```bash
# ============================================
# Staging Environment Variables
# ============================================

NEXT_PUBLIC_APP_URL=https://staging.ricordatidite.it
NEXT_PUBLIC_APP_NAME="Ricordati di Te [Staging]"

NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>

NEXT_PUBLIC_AUTH_CALLBACK_URL=https://staging.ricordatidite.it/auth/callback

# AI: stesse chiavi dev, threshold più basso per testare moderazione
AI_MODERATION_ENABLED=true
AI_MODERATION_THRESHOLD=0.6          # Più sensibile per testing

RESEND_API_KEY=re_...
EMAIL_FROM=noreply@staging.ricordatidite.it
EMAIL_ENABLED=true

FEATURE_SEARCH_ENABLED=true
FEATURE_DIGEST_ENABLED=true
FEATURE_AI_MODERATION=true

LOG_LEVEL=info
RATE_LIMIT_ENABLED=true

# Sentry (error tracking)
SENTRY_DSN=https://<key>@sentry.io/<project>
SENTRY_ENVIRONMENT=staging
```

#### Production

```bash
# ============================================
# Production Environment Variables
# SENSITIVE: Gestite solo via Vercel Dashboard
# ============================================

NEXT_PUBLIC_APP_URL=https://ricordatidite.it
NEXT_PUBLIC_APP_NAME="Ricordati di Te"

NEXT_PUBLIC_SUPABASE_URL=https://<prod-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-role-key>

NEXT_PUBLIC_AUTH_CALLBACK_URL=https://ricordatidite.it/auth/callback

# AI: chiavi dedicate per produzione
OPENAI_API_KEY=sk-prod-...
ANTHROPIC_API_KEY=sk-ant-prod-...
AI_MODERATION_ENABLED=true
AI_MODERATION_THRESHOLD=0.85         # Più conservativo in produzione

RESEND_API_KEY=re_prod_...
EMAIL_FROM=noreply@ricordatidite.it
EMAIL_ENABLED=true

FEATURE_SEARCH_ENABLED=true
FEATURE_DIGEST_ENABLED=true
FEATURE_AI_MODERATION=true

LOG_LEVEL=warn                       # Meno verboso in produzione
RATE_LIMIT_ENABLED=true

# Sentry Production
SENTRY_DSN=https://<key>@sentry.io/<project>
SENTRY_ENVIRONMENT=production

# Analytics
VERCEL_ANALYTICS_ENABLED=true
```

### 6.2 Tabella Riassuntiva Variabili

| Variabile | Local | Dev | Staging | Prod | Visibilità |
|-----------|:-----:|:---:|:-------:|:----:|------------|
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | ✅ | ✅ | Public |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | ✅ | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | ✅ | Public |
| `NEXT_PUBLIC_AUTH_CALLBACK_URL` | ✅ | ✅ | ✅ | ✅ | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ | ✅ | Secret |
| `SUPABASE_JWT_SECRET` | ✅ | ❌ | ❌ | ❌ | Secret |
| `OPENAI_API_KEY` | ✅ | ✅ | ✅ | ✅ | Secret |
| `ANTHROPIC_API_KEY` | ✅ | ✅ | ✅ | ✅ | Secret |
| `RESEND_API_KEY` | ✅ | ✅ | ✅ | ✅ | Secret |
| `SENTRY_DSN` | ❌ | ❌ | ✅ | ✅ | Secret |
| `AI_MODERATION_ENABLED` | ✅ | ✅ | ✅ | ✅ | Secret |
| `AI_MODERATION_THRESHOLD` | ✅ | ✅ | ✅ | ✅ | Secret |
| `EMAIL_ENABLED` | ✅ | ✅ | ✅ | ✅ | Secret |
| `LOG_LEVEL` | ✅ | ✅ | ✅ | ✅ | Secret |
| `RATE_LIMIT_ENABLED` | ✅ | ✅ | ✅ | ✅ | Secret |

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

env:
  NODE_VERSION: '20.x'
  PNPM_VERSION: '9'

jobs:
  # ============================================
  # 1. Lint & Type Check
  # ============================================
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm typecheck

  # ============================================
  # 2. Unit Tests
  # ============================================
  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run unit tests
        run: pnpm test:unit --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests

  # ============================================
  # 3. Database Migration Validation
  # ============================================
  db-validate:
    name: Validate DB Migrations
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15.1.1.78
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 54322:5432
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Start Supabase
        run: supabase start
      
      - name: Run migrations
        run: supabase migration up
      
      - name: Generate types
        run: supabase gen types typescript --local > lib/database.types.ts
      
      - name: Check types are up to date
        run: git diff --exit-code lib/database.types.ts

  # ============================================
  # 4. E2E Tests (Playwright)
  # ============================================
  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [lint, test-unit]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium
      
      - name: Start Supabase
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          CI: true
      
      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  # ============================================
  # 5. Build
  # ============================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test-unit]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build
```

### 7.2 Deploy Workflow

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [lint, test-unit, db-validate]
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: '9'
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      # Deploy Supabase migrations
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
      
      - name: Deploy migrations to staging
        run: supabase migration up --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.STAGING_SUPABASE_PROJECT_ID }}
      
      # Deploy to Vercel
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_STAGING_PROJECT_ID }}
          github-comment: false

# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production  # Richiede approvazione manuale
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: '9'
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      # Deploy Supabase migrations
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
      
      - name: Deploy migrations to production
        run: supabase migration up --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.PROD_SUPABASE_PROJECT_ID }}
      
      # Deploy to Vercel
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROD_PROJECT_ID }}
          vercel-args: '--prod'
          github-comment: false
      
      # Smoke test
      - name: Smoke test
        run: |
          sleep 30
          curl -f https://ricordatidite.it/api/health || exit 1
```

### 7.3 Secrets Repository (GitHub)

| Secret | Ambito | Descrizione |
|--------|--------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Repository | Token CLI Supabase |
| `STAGING_SUPABASE_PROJECT_ID` | Repository | Project ref staging |
| `PROD_SUPABASE_PROJECT_ID` | Repository | Project ref production |
| `VERCEL_TOKEN` | Repository | Token API Vercel |
| `VERCEL_ORG_ID` | Repository | ID organizzazione Vercel |
| `VERCEL_STAGING_PROJECT_ID` | Repository | ID progetto staging |
| `VERCEL_PROD_PROJECT_ID` | Repository | ID progetto production |

### 7.4 Environment Protection Rules

| Ambiente | Richiede Approvazione | Approvatori | Branches Permesse |
|----------|----------------------|-------------|-------------------|
| **Staging** | No | — | `staging` |
| **Production** | ✅ Sì | Tech Lead, Product Owner | `main` |

---

## 8. Checklist Pre-Deploy

### 8.1 Checklist Generale (Ogni Deploy)

```markdown
## Pre-Deploy Checklist

### Codice
- [ ] Tutte le PR sono state reviewate e approvate
- [ ] Il branch è aggiornato con il target (rebase/merge)
- [ ] I conflitti sono risolti
- [ ] Il codice segue le convenzioni del progetto (lint pass)
- [ ] I test unitari passano (`pnpm test:unit`)
- [ ] I test E2E passano (`pnpm test:e2e`)
- [ ] La coverage è >= 80%

### Database
- [ ] Le migrazioni sono state testate in locale
- [ ] Le migrazioni sono idempotenti (possono essere rieseguite)
- [ ] I tipi TypeScript sono aggiornati (`pnpm db:types`)
- [ ] Le RLS policies sono definite per le nuove tabelle
- [ ] Gli indici sono stati creati per le query frequenti
- [ ] Il piano di rollback delle migrazioni è documentato

### API / Server Actions
- [ ] Le nuove Server Actions sono protette da auth
- [ ] La validazione input è completa (zod schemas)
- [ ] Il rate limiting è configurato per i nuovi endpoint
- [ ] Gli errori sono gestiti e non leakano informazioni interne

### Frontend
- [ ] Il build Next.js passa senza errori (`pnpm build`)
- [ ] Il Lighthouse score è > 90 per le pagine modificate
- [ ] Le pagine sono responsive (testato su mobile)
- [ ] I componenti client sono minimizzati

### Feature Flags
- [ ] Le nuove feature sono dietro feature flag se necessario
- [ ] I feature flag sono configurati per ogni ambiente

### Documentazione
- [ ] Il CHANGELOG è aggiornato
- [ ] Le ADRs sono aggiornate (se nuove decisioni)
- [ ] La documentazione API è aggiornata

### Compliance
- [ ] Nessun dato sensibile hardcoded
- [ ] Nessun secret committato
- [ ] Privacy Policy aggiornata (se necessario)
- [ ] DPIA aggiornata (se nuovo processing dati)
```

### 8.2 Checklist Deploy Staging

```markdown
## Deploy Staging Specifico

- [ ] Variabili d'ambiente staging sono aggiornate su Vercel
- [ ] Il database staging è accessibile
- [ ] I seed data sono presenti per testing
- [ ] L'ambiente staging è isolato dalla produzione
- [ ] Gli email non vengono inviate a indirizzi reali
- [ ] I pagamenti (futuri) sono in modalità test
- [ ] Il monitoring è attivo (Sentry staging)
```

### 8.3 Checklist Deploy Produzione

```markdown
## Deploy Produzione Specifico

- [ ] Approvazione Tech Lead ottenuta
- [ ] Approvazione Product Owner ottenuta
- [ ] Window di maintenance comunicata (se necessaria)
- [ ] Backup database confermato
- [ ] Piano di rollback testato e documentato
- [ ] Smoke test definiti e pronti
- [ ] Team on-call notificato
- [ ] Canale #deployments aggiornato
- [ ] Feature flags per rollout graduale configurati
- [ ] Analytics baseline registrata (per misurare impatto)
```

### 8.4 Smoke Test Post-Deploy

```bash
#!/bin/bash
# scripts/smoke-test.sh

set -e

BASE_URL=${1:-"https://ricordatidite.it"}
echo "Running smoke tests against $BASE_URL..."

# 1. Health check
echo "1. Health check..."
curl -sf "$BASE_URL/api/health" > /dev/null && echo "✅ OK" || { echo "❌ FAIL"; exit 1; }

# 2. Homepage
echo "2. Homepage..."
curl -sf "$BASE_URL" > /dev/null && echo "✅ OK" || { echo "❌ FAIL"; exit 1; }

# 3. Login page
echo "3. Login page..."
curl -sf "$BASE_URL/login" > /dev/null && echo "✅ OK" || { echo "❌ FAIL"; exit 1; }

# 4. Ricerca (pubblica)
echo "4. Search page..."
curl -sf "$BASE_URL/ricerca" > /dev/null && echo "✅ OK" || { echo "❌ FAIL"; exit 1; }

# 5. API: ricerca memoriali
echo "5. Search API..."
curl -sf "$BASE_URL/api/memorials/search?q=test" > /dev/null && echo "✅ OK" || { echo "❌ FAIL"; exit 1; }

# 6. Static assets (CSS)
echo "6. Static assets..."
CURL_OUTPUT=$(curl -sf "$BASE_URL")
CSS_URL=$(echo "$CURL_OUTPUT" | grep -oP 'href="[^"]*\.css[^"]*"' | head -1 | sed 's/href="//;s/"//')
if [ -n "$CSS_URL" ]; then
  curl -sf "$BASE_URL$CSS_URL" > /dev/null && echo "✅ OK" || { echo "❌ FAIL"; exit 1; }
else
  echo "⚠️ No CSS found (might be inlined)"
fi

echo ""
echo "🎉 All smoke tests passed!"
```

---

## 9. Rollback Procedure

### 9.1 Rollback Database

```bash
# ============================================
# DATABASE ROLLBACK
# ATTENZIONE: Le migrazioni di rollback sono DANGEROUS
# Preferire sempre forward-fix quando possibile
# ============================================

# Opzione 1: Rollback specifico (se la migrazione ha down script)
npx supabase migration repair --status reverted 20250601120000

# Opzione 2: Restore da backup (consigliato per produzione)
# 1. Identifica il backup pre-deploy
npx supabase backups list --project-ref <PROD_REF>

# 2. Inizializza restore
npx supabase backups restore --project-ref <PROD_REF> --backup-id <BACKUP_ID>

# 3. Verifica il restore
npx supabase status --project-ref <PROD_REF>

# Opzione 3: Forward-fix (PREFERITO)
# Crea una nuova migrazione che corregge il problema
npx supabase migration new fix_<descrizione>
# Scrivi il SQL di correzione
npx supabase migration up --linked
```

### 9.2 Rollback Applicazione (Vercel)

```bash
# ============================================
# VERCEL ROLLBACK
# ============================================

# 1. Lista deployment recenti
vercel --version
vercel list ricordati-prod

# 2. Promuovi deployment precedente
vercel promote <PREVIOUS_DEPLOYMENT_ID>

# Oppure via GUI:
# Vercel Dashboard → Project → Deployments → ... → Promote to Production

# 3. Verifica rollback
curl -f https://ricordatidite.it/api/health
```

### 9.3 Runbook: Rollback Completo

```markdown
# RUNBOOK: Rollback Emergenza Produzione

## Trigger
- Error rate > 5% per 5 minuti consecutive
- Funzionalità critica non operativa
- Data integrity compromise
- Security incident

## Procedura (max 15 minuti)

### 0:00-2:00 — Assessment
1. Verifica la natura del problema (Sentry, logs, alert)
2. Determina se forward-fix è possibile in < 30 min
3. Se no → procedi con rollback

### 2:00-5:00 — Notifica
1. Notifica team in #incidents
2. Aggiorna status page
3. Se necessario, attiva pagina di manutenzione:
   ```bash
   vercel env add MAINTENANCE_MODE true --prod
   ```

### 5:00-10:00 — Rollback Applicazione
1. Identifica ultimo deployment stabile
2. Esegui rollback Vercel:
   ```bash
   vercel promote <STABLE_DEPLOYMENT_ID>
   ```
3. Verifica smoke tests

### 10:00-15:00 — Rollback Database (se necessario)
1. Se la migrazione ha causato il problema:
   ```bash
   # Opzione A: Forward-fix migration
   npx supabase migration new rollback_<issue>
   # Scrivi lo script di rollback
   npx supabase migration up --linked
   
   # Opzione B: Restore da backup (solo emergenza)
   npx supabase backups restore --project-ref <REF> --backup-id <ID>
   ```

### Post-Rollback
1. Verifica sistema stabile (monitoring per 30 min)
2. Analisi post-mortem entro 24 ore
3. Documenta lezioni apprese
```

### 9.4 Backup Schedule

| Ambiente | Frequenza | Retention | Metodo |
|----------|-----------|-----------|--------|
| Local | N/A | N/A | Docker volumes |
| Development | Giornaliero | 7 giorni | Supabase automated |
| Staging | Giornaliero | 14 giorni | Supabase automated |
| Production | Ogni 4 ore | 30 giorni | Supabase automated + manual |

---

## Appendice A: Comandi Rapidi

```bash
# === SVILUPPO LOCALE ===
pnpm dev                          # Avvia dev server
pnpm build                        # Build di produzione
pnpm lint                         # Esegui linter
pnpm typecheck                    # TypeScript check
pnpm test:unit                    # Test unitari
pnpm test:unit --coverage         # Test con coverage
pnpm test:e2e                     # Test E2E (Playwright)
pnpm db:types                     # Genera tipi Supabase

# === SUPABASE ===
npx supabase start                # Avvia Supabase locale
npx supabase stop                 # Ferma Supabase locale
npx supabase status               # Stato servizi
npx supabase db reset             # Reset DB con migrazioni
npx supabase migration new <name> # Nuova migrazione
npx supabase migration up         # Applica migrazioni
npx supabase migration list       # Lista migrazioni
npx supabase link                 # Link progetto remoto
npx supabase functions deploy     # Deploy Edge Functions
npx supabase functions serve      # Serve Edge Functions locale

# === VERCEL ===
vercel                            # Deploy preview
vercel --prod                     # Deploy produzione
vercel env ls                     # Lista variabili d'ambiente
vercel env add <name>             # Aggiungi variabile
vercel logs                      # Log deployment
```

## Appendice B: Monitoring & Alerting

| Servizio | Scopo | URL |
|----------|-------|-----|
| Vercel Analytics | Web performance | Dashboard Vercel |
| Vercel Logs | Log applicazione | Dashboard Vercel |
| Sentry | Error tracking | https://sentry.io/ |
| Supabase Dashboard | DB health, RLS, storage | https://supabase.com/dashboard |
| UptimeRobot | Uptime monitoring | https://uptimerobot.com/ |
| Status Page | Stato pubblico | https://status.ricordatidite.it |

## Appendice C: Contatti On-Call

| Ruolo | Nome | Telefono | Slack |
|-------|------|----------|-------|
| Tech Lead | TBD | TBD | @tech-lead |
| DevOps | TBD | TBD | @devops |
| Product Owner | TBD | TBD | @product-owner |

---

*Documento versionato. Per modifiche, aprire una PR nel repository docs/.*
