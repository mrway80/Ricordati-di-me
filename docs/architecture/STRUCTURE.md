# Struttura del Progetto — Ricordati di Te

**Data redazione**: 2025-01-15
**Versione**: 1.0.0
**Stato**: Repository vuoto — struttura proposta per inizializzazione
**Riferimento**: Complementare a INVENTORY.md

---

## 1. Panoramica Strutturale

Il progetto segue un pattern di **monorepo semplificato** basato su pnpm workspaces. La struttura e progettata per supportare l'evoluzione futura (separazione in pacchetti indipendenti, aggiunta di app) senza richiedere refactoring architetturali.

L'organizzazione interna di `apps/web/src/` segue un approccio **domain-driven a livello di directory**, dove il codice e organizzato per bounded context logico anziche per tipo tecnico. Questo migliora la localita del codice, riduce l'accoppiamento e facilita la navigazione in codebase in crescita.

---

## 2. Albero Completo del Progetto

```
ricordatidite/                                    # Root monorepo
|
+-- .github/                                    # GitHub configuration
|   +-- workflows/
|   |   +-- ci.yml                              # Pipeline CI principale
|   |   +-- e2e.yml                             # Test E2E dedicati
|   |   +-- deploy-staging.yml                  # Deploy su staging
|   |   +-- deploy-production.yml               # Deploy su production
|   +-- PULL_REQUEST_TEMPLATE.md
|   +-- CODEOWNERS
|
+-- .husky/                                     # Git hooks
|   +-- pre-commit                              # Lint + format check
|   +-- pre-push                                # Test run
|   +-- commit-msg                              # Conventional commits check
|
+-- apps/                                       # Applicazioni
|   +-- web/                                    # Next.js App Router
|   |   +-- src/
|   |   |   +-- app/                            # App Router (Next.js 15)
|   |   |   |   +-- (marketing)/                # Route group: pagine marketing
|   |   |   |   |   +-- page.tsx                # Landing page
|   |   |   |   |   +-- layout.tsx              # Layout marketing
|   |   |   |   |   +-- chi-siamo/
|   |   |   |   |   +-- come-funziona/
|   |   |   |   |   +-- prezzi/
|   |   |   |   |
|   |   |   |   +-- (dashboard)/                # Route group: area autenticata
|   |   |   |   |   +-- layout.tsx              # Layout con sidebar/nav auth
|   |   |   |   |   +-- page.tsx                # Dashboard principale
|   |   |   |   |   +-- ricordi/
|   |   |   |   |   |   +-- page.tsx            # Lista ricordi
|   |   |   |   |   |   +-- [id]/
|   |   |   |   |   |   |   +-- page.tsx        # Dettaglio ricordo
|   |   |   |   |   |   |   +-- modifica/
|   |   |   |   |   |   |   |   +-- page.tsx    # Modifica ricordo
|   |   |   |   |   |   +-- nuovo/
|   |   |   |   |   |   |   +-- page.tsx        # Crea nuovo ricordo
|   |   |   |   |   +-- timeline/
|   |   |   |   |   |   +-- page.tsx            # Vista timeline
|   |   |   |   |   +-- profilo/
|   |   |   |   |   |   +-- page.tsx            # Profilo utente
|   |   |   |   |   |   +-- impostazioni/
|   |   |   |   |   |   |   +-- page.tsx        # Impostazioni account
|   |   |   |   |   +-- condivisione/
|   |   |   |   |   |   +-- page.tsx            # Gestione condivisioni
|   |   |   |   |
|   |   |   |   +-- auth/                       # Route group: autenticazione
|   |   |   |   |   +-- callback/
|   |   |   |   |   |   +-- route.ts            # OAuth callback handler
|   |   |   |   |   +-- conferma/
|   |   |   |   |   |   +-- page.tsx            # Conferma email
|   |   |   |   |   +-- reimposta-password/
|   |   |   |   |   |   +-- page.tsx            # Reset password
|   |   |   |   |
|   |   |   |   +-- api/                        # API Routes (legacy/extension)
|   |   |   |   |   +-- webhooks/
|   |   |   |   |   |   +-- route.ts            # Webhook handlers
|   |   |   |   |
|   |   |   |   +-- layout.tsx                  # Root layout (font, metadata, providers)
|   |   |   |   +-- globals.css                  # Stili globali + Tailwind directives
|   |   |   |   +-- error.tsx                   # Error boundary globale
|   |   |   |   +-- not-found.tsx               # Pagina 404
|   |   |   |   +-- loading.tsx                 # UI di loading globale
|   |   |   |   +-- sitemap.ts                  # Sitemap dinamica
|   |   |   |   +-- robots.ts                   # robots.txt dinamico
|   |   |   |
|   |   |   +-- components/                     # Componenti condivisi cross-domain
|   |   |   |   +-- ui/                         # shadcn/ui components (auto-generated)
|   |   |   |   |   +-- button.tsx
|   |   |   |   |   +-- card.tsx
|   |   |   |   |   +-- dialog.tsx
|   |   |   |   |   +-- form.tsx
|   |   |   |   |   +-- input.tsx
|   |   |   |   |   +-- label.tsx
|   |   |   |   |   +-- select.tsx
|   |   |   |   |   +-- toast.tsx
|   |   |   |   |   +-- toaster.tsx
|   |   |   |   |   +-- dropdown-menu.tsx
|   |   |   |   |   +-- ...
|   |   |   |   |
|   |   |   |   +-- layout/                     # Componenti strutturali layout
|   |   |   |   |   +-- Header.tsx
|   |   |   |   |   +-- Footer.tsx
|   |   |   |   |   +-- Sidebar.tsx
|   |   |   |   |   +-- MobileNav.tsx
|   |   |   |   |   +-- Breadcrumbs.tsx
|   |   |   |   |   +-- UserNav.tsx
|   |   |   |   |
|   |   |   |   +-- feedback/                   # Feedback UX
|   |   |   |   |   +-- LoadingSpinner.tsx
|   |   |   |   |   +-- EmptyState.tsx
|   |   |   |   |   +-- ErrorState.tsx
|   |   |   |   |   +-- SkeletonCard.tsx
|   |   |   |   |   +-- ToastProvider.tsx
|   |   |   |   |
|   |   |   |   +-- providers/                  # React context providers
|   |   |   |   |   +-- QueryProvider.tsx       # TanStack Query
|   |   |   |   |   +-- AuthProvider.tsx        # Auth state
|   |   |   |   |   +-- ThemeProvider.tsx        # Dark/light mode
|   |   |   |
|   |   |   +-- domains/                        # Bounded contexts (logica di dominio)
|   |   |   |   +-- memories/                   # Dominio: Ricordi
|   |   |   |   |   +-- components/
|   |   |   |   |   |   +-- MemoryCard.tsx
|   |   |   |   |   |   +-- MemoryForm.tsx
|   |   |   |   |   |   +-- MemoryList.tsx
|   |   |   |   |   |   +-- MemoryDetail.tsx
|   |   |   |   |   |   +-- MemoryEditor.tsx
|   |   |   |   |   |   +-- MediaGallery.tsx
|   |   |   |   |   |   +-- MemoryTimeline.tsx
|   |   |   |   |   |
|   |   |   |   |   +-- actions/                # Server Actions
|   |   |   |   |   |   +-- createMemory.ts
|   |   |   |   |   |   +-- updateMemory.ts
|   |   |   |   |   |   +-- deleteMemory.ts
|   |   |   |   |   |   +-- toggleFavorite.ts
|   |   |   |   |   |
|   |   |   |   |   +-- schemas/                # Zod schemas
|   |   |   |   |   |   +-- memorySchema.ts
|   |   |   |   |   |   +-- mediaSchema.ts
|   |   |   |   |
|   |   |   |   |   +-- types/
|   |   |   |   |   |   +-- memory.ts
|   |   |   |   |   |   +-- media.ts
|   |   |   |   |
|   |   |   |   |   +-- hooks/
|   |   |   |   |   |   +-- useMemories.ts
|   |   |   |   |   |   +-- useMemory.ts
|   |   |   |   |   |   +-- useMemoryMutations.ts
|   |   |   |   |
|   |   |   |   |   +-- queries/                # TanStack Query + Supabase
|   |   |   |   |   |   +-- getMemories.ts
|   |   |   |   |   |   +-- getMemoryById.ts
|   |   |   |   |   |   +-- searchMemories.ts
|   |   |   |   |
|   |   |   |   +-- timeline/                   # Dominio: Timeline
|   |   |   |   |   +-- components/
|   |   |   |   |   |   +-- TimelineView.tsx
|   |   |   |   |   |   +-- TimelineEvent.tsx
|   |   |   |   |   |   +-- TimelineFilter.tsx
|   |   |   |   |   |
|   |   |   |   |   +-- actions/
|   |   |   |   |   |   +-- generateTimeline.ts
|   |   |   |   |   |
|   |   |   |   |   +-- schemas/
|   |   |   |   |   |   +-- timelineSchema.ts
|   |   |   |   |   |
|   |   |   |   |   +-- types/
|   |   |   |   |   |   +-- timeline.ts
|   |   |   |   |   |
|   |   |   |   |   +-- hooks/
|   |   |   |   |   |   +-- useTimeline.ts
|   |   |   |   |
|   |   |   |   +-- sharing/                    # Dominio: Condivisione
|   |   |   |   |   +-- components/
|   |   |   |   |   |   +-- ShareDialog.tsx
|   |   |   |   |   |   +-- ShareLinkManager.tsx
|   |   |   |   |   |   +-- RecipientList.tsx
|   |   |   |   |   |
|   |   |   |   |   +-- actions/
|   |   |   |   |   |   +-- createShareLink.ts
|   |   |   |   |   |   +-- revokeShareLink.ts
|   |   |   |   |   |
|   |   |   |   |   +-- schemas/
|   |   |   |   |   |   +-- sharingSchema.ts
|   |   |   |   |   |
|   |   |   |   |   +-- types/
|   |   |   |   |   |   +-- sharing.ts
|   |   |   |   |
|   |   |   |   +-- notifications/              # Dominio: Notifiche
|   |   |   |   |   +-- components/
|   |   |   |   |   |   +-- NotificationBell.tsx
|   |   |   |   |   |   +-- NotificationList.tsx
|   |   |   |   |   |
|   |   |   |   |   +-- actions/
|   |   |   |   |   |   +-- markAsRead.ts
|   |   |   |   |   |
|   |   |   |   |   +-- types/
|   |   |   |   |   |   +-- notification.ts
|   |   |   |   |   |
|   |   |   |   |   +-- hooks/
|   |   |   |   |   |   +-- useNotifications.ts
|   |   |   |   |
|   |   |   |   +-- profile/                    # Dominio: Profilo Utente
|   |   |   |   |   +-- components/
|   |   |   |   |   |   +-- ProfileForm.tsx
|   |   |   |   |   |   +-- AvatarUpload.tsx
|   |   |   |   |   |
|   |   |   |   |   +-- actions/
|   |   |   |   |   |   +-- updateProfile.ts
|   |   |   |   |   |   +-- uploadAvatar.ts
|   |   |   |   |   |
|   |   |   |   |   +-- schemas/
|   |   |   |   |   |   +-- profileSchema.ts
|   |   |   |   |
|   |   |   |   |   +-- types/
|   |   |   |   |   |   +-- profile.ts
|   |   |   |
|   |   |   +-- lib/                            # Utility e configurazione
|   |   |   |   +-- supabase/                   # Client Supabase
|   |   |   |   |   +-- client.ts               # Client browser
|   |   |   |   |   +-- server.ts               # Client server
|   |   |   |   |   +-- admin.ts                # Client service_role
|   |   |   |   |
|   |   |   |   +-- utils/                      # Utility generiche
|   |   |   |   |   +-- cn.ts                   # clsx + tailwind-merge
|   |   |   |   |   +-- dates.ts                # date-fns wrappers
|   |   |   |   |   +-- format.ts               # Formattazione display
|   |   |   |   |   +-- validators.ts           # Validazioni custom
|   |   |   |   |   +-- errors.ts               # Gestione errori
|   |   |   |   |
|   |   |   |   +-- constants/                  # Costanti applicative
|   |   |   |   |   +-- app.ts                  # Configurazione app
|   |   |   |   |   +-- routes.ts               # Route definitions
|   |   |   |   |   +-- limits.ts               # Limiti (file size, etc.)
|   |   |   |
|   |   |   +-- hooks/                          # Hook custom globali
|   |   |   |   +-- useAuth.ts                  # Auth state + actions
|   |   |   |   +-- useMediaQuery.ts            # Responsive breakpoints
|   |   |   |   +-- useDebounce.ts              # Debounce generico
|   |   |   |   +-- useLocalStorage.ts          # Persistenza locale
|   |   |   |   +-- useToast.ts                 # Toast notifications
|   |   |   |
|   |   |   +-- types/                          # Tipi globali condivisi
|   |   |   |   +-- index.ts                    # Export barrel
|   |   |   |   +-- database.ts                 # Tipi generati da Supabase
|   |   |   |   +-- api.ts                      # Tipi per API/Actions
|   |   |   |   +-- common.ts                   # Tipi utility (Maybe, Nullable, etc.)
|   |   |   |
|   |   |   +-- middleware.ts                   # Next.js middleware (auth, routing)
|   |   |
|   |   +-- public/
|   |   |   +-- favicon.ico
|   |   |   +-- logo.svg
|   |   |   +-- og-image.png                    # Open Graph default
|   |   |   +-- manifest.json                   # PWA manifest
|   |   |   +-- images/
|   |   |   |   +-- hero/
|   |   |   |   +-- icons/
|   |   |   |   +-- placeholders/
|   |   |
|   |   +-- next.config.js
|   |   +-- next.config.ts                      # Configurazione Next.js
|   |   +-- tailwind.config.ts                  # Configurazione Tailwind
|   |   +-- tsconfig.json                       # TypeScript config
|   |   +-- postcss.config.mjs
|   |   +-- vitest.config.ts                    # Configurazione Vitest
|   |   +-- components.json                     # Configurazione shadcn/ui
|   |   +-- .env.example
|   |   +-- .env.local                          # gitignored
|   |
|   +-- e2e/                                    # Playwright E2E tests
|   |   +-- playwright.config.ts
|   |   +-- tests/
|   |   |   +-- auth/
|   |   |   |   +-- login.spec.ts
|   |   |   |   +-- register.spec.ts
|   |   |   |   +-- password-reset.spec.ts
|   |   |   +-- memories/
|   |   |   |   +-- create-memory.spec.ts
|   |   |   |   +-- edit-memory.spec.ts
|   |   |   |   +-- delete-memory.spec.ts
|   |   |   |   +-- media-upload.spec.ts
|   |   |   +-- timeline/
|   |   |   |   +-- timeline-view.spec.ts
|   |   |   +-- sharing/
|   |   |   |   +-- share-link.spec.ts
|   |   |   +-- profile/
|   |   |   |   +-- update-profile.spec.ts
|   |   +-- fixtures/
|   |   |   +-- users.ts
|   |   |   +-- memories.ts
|   |   +-- pages/
|   |   |   +-- LoginPage.ts                    # Page Object Model
|   |   |   +-- DashboardPage.ts
|   |   |   +-- MemoryPage.ts
|   |   +-- utils/
|   |   |   +-- test-setup.ts
|   |   |   +-- auth-helpers.ts
|   +-- package.json
|
+-- packages/                                   # Pacchetti condivisi (stub iniziali)
|   +-- config/
|   |   +-- eslint/                             # Shared ESLint config
|   |   |   +-- index.js
|   |   |   +-- package.json
|   |   +-- typescript/                         # Shared TS config
|   |   |   +-- base.json
|   |   |   +-- nextjs.json
|   |   |   +-- package.json
|   |   +-- tailwind/                           # Shared Tailwind preset
|   |   |   +-- index.ts
|   |   |   +-- package.json
|   |
|   +-- ui/                                     # Design system (stub)
|   |   +-- src/
|   |   |   +-- index.ts
|   |   +-- package.json
|   |
|   +-- auth/                                   # Logica auth condivisa (stub)
|   |   +-- src/
|   |   |   +-- index.ts
|   |   +-- package.json
|   |
|   +-- database/                               # Schema + types DB (stub)
|   |   +-- src/
|   |   |   +-- index.ts
|   |   +-- package.json
|   |
|   +-- validation/                             # Schemi Zod condivisi (stub)
|   |   +-- src/
|   |   |   +-- index.ts
|   |   +-- package.json
|
+-- supabase/                                   # Configurazione Supabase
|   +-- config.toml                             # Configurazione Supabase CLI
|   +-- migrations/                             # Migrazioni database
|   |   +-- 00000000000000_initial_schema.sql
|   |   +-- 20250115000001_add_memories.sql
|   |   +-- 20250115000002_add_sharing.sql
|   |   +-- 20250115000003_add_notifications.sql
|   |
|   +-- seed/                                   # Dati di seed
|   |   +-- 001_users.sql
|   |   +-- 002_memories.sql
|   |   +-- 003_sharing.sql
|   |
|   +-- functions/                              # Edge Functions (se necessarie)
|   |   +-- .gitkeep
|   |
|   +-- tests/                                  # Test specifici DB
|   |   +-- rls.test.sql                        # Test Row Level Security
|   |
|   +-- types/                                  # Tipi generati (gitignored)
|       +-- database.ts
|
+-- docs/                                       # Documentazione
|   +-- product/                                # Documentazione prodotto
|   |   +-- PRD.md                              # Product Requirements Document
|   |   +-- user-stories.md
|   |   +-- glossary.md
|   |
|   +-- architecture/                           # Documentazione architetturale
|   |   +-- INVENTORY.md                        # Inventario tecnico
|   |   +-- STRUCTURE.md                        # Questo file
|   |   +-- ADR/                                # Architecture Decision Records
|   |   |   +-- ADR-001-stack-tecnologico.md
|   |   |   +-- ADR-002-monorepo-struttura.md
|   |   |   +-- ADR-003-auth-pattern.md
|   |   |   +-- ADR-004-data-access-pattern.md
|   |
|   +-- security/                               # Documentazione sicurezza
|   |   +-- security-model.md
|   |   +-- rls-policies.md
|   |   +-- gdpr-compliance.md
|   |
|   +-- database/                               # Documentazione database
|   |   +-- schema.md                           # Schema ER e descrizione
|   |   +-- migrations.md                       # Guida migrations
|   |   +-- seeding.md                          # Guida seeding
|   |
|   +-- api/                                    # Documentazione API/Actions
|   |   +-- server-actions.md
|   |   +-- webhooks.md
|   |
|   +-- operations/                             # Documentazione operativa
|   |   +-- onboarding.md                       # Guida setup sviluppatore
|   |   +-- deployment.md                       # Guida deployment
|   |   +-- runbook.md                          # Operazioni comuni
|   |
|   +-- assets/                                 # Asset documentazione
|       +-- diagrams/
|       +-- wireframes/
|
+-- public/                                     # Asset pubblici (root level)
|   +-- .gitkeep
|
+-- scripts/                                    # Script di automazione
|   +-- setup.sh                                # Script setup iniziale
|   +-- generate-types.sh                       # Generazione tipi Supabase
|   +-- seed-local.sh                           # Seed DB locale
|   +-- db-reset.sh                             # Reset DB locale
|
+-- .env.example                                # Template variabili d'ambiente
+-- .gitignore                                  # Git ignore rules
+-- .prettierrc                                 # Prettier configuration
+-- .prettierignore
+-- pnpm-workspace.yaml                         # Workspace definition
+-- pnpm-lock.yaml                              # Lockfile (git tracked)
+-- package.json                                # Root package.json
+-- README.md                                   # README progetto
+-- LICENSE                                     # Licenza
```

