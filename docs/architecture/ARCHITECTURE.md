# Architecture Document — Ricordati di Te

> **Versione**: 1.0  
> **Data**: 2025-06-01  
> **Stato**: Approvato per implementazione  
> **Pattern**: Clean Architecture + DDD + Ports & Adapters  

---

## Indice

1. [Overview Architetturale](#1-overview-architetturale)
2. [Bounded Contexts](#2-bounded-contexts)
3. [Flusso Dati](#3-flusso-dati)
4. [Strato Presentation](#4-strato-presentation)
5. [Strato Application](#5-strato-application)
6. [Strato Domain](#6-strato-domain)
7. [Strato Infrastructure](#7-strato-infrastructure)
8. [Cross-Cutting Concerns](#8-cross-cutting-concerns)
9. [Decisioni Architetturali (ADRs)](#9-decisioni-architetturali-adrs)

---

## 1. Overview Architetturale

### 1.1 Pattern Architetturali

La piattaforma adotta una **combinazione ibrida** di tre pattern complementari:

| Pattern | Scopo | Dove si applica |
|---------|-------|-----------------|
| **Clean Architecture** | Separazione in strati con dipendenze verso l'interno | Struttura globale del progetto |
| **Domain-Driven Design (DDD)** | Modellazione del dominio in Bounded Context | Organizzazione moduli e linguaggio ubiquo |
| **Ports & Adapters (Hexagonal)** | Disaccoppiamento core dalle dipendenze esterne | Interfacce repository e service |

### 1.2 Diagramma Architetturale (High-Level)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Next.js    │  │   Server     │  │   Client     │  │     UI       │ │
│  │   App Router │  │  Components  │  │  Components  │  │  Components  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────┘
          │                 │                 │                 │
          └─────────────────┴─────────────────┴─────────────────┘
                                    │
                          ┌─────────▼──────────┐
                          │   Server Actions   │  ◄─── Application Boundary
                          └─────────┬──────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                                   │                                      │
│  ┌────────────────────────────────▼────────────────────────────────┐   │
│  │                      APPLICATION LAYER                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │   Use Cases  │  │     DTOs     │  │  Service Orchestration│  │   │
│  │  │  (Server     │  │  (zod schemas)│  │     (workflow)       │  │   │
│  │  │   Actions)   │  │              │  │                      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                      DOMAIN LAYER                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │   Entities   │  │  Value       │  │  Domain Events       │  │   │
│  │  │  (memorial,  │  │  Objects     │  │  (type-safe events)  │  │   │
│  │  │   user, role)│  │  (dates, ids)│  │                      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │  Repository  │  │  Domain      │  │  Domain Services     │  │   │
│  │  │  Interfaces  │  │  Services    │  │  (pure business logic)│  │   │
│  │  │  (ports)     │  │              │  │                      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                   INFRASTRUCTURE LAYER                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │  Supabase    │  │   Storage    │  │   AI Provider        │  │   │
│  │  │  Adapter     │  │  (Quarantine │  │  (Moderation,        │  │   │
│  │  │  (PostgREST, │  │   Pipeline)  │  │   Classification)    │  │   │
│  │  │   RLS)       │  │              │  │                      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │  Auth        │  │   Email      │  │   Monitoring         │  │   │
│  │  │  (Supabase   │  │  (Resend/   │  │  (Vercel,            │  │   │
│  │  │   Auth)      │  │   SendGrid)  │  │   Sentry)            │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.3 Regola delle Dipendenze

```
Presentation ──depends on──▶ Application ──depends on──▶ Domain
                                                         ▲
Infrastructure ─────────────────────depends on (via DI)───┘
```

- **Domain** non dipende da nessun altro strato
- **Application** dipende solo da Domain
- **Presentation** dipende da Application e Domain (DTO)
- **Infrastructure** implementa le interfacce (ports) definite in Domain

---

## 2. Bounded Contexts

### 2.1 Mappa dei Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    ┌──────────┐                                                             │
│    │ Identity │◄─────────────────────────────────────────────────────┐      │
│    │ (Auth)   │                                                      │      │
│    └────┬─────┘                                                      │      │
│         │ UserAuthenticated, UserProfileUpdated                       │      │
│         │                                                            │      │
│    ┌────▼──────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐  │      │
│    │ Memorials │◄───▶│ Governance│◄──▶│ Content  │◄──▶│  Media    │  │      │
│    │ (Core)    │     │ (Roles)   │    │ (Posts)  │    │ (Upload)  │  │      │
│    └────┬──────┘    └───────────┘    └────┬─────┘    └─────┬─────┘  │      │
│         │                                  │                │        │      │
│         │ MemorialCreated                  │                │        │      │
│         │ PrivacyChanged                   │                │        │      │
│         ▼                                  │                │        │      │
│    ┌──────────┐    ┌───────────┐    ┌─────▼──────┐    ┌────▼─────┐  │      │
│    │Community │◄──▶│Moderation │◄──▶│ Notification│   │  Search  │  │      │
│    │(Messages)│    │(Reports)  │    │ (Events)    │   │ (Index)  │  │      │
│    └──────────┘    └───────────┘    └────────────┘    └──────────┘  │      │
│                                                                     │      │
│    ┌──────────┐    ┌───────────┐                                    │      │
│    │    AI    │    │   Audit   │◄───────────────────────────────────┘      │
│    │(Moderate)│    │  (Logs)   │                                           │
│    └──────────┘    └───────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Descrizione dei Bounded Contexts

| # | Context | Descrizione | Entità Principali |
|---|---------|-------------|-------------------|
| 1 | **Identity** | Gestione utenti, autenticazione, profili | `User`, `UserProfile`, `AuthSession` |
| 2 | **Memorials** | CRUD memoriali, configurazione, timeline | `Memorial`, `MemorialTimeline`, `Milestone` |
| 3 | **Governance** | Ruoli, permessi, inviti, successione | `RoleAssignment`, `Invitation`, `CustodianTransfer` |
| 4 | **Content** | Post, storie, biografia, approvazione | `Post`, `Story`, `ContentApproval`, `Biography` |
| 5 | **Media** | Upload, quarantena, ottimizzazione, storage | `MediaAsset`, `QuarantineJob`, `MediaVariant` |
| 6 | **Community** | Messaggi di vicinanza, bacheca | `CondolenceMessage`, `MessageBoard` |
| 7 | **Moderation** | Segnalazioni, review, azioni di moderazione | `Report`, `ModerationAction`, `Ban` |
| 8 | **Notifications** | Email, push, digest, ricorrenze | `Notification`, `NotificationPreference`, `Recurrence` |
| 9 | **Search** | Indicizzazione, ricerca memoriali | `SearchIndex`, `SearchQuery`, `SearchResult` |
| 10 | **AI** | Moderazione automatica, classificazione | `ModerationResult`, `Classification`, `AIJob` |
| 11 | **Audit** | Logging immutabile, tracciabilità | `AuditLog`, `AuditAction` |

---

## 3. Flusso Dati

### 3.1 Flusso Dati Principali

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  FLUSSO 1: Creazione Memoriale                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Client ──▶ POST /api/memorials ──▶ Server Action                            │
│                                        │                                     │
│                                        ▼                                     │
│                              ┌─────────────────┐                             │
│                              │ Validate Input   │                             │
│                              │ (zod schema)     │                             │
│                              └────────┬────────┘                             │
│                                       │                                      │
│                    ┌──────────────────┼──────────────────┐                  │
│                    ▼                  ▼                  ▼                  │
│           ┌─────────────┐   ┌──────────────┐   ┌──────────────┐            │
│           │ Memorials   │   │ Governance   │   │  Audit       │            │
│           │ Repository  │   │ Service      │   │  Log         │            │
│           │ (insert)    │   │ (assign role)│   │  (record)    │            │
│           └──────┬──────┘   └──────┬───────┘   └──────────────┘            │
│                  │                 │                                         │
│                  ▼                 ▼                                         │
│           ┌──────────────────────────────────────┐                          │
│           │         Supabase (PostgreSQL)        │                          │
│           │  memorials │ role_assignments │ audit_logs                       │
│           └──────────────────────────────────────┘                          │
│                              │                                               │
│                              ▼                                               │
│                    ┌──────────────────┐                                      │
│                    │  Domain Event    │                                      │
│                    │  MemorialCreated │─────▶ Notifications                  │
│                    └──────────────────┘         (email di benvenuto)         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  FLUSSO 2: Upload Media con Quarantena                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Client ──▶ POST /api/media/upload ──▶ Server Action                         │
│                                            │                                 │
│                                            ▼                                 │
│                              ┌─────────────────────┐                         │
│                              │ Pre-signed URL       │                         │
│                              │ (Supabase Storage)   │                         │
│                              └──────────┬──────────┘                         │
│                                         │                                    │
│                              ┌──────────▼──────────┐                         │
│                              │   Quarantine Job    │                         │
│                              │   (queued)          │                         │
│                              └──────────┬──────────┘                         │
│                                         │                                    │
│                              ┌──────────▼──────────┐                         │
│                              │  Background Worker  │                         │
│                              │  (Edge Function)    │                         │
│                              └──────────┬──────────┘                         │
│                                         │                                    │
│                    ┌────────────────────┼────────────────────┐               │
│                    ▼                    ▼                    ▼               │
│            ┌─────────────┐    ┌──────────────┐    ┌──────────────┐          │
│            │ Antivirus   │    │ AI Moderation│    │ Store Result │          │
│            │ (ClamAV)    │    │ (Classifier) │    │ (DB Record)  │          │
│            └──────┬──────┘    └──────┬───────┘    └──────┬──────┘          │
│                   │                  │                    │                  │
│                   ▼                  ▼                    ▼                  │
│              ┌─────────────────────────────────────────────────┐             │
│              │  Status: PENDING ──▶ APPROVED │ REJECTED       │             │
│              │  Approved: move to public storage                 │             │
│              │  Rejected: flag for review, notify submitter      │             │
│              └─────────────────────────────────────────────────┘             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  FLUSSO 3: Pubblicazione Contenuto con Approvazione                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Collaboratore ──▶ POST /api/content ──▶ Server Action                       │
│                                               │                              │
│                                               ▼                              │
│                                   ┌──────────────────┐                       │
│                                   │ Check Permission │                       │
│                                   │ (role-based)     │                       │
│                                   └────────┬────────┘                       │
│                                            │                                │
│                              ┌─────────────┴──────────────┐                │
│                              ▼                            ▼                │
│                    ┌──────────────────┐        ┌──────────────────┐        │
│                    │ Custode/Co-Cust. │        │ Collaboratore/   │        │
│                    │ (publish direct) │        │ Visitatore       │        │
│                    │ status: APPROVED │        │ status: PENDING  │        │
│                    └────────┬─────────┘        └────────┬─────────┘        │
│                             │                           │                   │
│                             ▼                           ▼                   │
│                    ┌──────────────────────────────────────────┐            │
│                    │  Notifica Custode (email/in-app)         │            │
│                    │  Link approvazione diretta               │            │
│                    └────────────────────┬─────────────────────┘            │
│                                         │                                  │
│                                         ▼                                  │
│                              ┌──────────────────┐                         │
│                              │  Custode approva  │                         │
│                              │  status: APPROVED │                         │
│                              └────────┬─────────┘                         │
│                                       │                                    │
│                                       ▼                                    │
│                              ┌──────────────────┐                         │
│                              │  Notify submitter │                         │
│                              │  Publish to feed  │                         │
│                              │  Audit log entry  │                         │
│                              └──────────────────┘                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Diagramma Sequenza — Pubblicazione Contenuto

```
Collaboratore    Next.js        Use Case       Content       Governance      Audit
     │              │              │           Service         Service        Log
     │              │              │             │               │            │
     │──createPost──▶│              │             │               │            │
     │              │──execute()───▶│             │               │            │
     │              │              │──validate()─▶│               │            │
     │              │              │             │               │            │
     │              │              │◀─valid─────│               │            │
     │              │              │             │               │            │
     │              │              │──checkRole()───────────────▶│            │
     │              │              │             │               │            │
     │              │              │◀────────role OK─────────────│            │
     │              │              │             │               │            │
     │              │              │──create()──▶│               │            │
     │              │              │             │ (PENDING)     │            │
     │              │              │◀─created───│               │            │
     │              │              │             │               │            │
     │              │              │──notify()──────────────────▶│            │
     │              │              │             │               │            │
     │              │◀────────────result────────│               │            │
     │◀─────────────response──────│             │               │            │
     │              │              │             │               │            │
     │              │              │             │  [Async: Custode approva]  │
     │              │              │             │               │            │
     │              │              │◀────approve()────────────────│            │
     │              │              │             │               │            │
     │              │              │──approve()─▶│               │            │
     │              │              │             │ (APPROVED)    │            │
     │              │              │◀─approved──│               │            │
     │              │              │             │               │            │
     │              │              │──notify()──────────────────▶│            │
     │              │              │             │               │            │
     │              │              │──log()───────────────────────────────────▶│
     │              │              │             │               │            │
     │◀────────────────────notification (email)────────────────────────────────│
```

---

## 4. Strato Presentation

### 4.1 Tecnologia

- **Framework**: Next.js 14+ con App Router
- **Rendering**: Server Components di default, Client Components per interattività
- **Styling**: Tailwind CSS + shadcn/ui
- **Font**: Inter (sans-serif), sobrio e leggibile

### 4.2 Struttura Directory (App Router)

```
app/
├── (marketing)/                    # Gruppo route pubblico
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Layout marketing
│   └── chi-siamo/
│       └── page.tsx
│
├── (auth)/                         # Gruppo route autenticazione
│   ├── login/
│   │   └── page.tsx                # Server Component
│   ├── registrazione/
│   │   └── page.tsx
│   └── reset-password/
│       └── page.tsx
│
├── (dashboard)/                    # Gruppo route autenticato
│   ├── layout.tsx                  # Layout con sidebar, auth guard
│   ├── page.tsx                    # Dashboard utente
│   ├── memoriali/
│   │   ├── page.tsx                # Lista memoriali
│   │   ├── nuovo/
│   │   │   └── page.tsx            # Wizard creazione (Server)
│   │   │       ├── StepAnagrafica.tsx    # Client
│   │   │       ├── StepFotoBio.tsx       # Client
│   │   │       ├── StepPrivacy.tsx       # Client
│   │   │       └── StepCoCustode.tsx     # Client
│   │   └── [slug]/
│   │       ├── page.tsx            # Pagina memoriale (Server)
│   │       ├── settings/
│   │       │   └── page.tsx        # Impostazioni memoriale
│   │       └── admin/
│   │           └── page.tsx        # Admin approvazioni
│   ├── impostazioni/
│   │   └── page.tsx                # Profilo e notifiche utente
│   └── ricerca/
│       └── page.tsx                # Ricerca memoriali
│
├── api/                            # Route handlers (solo se necessario)
│   └── webhooks/
│       └── stripe/route.ts         # (futuro: pagamenti)
│
├── layout.tsx                      # Root layout (i18n provider, etc.)
└── globals.css
```

### 4.3 Distribuzione Server/Client Components

```
┌─────────────────────────────────────────────────────────────┐
│                      ROOT LAYOUT                             │
│                    (Server Component)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  AuthProvider │  │ ThemeProvider│  │  I18nProvider    │  │
│  │  (Client)     │  │ (Client)     │  │  (Client)        │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────┘  │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────────┐    │
│  │              PAGE (Server Component)                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │  Data    │  │ Metadata │  │  Server Actions  │   │    │
│  │  │  Fetch   │  │ (SEO)    │  │  (form submit)   │   │    │
│  │  │  (DB)    │  │          │  │                  │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  │                                                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │  Form    │  │  Modal   │  │  Interactive     │   │    │
│  │  │  (Client)│  │ (Client) │  │  Component       │   │    │
│  │  │          │  │          │  │  (Client)        │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Componenti UI Core (shadcn/ui + Custom)

| Componente | Tipo | Libreria | Scopo |
|------------|------|----------|-------|
| `Button` | UI | shadcn/ui | Azioni primarie e secondarie |
| `Card` | UI | shadcn/ui | Contenitori contenuto |
| `Dialog` | UI | shadcn/ui | Modali conferma |
| `Form` | UI | shadcn/ui + zod | Gestione form |
| `Toast` | UI | shadcn/ui | Notifiche in-app |
| `MemorialCard` | Custom | — | Card preview memoriale |
| `Timeline` | Custom | — | Visualizzazione cronologica |
| `MediaUploader` | Custom | — | Upload con progress e preview |
| `ApprovalQueue` | Custom | — | Dashboard approvazioni |
| `RoleBadge` | Custom | — | Indicatore ruolo utente |

---

## 5. Strato Application

### 5.1 Server Actions

Le Server Actions rappresentano il punto di ingresso per tutte le operazioni di mutazione. Ogni action segue il pattern:

```typescript
// app/(dashboard)/memoriali/actions.ts
'use server';

import { createMemorialUseCase } from '@/lib/application/use-cases/memorials/create-memorial';
import { CreateMemorialInput, createMemorialSchema } from '@/lib/application/dto/memorials';
import { authGuard } from '@/lib/infrastructure/auth/guard';
import { revalidatePath } from 'next/cache';

export async function createMemorialAction(
  input: CreateMemorialInput
): Promise<ActionResult<{ memorialId: string }>> {
  try {
    // 1. Auth guard
    const user = await authGuard();
    
    // 2. Input validation
    const validated = createMemorialSchema.parse(input);
    
    // 3. Execute use case
    const result = await createMemorialUseCase.execute({
      ...validated,
      custodianId: user.id,
    });
    
    // 4. Revalidate cache
    revalidatePath('/memoriali');
    
    return { success: true, data: result };
  } catch (error) {
    // 5. Error handling (never leak internal errors)
    return { success: false, error: toUserError(error) };
  }
}
```

### 5.2 Pattern ActionResult

```typescript
// lib/shared/types/action-result.ts

export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: UserError };

export interface UserError {
  code: string;        // Es: "MEMORIAL_NOT_FOUND", "UNAUTHORIZED"
  message: string;     // Messaggio localizzato per l'utente
  fieldErrors?: Record<string, string[]>; // Errori di validazione per campo
}
```

### 5.3 DTOs (Data Transfer Objects)

```typescript
// lib/application/dto/memorials.ts

import { z } from 'zod';

export const createMemorialSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  birthDate: z.coerce.date().optional(),
  deathDate: z.coerce.date(),
  birthplace: z.string().max(200).optional(),
  deathplace: z.string().max(200).optional(),
  biography: z.string().max(5000).optional(),
  profilePhoto: z.string().uuid().optional(), // media asset id
  privacyLevel: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']),
  coCustodianEmail: z.string().email().optional(),
});

export type CreateMemorialInput = z.infer<typeof createMemorialSchema>;

export const updateMemorialSchema = createMemorialSchema.partial().extend({
  memorialId: z.string().uuid(),
});

export type UpdateMemorialInput = z.infer<typeof updateMemorialSchema>;
```

### 5.4 Service Layer

```typescript
// lib/application/services/governance-service.ts

import { IGovernanceRepository } from '@/lib/domain/governance/repository';
import { RoleAssignment } from '@/lib/domain/governance/role-assignment';
import { MemorialId, UserId } from '@/lib/domain/shared/value-objects';
import { injectable, inject } from 'tsyringe';

export interface IGovernanceService {
  assignRole(
    memorialId: MemorialId,
    userId: UserId,
    role: Role,
    assignedBy: UserId
  ): Promise<RoleAssignment>;
  
  canPublishDirectly(
    memorialId: MemorialId,
    userId: UserId
  ): Promise<boolean>;
  
  getCustodian(memorialId: MemorialId): Promise<UserId | null>;
  
  initiateCustodianTransfer(
    memorialId: MemorialId,
    coCustodianId: UserId
  ): Promise<CustodianTransfer>;
}

@injectable()
export class GovernanceService implements IGovernanceService {
  constructor(
    @inject('IGovernanceRepository')
    private readonly repo: IGovernanceRepository,
    @inject('IAuditService')
    private readonly audit: IAuditService
  ) {}

  async assignRole(
    memorialId: MemorialId,
    userId: UserId,
    role: Role,
    assignedBy: UserId
  ): Promise<RoleAssignment> {
    // Business rule: solo Custode può assegnare ruoli (tranne Co-Custode che può invitare)
    const assignerRole = await this.repo.getRole(memorialId, assignedBy);
    if (!assignerRole?.canAssign(role)) {
      throw new UnauthorizedError('Insufficient permissions to assign role');
    }

    const assignment = RoleAssignment.create({
      memorialId,
      userId,
      role,
      assignedBy,
      assignedAt: new Date(),
    });

    await this.repo.saveAssignment(assignment);
    await this.audit.log('ROLE_ASSIGNED', { memorialId, userId, role, assignedBy });

    return assignment;
  }

  async canPublishDirectly(memorialId: MemorialId, userId: UserId): Promise<boolean> {
    const role = await this.repo.getRole(memorialId, userId);
    return role === Role.CUSTODIAN || role === Role.CO_CUSTODIAN;
  }

  // ...
}
```

---

## 6. Strato Domain

### 6.1 Entità Core

```typescript
// lib/domain/memorials/memorial.ts

import { Entity } from '@/lib/domain/shared/entity';
import { MemorialId, UserId, Slug } from '@/lib/domain/shared/value-objects';
import { PrivacyLevel } from '@/lib/domain/memorials/privacy-level';
import { Biography } from '@/lib/domain/memorials/biography';
import { DomainEvent } from '@/lib/domain/shared/domain-event';

export interface MemorialProps {
  id: MemorialId;
  slug: Slug;
  firstName: string;
  lastName: string;
  birthDate?: Date;
  deathDate: Date;
  birthplace?: string;
  deathplace?: string;
  biography?: Biography;
  profilePhotoUrl?: string;
  privacyLevel: PrivacyLevel;
  custodianId: UserId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export class Memorial extends Entity<MemorialProps> {
  // Factory method per creazione controllata
  static create(props: Omit<MemorialProps, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'isActive'>): Memorial {
    const id = MemorialId.generate();
    const slug = Slug.generate(`${props.firstName}-${props.lastName}-${id.toShort()}`);
    
    const memorial = new Memorial({
      ...props,
      id,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    });

    memorial.addDomainEvent(new MemorialCreatedEvent({
      memorialId: id,
      custodianId: props.custodianId,
      privacyLevel: props.privacyLevel,
    }));

    return memorial;
  }

  // Business methods
  changePrivacy(level: PrivacyLevel, changedBy: UserId): void {
    if (this.privacyLevel === level) return;
    
    const oldLevel = this.privacyLevel;
    this.props.privacyLevel = level;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new PrivacyChangedEvent({
      memorialId: this.id,
      oldLevel,
      newLevel: level,
      changedBy,
    }));
  }

  updateBiography(bio: Biography, updatedBy: UserId): void {
    this.props.biography = bio;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new BiographyUpdatedEvent({
      memorialId: this.id,
      updatedBy,
    }));
  }

  deactivate(deactivatedBy: UserId): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new MemorialDeactivatedEvent({
      memorialId: this.id,
      deactivatedBy,
    }));
  }

  // Getters
  get id(): MemorialId { return this.props.id; }
  get slug(): Slug { return this.props.slug; }
  get fullName(): string { return `${this.props.firstName} ${this.props.lastName}`; }
  get privacyLevel(): PrivacyLevel { return this.props.privacyLevel; }
  get custodianId(): UserId { return this.props.custodianId; }
  get isActive(): boolean { return this.props.isActive; }
}
```

### 6.2 Value Objects

```typescript
// lib/domain/shared/value-objects.ts

import { z } from 'zod';
import { randomUUID } from 'crypto';

// Base class per Value Objects
export abstract class ValueObject<T> {
  protected constructor(protected readonly props: T) {}
  
  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}

// MemorialId
export class MemorialId extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }
  
  static generate(): MemorialId {
    return new MemorialId(randomUUID());
  }
  
  static fromString(value: string): MemorialId {
    if (!z.string().uuid().safeParse(value).success) {
      throw new Error('Invalid MemorialId format');
    }
    return new MemorialId(value);
  }
  
  toString(): string { return this.props.value; }
  toShort(): string { return this.props.value.slice(0, 8); }
}

// UserId
export class UserId extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }
  
  static fromString(value: string): UserId {
    return new UserId(value);
  }
  
  toString(): string { return this.props.value; }
}

