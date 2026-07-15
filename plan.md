# Piano di Esecuzione — "Ricordati di Te" Platform

## Panoramica
Progettazione e sviluppo di una piattaforma social memoriale enterprise con architettura modulare, security-first, e flusso verticale completo MVP.

## Fase 1 — Analisi e Documentazione Architetturale
**Obiettivo**: Analizzare il repository, generare inventario tecnico, produrre documenti architetturali completi.
- Analisi repository esistente (Next.js, Supabase, Vercel, dipendenze)
- Inventario tecnico con debito e rischi
- Generazione documenti:
  - docs/product/PRD.md
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/DOMAIN-MAP.md
  - docs/database/DATA-MODEL.md
  - docs/security/THREAT-MODEL.md
  - docs/operations/DEPLOYMENT.md
  - docs/operations/ENVIRONMENT.md
  - IMPLEMENTATION_PLAN.md

**Skill**: deep-research-swarm (analisi), report-writing (documentazione)
**Agenti**: Analista_Repo, Architetto_Software, Database_Architect, Security_Engineer

## Fase 2 — Database e Security Layer
**Obiettivo**: Progettare e implementare lo schema database, migrazioni, policy RLS, auth layer.
- Migrazioni SQL per tabelle core (profiles, memorials, guardians, media, posts, ecc.)
- Policy RLS esplicite e testate
- Configurazione Supabase Auth
- Seed data per sviluppo

**Skill**: vibecoding-webapp-swarm (implementazione)
**Agenti**: Database_Engineer, Security_Engineer, Auth_Specialist

## Fase 3 — Design System e Base Frontend
**Obiettivo**: Costruire il design system, componenti base, layout, e struttura pagine.
- Token di design (colori, tipografia, spaziature)
- Componenti accessibili (shadcn/ui based)
- Layout principale (header, nav, footer)
- Dark mode ready

**Skill**: vibecoding-webapp-swarm
**Agenti**: Frontend_Lead, UI_Designer

## Fase 4 — Flusso Verticale Completo (MVP E2E)
**Obiettivo**: Implementare il flusso end-to-end richiesto:
  registrazione → creazione memoriale → assegnazione custode → upload immagine in quarantena → approvazione → visualizzazione memoriale

- Server Actions per operazioni CRUD
- Repository pattern con type safety
- Permission layer centralizzato
- Media pipeline (quarantena, validazione, varianti)
- Testing completo

**Skill**: vibecoding-webapp-swarm
**Agenti**: FullStack_Engineer, QA_Engineer

## Dipendenze tra Fasi
- Fase 1 → Fase 2 (documenti DB prima delle migrazioni)
- Fase 2 → Fase 3 (RLS/Auth prima dei componenti che li usano)
- Fase 3 → Fase 4 (design system prima dei flussi)
- Fase 2 e Fase 3 possono essere parzialmente sovrapposte con coordinazione

## Standard di Qualità
- TypeScript strict, no any non motivati
- RLS testato su tutte le tabelle
- Nessun mock in produzione
- Build, lint, typecheck passanti
- WCAG AA accessibility

## Output Finale
- Repository strutturato e funzionante
- Documentazione completa
- MVP deployabile su Vercel
- Report milestone con tutti i campi richiesti