---

## 3. Dettaglio Directory per Directory

### 3.1 Root Level

#### `ricordatidite/`
**Scopo**: Punto di ingresso del monorepo. Contiene configurazione condivisa, workspace definition, documentazione e script di automazione.

**File chiave**:
- `package.json` — definisce workspaces, script condivisi, devDependencies root
- `pnpm-workspace.yaml` — dichiara `apps/*` e `packages/*` come workspace members
- `.env.example` — template variabili d'ambiente (documentario, non usato direttamente)
- `README.md` — istruzioni setup, struttura progetto, convenzioni, link documentazione

---

### 3.2 `.github/`

**Scopo**: Configurazione GitHub — CI/CD pipeline, template PR, code owners.

**Contenuto**:
| File | Scopo |
|------|-------|
| `workflows/ci.yml` | Pipeline CI: lint, typecheck, unit test, build |
| `workflows/e2e.yml` | Pipeline E2E: Playwright tests |
| `workflows/deploy-staging.yml` | Deploy automatico su staging |
| `workflows/deploy-production.yml` | Deploy automatico su production |
| `PULL_REQUEST_TEMPLATE.md` | Template per descrizione PR |
| `CODEOWNERS` | Assegnazione reviewer automatici per area |

**Convenzioni**:
- Ogni workflow deve avere `concurrency` per cancellare run obsoleti
- Tutti i workflow eseguono `pnpm install --frozen-lockfile`
- Segreti configurati a livello di organizzazione GitHub