// Slug
export class Slug extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value: value.toLowerCase().replace(/[^a-z0-9-]/g, '-') });
  }
  
  static generate(base: string): Slug {
    const normalized = base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100);
    return new Slug(normalized);
  }
  
  toString(): string { return this.props.value; }
}
```

### 6.3 Domain Events

```typescript
// lib/domain/shared/domain-event.ts

export abstract class DomainEvent {
  readonly occurredOn: Date;
  readonly eventId: string;
  
  constructor() {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }
  
  abstract readonly eventType: string;
}

// MemorialCreated
export class MemorialCreatedEvent extends DomainEvent {
  readonly eventType = 'MEMORIAL_CREATED';
  
  constructor(
    public readonly payload: {
      memorialId: MemorialId;
      custodianId: UserId;
      privacyLevel: PrivacyLevel;
    }
  ) {
    super();
  }
}

// PrivacyChanged
export class PrivacyChangedEvent extends DomainEvent {
  readonly eventType = 'PRIVACY_CHANGED';
  
  constructor(
    public readonly payload: {
      memorialId: MemorialId;
      oldLevel: PrivacyLevel;
      newLevel: PrivacyLevel;
      changedBy: UserId;
    }
  ) {
    super();
  }
}

// ContentSubmittedForApproval
export class ContentSubmittedEvent extends DomainEvent {
  readonly eventType = 'CONTENT_SUBMITTED';
  
