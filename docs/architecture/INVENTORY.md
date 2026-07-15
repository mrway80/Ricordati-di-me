# Inventario Tecnico — Stato Iniziale

## Piattaforma: Ricordati di Te

**Data redazione**: 2025-01-15
**Stato**: Repository vuoto — avvio da zero (greenfield)
**Autore**: Principal Software Architect
**Classificazione**: Confidenziale — Uso interno team

---

## 1. Executive Summary

Il repository della piattaforma "Ricordati di Te" e attualmente vuoto. Nessuna base di codice preesistente, nessun artefatto legacy, nessuna configurazione da migrare. Questo stato ci consente di impostare un progetto greenfield con scelte architetturali moderne, zero debito tecnico ereditato e piena liberta nella strutturazione del codebase.

Questo documento raccoglie tutte le decisioni di stack, le configurazioni consigliate, i requisiti di tooling e i rischi identificati per l'avvio del progetto.

---

## 2. Stato Repository

| Attributo | Valore |
|-----------|--------|
| Codice esistente | Nessuno |
| File di configurazione | Nessuno |
| Dipendenze installate | Nessuna |
| Database esistente | Nessuno (da creare su Supabase) |
| CI/CD pipeline | Nessuna |
| Test suite | Nessuna |
| Documentazione tecnica | Nessuna |
| Branching model | Da definire |
| Licenza | Da definire |

### 2.1 Implicazioni dello stato vuoto

**Vantaggi**:
- Nessun codice legacy da mantenere o migrare
- Liberta totale nelle scelte architetturali
- Nessun vincolo di compatibilita backward
- Stack tecnologico allineato alle best practice 2025
- Testabilita intrinseca fin dall'inizio (TDD possibile)

**Sfide**:
- Ogni decisione ha impatto a lungo termine — necessita di previsione
- Setup iniziale piu oneroso (scaffolding, configurazione, CI/CD)
- Documentazione e standard da stabilire ex-novo
- Necessita di definire convention e linee guida per tutto il team

---

## 3. Decisioni di Stack

### 3.1 Core Framework & Runtime

| Tecnologia | Versione | Motivazione |
|------------|----------|-------------|
| **Next.js** | 15.1.x (App Router) | Framework full-stack con SSR/ISR, API routes, streaming. App Router per Server Components e layout gerarchici |
| **React** | 19.0.x | UI library — v19 per concurrent features, Actions, use() API |
| **TypeScript** | 5.7.x | Type safety strict mode. `strict: true` in tsconfig. No `any` implicito |
| **Node.js** | >=20.0.0 (LTS) | Runtime minimo — v20 per native fetch, stable test runner, performance |

### 3.2 Styling & UI

| Tecnologia | Versione | Motivazione |
|------------|----------|-------------|
| **Tailwind CSS** | 3.4.x | Utility-first CSS framework — velocita di sviluppo, bundle ottimizzato |
| **shadcn/ui** | latest | Componenti UI accessibili, customizzabili, senza runtime dependency (codice in `src/components/ui/`) |
| **Lucide React** | 0.400+ | Icon set coerente, tree-shakeable, integrato con shadcn/ui |
| **clsx / tailwind-merge** | latest | Utility per classi condizionali e merge senza conflitti |

### 3.3 Stato & Data Management

| Tecnologia | Versione | Motivazione |
|------------|----------|-------------|
| **Supabase (PostgreSQL)** | latest | Database relazionale open-source, hosting gestito, scalabile |
| **Supabase Auth** | latest | Autenticazione con multi-provider (email, OAuth, SSO), PKCE flow |
| **Supabase Storage** | latest | Storage oggetti per upload file, CDN integrato |
| **Supabase Realtime** | latest | WebSocket per aggiornamenti live (subscription INSERT/UPDATE/DELETE) |
| **Supabase Client (@supabase/supabase-js)** | 2.47+ | Client JavaScript ufficiale, supporta SSR con Next.js |
| **TanStack Query (React Query)** | 5.62+ | Caching server state, invalidazione, infinite scroll, mutations |
| **Zustand** | 5.0+ | State management client-side minimalista, TypeScript-friendly |
| **Server Actions (Next.js)** | built-in | Mutazioni lato server senza API routes esplicite — pattern raccomandato per Next.js 15 |