---

### 3.3 `.husky/`

**Scopo**: Git hooks per quality gates pre-commit e pre-push.

**Contenuto**:
| Hook | Scopo |
|------|-------|
| `pre-commit` | Esegue `lint-staged` (ESLint + Prettier su file modificati) |
| `pre-push` | Esegue `pnpm typecheck` e `pnpm test` |
| `commit-msg` | Valida formato commit message (conventional commits) |

**Convenzione commit**: `tipo(scope): descrizione`
- Tipi: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`
- Esempio: `feat(memories): aggiungi upload multiplo media`

---

### 3.4 `apps/web/`

**Scopo**: Applicazione principale Next.js 15 con App Router. Contiene tutto il codice applicativo.

**Configurazione chiave**:
- TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess: true`)
- Tailwind CSS con custom design tokens
- Next.js con output `standalone` per containerizzazione futura
- Supporto immagini ottimizzate (Supabase Storage come external domain)

---

#### `apps/web/src/app/`

**Scopo**: Directory principale del Next.js App Router. Ogni subdirectory rappresenta una route.

**Organizzazione**:

| Route Group | Scopo | Route Effettiva |
|-------------|-------|-----------------|
| `(marketing)` | Pagine pubbliche (landing, chi siamo) | `/`, `/chi-siamo`, `/come-funziona`, `/prezzi` |
| `(dashboard)` | Area autenticata (app vero e proprio) | `/dashboard`, `/ricordi`, `/timeline`, `/profilo`, `/condivisione` |
| `auth` | Flusso autenticazione | `/auth/callback`, `/auth/conferma`, `/auth/reimposta-password` |
| `api` | API Routes (webhook, integrazioni) | `/api/webhooks` |

