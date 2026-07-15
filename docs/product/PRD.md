# Product Requirements Document — Ricordati di Te

> **Versione**: 1.0  
> **Data**: 2025-06-01  
> **Stato**: Draft per review  
> **Prodotto**: Ricordati di Te — Social Network Memoriale  

---

## Indice

1. [Visione](#1-visione)
2. [Utenti Target](#2-utenti-target)
3. [Funzionalità Core](#3-funzionalità-core)
4. [User Stories](#4-user-stories)
5. [Flussi Critici](#5-flussi-critici)
6. [Requisiti Non-Funzionali](#6-requisiti-non-funzionali)
7. [Criteri di Accettazione MVP](#7-criteri-di-accettazione-mvp)
8. [Esclusioni MVP](#8-esclusioni-mvp)
9. [Metriche di Successo](#9-metriche-di-successo)

---

## 1. Visione

### 1.1 Proposition

**Ricordati di Te** è una piattaforma memoriale digitale progettata per preservare, condividere e celebrare la memoria delle persone care. Offre uno spazio sicuro, rispettoso e duraturo dove familiari e amici possono costruire insieme un monumento digitale composto da storie, fotografie, video e messaggi di affetto.

### 1.2 Principi Guida

| Principio | Descrizione |
|-----------|-------------|
| **Dignità** | Ogni memoriale è trattato con il massimo rispetto. Il tono dell'interfaccia è sobrio, caldo, mai freddo o corporativo. |
| **Controllo familiare** | La famiglia detiene il controllo assoluto sui contenuti, la visibilità e le modalità di partecipazione. |
| **Permanenza** | I memoriali sono progettati per durare nel tempo. Nessun contenuto viene cancellato senza esplicito consenso del Custode. |
| **Privacy-by-design** | La privacy è il default. Ogni memoriale è privato fino a quando il Custode non ne configura la visibilità. |
| **Semplicità** | L'interfaccia deve essere immediatamente comprensibile anche da utenti non tecnici e da persone in un momento di vulnerabilità emotiva. |

### 1.3 Elevator Pitch

> *Uno spazio digitale protetto dove le famiglie possono creare, custodire e condividere la memoria dei propri cari. Con tre livelli di ruolo, approvazione familiare su ogni contenuto, e una moderazione attiva, garantisce che ogni ricordo sia preservato con dignità e rispetto.*

---

## 2. Utenti Target

### 2.1 Segmenti Utente

#### Segmento Primario — Familiari Prossimi
- **Profilo**: Coniugi, figli, genitori, fratelli/sorelle della persona ricordata
- **Bisogni**: Creare e gestire il memoriale; controllare chi può partecipare; approvare i contenuti; ricevere supporto emotivo
- **Frequenza**: Giornaliera/settimanale
- **Dispositivo**: Prevalentemente mobile

#### Segmento Secondario — Parenti e Amici Stretti
- **Profilo**: Parenti allargati, amici di lunga data, colleghi stretti
- **Bisogni**: Contribuire con contenuti e messaggi; interagire con il memoriale; partecipare alle ricorrenze
- **Frequenza**: Settimanale/mensile
- **Dispositivo**: Mobile e desktop

#### Segmento Terziario — Conoscenti e Visitatori
- **Profilo**: Conoscenti, colleghi, membri della comunità (scuola, associazioni)
- **Bisogni**: Visitare il memoriale; lasciare un messaggio di vicinanza; partecipare in modo leggero
- **Frequenza**: Occasionale (ricorrenze, anniversari)
- **Dispositivo**: Prevalentemente mobile

#### Segmento Quaternario — Visitatori Occasionali
- **Profilo**: Persone che non conoscevano direttamente la persona ma desiderano lasciare un segno di rispetto
- **Bisogni**: Trovare il memoriale; lasciare un messaggio breve; rispettare lo spazio
- **Frequenza**: Saltuaria
- **Dispositivo**: Mobile

### 2.2 Personas

| Persona | Età | Contesto | Obiettivo principale |
|---------|-----|----------|---------------------|
| **Maria** | 58 anni | Vedova, madre di 2 figli | Creare un memoriale per il marito e gestirlo con i figli |
| **Luca** | 32 anni | Figlio di Maria, vive all'estero | Contribuire con foto e ricordi dal passato; sentirsi vicino alla madre |
| **Giulia** | 25 anni | Nipote, studente universitaria | Aggiungere storie divertenti sul nonno; imparare cose nuove su di lui |
| **Roberto** | 60 anni | Ex collega del marito di Maria | Lasciare un messaggio di stima; partecipare all'anniversario |

---

## 3. Funzionalità Core

### 3.1 Matrice Funzionalità per Ruolo

| Funzionalità | Custode | Co-Custode | Collaboratore | Visitatore |
|---|---|---|---|---|
| Modifica dati anagrafici del defunto | ✅ | ✅ | ❌ | ❌ |
| Invitare Collaboratori | ✅ | ✅ | ❌ | ❌ |
| Approvare/rifiutare contenuti | ✅ | ✅ | ❌ | ❌ |
| Pubblicare contenuti (diretto) | ✅ | ✅ | ⚠️ con approvazione | ❌ |
| Pubblicare messaggi di vicinanza | ✅ | ✅ | ✅ | ✅ |
| Segnalare contenuti inappropriati | ✅ | ✅ | ✅ | ✅ |
| Gestire privacy memoriale | ✅ | ❌ | ❌ | ❌ |
| Designare erede (Co-Custode) | ✅ | ❌ | ❌ | ❌ |
| Eliminare memoriale | ✅ | ❌ | ❌ | ❌ |
| Ricevere notifiche ricorrenze | ✅ | ✅ | ✅ | ❌ |

> **Legenda**: ✅ = Permesso | ⚠️ = Con restrizioni | ❌ = Negato

### 3.2 Dettaglio Funzionalità

#### 3.2.1 Creazione e Gestione Memoriali

- **Creazione guidata**: Wizard multi-step per la creazione del memoriale con dati anagrafici, foto profilo, biografia, e configurazione privacy
- **Pagina profilo del defunto**: Nome, foto, date di nascita/decesso, biografia, citazioni preferite
- **Timeline della vita**: Sezione cronologica con eventi significativi (foto, storie, milestone)
- **Privacy configurabile**: Pubblico (visitabile da chiunque), Privato (solo invitati), Su invito (richiesta di accesso)

#### 3.2.2 Sistema Ruoli

| Ruolo | Descrizione | Nomina | Quantità |
|-------|-------------|--------|----------|
| **Custode** | Creatore del memoriale; controllo totale | Automatica (chi crea il memoriale) | 1 per memoriale |
| **Co-Custode** | Erede designato; assume il ruolo di Custode se necessario | Designato dal Custode | Max 2 per memoriale |
| **Collaboratore** | Può proporre contenuti e messaggi | Invitato da Custode/Co-Custode | Illimitato |
| **Visitatore** | Può visualizzare e lasciare messaggi di vicinanza | Auto-assegnato o approvato | Illimitato |

#### 3.2.3 Pubblicazione Contenuti con Approvazione

- **Contenuti diretti**: Custode e Co-Custode pubblicano senza approvazione
- **Contenuti in approvazione**: Collaboratori e Visitatori inviano contenuti che devono essere approvati da Custode/Co-Custode
- **Stati del contenuto**: `DRAFT` → `PENDING_APPROVAL` → `APPROVED` | `REJECTED`
- **Notifica approvazione**: Il submitter riceve notifica quando il contenuto viene approvato o rifiutato

#### 3.2.4 Media Upload con Pipeline di Quarantena

- **Tipi supportati**: Immagini (JPG, PNG, WebP), Video (MP4, MOV, max 100MB), Audio (MP3, M4A)
- **Pipeline di quarantena**:
  1. Upload in storage temporaneo
  2. Scan antivirus automatico
  3. Moderazione AI (rilevanza, appropriatezza, deepfake detection)
  4. Review umana per contenuti segnalati
  5. Release al memoriale dopo approvazione
- **Ottimizzazione**: Resize automatico immagini, transcoding video, compressione audio

#### 3.2.5 Messaggi di Vicinanza

- **Tipologia**: Messaggi testuali brevi (max 500 caratteri) con possibilità di allegare una singola foto
- **Visualizzazione**: Bacheca pubblica sul memoriale, ordinata per data
- **Moderazione**: I messaggi possono essere segnalati e rimossi dai Custodi o dal team di moderazione

#### 3.2.6 Moderazione e Segnalazioni

- **Segnalazione**: Ogni utente può segnalare contenuti inappropriati (categoria: offensivo, spam, contenuto non pertinente, violenza, altro)
- **Gestione segnalazioni**: Dashboard per Custodi e team di moderazione
- **Azioni**: Approva contenuto, rimuovi contenuto, sospendi utente, esci
- **Audit trail**: Ogni azione di moderazione è tracciata e immutabile

#### 3.2.7 Notifiche e Ricorrenze

- **Ricorrenze automatiche**: Notifiche per compleanni, anniversari di scomparsa, date significative configurate
- **Tipi notifica**: Email, push notification (opzionale), in-app notification
- **Preferenze**: Configurabili per ruolo e per memoriale
- **Digest**: Email riassuntiva settimanale con attività sui memoriali seguiti

#### 3.2.8 Privacy Configurabile

| Livello | Visibilità | Richiesta approvazione contenuti |
|---------|-----------|----------------------------------|
| **Pubblico** | Visibile a chiunque (anche non registrati) | Sì, per Collaboratori e Visitatori |
| **Privato** | Solo utenti invitati | Sì, per tutti tranne Custode |
| **Su invito** | Richiesta di accesso da approvare | Sì, per tutti tranne Custode |

---

## 4. User Stories

### US-001: Creazione Memoriale

> **Come** familiare prossimo  
> **Voglio** creare un memoriale per la mia persona cara  
> **Per** preservare la sua memoria e condividerla con chi l'ha conosciuta

**Criteri di accettazione**:
- Il wizard di creazione guida l'utente attraverso: dati anagrafici, foto, biografia, privacy
- Il memoriale è creato in stato `ACTIVE` al completamento
- Il creatore diventa automaticamente Custode
- Il memoriale è accessibile immediatamente

---

### US-002: Designazione Co-Custode

> **Come** Custode  
> **Voglio** designare un Co-Custode  
> **Per** garantire la continuità della gestione del memoriale

**Criteri di accettazione**:
- Posso invitare fino a 2 Co-Custodi per memoriale
- Il Co-Custode riceve un invito email con link di accettazione
- Il Co-Custode ha gli stessi permessi del Custode tranne: designazione altri Co-Custodi, eliminazione memoriale
- In caso di inattività del Custode (> 12 mesi), il Co-Custode può richiedere la promozione

---

### US-003: Invito Collaboratori

> **Come** Custode o Co-Custode  
> **Voglio** invitare amici e parenti come Collaboratori  
> **Per** permettere loro di contribuire con contenuti

**Criteri di accettazione**:
- Posso invitare via email o link di invito condivisibile
- Il destinatario riceve un invito con le istruzioni
- Il Collaboratore, dopo l'accettazione, può proporre contenuti
- Ogni contenuto proposto richiede approvazione

---

### US-004: Approvazione Contenuti

> **Come** Custode  
> **Voglio** approvare o rifiutare i contenuti proposti  
> **Per** mantenere il controllo sulla qualità e l'appropriatezza

**Criteri di accettazione**:
- Ricevo una notifica per ogni contenuto in attesa di approvazione
- Posso approvare o rifiutare con un click dalla dashboard o dall'email
- Il submitter riceve notifica del risultato
- I contenuti rifiutati sono eliminati permanentemente dopo 30 giorni

---

### US-005: Upload Media

> **Come** Collaboratore  
> **Voglio** caricare foto e video del mio caro  
> **Per** arricchire il memoriale con ricordi visivi

**Criteri di accettazione**:
- Posso caricare fino a 20 file per sessione di upload
- Ogni file passa attraverso la pipeline di quarantena
- Ricevo conferma dell'avvenuto upload e dello stato di approvazione
- Posso aggiungere didascalie e taggare persone nelle foto

---

### US-006: Messaggio di Vicinanza

> **Come** visitatore di un memoriale  
> **Voglio** lasciare un messaggio di affetto  
> **Per** esprimere la mia vicinanza alla famiglia

**Criteri di accettazione**:
- Posso scrivere un messaggio (max 500 caratteri) dalla pagina del memoriale
- Posso allegare opzionalmente una singola foto
- Il messaggio appare sulla bacheca dopo approvazione (se richiesta dalla privacy)
- Ricevo conferma della pubblicazione

---

### US-007: Gestione Privacy Memoriale

> **Come** Custode  
> **Voglio** configurare la visibilità del memoriale  
> **Per** proteggere la privacy della mia famiglia

**Criteri di accettazione**:
- Posso scegliere tra: Pubblico, Privato, Su invito
- La modifica della privacy ha effetto immediato
- Gli utenti attualmente con accesso non perdono i permessi se passo a "Privato"
- Posso revocare l'accesso a singoli utenti in qualsiasi momento

---

### US-008: Ricezione Notifiche Ricorrenze

> **Come** membro del memoriale  
> **Voglio** ricevere una notifica in prossimità di date significative  
> **Per** partecipare attivamente alle ricorrenze

**Criteri di accettazione**:
- Ricevo notifica 7 giorni prima e 1 giorno prima della ricorrenza
- La notifica include: nome della ricorrenza, data, link al memoriale
- Posso configurare le preferenze di notifica (email, push, nessuna)

---

### US-009: Segnalazione Contenuto Inappropriato

> **Come** utente del memoriale  
> **Voglio** segnalare un contenuto offensivo  
> **Per** proteggere la dignità dello spazio memoriale

**Criteri di accettazione**:
- Posso segnalare qualsiasi contenuto con un motivo predefinito o descrizione libera
- La segnalazione è anonima per il segnalatore
- Il Custode riceve la segnalazione entro 24 ore
- Il contenuto segnalato viene temporaneamente oscurato dopo 3 segnalazioni

---

### US-010: Eredita Ruolo di Custode

> **Come** Co-Custode  
> **Voglio** diventare Custode se il Custode originale non è più attivo  
> **Per** garantire la gestione continua del memoriale

**Criteri di accettazione**:
- Dopo 12 mesi di inattività del Custode, posso richiedere la promozione
- Il sistema invia un'ultima notifica al Custode prima della promozione
- La promozione diventa effettiva dopo 14 giorni dalla richiesta se non c'è risposta
- L'evento è tracciato nell'audit log

---

### US-011: Visualizzazione Timeline

> **Come** visitatore  
> **Voglio** visualizzare la timeline della vita del defunto  
> **Per** conoscere meglio la persona ricordata

**Criteri di accettazione**:
- La timeline mostra gli eventi in ordine cronologico
- Ogni evento include: data, titolo, descrizione, media allegati
- Posso filtrare per tipo di contenuto (foto, video, storia)
- La timeline è responsive e navigabile su mobile

---

### US-012: Configurazione Notifiche

> **Come** utente registrato  
> **Voglio** configurare le mie preferenze di notifica  
> **Per** ricevere solo le comunicazioni che mi interessano

**Criteri di accettazione**:
- Posso configurare: notifiche email, push, digest settimanale
- Posso scegliere per quali memoriali ricevere notifiche
- Le preferenze sono salvate e applicate immediatamente

---

### US-013: Ricerca Memoriali

> **Come** visitatore occasionale  
> **Voglio** cercare un memoriale per nome  
> **Per** trovare la persona che desidero ricordare

**Criteri di accettazione**:
- La ricerca supporta nome, cognome, data di nascita/decesso
- Solo i memoriali pubblici appaiono nei risultati
- I risultati mostrano: foto, nome, date, breve estratto

---

### US-014: Eliminazione Memoriale

> **Come** Custode  
> **Voglio** eliminare definitivamente un memoriale  
> **Per** gestire il diritto all'oblio

**Criteri di accettazione**:
- L'eliminazione richiede conferma esplicita e password
- Tutti i dati associati vengono eliminati permanentemente entro 30 giorni
- I Co-Custodi ricevono notifica dell'eliminazione
- L'azione è irreversibile e tracciata nell'audit log

---

### US-015: Moderazione Dashboard

> **Come** membro del team di moderazione  
> **Voglio** visualizzare tutte le segnalazioni  
> **Per** gestire i contenuti inappropriati in modo efficiente

**Criteri di accettazione**:
- La dashboard mostra: segnalazioni aperte, in revisione, risolte
- Posso filtrare per: data, gravità, tipo di contenuto
- Ogni segnalazione mostra: contenuto, motivo, storico segnalazioni utente
- Posso prendere azione direttamente dalla dashboard

---

### US-016: Modifica Dati Anagrafici

> **Come** Custode  
> **Voglio** modificare i dati anagrafici del defunto  
> **Per** correggere errori o aggiungere informazioni

**Criteri di accettazione**:
- Posso modificare: nome, date, luoghi, biografia, foto profilo
- Le modifiche sono tracciate nella cronologia
- I Collaboratori ricevono notifica delle modifiche significative

---

### US-017: Invio Link Condivisione

> **Come** Custode  
> **Voglio** condividere un link al memoriale  
> **Per** invitare persone a visitarlo

**Criteri di accettazione**:
- Posso generare un link di condivisione dalla pagina del memoriale
- Il link rispetta il livello di privacy configurato
- Posso revocare il link in qualsiasi momento

---

### US-018: Gestione Memoria da Mobile

> **Come** utente mobile  
> **Voglio** gestire il memoriale dal mio smartphone  
> **Per** avere accesso immediato ovunque mi trovi

**Criteri di accettazione**:
- L'interfaccia è completamente responsive (320px+)
- Le azioni principali sono accessibili entro 2 tap
- L'upload di foto è supportato direttamente dalla fotocamera
- Le notifiche push sono supportate

---

### US-019: Ricezione Digest Settimanale

> **Come** Collaboratore  
> **Voglio** ricevere un riepilogo settimanale delle attività  
> **Per** essere aggiornato senza essere sopraffatto dalle notifiche

**Criteri di accettazione**:
- Il digest include: nuovi contenuti approvati, nuovi messaggi, ricorrenze imminenti
- Posso disattivare il digest dalle preferenze
- Il digest viene inviato ogni lunedì mattina

---

### US-020: Richiesta Accesso a Memoriale Privato

> **Come** visitatore  
> **Voglio** richiedere l'accesso a un memoriale privato  
> **Per** poter partecipare anche senza un invito diretto

**Criteri di accettazione**:
- Posso inviare una richiesta di accesso con un messaggio opzionale
- Il Custode riceve la richiesta e può approvarla o rifiutarla
- Ricevo notifica della risposta
- Se approvata, ottengo il ruolo di Visitatore o Collaboratore (a scelta del Custode)

---

## 5. Flussi Critici

### 5.1 Flusso 1: Registrazione → Creazione Memoriale

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Landing    │───▶│  Registrazione│───▶│   Email     │───▶│   Login     │
│   Page      │    │  (email/pwd)  │    │  Verifica   │    │  Primo      │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                                 │
                    ┌─────────────┐    ┌─────────────┐           │
                    │   Memoriale  │◀───│   Wizard    │◀──────────┘
                    │   Creato     │    │  Creazione  │
                    │  (ACTIVE)    │    │ (4 steps)   │
                    └──────┬──────┘    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │   Dashboard  │
                    │   Custode    │
                    └─────────────┘

Wizard Steps:
  1. Dati anagrafici (nome, date, luoghi)
  2. Foto profilo e biografia
  3. Configurazione privacy (pubblico/privato/su invito)
  4. Designazione Co-Custode (opzionale)
```

### 5.2 Flusso 2: Invito → Accettazione → Collaborazione

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Custode   │───▶│   Invito    │───▶│   Email     │───▶│   Utente    │
│  Invita     │    │  Generato    │    │  Inviata    │    │  Clicca Link │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                                 │
                    ┌─────────────┐    ┌─────────────┐           │
                    │  Ruolo Asse- │◀───│  Registrazione│◀─────────┘ (se nuovo)
                    │   gnato      │    │  (se necess.) │
                    │(Collaboratore)│   └─────────────┘
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Può ora    │
                    │  proporre   │
                    │  contenuti  │
                    └─────────────┘
```

### 5.3 Flusso 3: Pubblicazione Contenuto → Approvazione

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Collaboratore│───▶│   Contenuto  │───▶│  Pipeline   │───▶│  PENDING    │
│  Crea Post   │    │   Upload     │    │  Quarantena │    │  APPROVAL   │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                                 │
                    ┌─────────────┐    ┌─────────────┐           │
                    │  APPROVED   │◀───│  Custode/   │◀──────────┘
                    │  (pubblico) │    │  Co-Custode │
                    └─────────────┘    │  Approva     │
                                       └─────────────┘
                                              │
                                       ┌──────▼──────┐
                                       │   REJECTED  │
                                       │  (eliminato │
                                       │   in 30gg)  │
                                       └─────────────┘
```

### 5.4 Flusso 4: Pipeline di Quarantena Media

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │───▶│   Storage   │───▶│   Scan      │───▶│  Moderazione │
│   File      │    │  Temporaneo │    │   Antivirus │    │     AI       │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
          │                                                     │
          │              ┌─────────────┐    ┌─────────────┐      │
          │              │   Memoriale  │◀───│   Storage   │◀─────┘ (OK)
          │              │   (pubblico) │    │   Definitivo│
          │              └─────────────┘    └─────────────┘
          │                                     │
          │                              ┌──────▼──────┐
          └─────────────────────────────▶│   REJECTED  │
                                         │  (segnalato │
                                         │   o KO AI)  │
                                         └─────────────┘
```

### 5.5 Flusso 5: Successione Custode → Co-Custode

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Custode   │───▶│  Inattività  │───▶│  Notifica   │───▶│  Promozione  │
│  Inattivo   │    │  > 12 mesi   │    │  al Custode │    │  Co-Custode  │
└─────────────┘    └─────────────┘    └──────┬──────┘    │  (conferma)  │
                                             │             └──────┬──────┘
                                             │   ┌─────────────┐  │
                                             └──▶│  Risposta   │──┘ (attivo)
                                                 │  entro 14gg │
                                                 └─────────────┘
```

---

## 6. Requisiti Non-Funzionali

### 6.1 Performance

| Requisito | Target | Misura |
|-----------|--------|--------|
| Time to First Byte (TTFB) | < 200ms | Lighthouse |
| First Contentful Paint (FCP) | < 1.2s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.5s | Lighthouse |
| Upload media (fino a 10MB) | < 15s | Tempo effettivo |
| Ricerca memoriali | < 500ms | Tempo risposta API |
| Query pagina memoriale | < 300ms | Tempo risposta API |

### 6.2 Sicurezza

| Requisito | Implementazione |
|-----------|-----------------|
| Autenticazione | Supabase Auth con email/password, OAuth (Google, Apple) |
| Autorizzazione | RBAC (Role-Based Access Control) a 4 livelli |
| HTTPS | Obbligatorio su tutti gli ambienti |
| Password policy | Min 8 caratteri, 1 maiuscola, 1 numero, 1 speciale |
| Rate limiting | 100 req/min per IP, 10 req/min per endpoint sensibile |
| CSP (Content Security Policy) | Configurato per prevenire XSS |
| Scan file | ClamAV su ogni upload; dimensione max 100MB |

### 6.3 Privacy (GDPR / DPA)

| Requisito | Implementazione |
|-----------|-----------------|
| Consenso informato | Checkbox esplicito al signup; privacy policy collegata |
| Diritto all'oblio | Eliminazione account e dati personali entro 30 giorni |
| Portabilità dati | Export dati personali in formato JSON/CSV |
| Minimizzazione dati | Raccolta solo dei dati strettamente necessari |
| Pseudonimizzazione | Dati sensibili criptati at-rest |
| Breach notification | Notifica entro 72 ore in caso di data breach |
| DPO | Nomina Responsabile Protezione Dati |
| Privacy by design | Valutazione d'impatto privacy (DPIA) pre-rilascio |

### 6.4 Accessibilità

| Requisito | Target |
|-----------|--------|
| WCAG | Livello AA |
| Screen reader | Compatibilità con NVDA, JAWS, VoiceOver |
| Tastiera | Navigazione completa senza mouse |
| Contrasto | Rapporto minimo 4.5:1 per testo normale |
| Font size | Supporto zoom fino al 200% senza perdita di funzionalità |
| Lingua | Italiano (default), i18n-ready per futura espansione |

### 6.5 Affidabilità

| Requisito | Target |
|-----------|--------|
| Uptime | 99.9% (esclusa manutenzione programmata) |
| RPO (Recovery Point Objective) | < 1 ora |
| RTO (Recovery Time Objective) | < 4 ore |
| Backup | Giornaliero automatico, retention 30 giorni |

### 6.6 Scalabilità

| Requisito | Target |
|-----------|--------|
| Utenti simultanei | Supporto fino a 10.000 utenti attivi contemporanei |
| Memoriali | Supporto fino a 100.000 memoriali nel primo anno |
| Media storage | Scalabile fino a 10TB |
| CDN | Distribuzione globale via CDN per asset statici |

---

## 7. Criteri di Accettazione MVP

### 7.1 Feature Complete

- [ ] Registrazione e autenticazione utente (email/password, OAuth)
- [ ] Creazione memoriale con wizard guidato (4 step)
- [ ] Sistema ruoli completo (Custode, Co-Custode, Collaboratore, Visitatore)
- [ ] Invito utenti via email e link condivisibile
- [ ] Pubblicazione contenuti (testo, foto, video) con approvazione
- [ ] Pipeline di quarantena media (scan antivirus + moderazione AI)
- [ ] Messaggi di vicinanza sulla bacheca
- [ ] Sistema segnalazioni e moderazione dashboard
- [ ] Notifiche email per ricorrenze e attività
- [ ] Privacy configurabile (pubblico/privato/su invito)
- [ ] Designazione erede (Co-Custode) e successione

### 7.2 Qualità

- [ ] Lighthouse score > 90 su Performance, Accessibility, Best Practices
- [ ] Zero vulnerabilità critiche o high nel security scan
- [ ] Test coverage > 80% (unit + integration)
- [ ] WCAG 2.1 AA compliance verificata
- [ ] Load test superato: 1.000 utenti simultanei

### 7.3 Operatività

- [ ] Documentazione deployment completa
- [ ] Monitoring e alerting configurati
- [ ] Piano di rollback testato
- [ ] Privacy policy e ToS pubblicati
- [ ] Supporto utente (email) attivo

---

## 8. Esclusioni MVP

Le seguenti funzionalità sono **esplicitamente escluse** dalla versione MVP e pianificate per release future:

### 8.1 Esclusioni per Decisione Prodotto

| Funzionalità | Motivazione Esclusione | Piano Futuro |
|-------------|------------------------|--------------|
| **Pagamenti / Abbonamenti** | Modello business non definito; priorità a crescita organica | Post-MVP: freemium con feature premium |
| **Raccolte fondi / Donazioni** | Complessità normativa; richiede partnership con enti | Post-MVP: integrazione con piattaforme crowdfunding |
| **Riconoscimento facciale** | Alto rischio privacy; sensibilità etica in contesto memoriale | Valutazione futura con consenso esplicito |
| **Algoritmi di feed opachi** | Contrastano con il principio di trasparenza e controllo | Non previsto; il feed è sempre cronologico |

### 8.2 Esclusioni Tecnologiche

| Funzionalità | Motivazione | Piano Futuro |
|-------------|-------------|--------------|
| **App native iOS/Android** | Costo elevato; PWA come prima iterazione | Post-MVP se necessario |
| **Video live streaming** | Non pertinente per il contesto memoriale | Non previsto |
| **Real-time chat** | Complessità moderazione; messaggi asincroni sufficienti | Valutazione post-MVP |
| **Multi-language UI** | Focus su mercato italiano; codebase i18n-ready | V2 per mercati europei |
| **API pubblica** | Non necessaria per il modello attuale | Post-MVP se richiesta da partner |

### 8.3 Esclusioni Ambito

| Esclusione | Motivazione |
|-----------|-------------|
| Gestione successione digitale legale | Richiede integrazione con notai e sistema legale italiano |
| Funeraria online (e-commerce) | Fuori scope; possibile partnership futura |
| Consulenza psicologica | Fuori scope; possibile sezione risorse con partner |
| Verifica identità reale (KYC) | Non necessaria per il modello a invito; solo email verification |

---

## 9. Metriche di Successo

### 9.1 Metriche North Star

| Metrica | Target Y1 | Strumento di misura |
|---------|-----------|---------------------|
| Memoriali creati | 5.000 | Database analytics |
| Utenti registrati | 15.000 | Database analytics |
| Contenuti pubblicati | 25.000 | Database analytics |
| Messaggi di vicinanza | 50.000 | Database analytics |
| Retention D30 | > 30% | Mixpanel/Amplitude |
| NPS (Net Promoter Score) | > 40 | Survey trimestrale |

### 9.2 Metriche di Qualità

| Metrica | Target | Strumento |
|---------|--------|-----------|
| Tempo medio creazione memoriale | < 5 min | Analytics |
| Contenuti approvati / rifiutati | Ratio > 90% | Database |
| Segnalazioni / contenuti totali | Ratio < 2% | Database |
| Tempo medio risoluzione segnalazione | < 24h | Dashboard moderazione |
| Uptime | > 99.9% | Uptime monitoring |

---

## Appendice A: Glossario

| Termine | Definizione |
|---------|-------------|
| **Memoriale** | Pagina digitale dedicata alla memoria di una persona deceduta |
| **Custode** | Utente con controllo totale sul memoriale; generalmente il creatore |
| **Co-Custode** | Erede designato del Custode; assume il ruolo in caso di inattività |
| **Collaboratore** | Utente invitato che può proporre contenuti |
| **Visitatore** | Utente che può visualizzare il memoriale e lasciare messaggi |
| **Pipeline di Quarantena** | Processo di scan e moderazione automatica dei media caricati |
| **Messaggio di Vicinanza** | Messaggio breve di affetto sulla bacheca del memoriale |
| **Ricorrenza** | Data significativa (compleanno, anniversario) che genera notifiche |

## Appendice B: Riferimenti

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [GDPR Regulation (EU) 2016/679](https://gdpr-info.eu/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)

---

*Documento versionato. Per modifiche, aprire una PR nel repository docs/.*