  constructor(
    public readonly payload: {
      contentId: string;
      memorialId: MemorialId;
      submitterId: UserId;
      contentType: 'POST' | 'STORY' | 'MEDIA';
    }
  ) {
    super();
  }
}

// ContentApproved
export class ContentApprovedEvent extends DomainEvent {
  readonly eventType = 'CONTENT_APPROVED';
  
  constructor(
    public readonly payload: {
      contentId: string;
      memorialId: MemorialId;
      approvedBy: UserId;
    }
  ) {
    super();
  }
}

// RoleAssigned
export class RoleAssignedEvent extends DomainEvent {
  readonly eventType = 'ROLE_ASSIGNED';
  
  constructor(
    public readonly payload: {
      memorialId: MemorialId;
      userId: UserId;
      role: Role;
      assignedBy: UserId;
    }
  ) {
    super();
  }
}
```

### 6.4 Repository Interfaces (Ports)

```typescript
// lib/domain/memorials/repository.ts

import { Memorial } from './memorial';
import { MemorialId, UserId, Slug } from '@/lib/domain/shared/value-objects';

export interface IMemorialRepository {
  findById(id: MemorialId): Promise<Memorial | null>;
  findBySlug(slug: Slug): Promise<Memorial | null>;
  findByCustodian(userId: UserId): Promise<Memorial[]>;
  search(query: MemorialSearchQuery): Promise<PaginatedResult<Memorial>>;
  save(memorial: Memorial): Promise<void>;
  update(memorial: Memorial): Promise<void>;
  delete(id: MemorialId): Promise<void>;
}

