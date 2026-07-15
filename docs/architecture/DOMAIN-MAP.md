# Domain Map — Ricordati di Te

> **Versione**: 1.0  
> **Data**: 2025-06-01  
> **Metodologia**: Domain-Driven Design (DDD) — Bounded Contexts  

---

## Indice

1. [Mappa dei Bounded Contexts](#1-mappa-dei-bounded-contexts)
2. [Context: Identity](#2-context-identity)
3. [Context: Memorials](#3-context-memorials)
4. [Context: Governance](#4-context-governance)
5. [Context: Content](#5-context-content)
6. [Context: Media](#6-context-media)
7. [Context: Community](#7-context-community)
8. [Context: Moderation](#8-context-moderation)
9. [Context: Notifications](#9-context-notifications)
10. [Context: Search](#10-context-search)
11. [Context: AI](#11-context-ai)
12. [Context: Audit](#12-context-audit)
13. [Diagramma delle Dipendenze](#13-diagramma-delle-dipendenze)
14. [Flusso Eventi Cross-Domain](#14-flusso-eventi-cross-domain)

---

## 1. Mappa dei Bounded Contexts

### 1.1 Overview Visuale

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CORE DOMAIN                                      │   │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │   │
│  │  │Memorials │◄──►│Governance│◄──►│ Content  │◄──►│  Media   │         │   │
│  │  │  (Core)  │    │ (Roles)  │    │ (Posts)  │    │ (Upload) │         │   │
│  │  └──────────┘    └──────────┘    └──────────┘    └──────────┘         │   │
│  │       ▲                                              ▲                  │   │
│  └───────┼──────────────────────────────────────────────┼──────────────────┘   │
│          │                                              │                       │
│  ┌───────┼──────────────────────────────────────────────┼──────────────────┐   │
│  │       │           SUPPORTING DOMAIN                  │                  │   │
│  │  ┌────┴────┐    ┌──────────┐    ┌──────────┐   ┌────┴────┐   ┌────────┐ │   │
│  │  │Identity │    │Community │    │Moderation│   │  Search │   │   AI   │ │   │
│  │  │ (Auth)  │    │(Messages)│    │(Reports) │   │ (Index) │   │(Mod.)  │ │   │
│  │  └─────────┘    └──────────┘    └──────────┘   └─────────┘   └────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        GENERIC DOMAIN                                     │   │
│  │  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐      │   │
│  │  │  Audit       │    │  Notifications   │    │  Shared Kernel   │      │   │
│  │  │  (Logs)      │    │  (Email/Push)    │    │  (VO, Events)    │      │   │
│  │  └──────────────┘    └──────────────────┘    └──────────────────┘      │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Classificazione dei Contexts

| Tipo | Contexts | Descrizione |
|------|----------|-------------|
| **Core Domain** | Memorials, Governance, Content, Media | Competitivi, complessi, evolvono nel tempo |
| **Supporting** | Identity, Community, Moderation, Search, AI | Necessari ma non differenzianti |
| **Generic** | Notifications, Audit, Shared Kernel | Riutilizzabili, commodity |

---

## 2. Context: Identity

### 2.1 Responsabilità

Gestione identità digitale degli utenti: registrazione, autenticazione, profilo utente, sessioni. Questo context è il gateway per l'accesso alla piattaforma.

### 2.2 Entità Principali

```typescript
// Identity domain model

class User {
  id: UserId;
  email: Email;
  passwordHash: PasswordHash;        // gestito da Supabase Auth
  emailVerified: boolean;
  status: UserStatus;                // ACTIVE | SUSPENDED | DELETED
  createdAt: DateTime;
  updatedAt: DateTime;
}

class UserProfile {
  userId: UserId;
  firstName: string;
  lastName: string;
  displayName: string;               // Nome pubblico
  avatarUrl?: Url;
  bio?: string;
  timezone: string;                  // default: Europe/Rome
  language: Locale;                   // it | en
  preferences: UserPreferences;
  updatedAt: DateTime;
}

class UserPreferences {
  userId: UserId;
  emailNotifications: boolean;
  pushNotifications: boolean;
  digestWeekly: boolean;
  recurrenceReminders: boolean;       // notifiche ricorrenze
  invitationEmails: boolean;          // email di invito
  marketingEmails: boolean;           // default: false (GDPR)
}

enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',           // sospensione temporanea
  DELETED = 'DELETED',               // soft delete (GDPR)
}
```

### 2.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `Email` | indirizzo email | Regex RFC 5322, DNS verification |
| `PasswordHash` | hash bcrypt | Min 8 char, pattern complessità |
| `UserId` | UUID v4 | Formato UUID |
| `Locale` | it \| en | Enum |

### 2.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Governance | **User** ←→ **RoleAssignment** | 1:N | Un utente può avere ruoli in N memoriali |
| Memorials | **User** → **Memorial** | 1:N | Un utente (Custode) può creare N memoriali |
| Notifications | **User** → **Notification** | 1:N | Un utente riceve N notifiche |
| Audit | **User** → **AuditLog** | 1:N | Le azioni di un utente sono tracciate |

### 2.5 Eventi Pubblicati

| Evento | Payload | Destinatari |
|--------|---------|-------------|
| `UserRegistered` | `{ userId, email, timestamp }` | Notifications, Audit |
| `UserAuthenticated` | `{ userId, timestamp, method }` | Audit |
| `UserProfileUpdated` | `{ userId, changedFields }` | Notifications (se email cambiata), Audit |
| `UserDeleted` | `{ userId, reason, timestamp }` | Memorials, Governance, Notifications, Audit |
| `EmailVerified` | `{ userId, timestamp }` | Notifications |

### 2.6 Eventi Sottoscritti

| Evento | Sorgente | Azione |
|--------|----------|--------|
| `MemorialCreated` | Memorials | Aggiorna contatore memoriali utente |
| `RoleAssigned` | Governance | Invia notifica all'utente |
| `CustodianTransferCompleted` | Governance | Aggiorna status utente |

### 2.7 Invarianti del Dominio

- Email deve essere unica a livello di piattaforma
- Soft delete: i dati utente vengono anonimizzati dopo 30 giorni dall'eliminazione (GDPR)
- Un utente DEVE verificare l'email prima di creare un memoriale
- Password deve soddisfare i requisiti di complessità (min 8 char, 1 maiuscola, 1 numero, 1 speciale)

---

## 3. Context: Memorials

### 3.1 Responsabilità

Gestione del ciclo di vita dei memoriali: creazione, modifica, configurazione, eliminazione. Rappresenta il core domain della piattaforma.

### 3.2 Entità Principali

```typescript
// Memorials domain model

class Memorial {
  id: MemorialId;
  slug: Slug;                          // URL-friendly identifier
  firstName: string;
  lastName: string;
  birthDate?: Date;
  deathDate: Date;
  birthplace?: string;
  deathplace?: string;
  biography?: Biography;
  profilePhotoUrl?: Url;
  privacyLevel: PrivacyLevel;          // PUBLIC | PRIVATE | INVITE_ONLY
  custodianId: UserId;
  isActive: boolean;                   // soft delete
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Business methods
  changePrivacy(level: PrivacyLevel, by: UserId): void;
  updateProfile(data: ProfileUpdateData, by: UserId): void;
  deactivate(by: UserId): void;
  reactivate(by: UserId): void;        // solo in casi specifici
}

class MemorialTimeline {
  memorialId: MemorialId;
  events: TimelineEvent[];             // Ordinati cronologicamente
  
  addEvent(event: TimelineEvent): void;
  removeEvent(eventId: string): void;
  reorderEvents(): void;
}

class TimelineEvent {
  id: string;
  memorialId: MemorialId;
  title: string;
  description?: string;
  eventDate: Date;
  eventType: TimelineEventType;        // BIRTH | DEATH | MILESTONE | STORY
  mediaAssetIds: MediaAssetId[];
  createdBy: UserId;
  createdAt: DateTime;
}

class Milestone {
  id: string;
  memorialId: MemorialId;
  title: string;
  description: string;
  date: Date;
  category: MilestoneCategory;         // FAMILY | CAREER | EDUCATION | TRAVEL | OTHER
  mediaAssetIds: MediaAssetId[];
  createdBy: UserId;
  createdAt: DateTime;
}

enum PrivacyLevel {
  PUBLIC = 'PUBLIC',                   // Visibile a tutti
  PRIVATE = 'PRIVATE',                 // Solo membri invitati
  INVITE_ONLY = 'INVITE_ONLY',         // Richiesta accesso
}

enum TimelineEventType {
  BIRTH = 'BIRTH',
  DEATH = 'DEATH',
  MILESTONE = 'MILESTONE',
  STORY = 'STORY',
}

enum MilestoneCategory {
  FAMILY = 'FAMILY',
  CAREER = 'CAREER',
  EDUCATION = 'EDUCATION',
  TRAVEL = 'TRAVEL',
  OTHER = 'OTHER',
}
```

### 3.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `MemorialId` | UUID | Formato UUID v4 |
| `Slug` | string normalizzata | Max 100 char, solo a-z, 0-9, - |
| `Biography` | testo RTF/markdown | Max 5000 caratteri |
| `Url` | string URL | Validazione formato URL |

### 3.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Identity | **Memorial** → **User** (custodian) | N:1 | Ogni memoriale ha un Custode (User) |
| Governance | **Memorial** → **RoleAssignment** | 1:N | Un memoriale ha N assegnazioni ruolo |
| Content | **Memorial** → **Post** | 1:N | Un memoriale contiene N post |
| Media | **Memorial** → **MediaAsset** | 1:N | Un memoriale ha N media asset |
| Community | **Memorial** → **CondolenceMessage** | 1:N | Un memoriale ha N messaggi |
| Search | **Memorial** → **SearchIndex** | 1:1 | Ogni memoriale pubblico è indicizzato |
| Notifications | **Memorial** → **Recurrence** | 1:N | Un memoriale ha N ricorrenze |

### 3.5 Eventi Pubblicati

| Evento | Payload | Destinatari |
|--------|---------|-------------|
| `MemorialCreated` | `{ memorialId, slug, custodianId, privacyLevel, fullName }` | Identity, Governance, Search, Notifications, Audit |
| `MemorialUpdated` | `{ memorialId, changedFields, updatedBy }` | Search, Notifications, Audit |
| `PrivacyChanged` | `{ memorialId, oldLevel, newLevel, changedBy }` | Search, Notifications, Audit |
| `MemorialDeactivated` | `{ memorialId, deactivatedBy, reason }` | Search, Governance, Notifications, Audit |
| `ProfilePhotoUpdated` | `{ memorialId, newPhotoUrl }` | Content, Audit |
| `MilestoneAdded` | `{ memorialId, milestoneId, title, date }` | Notifications, Audit |

### 3.6 Eventi Sottoscritti

| Evento | Sorgente | Azione |
|--------|----------|--------|
| `UserDeleted` | Identity | Disattiva memoriali dell'utente |
| `RoleAssigned` | Governance | Aggiorna membri del memoriale |
| `ContentApproved` | Content | Aggiungi alla timeline |
| `CustodianTransferCompleted` | Governance | Aggiorna custodianId |

### 3.7 Invarianti del Dominio

- **Unicità slug**: Lo slug di un memoriale deve essere univoco a livello di piattaforma
- **Date coerenti**: deathDate non può essere precedente a birthDate (se entrambe presenti)
- **Un solo Custode attivo**: Un memoriale ha esattamente un Custode attivo in ogni momento
- **Soft delete**: La disattivazione non elimina i dati, li rende inaccessibili
- **Privacy immutabile per Co-Custode**: Solo il Custode può cambiare il livello di privacy
- **Max 2 Co-Custodi**: Un memoriale può avere al massimo 2 Co-Custodi simultaneamente

---

## 4. Context: Governance

### 4.1 Responsabilità

Gestione del modello di autorizzazione: ruoli, permessi, inviti, successione del Custode. È il context che garantisce il controllo familiare.

### 4.2 Entità Principali

```typescript
// Governance domain model

class RoleAssignment {
  id: string;
  memorialId: MemorialId;
  userId: UserId;
  role: Role;                          // CUSTODIAN | CO_CUSTODIAN | COLLABORATOR | VISITOR
  assignedBy: UserId;
  assignedAt: DateTime;
  expiresAt?: DateTime;               // per inviti temporanei (futuro)
  isActive: boolean;
  
  // Business methods
  changeRole(newRole: Role, by: UserId): void;
  revoke(by: UserId): void;
  canAssign(targetRole: Role): boolean;
  canPublishDirectly(): boolean;
}

class Invitation {
  id: string;
  memorialId: MemorialId;
  email: Email;
  invitedRole: Role;                   // CO_CUSTODIAN | COLLABORATOR | VISITOR
  invitedBy: UserId;
  status: InvitationStatus;            // PENDING | ACCEPTED | EXPIRED | REVOKED
  token: string;                       // JWT token per accettazione
  expiresAt: DateTime;                 // Default: 14 giorni
  createdAt: DateTime;
  acceptedAt?: DateTime;
  acceptedBy?: UserId;
  
  // Business methods
  accept(by: UserId): RoleAssignment;
  revoke(by: UserId): void;
  expire(): void;
  isExpired(): boolean;
}

class CustodianTransfer {
  id: string;
  memorialId: MemorialId;
  fromCustodianId: UserId;
  toCoCustodianId: UserId;
  status: TransferStatus;              // INITIATED | PENDING_CONFIRMATION | COMPLETED | CANCELLED
  initiatedAt: DateTime;
  custodianNotifiedAt: DateTime;
  custodianRespondedAt?: DateTime;
  custodianResponse?: boolean;         // true = conferma, false = rifiuta
  completedAt?: DateTime;
  autoPromoteAt: DateTime;            // initiatedAt + 14 giorni
  
  // Business methods
  initiate(by: UserId): void;
  custodianResponse(response: boolean): void;
  complete(): void;
  cancel(by: UserId): void;
  isAutoPromoteDue(): boolean;
}

enum Role {
  CUSTODIAN = 'CUSTODIAN',             // Controllo totale
  CO_CUSTODIAN = 'CO_CUSTODIAN',       # Erede, quasi tutti i permessi
  COLLABORATOR = 'COLLABORATOR',       // Proponi contenuti, approvazione richiesta
  VISITOR = 'VISITOR',                 // Visualizza e messaggi di vicinanza
}

enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

enum TransferStatus {
  INITIATED = 'INITIATED',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
```

### 4.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `Role` | Enum | Uno dei 4 valori definiti |
| `InvitationToken` | JWT string | Expires in 14 giorni, signed |

### 4.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Memorials | **RoleAssignment** → **Memorial** | N:1 | N assegnazioni per 1 memoriale |
| Identity | **RoleAssignment** → **User** | N:1 | N assegnazioni per 1 utente |
| Content | **Role** → **ContentApproval** | 1:N | Il ruolo determina se l'approvazione è richiesta |
| Notifications | **Invitation** → **Notification** | 1:1 | Ogni invito genera una notifica |

### 4.5 Eventi Pubblicati

| Evento | Payload | Destinatari |
|--------|---------|-------------|
| `RoleAssigned` | `{ memorialId, userId, role, assignedBy }` | Notifications, Memorials, Audit |
| `RoleRevoked` | `{ memorialId, userId, revokedBy }` | Notifications, Content, Audit |
| `InvitationCreated` | `{ invitationId, memorialId, email, role }` | Notifications, Audit |
| `InvitationAccepted` | `{ invitationId, memorialId, userId, role }` | Notifications, Memorials, Audit |
| `InvitationRevoked` | `{ invitationId, memorialId, revokedBy }` | Notifications, Audit |
| `CustodianTransferInitiated` | `{ transferId, memorialId, fromId, toId }` | Notifications, Audit |
| `CustodianTransferCompleted` | `{ transferId, memorialId, newCustodianId }` | Memorials, Notifications, Audit |
| `CustodianTransferCancelled` | `{ transferId, memorialId, cancelledBy }` | Notifications, Audit |

### 4.6 Eventi Sottoscritti

| Evento | Sorgente | Azione |
|--------|----------|--------|
| `MemorialCreated` | Memorials | Crea RoleAssignment CUSTODIAN per il creatore |
| `MemorialDeactivated` | Memorials | Revoca tutti i ruoli attivi |
| `UserDeleted` | Identity | Revoca tutti i ruoli dell'utente |

### 4.7 Invarianti del Dominio

- **Un solo Custode**: Esattamente un RoleAssignment con role=CUSTODIAN per memorialId
- **Max 2 Co-Custodi**: Al massimo 2 RoleAssignment con role=CO_CUSTODIAN attivi per memorialId
- **Co-Custode è erede**: Il Co-Custode DEVE essere un utente già registrato; non può essere un invito aperto
- **No self-invite**: Un utente non può invitare se stesso a un memoriale dove ha già un ruolo
- **Transfer timeout**: Se il Custode non risponde entro 14 giorni, il trasferimento si completa automaticamente
- **Custode può sempre rifiutare**: Il Custode originale può bloccare il trasferimento rispondendo entro il timeout
- **Chain of custody**: Ogni trasferimento è tracciato in una catena immutabile (Audit)

### 4.8 Matrice Permessi

| Azione | Custode | Co-Custode | Collaboratore | Visitatore |
|---|---|---|---|---|
| Modifica dati anagrafici | ✅ | ✅ | ❌ | ❌ |
| Cambio privacy | ✅ | ❌ | ❌ | ❌ |
| Invita Collaboratori | ✅ | ✅ | ❌ | ❌ |
| Invita Co-Custode | ✅ | ❌ | ❌ | ❌ |
| Approva/rifiuta contenuti | ✅ | ✅ | ❌ | ❌ |
| Pubblica diretto | ✅ | ✅ | ❌ | ❌ |
| Messaggio vicinanza | ✅ | ✅ | ✅ | ✅ |
| Designa erede | ✅ | ❌ | ❌ | ❌ |
| Elimina memoriale | ✅ | ❌ | ❌ | ❌ |
| Revoca accessi | ✅ | ✅ | ❌ | ❌ |
| Gestisci ricorrenze | ✅ | ✅ | ❌ | ❌ |

---

## 5. Context: Content

### 5.1 Responsabilità

Gestione di tutti i contenuti testuali e multimediali pubblicati sui memoriali: post, storie, biografia, messaggi. Include il workflow di approvazione.

### 5.2 Entità Principali

```typescript
// Content domain model

class Post {
  id: string;
  memorialId: MemorialId;
  authorId: UserId;
  title?: string;
  body: string;                       // Markdown supportato
  status: ContentStatus;              // DRAFT | PENDING_APPROVAL | APPROVED | REJECTED
  visibility: Visibility;             // PUBLIC | MEMBERS_ONLY
  mediaAssetIds: MediaAssetId[];
  tags: string[];
  createdAt: DateTime;
  updatedAt: DateTime;
  publishedAt?: DateTime;
  approvedBy?: UserId;
  approvedAt?: DateTime;
  rejectionReason?: string;
  
  // Business methods
  submitForApproval(): void;
  approve(by: UserId): void;
  reject(by: UserId, reason: string): void;
  publishDirectly(): void;            // Solo Custode/Co-Custode
  update(body: string, by: UserId): void;
}

class Story {
  id: string;
  memorialId: MemorialId;
  authorId: UserId;
  title: string;
  content: string;                     // Markdown, max 10000 char
  excerpt: string;                     // Auto-generato o manuale, max 200 char
  mediaAssetIds: MediaAssetId[];
  status: ContentStatus;
  createdAt: DateTime;
  updatedAt: DateTime;
  publishedAt?: DateTime;
  approvedBy?: UserId;
  approvedAt?: DateTime;
  
  // Business methods
  submitForApproval(): void;
  approve(by: UserId): void;
  reject(by: UserId, reason: string): void;
}

class Biography {
  memorialId: MemorialId;             // 1:1 con Memorial
  content: string;                     // Markdown, max 5000 char
  sections: BiographySection[];        // Sezioni tematiche
  lastEditedBy: UserId;
  lastEditedAt: DateTime;
  version: number;                     // Versionamento semplice
  
  update(content: string, by: UserId): void;
}

class ContentApproval {
  id: string;
  contentId: string;
  contentType: 'POST' | 'STORY' | 'MEDIA';
  memorialId: MemorialId;
  submitterId: UserId;
  status: ApprovalStatus;              // PENDING | APPROVED | REJECTED
  submittedAt: DateTime;
  reviewedBy?: UserId;
  reviewedAt?: DateTime;
  rejectionReason?: string;
  
  approve(by: UserId): void;
  reject(by: UserId, reason: string): void;
}

enum ContentStatus {
  DRAFT = 'DRAFT',                     // Solo autore può vedere
  PENDING_APPROVAL = 'PENDING_APPROVAL', // In attesa di approvazione
  APPROVED = 'APPROVED',               // Pubblicato
  REJECTED = 'REJECTED',               // Rifiutato (eliminato in 30gg)
}

enum Visibility {
  PUBLIC = 'PUBLIC',                   // Visibile a tutti
  MEMBERS_ONLY = 'MEMBERS_ONLY',       // Solo membri del memoriale
}

enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
```

### 5.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `MediaAssetId` | UUID | Riferimento al context Media |
| `ContentBody` | string markdown | Max 10000 char, sanitizzato XSS |
| `Excerpt` | string | Max 200 char |

### 5.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Memorials | **Post** → **Memorial** | N:1 | N post per 1 memoriale |
| Media | **Post** → **MediaAsset** | N:N | Un post può avere N media |
| Governance | **Post** → **Role** (via approval) | dipendenza | Il ruolo determina il flusso di approvazione |
| Community | **Post** (STORY) → **CondolenceMessage** | correlazione | Storie possono ricevere messaggi |
| Search | **Post** → **SearchIndex** | 1:1 | Post approvati sono indicizzati |

### 5.5 Eventi Pubblicati

| Evento | Payload | Destinatari |
|--------|---------|-------------|
| `PostCreated` | `{ postId, memorialId, authorId, status }` | Notifications, Media, Audit |
| `PostSubmittedForApproval` | `{ postId, memorialId, submitterId }` | Notifications, Audit |
| `ContentApproved` | `{ contentId, contentType, memorialId, approvedBy }` | Notifications, Memorials, Search, Audit |
| `ContentRejected` | `{ contentId, contentType, memorialId, rejectedBy, reason }` | Notifications, Audit |
| `BiographyUpdated` | `{ memorialId, updatedBy }` | Notifications, Audit |
| `StoryPublished` | `{ storyId, memorialId, authorId }` | Notifications, Search, Audit |

### 5.6 Eventi Sottoscritti

| Evento | Sorgente | Azione |
|--------|----------|--------|
| `MemorialCreated` | Memorials | Inizializza Biography vuota |
| `MediaQuarantineCompleted` | Media | Se media è approvato, aggiorna il post |
| `RoleRevoked` | Governance | Se autore perde ruolo, i suoi contenuti in draft vengono segnalati |

### 5.7 Invarianti del Dominio

- **Approvazione obbligatoria**: Contenuti creati da Collaboratori e Visitatori DEVONO passare per l'approvazione
- **Solo contenuti APPROVED sono visibili** nel memoriale pubblico
- **Max 5000 char per post**, max 10000 per storie
- **Markdown sanitizzato**: Solo tag HTML safe permessi (strong, em, a, p, br, ul, ol, li, h1-h3)
- **30 giorni retention**: Contenuti REJECTED sono eliminati automaticamente dopo 30 giorni
- **Biography unica**: Esattamente una Biography per Memorial

---

## 6. Context: Media

### 6.1 Responsabilità

Gestione del ciclo di vita dei file multimediali: upload, quarantena, moderazione AI, ottimizzazione, storage, delivery. Questo context è critical per la sicurezza.

### 6.2 Entità Principali

```typescript
// Media domain model

class MediaAsset {
  id: MediaAssetId;
  memorialId: MemorialId;
  uploaderId: UserId;
  originalFilename: string;
  mimeType: MimeType;                  // image/jpeg, video/mp4, audio/mpeg
  fileSize: number;                    // bytes
  status: MediaStatus;                 // UPLOADED | IN_QUARANTINE | APPROVED | REJECTED
  storagePath: string;                 // Path in Supabase Storage (quarantine bucket)
  publicPath?: string;                 // Path in Supabase Storage (public bucket)
  quarantineJobId?: string;
  variants: MediaVariant[];            // Thumbnails, ottimizzazioni
  metadata: MediaMetadata;
  associatedContentId?: string;        // Post o Story a cui è associato
  createdAt: DateTime;
  
  // Business methods
  submitToQuarantine(): void;
  approve(): void;
  reject(reason: string): void;
  generateVariants(): Promise<MediaVariant[]>;
  associateWithContent(contentId: string): void;
}

class MediaVariant {
  id: string;
  mediaAssetId: MediaAssetId;
  variantType: VariantType;            // THUMBNAIL | MOBILE | DESKTOP | ORIGINAL
  width: number;
  height: number;
  fileSize: number;
  storagePath: string;
  mimeType: MimeType;
  createdAt: DateTime;
}

class QuarantineJob {
  id: string;
  mediaAssetId: MediaAssetId;
  status: QuarantineStatus;            // QUEUED | SCANNING | AI_ANALYZING | COMPLETED | FAILED
  antivirusResult?: AntivirusResult;
  aiResult?: AIModerationResult;
  startedAt: DateTime;
  completedAt?: DateTime;
  finalStatus?: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW';
  reviewedBy?: UserId;
  reviewedAt?: DateTime;
  
  processAntivirus(result: AntivirusResult): void;
  processAI(result: AIModerationResult): void;
  humanReview(approved: boolean, by: UserId): void;
}

class MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;                   // per video/audio (secondi)
  camera?: string;
  location?: GeoLocation;              // GPS coords se disponibili
  takenAt?: DateTime;
}

enum MediaStatus {
  UPLOADED = 'UPLOADED',               // Upload completato, in attesa di quarantena
  IN_QUARANTINE = 'IN_QUARANTINE',     // In fase di scan/moderazione
  APPROVED = 'APPROVED',               // Pubblicato
  REJECTED = 'REJECTED',               // Rifiutato
  PENDING_REVIEW = 'PENDING_REVIEW',   // Richiede review umana
}

enum VariantType {
  THUMBNAIL = 'THUMBNAIL',             // 200x200
  MOBILE = 'MOBILE',                   // 800px larghezza
  DESKTOP = 'DESKTOP',                 // 1600px larghezza
  ORIGINAL = 'ORIGINAL',               // File originale
}

enum QuarantineStatus {
  QUEUED = 'QUEUED',
  SCANNING = 'SCANNING',
  AI_ANALYZING = 'AI_ANALYZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
```

### 6.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `MediaAssetId` | UUID | Formato UUID v4 |
| `MimeType` | string | Solo tipi permessi: image/*, video/mp4\|mov, audio/mp3\|m4a |
| `FileSize` | number | Max 100MB per file |
| `GeoLocation` | lat: number, lng: number | Range valido lat/lng |

### 6.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Memorials | **MediaAsset** → **Memorial** | N:1 | N media per 1 memoriale |
| Content | **MediaAsset** → **Post** / **Story** | N:1 (opzionale) | Media associati a contenuti |
| AI | **QuarantineJob** → **AIModerator** | dipendenza | AI analizza il media in quarantena |
| Community | **MediaAsset** → **CondolenceMessage** | 0:1 | Messaggio può avere max 1 media |

### 6.5 Eventi Pubblicati

| Evento | Payload | Destinatari |
|--------|---------|-------------|
| `MediaUploaded` | `{ mediaAssetId, memorialId, uploaderId, mimeType }` | Notifications, Quarantine Pipeline, Audit |
| `MediaQuarantineStarted` | `{ mediaAssetId, jobId }` | Audit |
| `MediaQuarantineCompleted` | `{ mediaAssetId, finalStatus, confidence }` | Content, Notifications, Audit |
| `MediaApproved` | `{ mediaAssetId, publicPath }` | Content, Notifications, Audit |
| `MediaRejected` | `{ mediaAssetId, reasons }` | Notifications, Audit |
| `MediaVariantsGenerated` | `{ mediaAssetId, variants }` | Audit |

### 6.6 Eventi Sottoscritti

| Evento | Sorgente | Azione |
|--------|----------|--------|
| `PostCreated` | Content | Se il post ha media, avvia quarantena |
| `ContentApproved` | Content | Se media associato in PENDING_REVIEW, completa pubblicazione |
| `MemorialDeactivated` | Memorials | Sospendi tutti i media del memoriale |

### 6.7 Invarianti del Dominio

- **Max 100MB per file**: Upload rifiutato se superiore
- **Solo tipi MIME permessi**: Immagini (JPG, PNG, WebP), Video (MP4, MOV), Audio (MP3, M4A)
- **Pipeline sequenziale**: Antivirus → AI Moderation → Human Review (se necessario)
- **Nessun media pubblico senza approvazione**: I file in quarantena non sono accessibili pubblicamente
- **Variants automatiche**: Per ogni immagine approvata, generare THUMBNAIL, MOBILE, DESKTOP
- **Retention quarantena**: File in quarantena respinti eliminati dopo 30 giorni
- **Deepfake detection**: Video con volti umani passano per detection aggiuntiva

---

## 7. Context: Community

### 7.1 Responsabilità

Gestione dell'interazione sociale: messaggi di vicinanza, bacheca, espressioni di affetto. Rappresenta il "cuore sociale" della piattaforma.

### 7.2 Entità Principali

```typescript
// Community domain model

class CondolenceMessage {
  id: string;
  memorialId: MemorialId;
  authorId: UserId;
  authorName: string;                  // Nome visualizzato (snapshot)
  authorEmail: string;                 // Snapshot per notifiche
  content: string;                     // Max 500 caratteri
  mediaAssetId?: MediaAssetId;         // Max 1 foto opzionale
  status: MessageStatus;               // PENDING | APPROVED | REJECTED | FLAGGED
  likes: number;
  createdAt: DateTime;
  approvedBy?: UserId;
  approvedAt?: DateTime;
  
  // Business methods
  submit(): void;
  approve(by: UserId): void;
  reject(by: UserId, reason: string): void;
  flag(reason: string): void;
  incrementLikes(): void;
}

class MessageBoard {
  memorialId: MemorialId;             // 1:1 con Memorial
  messages: CondolenceMessage[];
  totalMessages: number;
  isEnabled: boolean;                  // Configurabile dal Custode
  requiresApproval: boolean;           // Dipende dalla privacy del memoriale
  
  addMessage(message: CondolenceMessage): void;
  removeMessage(messageId: string): void;
  toggleEnabled(): void;
  getApprovedMessages(): CondolenceMessage[];
}

class CandleLit {
  id: string;
  memorialId: MemorialId;
  userId: UserId;
  litAt: DateTime;
  message?: string;                    // Opzionale messaggio breve
}

enum MessageStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',                 // Segnalato per moderazione
}
```

### 7.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `MessageContent` | string | Max 500 caratteri, sanitizzato |
| `AuthorSnapshot` | name, email | Snapshot al momento della creazione |

### 7.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Memorials | **MessageBoard** → **Memorial** | 1:1 | Ogni memoriale ha una bacheca |
| Media | **CondolenceMessage** → **MediaAsset** | 0:1 | Max 1 media per messaggio |
| Moderation | **CondolenceMessage** → **Report** | 1:N | Un messaggio può ricevere N segnalazioni |
| Identity | **CondolenceMessage** → **User** | N:1 | N messaggi per 1 utente |

### 7.5 Eventi Pubblicati

| Evento | Payload | Destinatari |
|--------|---------|-------------|
| `MessageSubmitted` | `{ messageId, memorialId, authorId }` | Notifications, Moderation, Audit |
| `MessageApproved` | `{ messageId, memorialId, approvedBy }` | Notifications, Audit |
| `MessageRejected` | `{ messageId, memorialId, rejectedBy, reason }` | Notifications, Audit |
| `MessageFlagged` | `{ messageId, memorialId, reportId }` | Moderation, Notifications, Audit |
| `CandleLit` | `{ candleId, memorialId, userId }` | Notifications, Audit |

### 7.6 Eventi Sottoscritti

| Evento | Sorgente | Azione |
|--------|----------|--------|
| `MemorialCreated` | Memorials | Crea MessageBoard vuota |
| `PrivacyChanged` | Memorials | Aggiorna requiresApproval |
| `MemorialDeactivated` | Memorials | Disabilita MessageBoard |

### 7.7 Invarianti del Dominio

- **Max 500 caratteri** per messaggio di vicinanza
- **Max 1 media** per messaggio (foto singola)
- **Snapshot autore**: Il nome e email dell'autore sono salvati al momento della creazione (non cambiano se l'utente modifica il profilo)
- **Bacheca disabilitabile**: Il Custode può disabilitare la bacheca
- **Messaggi FLAGGED nascosti**: I messaggi segnalati sono nascosti fino a risoluzione
- **Rate limiting**: Max 10 messaggi/ora per utente per memoriale

---

## 8. Context: Moderation

### 8.1 Responsabilità

Gestione delle segnalazioni e delle azioni di moderazione: contenuti inappropriati, spam, abusi. Garantisce la qualità e la dignità dello spazio.

### 8.2 Entità Principali

```typescript
// Moderation domain model

class Report {
  id: string;
  targetType: ReportTargetType;        // POST | STORY | MESSAGE | MEDIA | USER
  targetId: string;
  memorialId: MemorialId;
  reporterId: UserId;                  // Può essere anonimo internamente
  reason: ReportReason;
  description?: string;
  status: ReportStatus;                // OPEN | UNDER_REVIEW | RESOLVED | DISMISSED
  priority: ReportPriority;            // LOW | MEDIUM | HIGH | CRITICAL
  assignedTo?: UserId;                 // Moderatore assegnato
  resolution?: ReportResolution;
  createdAt: DateTime;
  updatedAt: DateTime;
  resolvedAt?: DateTime;
  
  // Business methods
  assignTo(moderatorId: UserId): void;
  resolve(resolution: ReportResolution): void;
  dismiss(by: UserId, reason: string): void;
  escalate(): void;
}

class ReportResolution {
  action: ModerationAction;
  actionTargetId: string;
  notes?: string;
  resolvedBy: UserId;
}

class ModerationAction {
  id: string;
  actionType: ModerationActionType;
  targetType: ReportTargetType;
  targetId: string;
  memorialId: MemorialId;
  performedBy: UserId;
  reason: string;
  previousState?: string;
  newState: string;
  createdAt: DateTime;
  revertedAt?: DateTime;
  revertedBy?: UserId;
}

class Ban {
  id: string;
  userId: UserId;
  memorialId: MemorialId;             // Se null = ban globale
  reason: string;
  bannedBy: UserId;
  bannedAt: DateTime;
  expiresAt?: DateTime;               // Null = permanente
  isActive: boolean;
  
  revoke(by: UserId): void;
  isExpired(): boolean;
}

enum ReportTargetType {
  POST = 'POST',
  STORY = 'STORY',
  MESSAGE = 'MESSAGE',
  MEDIA = 'MEDIA',
  USER = 'USER',
}

enum ReportReason {
  OFFENSIVE = 'OFFENSIVE',
  SPAM = 'SPAM',
  IRRELEVANT = 'IRRELEVANT',
  VIOLENCE = 'VIOLENCE',
  HATE_SPEECH = 'HATE_SPEECH',
  PRIVACY_VIOLATION = 'PRIVACY_VIOLATION',
  OTHER = 'OTHER',
}

enum ReportStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

enum ReportPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',               // Violenza, minacce
}

enum ModerationActionType {
  CONTENT_REMOVED = 'CONTENT_REMOVED',
  CONTENT_APPROVED = 'CONTENT_APPROVED',
  USER_WARNED = 'USER_WARNED',
  USER_BANNED = 'USER_BANNED',
  MEMORIAL_REVIEW = 'MEMORIAL_REVIEW',
}
```

### 8.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `ReportId` | UUID | Formato UUID |
| `ModerationNotes` | string | Max 1000 caratteri |

### 8.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Content | **Report** → **Post** / **Story** | N:1 | N segnalazioni per 1 contenuto |
| Community | **Report** → **CondolenceMessage** | N:1 | N segnalazioni per 1 messaggio |
| Media | **Report** → **MediaAsset** | N:1 | N segnalazioni per 1 media |
| Identity | **Ban** → **User** | N:1 | N ban per 1 utente |
| Audit | **ModerationAction** → **AuditLog** | 1:1 | Ogni azione è tracciata |

### 8.5 Eventi Pubblicati

| Evento | Payload | Destinatari |
|--------|---------|-------------|
| `ReportCreated` | `{ reportId, targetType, targetId, memorialId, priority }` | Notifications, Audit |
| `ReportAssigned` | `{ reportId, moderatorId }` | Notifications |
| `ReportResolved` | `{ reportId, action, resolvedBy }` | Content, Community, Identity (se ban), Audit |
| `UserBanned` | `{ banId, userId, memorialId, bannedBy }` | Identity, Notifications, Audit |
| `UserUnbanned` | `{ banId, userId, unbannedBy }` | Identity, Notifications, Audit |
| `ContentAutoFlagged` | `{ targetId, targetType, memorialId, aiReasons }` | Notifications, Audit |

### 8.6 Eventi Sottoscritti

| Evento | Sorgente | Azione |
|--------|----------|--------|
| `MessageFlagged` | Community | Crea Report con targetType=MESSAGE |
| `MediaQuarantineCompleted` | Media | Se REJECTED, crea Report automatico |
| `ContentSubmitted` | Content | Se AI rileva problema, crea Report |
| `UserDeleted` | Identity | Risolvi tutti i report aperti relativi all'utente |

### 8.7 Invarianti del Dominio

- **Auto-escalation**: 3 segnalazioni sullo stesso contenuto entro 24h = escalation automatica
- **Anonimato segnalatore**: L'identità del segnalatore non è rivelata al target
- **Solo Custode/Co-Custode/Moderatore** possono risolvere segnalazioni
- **Ban reversibile**: I ban possono essere revocati da un moderatore
- **Solo contenuti, non persone**: La moderazione agisce sui contenuti, non sugli utenti (tranne ban egregi)
- **Tutte le azioni sono tracciate**: Nessuna azione di moderazione è cancellabile
- **CRITICAL priority**: Segnalazioni per violenza o minacce hanno SLA di risposta di 1 ora

---

## 9. Context: Notifications

### 9.1 Responsabilità

Gestione di tutte le comunicazioni verso gli utenti: notifiche in-app, email, ricorrenze, digest. Centralizza la logica di delivery.

### 9.2 Entità Principali

```typescript
// Notifications domain model

class Notification {
  id: string;
  userId: UserId;
  type: NotificationType;
  channel: NotificationChannel;        // IN_APP | EMAIL | PUSH
  status: NotificationStatus;          // PENDING | SENT | DELIVERED | READ | FAILED
  title: string;
  body: string;
  actionUrl?: string;
  metadata: NotificationMetadata;
  memorialId?: MemorialId;
  createdAt: DateTime;
  sentAt?: DateTime;
  readAt?: DateTime;
  
  markAsRead(): void;
  markAsSent(): void;
  markAsFailed(error: string): void;
}

class NotificationPreference {
  userId: UserId;
  memorialId?: MemorialId;            // Se null = globali
  channels: ChannelPreferences;
  types: TypePreferences;
  quietHoursStart?: Time;             // Non disturbare (opzionale)
  quietHoursEnd?: Time;
  digestEnabled: boolean;
  digestDay: DayOfWeek;                // Default: LUNEDI
  language: Locale;
  updatedAt: DateTime;
  
  shouldSend(type: NotificationType, channel: NotificationChannel): boolean;
  isInQuietHours(): boolean;
}

class ChannelPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

class TypePreferences {
  contentApproval: boolean;            // Richiesta approvazione contenuto
  contentApproved: boolean;            // Il tuo contenuto è stato approvato
  contentRejected: boolean;
  invitationReceived: boolean;
  roleChanged: boolean;
  messageReceived: boolean;
  reportUpdate: boolean;
  recurrenceReminder: boolean;
  systemUpdates: boolean;
}

class Recurrence {
  id: string;
  memorialId: MemorialId;
  recurrenceType: RecurrenceType;      // BIRTHDAY | DEATH_ANNIVERSARY | CUSTOM
  title: string;
  month: number;                       // 1-12
  day: number;                         // 1-31
  year?: number;                      // Per date specifiche
  notifyDaysBefore: number[];          // [7, 1] = notifica a 7 e 1 giorno prima
  messageTemplate?: string;           // Messaggio personalizzato per l'occasione
  isActive: boolean;
  lastNotifiedAt?: DateTime;
  createdBy: UserId;
  
  // Business methods
  calculateNextOccurrence(): Date;
  shouldNotifyToday(): boolean;
  deactivate(): void;
}

class Digest {
  id: string;
  userId: UserId;
  period: DigestPeriod;                // WEEKLY
  memorials: MemorialId[];             // Memoriali inclusi nel digest
  lastSentAt?: DateTime;
  nextSendAt: DateTime;
  
  generate(): DigestContent;
  markAsSent(): void;
}

enum NotificationType {
  CONTENT_APPROVAL_REQUESTED = 'CONTENT_APPROVAL_REQUESTED',
  CONTENT_APPROVED = 'CONTENT_APPROVED',
  CONTENT_REJECTED = 'CONTENT_REJECTED',
  INVITATION_RECEIVED = 'INVITATION_RECEIVED',
  INVITATION_ACCEPTED = 'INVITATION_ACCEPTED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  MESSAGE_APPROVED = 'MESSAGE_APPROVED',
  REPORT_CREATED = 'REPORT_CREATED',
  REPORT_RESOLVED = 'REPORT_RESOLVED',
  RECURRENCE_REMINDER = 'RECURRENCE_REMINDER',
  CUSTODIAN_TRANSFER = 'CUSTODIAN_TRANSFER',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

enum RecurrenceType {
  BIRTHDAY = 'BIRTHDAY',
  DEATH_ANNIVERSARY = 'DEATH_ANNIVERSARY',
  CUSTOM = 'CUSTOM',
}

enum DigestPeriod {
  WEEKLY = 'WEEKLY',
}
```

### 9.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `NotificationMetadata` | record<string, any> | Max 1KB JSON |
| `Time` | ore, minuti | 00:00 - 23:59 |
| `DayOfWeek` | 0-6 | Lun=0, Dom=6 |

### 9.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Identity | **Notification** → **User** | N:1 | N notifiche per 1 utente |
| Memorials | **Recurrence** → **Memorial** | N:1 | N ricorrenze per 1 memoriale |
| Tutti | **Notification** ← **Events** | cross | Riceve eventi da tutti i contexts |

### 9.5 Eventi Pubblicati

| Evento | Payload | Destinatari |
|--------|---------|-------------|
| `NotificationSent` | `{ notificationId, userId, channel, type }` | Audit |
| `NotificationDelivered` | `{ notificationId }` | Audit |
| `NotificationRead` | `{ notificationId, userId }` | Audit |
| `DigestSent` | `{ digestId, userId }` | Audit |
| `RecurrenceNotificationSent` | `{ recurrenceId, memorialId }` | Audit |

### 9.6 Eventi Sottoscritti (tutti)

| Evento | Sorgente | Azione |
|--------|----------|--------|
| `MemorialCreated` | Memorials | Notifica di benvenuto al Custode |
| `PrivacyChanged` | Memorials | Notifica ai membri del memoriale |
| `RoleAssigned` | Governance | Notifica all'utente che ha ricevuto il ruolo |
| `InvitationCreated` | Governance | Invia email di invito |
| `ContentSubmitted` | Content | Notifica approvazione richiesta al Custode |
| `ContentApproved` | Content | Notifica approvazione al submitter |
| `ContentRejected` | Content | Notifica rifiuto al submitter |
| `MessageSubmitted` | Community | Notifica nuovo messaggio in attesa |
| `MessageApproved` | Community | Notifica pubblicazione al mittente |
| `ReportCreated` | Moderation | Notifica ai moderatori |
| `ReportResolved` | Moderation | Notifica esito al reporter |
| `CustodianTransferInitiated` | Governance | Notifica al Custode e Co-Custode |
| `CustodianTransferCompleted` | Governance | Notifica a tutti i membri |
| `MediaQuarantineCompleted` | Media | Notifica esito all'uploader |

### 9.7 Invarianti del Dominio

- **Rispetto quiet hours**: Notifiche non inviate durante le ore di quiete (configurabili)
- **Preferenze rispettate**: Ogni notifica verifica le preferenze dell'utente prima dell'invio
- **Deduplication**: Se una notifica in-app è già stata inviata per lo stesso evento, non re-inviare
- **Email transazionali**: Alcune email (invito, reset password) bypassano le preferenze
- **Max 100 notifiche in-app**: Oltre, le più vecchie vengono archiviate
- **Ricorrenze automatiche**: Il sistema calcola automaticamente le prossime ricorrenze e invia notifiche

---

## 10. Context: Search

### 10.1 Responsabilità

Gestione dell'indicizzazione e della ricerca dei memoriali pubblici. Solo i memoriali con privacy=PUBLIC sono ricercabili.

### 10.2 Entità Principali

```typescript
// Search domain model

class SearchIndex {
  memorialId: MemorialId;
  slug: Slug;
  fullName: string;
  firstName: string;
  lastName: string;
  birthDate?: Date;
  deathDate: Date;
  birthplace?: string;
  deathplace?: string;
  excerpt: string;                     // Primi 200 char della biografia
  profilePhotoUrl?: string;
  contentCount: number;                // Numero di post approvati
  lastUpdatedAt: DateTime;
  
  update(memorial: Memorial): void;
  remove(): void;
}

class SearchQuery {
  q: string;                           // Query string
  filters?: SearchFilters;
  sort?: SearchSort;                   // RELEVANCE | DATE_DESC | DATE_ASC
  pagination: Pagination;
}

class SearchFilters {
  dateRange?: DateRange;               // birthDate o deathDate range
  location?: string;                   // birthplace o deathplace
}

class SearchResult {
  memorialId: MemorialId;
  slug: Slug;
  fullName: string;
  birthDate?: Date;
  deathDate: Date;
  profilePhotoUrl?: string;
  excerpt: string;
  relevanceScore: number;
}

enum SearchSort {
  RELEVANCE = 'RELEVANCE',
  DATE_DESC = 'DATE_DESC',
  DATE_ASC = 'DATE_ASC',
}
```

### 10.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `DateRange` | from: Date, to: Date | from <= to |
| `Pagination` | page: number, pageSize: number | page >= 1, pageSize <= 100 |

### 10.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Memorials | **SearchIndex** → **Memorial** | 1:1 | Indice sincronizzato con memoriale |
| Content | **SearchIndex** ← **Post** | N:1 | Il numero di post influenza il ranking |

### 10.5 Eventi Pubblicati

Questo context non pubblica eventi; è prevalentemente consumer.

### 10.6 Eventi Sottoscritti

| Evento | Sorgente | Azione |
|--------|----------|--------|
| `MemorialCreated` | Memorials | Aggiungi a SearchIndex (solo se PUBLIC) |
| `MemorialUpdated` | Memorials | Aggiorna SearchIndex |
| `PrivacyChanged` | Memorials | Se PUBLIC → aggiungi; se PRIVATE → rimuovi |
| `MemorialDeactivated` | Memorials | Rimuovi da SearchIndex |
| `ContentApproved` | Content | Aggiorna contentCount nell'indice |
| `BiographyUpdated` | Memorials | Aggiorna excerpt nell'indice |

### 10.7 Invarianti del Dominio

- **Solo memoriali PUBLIC**: Nessun memoriale con privacy diversa da PUBLIC è indicizzato
- **Indice sincronizzato**: Ogni modifica al memoriale pubblico si riflette nell'indice entro 5 minuti
- **Full-text search**: La ricerca supporta match parziali su nome, cognome, luoghi
- **Max 100 risultati per pagina**

---

## 11. Context: AI

### 11.1 Responsabilità

Servizi di intelligenza artificiale per la moderazione automatica dei contenuti: analisi immagini, video, testo. Questo context è un provider di servizi, non ha entità di business proprie.

### 11.2 Entità Principali

```typescript
// AI domain model

class AIJob {
  id: string;
  jobType: AIJobType;                  // TEXT_CLASSIFICATION | IMAGE_MODERATION | VIDEO_MODERATION
  targetId: string;                    // ID del contenuto da analizzare
  targetType: 'POST' | 'STORY' | 'MESSAGE' | 'MEDIA';
  status: AIJobStatus;                 // QUEUED | PROCESSING | COMPLETED | FAILED
  provider: AIProvider;                // OPENAI | ANTHROPIC | CUSTOM
  result?: AIResult;
  error?: string;
  createdAt: DateTime;
  completedAt?: DateTime;
  retryCount: number;
  maxRetries: number;                   // Default: 3
  
  retry(): void;
  complete(result: AIResult): void;
  fail(error: string): void;
}

class AIResult {
  isAppropriate: boolean;
  confidence: number;                   // 0.0 - 1.0
  requiresHumanReview: boolean;
  categories: AICategories;
  rawResponse: string;                  // JSON della risposta API
  processingTimeMs: number;
}

class AICategories {
  violence: number;
  nudity: number;
  hateSpeech: number;
  spam: number;
  deepfake: number;
  selfHarm: number;
  harassment: number;
}

enum AIJobType {
  TEXT_CLASSIFICATION = 'TEXT_CLASSIFICATION',
  IMAGE_MODERATION = 'IMAGE_MODERATION',
  VIDEO_MODERATION = 'VIDEO_MODERATION',
  DEEPFAKE_DETECTION = 'DEEPFAKE_DETECTION',
}

enum AIJobStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

enum AIProvider {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  CUSTOM = 'CUSTOM',
}
```

### 11.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `ConfidenceScore` | number | 0.0 - 1.0 |
| `ModerationThreshold` | number | 0.0 - 1.0, configurabile per categoria |

### 11.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Media | **AIJob** → **MediaAsset** | N:1 | N job per 1 media (ri-analisi) |
| Content | **AIJob** → **Post** / **Story** | N:1 | Analisi testo dei contenuti |
| Moderation | **AIResult** → **Report** | 0:1 | Se inappropriato, genera report |

### 11.5 Eventi Pubblicati

| Evento | Payload | Destinatari |
|--------|---------|-------------|
| `AIJobCompleted` | `{ jobId, targetId, result }` | Media, Content, Moderation, Audit |
| `AIJobFailed` | `{ jobId, targetId, error, retryCount }` | Audit |
| `HumanReviewRequired` | `{ jobId, targetId, targetType, reasons }` | Moderation, Notifications |

### 11.6 Eventi Sottoscritti

| Evento | Sorgente | Azione |
|--------|----------|--------|
| `MediaUploaded` | Media | Crea AIJob per IMAGE_MODERATION o VIDEO_MODERATION |
| `PostSubmittedForApproval` | Content | Crea AIJob per TEXT_CLASSIFICATION |
| `MessageSubmitted` | Community | Crea AIJob per TEXT_CLASSIFICATION |

### 11.7 Invarianti del Dominio

- **Max 3 retry**: Fallito 3 volte → segnalazione umana obbligatoria
- **Timeout 30s**: Ogni job AI deve completarsi entro 30 secondi
- **Deepfake per video con volti**: Ogni video contenente volti umani passa per deepfake detection
- **Threshold configurabile**: Le soglie di confidenza sono configurabili per ambiente
- **Fallback human**: Se l'AI non è disponibile, il contenuto va in PENDING_REVIEW umano
- **No AI training su dati utente**: I contenuti degli utenti non sono usati per addestrare modelli

---

## 12. Context: Audit

### 12.1 Responsabilità

Tracciamento immutabile di tutte le azioni significative sulla piattaforma. L'audit log è append-only e non modificabile.

### 12.2 Entità Principali

```typescript
// Audit domain model

class AuditLog {
  id: string;
  action: AuditAction;
  actorId: UserId;                     // Chi ha eseguito l'azione
  actorRole?: Role;                    // Ruolo dell'attore nel momento
  targetType: AuditTargetType;         // Tipo di oggetto coinvolto
  targetId: string;                    // ID dell'oggetto
  memorialId?: MemorialId;             // Contesto del memoriale (se applicabile)
  metadata: AuditMetadata;             // Dettagli dell'azione
  ipAddress?: string;
  userAgent?: string;
  timestamp: DateTime;
  
  // Immutabile: nessun metodo di modifica
}

class AuditAction {
  category: ActionCategory;
  name: string;                        // Es: "MEMORIAL_CREATED", "ROLE_ASSIGNED"
}

class AuditMetadata {
  previousState?: Record<string, unknown>;
  newState: Record<string, unknown>;
  reason?: string;
  additionalInfo?: Record<string, unknown>;
}

enum AuditTargetType {
  MEMORIAL = 'MEMORIAL',
  USER = 'USER',
  POST = 'POST',
  STORY = 'STORY',
  MEDIA = 'MEDIA',
  MESSAGE = 'MESSAGE',
  ROLE = 'ROLE',
  INVITATION = 'INVITATION',
  REPORT = 'REPORT',
  NOTIFICATION = 'NOTIFICATION',
  SYSTEM = 'SYSTEM',
}

enum ActionCategory {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  AUTH = 'AUTH',
  MODERATE = 'MODERATE',
  ADMIN = 'ADMIN',
}
```

### 12.3 Value Objects

| Value Object | Attributi | Validazione |
|-------------|-----------|-------------|
| `IPAddress` | string | Formato IPv4 o IPv6 |
| `Timestamp` | ISO 8601 | UTC |

### 12.4 Relazioni con Altri Domini

| Context | Relazione | Tipo | Descrizione |
|---------|-----------|------|-------------|
| Tutti | **AuditLog** ← **Events** | cross | Riceve eventi da tutti i contexts |
| Identity | **AuditLog** → **User** | N:1 | N log entries per 1 utente (actor) |
| Memorials | **AuditLog** → **Memorial** | N:1 | N log entries per 1 memoriale |

### 12.5 Eventi Pubblicati

Questo context non pubblica eventi; è esclusivamente consumer e logger.

### 12.6 Eventi Sottoscritti (tutti)

| Evento | Sorgente | Azione |
|--------|----------|--------|
| Tutti gli eventi di dominio | Tutti i contexts | Crea AuditLog entry |
| `UserAuthenticated` | Identity | Log accesso |
| `UserDeleted` | Identity | Log eliminazione con motivazione GDPR |
| `MemorialCreated` | Memorials | Log creazione |
| `PrivacyChanged` | Memorials | Log con old/new value |
| `RoleAssigned` | Governance | Log assegnazione |
| `ContentApproved` / `ContentRejected` | Content | Log decisione |
| `ReportResolved` | Moderation | Log azione di moderazione |
| `CustodianTransferCompleted` | Governance | Log trasferimento custodia |
| `ModerationAction` | Moderation | Log azione eseguita |

### 12.7 Invarianti del Dominio

- **Append-only**: I log non possono essere modificati o eliminati
- **Retention 7 anni**: I log sono conservati per 7 anni (conformità legale)
- **Immutabilità**: Una volta scritto, un log entry non cambia mai
- **Completezza**: Ogni azione significativa (CRUD, auth, moderation) DEVE essere loggata
- **Auditabile**: Ogni log entry deve permettere di ricostruire "chi, cosa, quando, dove"
- **GDPR compliant**: I log contenenti dati personali sono pseudonimizzati dopo la retention

---

## 13. Diagramma delle Dipendenze

### 13.1 Grafo delle Dipendenze (Testuale)

```
                        ┌──────────────┐
                        │   Shared     │
                        │   Kernel     │
                        │  (VO, Types) │
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
       ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
       │  Identity   │  │   Audit     │  │ Notifications│
       │  (Auth)     │  │   (Logs)    │  │  (Delivery)  │
       └──────┬──────┘  └─────────────┘  └──────────────┘
              │
              │    ┌──────────┐    ┌──────────┐    ┌──────────┐
              └───►│ Memorials│◄──►│Governance│◄──►│ Content  │
                   │  (Core)  │    │  (Roles) │    │  (Posts) │
                   └────┬─────┘    └────┬─────┘    └────┬─────┘
                        │               │               │
                   ┌────▼─────┐    ┌────▼─────┐    ┌───▼──────┐
                   │  Search  │    │ Community│    │  Media   │
                   │  (Index) │    │(Messages)│    │ (Upload) │
                   └──────────┘    └──────────┘    └────┬─────┘
                                                        │
                                                   ┌────▼──────┐
                                                   │    AI     │
                                                   │(Moderate) │
                                                   └───────────┘


Legenda:
  ──► = Dipendenza (il contesto sorgente dipende dal contesto destinazione)
  ◄──► = Dipendenza bidirezionale (attraverso eventi)
```

### 13.2 Matrice delle Dipendenze

| Context | Dipende da | Dipendono da lui |
|---------|-----------|------------------|
| **Identity** | Shared Kernel | Memorials, Governance, Community, Moderation, Notifications, Audit |
| **Memorials** | Identity, Shared Kernel | Governance, Content, Media, Community, Search, Notifications, Audit |
| **Governance** | Memorials, Identity, Shared Kernel | Content, Notifications, Audit |
| **Content** | Memorials, Governance, Media, Shared Kernel | Community, Search, Notifications, Audit |
| **Media** | Memorials, AI, Shared Kernel | Content, Community, Notifications, Audit |
| **Community** | Memorials, Media, Identity, Shared Kernel | Moderation, Notifications, Audit |
| **Moderation** | Community, Content, Media, Identity, Shared Kernel | Notifications, Audit |
| **Notifications** | Identity, Memorials, Shared Kernel | — (leaf node) |
| **Search** | Memorials, Content, Shared Kernel | — (leaf node) |
| **AI** | Shared Kernel | Media, Moderation, Audit |
| **Audit** | Tutti, Shared Kernel | — (leaf node) |
| **Shared Kernel** | — | Tutti |

### 13.3 Regole di Dipendenza

1. **Nessuna dipendenza ciclica** tra Core contexts
2. **Shared Kernel** è l'unico context che può essere dipendenza di tutti
3. **Audit** e **Notifications** sono leaf nodes (non hanno dipendenze uscenti)
4. **AI** è un provider puro (nessuno dipende da AI direttamente, solo via Media)
5. **Identity** è il context radice dell'autenticazione

---

## 14. Flusso Eventi Cross-Domain

### 14.1 Sequence: Creazione Memoriale Completa

```
Identity          Memorials        Governance       Notifications       Audit        Search
   │                 │                 │                  │              │            │
   │──UserRegistered─────────────────────────────────────►│              │            │
   │                 │                 │                  │              │            │
   │                 │──MemorialCreated───────────────────────────────────►            │
   │                 │                 │                  │              │            │
   │                 │─────────────────►──RoleAssigned────►              │            │
   │                 │                 │                  │              │            │
   │                 │────────────────────────────────────►              │            │
   │                 │                 │                  │              │            │
   │                 │────────────────────────────────────────────────────►            │
   │                 │                 │                  │              │            │
   │                 │─────────────────────────────────────────────────────────────────►│
   │                 │                 │                  │              │            │
```

### 14.2 Sequence: Pubblicazione Contenuto con Approvazione

```
Content         Governance         Media              AI           Notifications      Moderation      Audit
  │                │                │                 │                  │               │            │
  │──PostCreated────────────────────────────────────────────────────────────────────────────────────────►│
  │                │                │                 │                  │               │            │
  │                │──checkRole()──►│                 │                  │               │            │
  │                │◀──COLLABORATOR─│                 │                  │               │            │
  │                │                │                 │                  │               │            │
  │──ContentSubmittedForApproval───────────────────────────────────────►               │            │
  │                │                │                 │                  │               │            │
  │                │                │──QuarantineJob───────────────────────────────────────────────────►│
  │                │                │                 │                  │               │            │
  │                │                │                 │──AIJob──────────►│               │            │
  │                │                │                 │                  │               │            │
  │                │                │◀──Result: OK────│                  │               │            │
  │                │                │                 │                  │               │            │
  │                │                │──MediaApproved───────────────────────────────────────────────────►│
  │                │                │                 │                  │               │            │
  │                │                │                 │  [Custode approva il contenuto]   │            │
  │                │                │                 │                  │               │            │
  │──ContentApproved──────────────────────────────────────────────────────────────────────────────────►│
  │                │                │                 │                  │               │            │
  │                │                │                 │  [Notifica al submitter]          │            │
  │                │                │                 │                  │               │            │
```

### 14.3 Sequence: Successione Custode

```
Governance         Memorials        Identity       Notifications         Audit
    │                 │                │                  │                 │
    │──CustodianTransferInitiated────────────────────────────────────────────────►
    │                 │                │                  │                 │
    │                 │                │                  │──Email al Custode
    │                 │                │                  │                 │
    │                 │                │  [12 mesi + 14 giorni senza risposta]
    │                 │                │                  │                 │
    │──CustodianTransferCompleted────────────────────────────────────────────────►
    │                 │                │                  │                 │
    │─────────────────►──Aggiorna custodianId─────────────►                  │
    │                 │                │                  │                 │
    │                 │                │                  │──Notifica membri│
    │                 │                │                  │                 │
    │                 │                │                  │                 │
```

### 14.4 Sequence: Segnalazione e Moderazione

```
Community/Content    Moderation        Governance       Notifications        Audit       AI (se auto-flag)
       │                │                 │                  │                 │              │
       │──ReportCreated──────────────────────────────────────────────────────────────────────────►
       │                │                 │                  │                 │              │
       │                │──Auto-prioritize─────────────────────────────────────────────────────►
       │                │                 │                  │                 │              │
       │                │                 │                  │──Notifica mod───►              │
       │                │                 │                  │                 │              │
       │                │  [Moderatore risolve: rimuove contenuto]                             │
       │                │                 │                  │                 │              │
       │                │──ModerationAction:CONTENT_REMOVED────────────────────────────────────►
       │                │                 │                  │                 │              │
       │                │──ReportResolved──────────────────────────────────────────────────────►
       │                │                 │                  │                 │              │
       │                │                 │                  │──Notifica parte──►             │
       │                │                 │                  │                 │              │
```

### 14.5 Tabella Riassuntiva Eventi Cross-Domain

| Evento | Publisher | Subscribers | Frequenza |
|--------|-----------|-------------|-----------|
| `MemorialCreated` | Memorials | Identity, Governance, Search, Notifications, Audit | Alta |
| `PrivacyChanged` | Memorials | Search, Notifications, Audit | Media |
| `RoleAssigned` | Governance | Notifications, Memorials, Audit | Alta |
| `ContentSubmitted` | Content | Notifications, AI, Audit | Alta |
| `ContentApproved` | Content | Notifications, Memorials, Search, Audit | Alta |
| `MediaQuarantineCompleted` | Media | Content, Notifications, Moderation, Audit | Alta |
| `MessageSubmitted` | Community | Notifications, AI, Audit | Alta |
| `ReportCreated` | Moderation | Notifications, Audit | Media |
| `CustodianTransferInitiated` | Governance | Notifications, Audit | Bassa |
| `UserDeleted` | Identity | Memorials, Governance, Notifications, Audit | Bassa |
| `AIJobCompleted` | AI | Media, Content, Moderation, Audit | Alta |
| `RecurrenceTriggered` | Notifications | Memorials, Audit | Ricorrente |

---

## Appendice A: Shared Kernel

Il **Shared Kernel** contiene tipi, value objects e utility condivisi tra tutti i bounded contexts.

```typescript
// shared/value-objects.ts
export class MemorialId extends ValueObject<string> {}
export class UserId extends ValueObject<string> {}
export class MediaAssetId extends ValueObject<string> {}
export class DateTime extends ValueObject<Date> {}
export class Email extends ValueObject<string> {}
export class Url extends ValueObject<string> {}
export class Slug extends ValueObject<string> {}

// shared/domain-event.ts
export abstract class DomainEvent {
  readonly occurredOn: DateTime;
  readonly eventId: string;
  readonly eventType: string;
}

// shared/entity.ts
export abstract class Entity<T> {
  protected readonly props: T;
  private domainEvents: DomainEvent[] = [];
  
  addDomainEvent(event: DomainEvent): void;
  clearDomainEvents(): void;
  get domainEvents(): DomainEvent[];
}

// shared/result.ts
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

## Appendice B: Glossary — Ubiquitous Language

| Termine (IT) | Termine (EN) | Definizione |
|-------------|-------------|-------------|
| Memoriale | Memorial | Pagina digitale dedicata a una persona deceduta |
| Custode | Custodian | Creatore e gestore principale del memoriale |
| Co-Custode | Co-Custodian | Erede designato del Custode |
| Collaboratore | Collaborator | Utente che può proporre contenuti |
| Visitatore | Visitor | Utente che può visualizzare e lasciare messaggi |
| Messaggio di vicinanza | Condolence Message | Messaggio breve di affetto sulla bacheca |
| Ricorrenza | Recurrence | Data significativa che genera notifiche annuali |
| Pipeline di quarantena | Quarantine Pipeline | Processo di scan e moderazione dei media |
| Bacheca | Message Board | Area del memoriale con i messaggi di vicinanza |
| Eredità | Custodian Transfer | Trasferimento del ruolo di Custode |

---

*Documento versionato. Per modifiche, aprire una PR nel repository docs/.*