### 3.4 Validazione & Form

| Tecnologia | Versione | Motivazione |
|------------|----------|-------------|
| **Zod** | 3.24+ | Schema validation — coerenza tra frontend, backend e database |
| **React Hook Form** | 7.54+ | Gestione form performante, re-rendering minimizzato |
| **@hookform/resolvers** | latest | Integrazione Zod con React Hook Form |

### 3.5 Testing

| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| **Vitest** | 2.1+ | Unit test e integration test — veloce, ESM-native, API compatibile con Jest |
| **Testing Library (React)** | 16.1+ | Testing React components con approccio user-centric |
| **Playwright** | 1.49+ | End-to-end testing — multi-browser, screenshot comparison, trace viewer |
| **MSW (Mock Service Worker)** | 2.7+ | Mock API per test unitari e integrazione |

### 3.6 Qualita & Tooling

| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| **ESLint** | 9.x (flat config) | Linting con configurazione flat config, plugin React/TypeScript |
| **Prettier** | 3.4+ | Formattazione automatica del codice |
| **eslint-config-prettier** | latest | Disabilita regole ESLint in conflitto con Prettier |
| **TypeScript ESLint** | 8.x+ | Plugin ESLint per TypeScript |
| **Husky** | 9.1+ | Git hooks per pre-commit lint/format |
| **lint-staged** | 15.3+ | Lint solo su file staged |
| **pnpm** | 9.x+ | Package manager — workspace support, disk efficient, lockfile deterministico |

### 3.7 Utility & Support Libraries

| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| **date-fns** | 4.x+ | Manipolazione date — tree-shakeable, immutabile |
| **nanoid** | 5.0+ | Generazione ID univoci, piu leggero di UUID |
| **lodash-es** | 4.17+ | Utility functions — import ESM per tree-shaking |

### 3.8 Stack diagram

```
+------------------+     +------------------+     +------------------+
|   Presentation   | --> |   Application    | --> |     Domain       |
|                  |     |                  |     |                  |
| Next.js 15 App   |     | Server Actions   |     | Zod Schemas      |
| Router           |     | TanStack Query   |     | Business Logic   |
| React 19         |     | Zustand (client) |     | Supabase Client  |
| shadcn/ui        |     |                  |     |                  |
| Tailwind CSS     |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
                                                        |
                                                        v
                                               +------------------+
                                               |   Infrastructure |
                                               |                  |
                                               | Supabase         |
                                               |   - PostgreSQL   |
                                               |   - Auth         |
                                               |   - Storage      |
                                               |   - Realtime     |
                                               |                  |
                                               +------------------+
```

---

## 4. Struttura Monorepo