**Convenzioni App Router**:
- I file `page.tsx` sono Server Components di default
- I file `layout.tsx` gestiscono il layout condiviso del segmento
- I file `loading.tsx` forniscono skeleton UI durante il caricamento
- I file `error.tsx` gestiscono errori nel segmento
- I file `not-found.tsx` gestiscono 404 nel segmento
- I file `route.ts` (in `api/`) gestiscono HTTP requests

**Pattern naming**:
```
page.tsx          — Server Component per la pagina
layout.tsx        — Layout condiviso del segmento
loading.tsx       — Loading UI (streaming)
error.tsx         — Error boundary
not-found.tsx     — 404 handler
template.tsx      — Layout che re-mounta (transizioni)
route.ts          — API route handler
```

---

#### `apps/web/src/components/`

**Scopo**: Componenti React condivisi tra piu domini. Organizzati per categoria funzionale.

**Sottodirectory**:

| Directory | Scopo | Esempi |
|-----------|-------|--------|
| `ui/` | Componenti shadcn/ui (auto-generati) | Button, Card, Dialog, Form, Input |
| `layout/` | Componenti strutturali dell'applicazione | Header, Footer, Sidebar, MobileNav |
| `feedback/` | Stati UX (loading, error, empty) | LoadingSpinner, EmptyState, ErrorState |
| `providers/` | Context providers React | QueryProvider, AuthProvider, ThemeProvider |