export interface MemorialSearchQuery {
  q?: string;
  privacyLevel?: 'PUBLIC';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

```typescript
// lib/domain/governance/repository.ts

import { RoleAssignment } from './role-assignment';
import { MemorialId, UserId } from '@/lib/domain/shared/value-objects';
import { Role } from './role';

export interface IGovernanceRepository {
  getRole(memorialId: MemorialId, userId: UserId): Promise<Role | null>;
  getAssignments(memorialId: MemorialId): Promise<RoleAssignment[]>;
  saveAssignment(assignment: RoleAssignment): Promise<void>;
  removeAssignment(memorialId: MemorialId, userId: UserId): Promise<void>;
  getCustodian(memorialId: MemorialId): Promise<UserId | null>;
  getCoCustodians(memorialId: MemorialId): Promise<UserId[]>;
}
```

### 6.5 Enum e Tipi

```typescript
// lib/domain/governance/role.ts

export enum Role {
  CUSTODIAN = 'CUSTODIAN',
  CO_CUSTODIAN = 'CO_CUSTODIAN',
  COLLABORATOR = 'COLLABORATOR',
  VISITOR = 'VISITOR',
}

export namespace Role {
  export function canAssign(role: Role, targetRole: Role): boolean {
    switch (role) {
      case Role.CUSTODIAN:
        return targetRole !== Role.CUSTODIAN; // Custode può assegnare tutto tranne Custode
      case Role.CO_CUSTODIAN:
        return targetRole === Role.COLLABORATOR || targetRole === Role.VISITOR;
      default:
        return false;
    }
  }

  export function canPublishDirectly(role: Role): boolean {
    return role === Role.CUSTODIAN || role === Role.CO_CUSTODIAN;
  }

  export function canModerate(role: Role): boolean {
    return role === Role.CUSTODIAN || role === Role.CO_CUSTODIAN;
  }
}
```

```typescript
// lib/domain/memorials/privacy-level.ts

export enum PrivacyLevel {
  PUBLIC = 'PUBLIC',         // Visibile a tutti
  PRIVATE = 'PRIVATE',       // Solo invitati
  INVITE_ONLY = 'INVITE_ONLY', // Richiesta accesso
}

export namespace PrivacyLevel {
  export function requiresApprovalForPosting(level: PrivacyLevel, role: Role): boolean {
    if (Role.canPublishDirectly(role)) return false;
    return true; // Collaboratori e Visitatori sempre in approvazione
  }

  export function isSearchable(level: PrivacyLevel): boolean {
    return level === PrivacyLevel.PUBLIC;
  }
}
```

---

## 7. Strato Infrastructure

### 7.1 Supabase Adapter

```typescript
// lib/infrastructure/persistence/supabase/memorial-repository.ts

import { IMemorialRepository, MemorialSearchQuery, PaginatedResult } from '@/lib/domain/memorials/repository';
import { Memorial } from '@/lib/domain/memorials/memorial';
import { MemorialId, UserId, Slug } from '@/lib/domain/shared/value-objects';
import { PrivacyLevel } from '@/lib/domain/memorials/privacy-level';
import { createClient } from '@/lib/infrastructure/supabase/server';
import { injectable } from 'tsyringe';

@injectable()
export class SupabaseMemorialRepository implements IMemorialRepository {
  async findById(id: MemorialId): Promise<Memorial | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('memorials')
      .select('*')
      .eq('id', id.toString())
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findBySlug(slug: Slug): Promise<Memorial | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('memorials')
      .select('*')
      .eq('slug', slug.toString())
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async search(query: MemorialSearchQuery): Promise<PaginatedResult<Memorial>> {
    const supabase = await createClient();
    let dbQuery = supabase
      .from('memorials')
      .select('*', { count: 'exact' })
      .eq('privacy_level', 'PUBLIC')
      .eq('is_active', true);

    if (query.q) {
      dbQuery = dbQuery.or(`first_name.ilike.%${query.q}%,last_name.ilike.%${query.q}%`);
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { data, error, count } = await dbQuery
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      items: (data ?? []).map(this.toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async save(memorial: Memorial): Promise<void> {
    const supabase = await createClient();
    const events = memorial.domainEvents;

    const { error } = await supabase
      .from('memorials')
      .insert(this.toPersistence(memorial));

    if (error) throw error;

    // Publish domain events
    for (const event of events) {
      await this.publishEvent(event);
    }
    memorial.clearDomainEvents();
  }

  // Mappers
  private toDomain(data: any): Memorial {
    return Memorial.reconstruct({
      id: MemorialId.fromString(data.id),
      slug: Slug.fromString(data.slug),
      firstName: data.first_name,
      lastName: data.last_name,
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
      deathDate: new Date(data.death_date),
      birthplace: data.birthplace ?? undefined,
      deathplace: data.deathplace ?? undefined,
      biography: data.biography ?? undefined,
      profilePhotoUrl: data.profile_photo_url ?? undefined,
      privacyLevel: data.privacy_level as PrivacyLevel,
      custodianId: UserId.fromString(data.custodian_id),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      isActive: data.is_active,
    });
  }

  private toPersistence(memorial: Memorial): any {
    return {
      id: memorial.id.toString(),
      slug: memorial.slug.toString(),
      first_name: memorial.firstName,
      last_name: memorial.lastName,
      birth_date: memorial.birthDate?.toISOString(),
      death_date: memorial.deathDate.toISOString(),
      birthplace: memorial.birthplace,
      deathplace: memorial.deathplace,
      biography: memorial.biography,
      profile_photo_url: memorial.profilePhotoUrl,
      privacy_level: memorial.privacyLevel,
      custodian_id: memorial.custodianId.toString(),
      is_active: memorial.isActive,
    };
  }

  private async publishEvent(event: DomainEvent): Promise<void> {
    const supabase = await createClient();
    await supabase.from('domain_events').insert({
      event_type: event.eventType,
      payload: JSON.stringify(event.payload),
      occurred_on: event.occurredOn.toISOString(),
    });
  }
}
```

### 7.2 Row Level Security (RLS) Policies

```sql
-- Supabase RLS Policies per la tabella memorials

ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;

-- Policy: Leggere memoriali pubblici
CREATE POLICY "Memorials pubblici sono leggibili da tutti"
  ON memorials FOR SELECT
  USING (privacy_level = 'PUBLIC' AND is_active = true);

-- Policy: Leggere memoriali dove si è invitati
CREATE POLICY "Memoriali invitati sono leggibili dagli assegnatari"
  ON memorials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM role_assignments
      WHERE role_assignments.memorial_id = memorials.id
      AND role_assignments.user_id = auth.uid()
    )
  );

-- Policy: Custode può fare tutto sul proprio memoriale
CREATE POLICY "Custode ha controllo totale"
  ON memorials FOR ALL
  USING (custodian_id = auth.uid());

-- Policy: Co-Custode può aggiornare
CREATE POLICY "Co-Custode può modificare"
  ON memorials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM role_assignments
      WHERE role_assignments.memorial_id = memorials.id
      AND role_assignments.user_id = auth.uid()
      AND role_assignments.role = 'CO_CUSTODIAN'
    )
  );
```

### 7.3 Storage Quarantine Pipeline

```typescript
// lib/infrastructure/storage/quarantine-pipeline.ts

import { createClient } from '@/lib/infrastructure/supabase/server';

export interface QuarantineResult {
  status: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW';
  reasons?: string[];
  confidence: number;
}

export class QuarantinePipeline {
  constructor(
    private readonly antivirus: IAntivirusScanner,
    private readonly aiModerator: IAIModerator,
    private readonly storage: IStorageService
  ) {}

  async process(mediaAssetId: string): Promise<QuarantineResult> {
    // Step 1: Scan antivirus
    const scanResult = await this.antivirus.scan(mediaAssetId);
    if (!scanResult.clean) {
      return {
        status: 'REJECTED',
        reasons: [`Antivirus: ${scanResult.threats.join(', ')}`],
        confidence: 1.0,
      };
    }

    // Step 2: AI Moderation
    const aiResult = await this.aiModerator.analyze(mediaAssetId);
    if (aiResult.isInappropriate) {
      return {
        status: 'REJECTED',
        reasons: aiResult.reasons,
        confidence: aiResult.confidence,
      };
    }

    if (aiResult.requiresHumanReview) {
      return {
        status: 'PENDING_REVIEW',
        reasons: aiResult.reasons,
        confidence: aiResult.confidence,
      };
    }

    // Step 3: Move to public storage
    await this.storage.moveFromQuarantine(mediaAssetId);

    return { status: 'APPROVED', confidence: aiResult.confidence };
  }
}
```

### 7.4 AI Provider Abstraction

```typescript
// lib/infrastructure/ai/ai-provider.ts

export interface IAIModerator {
  analyze(mediaAssetId: string): Promise<AIModerationResult>;
  classifyText(text: string): Promise<TextClassificationResult>;
}

export interface AIModerationResult {
  isInappropriate: boolean;
  requiresHumanReview: boolean;
  reasons: string[];
  confidence: number;
  categories: {
    violence: number;
    nudity: number;
    hate: number;
    spam: number;
    deepfake: number;
  };
}

// Adapter per OpenAI/Anthropic
@injectable()
export class OpenAIModerator implements IAIModerator {
  constructor(
    @inject('AI_CONFIG') private readonly config: AIConfig
  ) {}

  async analyze(mediaAssetId: string): Promise<AIModerationResult> {
    // Implementation: chiama API di moderazione
    // con retry logic e circuit breaker
    // ...
  }

  async classifyText(text: string): Promise<TextClassificationResult> {
    // Implementation
    // ...
  }
}
```

---

## 8. Cross-Cutting Concerns

### 8.1 Autenticazione

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTH FLOW                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────┐   │
│  │  Client  │────▶│  Supabase    │────▶│   Auth Session   │   │
│  │  (Form)  │     │  Auth API    │     │   (JWT Cookie)   │   │
│  └──────────┘     └──────────────┘     └──────────────────┘   │
│                                              │                  │
│                                              ▼                  │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────┐   │
│  │  Server  │◀────│  Middleware  │◀────│  Session Verify  │   │
│  │  Action  │     │  (matcher)   │     │  (RLS context)   │   │
│  └──────────┘     └──────────────┘     └──────────────────┘   │
│                                                                 │
│  Middleware Configuration:                                      │
│  - /(dashboard)/* → requires auth                               │
│  - /api/* → requires auth (per API protette)                    │
│  - /memoriali/[slug] → public (con check RLS)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Logging

```typescript
// lib/infrastructure/logging/logger.ts

export interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

// Pino logger con configurazione per Vercel
export class PinoLogger implements ILogger {
  private logger: import('pino').Logger;
  
  constructor() {
    this.logger = require('pino')({
      level: process.env.LOG_LEVEL ?? 'info',
      transport: process.env.NODE_ENV === 'development' 
        ? { target: 'pino-pretty' }
        : undefined,
    });
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(meta, message);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(meta, message);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(meta, message);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    this.logger.error({ ...meta, err: error }, message);
  }
}
```

### 8.3 Error Handling

```typescript
// lib/shared/errors/index.ts

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// Domain Errors
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
  readonly isOperational = true;
}

export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 403;
  readonly isOperational = true;
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string[]>
  ) {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;
  readonly isOperational = true;
}

// Error mapping per Server Actions
export function toUserError(error: unknown): UserError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      ...(error instanceof ValidationError ? { fieldErrors: error.fieldErrors } : {}),
    };
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  return {
    code: 'INTERNAL_ERROR',
    message: 'Si è verificato un errore imprevisto. Riprova più tardi.',
  };
}
```

### 8.4 Internazionalizzazione (i18n)

```typescript
// lib/infrastructure/i18n/config.ts

import { getRequestConfig } from 'next-intl/server';

export const locales = ['it', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'it';

export default getRequestConfig(async ({ locale }) => {
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return { messages, locale };
});
```

```
messages/
├── it.json              # Italiano (default)
├── en.json              # Inglese
└── components/
    ├── memorials.json
    ├── governance.json
    └── common.json
```

---

## 9. Decisioni Architetturali (ADRs)

### ADR-001: Next.js App Router con Server Components

**Contesto**: Scelta del framework frontend e pattern di rendering.

**Decisione**: Utilizzare Next.js 14+ con App Router, Server Components di default, Client Components solo dove necessario.

**Alternativa Considerata**: Next.js Pages Router, Remix, Astro.

**Trade-off**:

| Criterio | App Router (scelto) | Pages Router | Remix |
|----------|-------------------|--------------|-------|
| Server Components | ✅ Nativo | ❌ No | ❌ No |
| Data fetching semplice | ✅ Server-side nativo | ⚠️ getServerSideProps | ✅ Loaders |
| Streaming | ✅ Supportato | ❌ No | ✅ Supportato |
| Maturità ecosystem | ⚠️ In evoluzione | ✅ Maturo | ⚠️ In crescita |
| Lock-in Vercel | ⚠️ Alto | ⚠️ Alto | ⚠️ Medio |

**Impatto**: Positivo su performance (meno JS client), semplificazione data fetching, SEO migliore.

---

### ADR-002: Supabase come Backend-as-a-Service

**Contesto**: Scelta della piattaforma backend (database, auth, storage).

**Decisione**: Utilizzare Supabase per PostgreSQL, Auth, Storage e Realtime.

**Alternativa Considerata**: Firebase, AWS Amplify, Custom backend (Node.js + PostgreSQL).

**Trade-off**:

| Criterio | Supabase (scelto) | Firebase | Custom Backend |
|----------|------------------|----------|----------------|
| PostgreSQL | ✅ Nativo | ❌ NoSQL | ✅ Configurabile |
| Auth integrato | ✅ Completo | ✅ Completo | ❌ Da implementare |
| RLS | ✅ Potente | ⚠️ Basic | ❌ Da implementare |
| Self-hosting | ✅ Possibile | ❌ No | ✅ Sempre |
| Costo scaling | ⚠️ Da monitorare | ⚠️ Da monitorare | ⚠️ Da gestire |

**Impatto**: Accelerazione sviluppo, RLS semplifica autorizzazione, PostgreSQL garantisce ACID.

---

### ADR-003: Clean Architecture + DDD (lightweight)

**Contesto**: Scelta dell'architettura software.

**Decisione**: Adottare Clean Architecture con DDD "pragmatico" — entità e value objects nel domain, ma senza event sourcing o CQRS completo.

**Alternativa Considerata**: MVC tradizionale, Hexagonal puro, CRUD semplice.

**Trade-off**:

| Criterio | Clean + DDD (scelto) | MVC | CRUD semplice |
|----------|---------------------|-----|---------------|
| Testabilità | ✅ Alta | ⚠️ Media | ❌ Bassa |
| Complessità iniziale | ⚠️ Media | ✅ Bassa | ✅ Bassa |
| Evolvibilità | ✅ Alta | ⚠️ Media | ❌ Bassa |
| Onboarding team | ⚠️ Richiede training | ✅ Semplice | ✅ Semplice |

**Impatto**: Maggiore boilerplate iniziale ma evolvibilità garantita nel tempo.

---

### ADR-004: Server Actions per Mutazioni

**Contesto**: Pattern di comunicazione client-server per operazioni di scrittura.

**Decisione**: Utilizzare Next.js Server Actions per tutte le mutazioni, evitando API Routes RESTful.

**Alternativa Considerata**: tRPC, REST API, GraphQL.

**Trade-off**:

| Criterio | Server Actions (scelto) | tRPC | REST |
|----------|------------------------|------|------|
| Type safety | ✅ End-to-end | ✅ End-to-end | ⚠️ Manuale |
| Progressive Enhancement | ✅ Supportata | ❌ No | ⚠️ Parziale |
| Caching integrato | ✅ revalidatePath | ⚠️ Manuale | ⚠️ Manuale |
| Ecosystem maturity | ⚠️ Nuovo | ✅ Maturo | ✅ Maturo |
| Debugging | ⚠️ Network tab opaco | ✅ Trasparente | ✅ Trasparente |

**Impatto**: Semplificazione codice, meno boilerplate, ma tool di debugging meno trasparenti.

---

### ADR-005: Repository Pattern con Supabase

**Contesto**: Pattern di accesso ai dati.

**Decisione**: Implementare Repository Pattern con interfacce nel domain e implementazione Supabase nell'infrastructure.

**Alternativa Considerata**: Query dirette Supabase nel codice, ORM (Prisma).

**Trade-off**:

| Criterio | Repository + Supabase (scelto) | Query dirette | Prisma |
|----------|-------------------------------|---------------|--------|
| Testabilità | ✅ Mock repository | ❌ Hard da testare | ✅ Buona |
| Dipendenza DB | ✅ Astratta | ❌ Accoppiata | ⚠️ Parzialmente |
| Performance | ✅ Ottima (query native) | ✅ Ottima | ⚠️ Overhead ORM |
| Type safety | ⚠️ Manuale (mappers) | ⚠️ Manuale | ✅ Generata |

**Impatto**: Necessità di scrivere mappers domain/persistence, ma massima flessibilità.

---

### ADR-006: Pipeline di Quarantena Asincrona

**Contesto**: Gestione upload media e moderazione.

**Decisione**: Implementare pipeline di quarantena asincrona con scan antivirus + AI moderation prima della pubblicazione.

**Alternativa Considerata**: Upload diretto con moderazione retroattiva, solo moderazione umana.

**Trade-off**:

| Criterio | Quarantena asincrona (scelto) | Moderazione retroattiva | Solo umana |
|----------|------------------------------|------------------------|------------|
| Sicurezza | ✅ Proattiva | ❌ Reattiva | ⚠️ Lenta |
| UX | ⚠️ Delay pubblicazione | ✅ Immediata | ❌ Molto lenta |
| Costo | ⚠️ AI + storage doppio | ✅ Basso | ❌ Alto (personale) |
| Scalabilità | ✅ Automatica | ⚠️ Richiede moderatori | ❌ Non scalabile |

**Impatto**: UX leggermente degradata (delay) ma sicurezza massimale e moderazione scalabile.

---

### ADR-007: No Microservices nel MVP

**Contesto**: Decomposizione del sistema.

**Decisione**: Monolite modulare con Bounded Contexts logici, nessun microservice nel MVP.

**Alternativa Considerata**: Microservices fin da subito, modular monolith.

**Trade-off**:

| Criterio | Monolite modulare (scelto) | Microservices |
|----------|---------------------------|---------------|
| Deployment | ✅ Semplice | ❌ Complesso |
| Debugging | ✅ Semplice | ❌ Distribuito |
| Onboarding | ✅ Veloce | ⚠️ Più lento |
| Scaling indipendente | ❌ No | ✅ Sì |
| Resilienza | ⚠️ Single point of failure | ✅ Isolamento |

**Impatto**: Velocità di sviluppo prioritaria; i Bounded Contexts sono pronti per essere estratti in futuro.

---

## Appendice: Stack Tecnologico

| Livello | Tecnologia | Versione | Scopo |
|---------|-----------|----------|-------|
| Frontend Framework | Next.js | ^14.0 | App Router, React, SSR |
| Language | TypeScript | ^5.3 | Type safety |
| Styling | Tailwind CSS | ^3.4 | Utility-first CSS |
| UI Components | shadcn/ui | latest | Componenti accessibili |
| State Management | Zustand | ^4.4 | Stato client locale |
| Forms | React Hook Form + zod | ^7.48 | Gestione form e validazione |
| Backend | Supabase | latest | DB, Auth, Storage, Realtime |
| AI Moderation | OpenAI/Anthropic API | latest | Moderazione contenuti |
| Email | Resend | latest | Invio email transazionali |
| Monitoring | Sentry | latest | Error tracking |
| Analytics | Vercel Analytics | latest | Web analytics |
| Testing | Vitest + Playwright | latest | Unit + E2E tests |
| CI/CD | GitHub Actions | N/A | Pipeline CI/CD |
| Hosting | Vercel | latest | Deployment edge |

---

*Documento versionato. Per modifiche, aprire una PR nel repository docs/.*