Per il **MVP** la struttura sara una **pseudo-monorepo** con pnpm workspaces, ma senza Turborepo (overkill per un'unica app). La separazione in `apps/` e `packages/` e strutturale e prepara il terreno per futura estrazione di pacchetti condivisi.

```
ricordatidite/
├── apps/
│   └── web/                    # Next.js — unica app al momento
├── packages/                   # Estrazione futura (stub iniziali)
│   ├── config/                 # Shared ESLint, TS, Tailwind configs
│   ├── ui/                     # Design system (wrapper shadcn/ui)
│   ├── auth/                   # Logica auth condivisa
│   ├── database/               # Schema, types, query builders
│   └── validation/             # Schemi Zod condivisi
├── supabase/                   # Configurazione e codice Supabase
├── docs/                       # Documentazione
├── e2e/                        # Playwright E2E tests
└── package.json                # Root workspace config
```

**Razionale**: La struttura `apps/packages` e lo standard de-facto per monorepo TypeScript. Inserire subito Next.js in `apps/web/` evita refactoring strutturali futuri quando si aggiungeranno (eventuali) nuove app (mobile, admin, API dedicata).

---

## 5. CI/CD & DevOps

### 5.1 Git Flow Semplificato (per MVP)

```
main        ----o----o----o----o----o----o----o----  (production)
                \         / \         / \
develop    ----o----o----o----o----o----o----o----  (staging/integration)
                \    /      \    /      \
feature/xyz  ---o--o        o--o        o--o       (feature branches)
```

- `main` — produzione (deploy automatico su Vercel)
- `develop` — integrazione continua (preview deployment)
- `feature/*` — feature branches, PR verso `develop`
- `hotfix/*` — fix urgenti, PR dirette verso `main`

### 5.2 Pipeline CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-format:
    - ESLint check (strict)
    - Prettier check
    - TypeScript type check (tsc --noEmit)
  
  unit-test:
    - Vitest execution with coverage
    - Soglia minima coverage: 70% (MVP), 80% (post-MVP)
  
  e2e-test:
    - Playwright test execution
    - Screenshot on failure
    - Trace retention 30 giorni
  
  deploy-preview:
    - Vercel preview deployment (solo PR)
  
  deploy-production:
    - Vercel production deployment (solo main)
```

### 5.3 Hosting

| Servizio | Scopo | Piano |
|----------|-------|-------|
| **Vercel** | Hosting Next.js, edge functions, analytics | Pro (per team e preview deployments) |
| **Supabase** | Database, auth, storage, realtime | Free tier iniziale, scale-up su usage |

### 5.4 Environment Management

| Environment | Branch | URL | Supabase Project |
|-------------|--------|-----|------------------|
| Local | qualsiasi | `localhost:3000` | Local (supabase CLI) o Dev |
| Preview | PR | `*.vercel.app` | Dev |
| Staging | `develop` | `staging.ricordatidite.it` | Staging |
| Production | `main` | `ricordatidite.it` | Production |

---

## 6. Dipendenze Esterne Necessarie

### 6.1 Account e Servizi

| Servizio | Scopo | Stato | Priorita |
|----------|-------|-------|----------|
| **GitHub repository** | Codice sorgente, CI/CD, issue tracking | Da creare | Critica |
| **Vercel account** | Hosting, deployments | Da creare | Critica |
| **Supabase project** | Database, auth, storage | Da creare | Critica |
| **Supabase CLI** | Local development, migrations | Installare | Critica |
| **Domain name** | `ricordatidite.it` | Da registrare | Alta |
| **Email provider** | Transactional emails (auth, notifiche) | Da configurare (Resend/SendGrid) | Media |
| **Sentry** | Error tracking e monitoring | Da configurare | Media |
| **Analytics** | Vercel Analytics (built-in) o Plausible | Da configurare | Bassa |

### 6.2 Variabili d'Ambiente

```bash
# .env.example — tutte le variabili richieste

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Auth
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback

# Feature flags (opzionali)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_REALTIME=true
```

---

## 7. Debito Tecnico Iniziale

### 7.1 Stato corrente: ZERO debito tecnico ereditato

Il progetto parte da una tabula rasa. Non esiste codice legacy, non esistono decisioni tecnologiche pregresse da rimuovere.

### 7.2 Potenziali debiti tecnici preventivi

Anche partendo da zero, alcune scelte possono introdurre debito se non gestite correttamente:

| # | Rischio | Probabilita | Impatto | Mitigazione |
|---|---------|-------------|---------|-------------|
| 1 | **Monorepo over-engineering** — struttura packages/ senza estrazione reale | Alta | Medio | Iniziare con tutto in `apps/web/src/`, estrarre in packages solo quando la condivisione e reale |
| 2 | **Server Actions vs API Routes** — eccessiva dipendenza da Server Actions puo rendere difficile API esterne future | Media | Medio | Wrappare tutte le Server Actions in funzioni riutilizzabili, documentare i punti di estensione |
| 3 | **Supabase lock-in** — dipendenza troppo stretta da servizi Supabase-specifici | Media | Medio | Astrarre il layer di persistenza con repository pattern, usare Supabase client solo nei service |
| 4 | **Auth proliferation** — logica auth sparsa in troppi componenti | Alta | Medio | Centralizzare in un unico modulo `auth/`, hook `useAuth` unico |
| 5 | **Type safety gaps** — mancata sincronizzazione tra DB schema e TypeScript types | Media | Alto | Usare `supabase gen types` in CI, pipeline di generazione automatica |
| 6 | **Premature optimization** — astrazioni troppo complesse per requisiti semplici | Alta | Medio | Seguire principio YAGNI, rifattorizzare quando il pattern si ripete 3+ volte |
| 7 | **Testing gaps** — coverage insufficiente nelle aree critiche (auth, payments) | Media | Alto | Definire soglia coverage minima, testare ogni Server Action, test E2E per user flows critici |
| 8 | **Environment drift** — divergenza tra local/dev/staging/prod | Media | Medio | Docker Compose per local, Supabase CLI per migrations, seed data condivisi |
| 9 | **Bundle bloat** — import eccessive di librerie, tree-shaking non efficace | Bassa | Medio | Bundle analysis in CI (`@next/bundle-analyzer`), regola "nessuna dipendenza senza discussione" |
| 10 | **Accessibility debt** — componenti non accessibili fin dall'inizio | Media | Medio | shadcn/ui come base (gia accessible), axe-core in CI, audit mensile Lighthouse |

### 7.3 Principi anti-debito

1. **You Ain't Gonna Need It (YAGNI)** — nessuna astrazione prima che serva
2. **Refactoring opportunistico** — migliorare il codice che si tocca
3. **Boy Scout Rule** — lasciare il codice piu pulito di come lo si e trovato
4. **Test every boundary** — ogni integrazione esterna deve avere il suo test
5. **Document every decision** — ADR (Architecture Decision Records) per scelte significative

---

## 8. Criticità e Mitigation

### 8.1 Criticità Architetturali

| Priorita | Criticità | Descrizione | Mitigazione |
|----------|-----------|-------------|-------------|
| **P0** | Scalabilita del monorepo | Struttura iniziale che non supporta crescita | Definire chiaramente i confini dei packages, convenzione di naming rigorosa |
| **P0** | Sicurezza dati sanitari | La piattaforma gestisce dati potenzialmente sensibili | Row Level Security (RLS) obbligatorio su tutte le tabelle, audit trail, cifratura at-rest |
| **P1** | Gestione migratiioni DB | Conflitti tra migration in parallelo | Naming convenzione timestamp-based, migration test in CI, seed data deterministico |
| **P1** | SSR + Auth | Gestione sessione lato server con Supabase | Pattern middleware ufficiale Supabase + Next.js, documentazione aggiornata |
| **P1** | Realtime reliability | WebSocket possono disconnettersi | Reconnection automatica, stato offline/online, queue locale per operazioni pendenti |
| **P2** | SEO | La piattaforma potrebbe avere contenuti pubblici | SSR per pagine pubbliche, metadata dinamici, sitemap.xml, robots.txt |
| **P2** | Performance | Bundle size e TTFB | Code splitting automatico (Next.js), lazy loading, Edge Functions dove appropriato |

### 8.2 Rischi Progettuali

| Rischio | Probabilita | Impatto | Contromisura |
|---------|-------------|---------|--------------|
| Crescita rapida del database | Media | Alto | Monitoring query lente, indici preventivi, partizionamento ready |
| Feature creep | Alta | Medio | Backlog rigoroso, sprint planning, definition of done chiara |
| Onboarding team | Media | Medio | Documentazione completa, ADR, README esaustivo, script di setup |
| Vendor lock-in Supabase | Media | Medio | Repository pattern, schemi SQL standard, niente funzioni proprietary |
| GDPR e privacy | Media | Alto | Privacy by design, data minimization, diritto all'oblio implementato fin da subito |

### 8.3 Checklist Pre-Sviluppo

Prima di scrivere la prima riga di codice:

- [ ] Creare repository GitHub
- [ ] Configurare branch protection su `main` e `develop`
- [ ] Installare e configurare pnpm workspaces
- [ ] Inizializzare Next.js 15 con App Router
- [ ] Configurare TypeScript strict mode
- [ ] Configurare Tailwind CSS
- [ ] Inizializzare shadcn/ui
- [ ] Configurare ESLint 9 (flat config) + Prettier
- [ ] Configurare Husky + lint-staged
- [ ] Installare Vitest + Testing Library
- [ ] Installare e configurare Playwright
- [ ] Creare progetto Supabase (dev)
- [ ] Configurare Supabase CLI locale
- [ ] Definire schema DB iniziale (migrations)
- [ ] Generare tipi TypeScript da schema DB
- [ ] Configurare variabili d'ambiente (.env.example)
- [ ] Configurare GitHub Actions CI pipeline
- [ ] Configurare Vercel project + link
- [ ] Documentare convenzioni di naming e coding standards
- [ ] Scrivere ADR-001: Scelta stack tecnologico

---

## 9. Convenzioni & Standard

### 9.1 Naming Conventions

| Entita | Convenzione | Esempio |
|--------|-------------|---------|
| Componenti React | PascalCase | `UserProfile.tsx`, `MemoryCard.tsx` |
| Hook custom | camelCase, prefisso `use` | `useAuth.ts`, `useMemory.ts` |
| File di utility | camelCase | `dateUtils.ts`, `formatHelpers.ts` |
| Server Actions | camelCase, suffisso `Action` | `createMemoryAction.ts` |
| Zod schemas | PascalCase, suffisso `Schema` | `MemorySchema.ts`, `UserSchema.ts` |
| Tipi TypeScript | PascalCase | `Memory`, `UserProfile`, `CreateMemoryInput` |
| Directory | kebab-case | `memory-card/`, `user-profile/` |
| Variabili/funzioni | camelCase | `getMemories()`, `isLoading` |
| Costanti | SNAKE_CASE uppercase | `MAX_UPLOAD_SIZE`, `DEFAULT_PAGE_SIZE` |
| Tabelle DB | snake_case, plurale | `memories`, `user_profiles` |
| Colonne DB | snake_case | `created_at`, `user_id` |
| Environment variables | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_SUPABASE_URL` |

### 9.2 File Organization

```
# Pattern di co-location per feature
src/domains/memories/
├── components/           # Componenti specifici del dominio
│   ├── MemoryCard.tsx
│   ├── MemoryForm.tsx
│   └── MemoryList.tsx
├── actions/              # Server Actions
│   ├── createMemoryAction.ts
│   ├── updateMemoryAction.ts
│   └── deleteMemoryAction.ts
├── schemas/              # Schemi Zod
│   └── memorySchema.ts
├── types/                # Tipi TypeScript
│   └── memory.ts
├── hooks/                # Hook custom
│   ├── useMemories.ts
│   └── useMemoryMutations.ts
└── queries/              # Query builders / TanStack Query
    ├── getMemories.ts
    └── getMemoryById.ts
```

### 9.3 Code Quality Gates

| Gate | Criterio | Enforcement |
|------|----------|-------------|
| Lint | Zero errori ESLint | Pre-commit hook + CI |
| Formattazione | Prettier pass | Pre-commit hook + CI |
| Type Check | `tsc --noEmit` senza errori | CI |
| Unit Test | Coverage >= 70% | CI |
| E2E Test | Test critici passanti | CI |
| Bundle Size | < 200KB initial JS | CI warning |
| Lighthouse | Score >= 90 (performance, a11y) | CI warning |

---

## 10. KPI Tecnici di Riferimento

| Metrica | Target MVP | Target Scale |
|---------|-----------|--------------|
| Time to First Byte (TTFB) | < 200ms | < 100ms |
| Largest Contentful Paint (LCP) | < 2.5s | < 1.5s |
| First Input Delay (FID) | < 100ms | < 50ms |
| Cumulative Layout Shift (CLS) | < 0.1 | < 0.05 |
| Bundle JS iniziale | < 200KB | < 150KB |
| Lighthouse Performance | >= 90 | >= 95 |
| Lighthouse Accessibility | >= 95 | 100 |
| Test Coverage | >= 70% | >= 80% |
| Uptime | 99.9% | 99.95% |

---

## 11. Timeline Stimata Setup

| Fase | Durata | Output |
|------|--------|--------|
| Setup repository + tooling | 1 giorno | Repo configurato, CI/CD attiva |
| Setup Next.js + Tailwind + shadcn/ui | 1 giorno | App base con layout, tema, componenti fondamentali |
| Setup Supabase + schema DB | 1 giorno | DB locale e cloud, migrations, tipi generati |
| Setup Auth | 0.5 giorni | Login, logout, protezione route, middleware |
| Struttura directory + prime feature | 2 giorni | Domains, Server Actions, query pattern, prime pagine |
| **Totale setup iniziale** | **~5 giorni** | **Codebase pronto per sviluppo feature** |

---

## 12. Appendice: Dipendenze Complete package.json

### Root package.json

```json
{
  "name": "ricordatidite",
  "private": true,
  "version": "0.1.0",
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "build": "pnpm --filter web build",
    "dev": "pnpm --filter web dev",
    "lint": "pnpm --filter web lint",
    "test": "pnpm --filter web test",
    "test:e2e": "pnpm --filter e2e test",
    "typecheck": "pnpm --filter web typecheck",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset",
    "supabase:gen-types": "supabase gen types --lang=typescript --local > apps/web/src/types/database.ts",
    "prepare": "husky"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.3.0",
    "prettier": "^3.4.0",
    "typescript": "^5.7.0"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

### apps/web/package.json

```json
{
  "name": "@ricordatidite/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.47.0",
    "@supabase/ssr": "^0.5.0",
    "@tanstack/react-query": "^5.62.0",
    "zustand": "^5.0.0",
    "zod": "^3.24.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.10.0",
    "date-fns": "^4.1.0",
    "nanoid": "^5.0.0",
    "lodash-es": "^4.17.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/lodash-es": "^4.17.0",
    "@types/node": "^22.10.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.1.0",
    "@typescript-eslint/eslint-plugin": "^8.19.0",
    "@typescript-eslint/parser": "^8.19.0",
    "eslint-config-prettier": "^9.1.0",
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "msw": "^2.7.0"
  }
}
```

---

## 13. Riepilogo Decisioni

| # | Decisione | Stato | Razionale |
|---|-----------|-------|-----------|
| 1 | Next.js 15 App Router | **Deciso** | Framework raccomandato dal committente, SSR/ISR, Server Actions |
| 2 | React 19 | **Deciso** | Major piu recente, concurrent features, use() API |
| 3 | TypeScript strict | **Deciso** | Type safety massima, catch a compile-time |
| 4 | Supabase completo | **Deciso** | Backend-as-a-service, PostgreSQL, Auth, Storage, Realtime |
| 5 | Vercel hosting | **Deciso** | Edge deployment, ottimizzato per Next.js |
| 6 | Tailwind CSS + shadcn/ui | **Deciso** | Velocita sviluppo, componenti accessibili, zero runtime |
| 7 | Zod + React Hook Form | **Deciso** | Validazione type-safe, forms performanti |
| 8 | pnpm workspaces | **Deciso** | Monorepo-ready senza overhead Turborepo per MVP |
| 9 | Vitest + Playwright | **Deciso** | Testing pyramid completo, unit + E2E |
| 10 | ESLint 9 flat config + Prettier | **Deciso** | Linting moderno, formattazione automatica |
| 11 | TanStack Query + Zustand | **Deciso** | Server state caching + client state minimalista |
| 12 | Monorepo strutturale | **Deciso** | apps/web + packages/ stub per futura evoluzione |
| 13 | Git Flow semplificato | **Deciso** | main + develop + feature branches |
| 14 | GitHub Actions CI/CD | **Deciso** | Pipeline automata, check su ogni PR |
| 15 | Server Actions come default | **Deciso** | Pattern Next.js 15, meno boilerplate delle API Routes |
| 16 | Row Level Security | **Deciso** | Sicurezza a livello database, obbligatorio per dati sensibili |
| 17 | Repository Pattern | **Deciso** | Astrazione layer dati, facilita testing e future migrazioni |
| 18 | Co-location by domain | **Deciso** | Organizzazione per bounded context, scalabilita cognitiva |

---

*Fine documento — INVENTORY.md*
*Versione: 1.0.0*
*Prossima revisione: alla conclusione del setup iniziale*