**Convenzioni**:
- Componenti in `ui/` sono **copiati** da shadcn/ui (non installati come dipendenza)
- Componenti custom sono sempre in PascalCase
- Ogni componente esporta un'interfaccia `Props` (o `ComponentNameProps`)
- Props interface documenta ogni campo con JSDoc

---

#### `apps/web/src/domains/`

**Scopo**: Bounded contexts logici — organizzazione per dominio di business anziche per tipo tecnico. Questo e il cuore dell'architettura domain-driven.

**Filosofia**: Ogni dominio e un modulo autosufficiente che contiene tutto il codice relativo a quel contesto di business.

**Domini iniziali**:

| Dominio | Descrizione | Contenuto |
|---------|-------------|-----------|
| `memories/` | Ricordi — CRUD, media, categorie | Componenti, actions, schema, tipi, hook, query |
| `timeline/` | Timeline — visualizzazione temporale | Componenti, actions, schema, tipi, hook |
| `sharing/` | Condivisione — link, permessi | Componenti, actions, schema, tipi |
| `notifications/` | Notifiche — alert, promemoria | Componenti, actions, tipi, hook |
| `profile/` | Profilo utente — dati, avatar | Componenti, actions, schema, tipi |

**Struttura interna di ogni dominio**:

```
domains/{nome}/
├── components/           # Componenti React specifici del dominio
├── actions/              # Server Actions (Next.js)
├── schemas/              # Schemi Zod per validazione
├── types/                # Tipi TypeScript
├── hooks/                # Hook custom del dominio
└── queries/              # Funzioni query (Supabase/TanStack Query)
```

**Convenzioni**:
- Ogni file in un dominio importa solo da:
  - Librerie esterne
  - `lib/` (utility condivise)
  - `types/` (tipi globali)
  - Altri file nello stesso dominio
- **Nessun dominio deve importare da un altro dominio** — usa tipi condivisi in `types/`
- Le interazioni tra domini avvengono attraverso Server Actions e il database

---

##### `domains/{x}/components/`

**Scopo**: Componenti React specifici del dominio. Non usano direttamente Supabase — ricevono dati via props o hook.

**Convenzioni**:
- PascalCase per nomi file e export
- Co-locare test come `{Component}.test.tsx` (opzionale) o in `__tests__/`
- Ogni componente deve essere Server Component di default, "use client" solo se necessario
- Documentare varianti con JSDoc `@example`

---

##### `domains/{x}/actions/`

**Scopo**: Server Actions Next.js — funzioni eseguite lato server per mutazioni.

**Convenzioni**:
- File in camelCase, suffisso implicito (il file si chiama `createMemory.ts`, non `createMemoryAction.ts` — la distinzione e data dalla directory)
- Ogni action deve:
  1. Validare input con Zod (`safeParse` o `parse`)
  2. Verificare autenticazione
  3. Eseguire operazione con Supabase client lato server
  4. Gestire errori e ritornare risultato tipizzato
  5. Revalidare cache dove necessario (`revalidatePath`, `revalidateTag`)

**Pattern tipo**:
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { memorySchema } from "../schemas/memorySchema";

export async function createMemory(input: unknown) {
  // 1. Validazione
  const result = memorySchema.safeParse(input);
  if (!result.success) return { error: result.error.flatten() };

  // 2. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 3. Operazione
  const { data, error } = await supabase
    .from("memories")
    .insert({ ...result.data, user_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  // 4. Revalidation
  revalidatePath("/ricordi");

  return { data };
}
```

---

##### `domains/{x}/schemas/`

**Scopo**: Schemi Zod per validazione — condivisi tra frontend (form) e backend (Server Actions).

**Convenzioni**:
- PascalCase con suffisso `Schema` (es. `MemorySchema`)
- Esportare sia lo schema che il tipo inferito (`export type Memory = z.infer<typeof MemorySchema>`)
- Un file per entita principale
- Usare `.refine()` per validazioni cross-field

---

##### `domains/{x}/types/`

**Scopo**: Tipi TypeScript specifici del dominio — modelli dati, input types, DTO.

**Convenzioni**:
- PascalCase per nomi tipo
- Suffisso `Input` per tipi di input (creazione/aggiornamento)
- Suffisso `Dto` per tipi di trasferimento
- Export barrel in `index.ts`

---

##### `domains/{x}/hooks/`

**Scopo**: Hook React custom per logica riutilizzabile del dominio.

**Convenzioni**:
- camelCase, prefisso `use`
- Ogni hook deve avere un tipo di ritorno esplicito
- Documentare parametri e valore di ritorno con JSDoc
- Co-locare con il dominio, non in `src/hooks/` globale

---

##### `domains/{x}/queries/`

**Scopo**: Funzioni di query per TanStack Query — wrappano chiamate Supabase.

**Convenzioni**:
- camelCase (es. `getMemories`, `getMemoryById`)
- Ritornano sempre Promise con tipo esplicito
- Gestiscono errori Supabase e lanciano eccezioni per TanStack Query

---

#### `apps/web/src/lib/`

**Scopo**: Utility, configurazione e client di terze parti. Codice condiviso tra domini.

**Sottodirectory**:

| Directory | Scopo | Contenuto |
|-----------|-------|-----------|
| `supabase/` | Client Supabase per diversi contesti | `client.ts` (browser), `server.ts` (SSR), `admin.ts` (service role) |
| `utils/` | Funzioni utility generiche | `cn.ts`, `dates.ts`, `format.ts`, `validators.ts`, `errors.ts` |
| `constants/` | Costanti applicative | `app.ts`, `routes.ts`, `limits.ts` |

**Convenzioni**:
- Ogni file in camelCase
- Funzioni pure, testabili
- Nessuna dipendenza da React

---

#### `apps/web/src/hooks/`

**Scopo**: Hook React custom globali — usati da piu domini.

**Criterio di posizionamento**:
- Se un hook e usato da un solo dominio → `domains/{x}/hooks/`
- Se un hook e usato da 2+ domini → `src/hooks/`

**Hook previsti**:

| Hook | Scopo |
|------|-------|
| `useAuth.ts` | Stato autenticazione, user, session |
| `useMediaQuery.ts` | Responsive design (breakpoints) |
| `useDebounce.ts` | Debounce valori input |
| `useLocalStorage.ts` | Persistenza stato in localStorage |
| `useToast.ts` | Sistema notifiche toast |

---

#### `apps/web/src/types/`

**Scopo**: Tipi TypeScript globali — condivisi tra domini.

**Contenuto**:

| File | Scopo |
|------|-------|
| `database.ts` | Tipi generati automaticamente da `supabase gen types` |
| `api.ts` | Tipi per risposte API e Server Actions |
| `common.ts` | Tipi utility (`Nullable<T>`, `Maybe<T>`, `Result<T,E>`) |

**Convenzioni**:
- `database.ts` e **auto-generato** — non modificare manualmente
- Rigenerare con `pnpm supabase:gen-types` dopo ogni modifica al DB
- Includere in CI per verificare che i tipi siano sincronizzati

---

#### `apps/web/src/middleware.ts`

**Scopo**: Next.js middleware per gestione routing, autenticazione, e rewrite.

**Responsabilita**:
- Proteggere route autenticate (redirect a login se non autenticato)
- Refresh automatico sessione Supabase
- Redirect da route pubbliche a dashboard se gia autenticato
- Header di sicurezza (opzionale, Vercel gestisce molti)

---

### 3.5 `apps/e2e/`

**Scopo**: Test end-to-end con Playwright. Separato dall'app per indipendenza e velocita.

**Struttura**:

| Directory | Scopo |
|-----------|-------|
| `tests/` | Test E2E organizzati per feature |
| `fixtures/` | Dati di test (mock users, memories) |
| `pages/` | Page Object Model — classi che astraggono le pagine |
| `utils/` | Helper per test (autenticazione, setup) |

**Convenzioni**:
- Pattern Page Object Model per manutenibilita
- Ogni test e indipendente (setup e teardown espliciti)
- Usare `storageState` per autenticazione persistente tra test
- Screenshot e video on failure
- Esecuzione in CI su 3 browser: Chromium, Firefox, WebKit

---

### 3.6 `packages/`

**Scopo**: Pacchetti condivisi tra app future. Al momento sono **stub** — contengono solo struttura e export placeholder.

**Razionale**: Preparare la struttura monorepo per futura estrazione senza dover rifattorizzare in corso d'opera.

#### `packages/config/`

**Scopo**: Configurazioni condivise (ESLint, TypeScript, Tailwind).

**Struttura**:
```
config/
├── eslint/
│   ├── index.js              # Shared ESLint flat config
│   └── package.json
├── typescript/
│   ├── base.json             # TS config base (strict, paths)
│   ├── nextjs.json           # Estensione per Next.js
│   └── package.json
└── tailwind/
    ├── index.ts              # Tailwind preset con design tokens
    └── package.json
```

**Estrazione futura**: Quando si aggiunge una seconda app, le configurazioni possono essere condivise importando `@ricordatidite/config/eslint`.

---

#### `packages/ui/`

**Scopo**: Design system — componenti UI condivisi.

**Stato iniziale**: Stub. I componenti shadcn/ui risiedono in `apps/web/src/components/ui/`.

**Estrazione futura**: Quando il design system matura, copiare i componenti da `apps/web/` a `packages/ui/` e importarli come `@ricordatidite/ui`.

---

#### `packages/auth/`

**Scopo**: Logica di autenticazione condivisa.

**Stato iniziale**: Stub. L'auth e gestita in `apps/web/src/lib/supabase/`.

**Estrazione futura**: Helper auth, hook, e utility da condividere tra app.

---

#### `packages/database/`

**Scopo**: Schema database, query builders, tipi.

**Stato iniziale**: Stub. Il database e gestito in `supabase/` e i tipi in `apps/web/src/types/database.ts`.

**Estrazione futura**: Tipi database, query type-safe, e seed scripts condivisi.

---

#### `packages/validation/`

**Scopo**: Schemi Zod condivisi.

**Stato iniziale**: Stub. Gli schemi sono co-locati in `domains/{x}/schemas/`.

**Estrazione futura**: Schemi base (utente, email, etc.) da condividere tra frontend e backend.

---

### 3.7 `supabase/`

**Scopo**: Tutta la configurazione Supabase — migrazioni, seed, edge functions.

**Directory**:

| Directory | Scopo | Convenzioni |
|-----------|-------|-------------|
| `migrations/` | Migrazioni SQL | Prefisso timestamp `YYYYMMDDHHMMSS_nome.sql`. Mai modificare una migration gia eseguita — creare una nuova. |
| `seed/` | Dati di seed | Ordinati numericamente (`001_`, `002_`). Ricreabili in qualsiasi momento. |
| `functions/` | Edge Functions (Deno) | Una directory per funzione. Usare solo se necessario — preferire Server Actions. |
| `tests/` | Test database | Test SQL per RLS policies. Eseguiti con `supabase test`. |
| `types/` | Tipi generati | Auto-generati. **Gitignored** — rigenerati in CI. |

**Workflow migrazioni**:
```bash
# Sviluppo locale
supabase migration new nome_migrazione    # Crea file migration
supabase db reset                         # Applica migrations + seed
supabase db diff -f nome                  # Genera migration da diff

# Sincronizzazione tipi
supabase gen types --lang=typescript --local > apps/web/src/types/database.ts

# Deploy
supabase db push                          # Staging
supabase db push --linked                 # Production (con link)
```

---

### 3.8 `docs/`

**Scopo**: Documentazione completa del progetto.

**Struttura**:

| Directory | Contenuto | Target |
|-----------|-----------|--------|
| `product/` | PRD, user stories, glossary | Team prodotto + dev |
| `architecture/` | Inventario, struttura, ADR | Team dev + architect |
| `security/` | Security model, RLS, GDPR | Team dev + security |
| `database/` | Schema ER, migrazioni, seeding | Team dev |
| `api/` | Server Actions, webhooks | Team dev + integratori |
| `operations/` | Onboarding, deployment, runbook | Team dev + ops |

**Formato**: Tutti i documenti in Markdown. Diagrammi in Mermaid dove possibile.

---

### 3.9 `scripts/`

**Scopo**: Script di automazione per operazioni ricorrenti.

| Script | Scopo |
|--------|-------|
| `setup.sh` | Setup completo ambiente di sviluppo (install deps, start Supabase, seed) |
| `generate-types.sh` | Rigenera tipi TypeScript da schema Supabase |
| `seed-local.sh` | Popola DB locale con dati di test |
| `db-reset.sh` | Reset completo DB locale (migrations + seed) |

---

## 4. Flussi di Dati

### 4.1 Lettura dati (Read)

```
Pagina (Server Component)
    |
    v
domains/{x}/queries/getX.ts    # Query Supabase
    |
    v
Supabase PostgreSQL
    |
    v
Hydration → TanStack Query    # Cache lato client
    |
    v
Componenti React              # Rendering con dati
```

### 4.2 Scrittura dati (Write)

```
Form React (Client Component)
    |
    v
React Hook Form + Zod         # Validazione client-side
    |
    v
domains/{x}/actions/createX.ts  # Server Action
    |
    v
Zod Validation                # Validazione server-side
    |
    v
Supabase Client (server)      # Scrittura DB
    |
    v
revalidatePath()              # Invalidazione cache
    |
    v
TanStack Query invalidation   # Aggiornamento UI
```

### 4.3 Realtime Updates

```
Supabase Realtime
    |
    v
WebSocket Subscription
    |
    v
TanStack Query onSnapshot     # Callback di aggiornamento
    |
    v
Zustand Store (opzionale)     # Stato locale
    |
    v
Componenti React              # Re-render automatico
```

---

## 5. Convenzioni di Naming — Riepilogo Completo

### 5.1 File e Directory

| Entita | Pattern | Esempio |
|--------|---------|---------|
| Directory (generica) | kebab-case | `memory-card/`, `user-profile/` |
| Directory (dominio) | snake_case o camelCase | `memories/`, `userProfile/` |
| React Component | PascalCase `.tsx` | `MemoryCard.tsx` |
| Server Action | camelCase `.ts` | `createMemory.ts` |
| Zod Schema | PascalCase `.ts` | `MemorySchema.ts` |
| Hook | camelCase, prefisso `use` | `useMemories.ts` |
| Utility | camelCase `.ts` | `dateUtils.ts` |
| Type definition | PascalCase `.ts` | `memory.ts` |
| Query function | camelCase `.ts` | `getMemories.ts` |
| Test file | stesso nome, suffisso `.test.ts` | `MemoryCard.test.tsx` |
| E2E test | kebab-case, suffisso `.spec.ts` | `create-memory.spec.ts` |
| Page Object | PascalCase `.ts` | `LoginPage.ts` |

### 5.2 Variabili e Funzioni

| Entita | Pattern | Esempio |
|--------|---------|---------|
| Variabile/funzione | camelCase | `getMemories()`, `isLoading` |
| Costante primitiva | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `DEFAULT_LIMIT` |
| Componente React | PascalCase | `<MemoryCard />`, `<UserProfile />` |
| Tipo/Interfaccia | PascalCase | `Memory`, `CreateMemoryInput` |
| Enum | PascalCase | `MemoryType`, `SharePermission` |
| Environment variable | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_SUPABASE_URL` |

### 5.3 Database

| Entita | Pattern | Esempio |
|--------|---------|---------|
| Tabella | snake_case, plurale | `memories`, `user_profiles` |
| Colonna | snake_case | `created_at`, `user_id` |
| Chiave esterna | singular_table_id | `memory_id`, `user_id` |
| Indice | idx_table_columns | `idx_memories_user_id_created_at` |
| Function | snake_case | `get_memories_by_user` |
| Trigger | trg_table_event | `trg_memories_updated_at` |
| RLS Policy | table_action_role | `memories_select_owner` |

---

## 6. Pattern Architetturali

### 6.1 Repository Pattern (Data Access)

Astrarre l'accesso ai dati per non dipendere direttamente da Supabase:

```
domains/{x}/
├── repository/               # [FUTURO] Estrarre quando necessario
│   ├── memoryRepository.ts   # Interfaccia + implementazione Supabase
│   └── types.ts              # Tipi del repository
```

**Per MVP**: Le query in `domains/{x}/queries/` fungono da repository leggero. Estrarre in pattern formale quando:
- Si aggiunge un secondo provider di dati
- I test richiedono mocking complesso
- La logica di query diventa riutilizzata in 3+ punti

### 6.2 Result Type per Error Handling

```typescript
// src/types/common.ts
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

// Uso in Server Actions
export async function createMemory(input: unknown): Promise<Result<Memory>> {
  // ...
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
```

### 6.3 Feature Flags

Per rilasci graduali:

```typescript
// src/lib/constants/app.ts
export const FEATURES = {
  enableRealtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME === "true",
  enableSharing: process.env.NEXT_PUBLIC_ENABLE_SHARING === "true",
  enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === "true",
} as const;
```

---

## 7. Checklist di Inizializzazione

### 7.1 Setup Repository

- [ ] Inizializzare Git repository
- [ ] Creare `.gitignore` (Node, Next.js, Vercel, Supabase, OS)
- [ ] Configurare pnpm workspaces (`pnpm-workspace.yaml`)
- [ ] Scrivere root `package.json`
- [ ] Creare `README.md` con istruzioni setup

### 7.2 Setup Next.js App

- [ ] `pnpm create next-app@latest apps/web` — selezionare App Router, TypeScript, Tailwind
- [ ] Configurare TypeScript strict mode
- [ ] Configurare path alias in `tsconfig.json`: `@/*` → `src/*`
- [ ] Installare e configurare shadcn/ui (`npx shadcn@latest init`)
- [ ] Installare dipendenze aggiuntive (Zod, RHF, TanStack Query, etc.)

### 7.3 Setup Supabase

- [ ] Installare Supabase CLI
- [ ] `supabase init` nella root
- [ ] `supabase start` per ambiente locale
- [ ] Creare progetto Supabase cloud (dev)
- [ ] Scrivere migrazione iniziale (`supabase migration new initial_schema`)
- [ ] Generare tipi TypeScript (`supabase gen types`)

### 7.4 Setup Testing

- [ ] Installare Vitest + Testing Library
- [ ] Configurare `vitest.config.ts` con path alias
- [ ] Scrivere primo test di esempio
- [ ] Installare e configurare Playwright (`pnpm create playwright`)
- [ ] Scrivere primo test E2E di esempio

### 7.5 Setup CI/CD

- [ ] Scrivere `.github/workflows/ci.yml`
- [ ] Configurare GitHub secrets (Supabase, Vercel)
- [ ] Configurare Vercel project e link
- [ ] Configurare branch protection rules
- [ ] Installare e configurare Husky + lint-staged

### 7.6 Setup Documentazione

- [ ] Creare struttura `docs/`
- [ ] Scrivere `INVENTORY.md` (questo documento)
- [ ] Scrivere `STRUCTURE.md` (questo documento)
- [ ] Scrivere primo ADR (`ADR-001-stack-tecnologico.md`)
- [ ] Scrivere `README.md` onboarding sviluppatore

---

## 8. Evoluzione Futura

### 8.1 Da MVP a Scale — Estrazione Pacchetti

```
Fase 1 (MVP):          apps/web/src/domains/    # Tutto in un'app
                       apps/web/src/components/ui/

Fase 2 (Stabilizzazione):                        
                       packages/ui/              # Componenti UI estratti
                       
Fase 3 (Multi-app):
                       apps/web/                 # App principale
                       apps/mobile-web/          # Versione mobile ottimizzata
                       apps/admin/               # Pannello amministrazione
                       packages/ui/              # Design system
                       packages/auth/            # Logica auth condivisa
                       packages/database/        # Tipi + query builders
                       packages/validation/      # Schemi Zod condivisi
```

### 8.2 Aggiunta Turborepo

Quando il monorepo cresce (3+ app o 5+ packages), introdurre Turborepo per:
- Build caching
- Pipeline orchestration
- Remote caching

**Configurazione**:
```json
// turbo.json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["build"] },
    "lint": {},
    "typecheck": {}
  }
}
```

### 8.3 Containerizzazione

Per ambienti di staging/production containerizzati:

```dockerfile
# Dockerfile (futuro)
FROM node:20-alpine AS base
# ... multi-stage build con output standalone
```

Next.js `output: 'standalone'` gia preparato in `next.config.ts`.

---

*Fine documento — STRUCTURE.md*
*Versione: 1.0.0*
*Prossima revisione: dopo completamento setup iniziale e prima feature implementata*
