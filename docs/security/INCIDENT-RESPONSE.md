# Incident Response Plan - Piattaforma "Ricordati di Te"

**Versione**: 1.0  
**Data**: 2025-01-15  
**Classificazione**: CONFIDENZIALE - USO INTERNO  
**Autore**: Security Team  
**Review**: Trimestrale  

---

## 1. Indice

1. [Introduzione](#2-introduzione)
2. [Classificazione Incidenti](#3-classificazione-incidenti)
3. [Playbook per Categoria](#4-playbook-per-categoria)
4. [Contatti e Escalation](#5-contatti-e-escalation)
5. [Comunicazione](#6-comunicazione)
6. [Forensics](#7-forensics)
7. [Appendici](#8-appendici)

---

## 2. Introduzione

### 2.1 Scopo

Il presente documento definisce il piano di risposta agli incidenti di sicurezza per la piattaforma "Ricordati di Te". Fornisce procedure strutturate per la detection, containment, eradication, recovery e lessons learned di ogni categoria di incidente.

### 2.2 Principi

| ID | Principio |
|----|-----------|
| P1 | **People first**: La sicurezza e la dignita degli utenti e prioritaria |
| P2 | **Transparency**: Comunicazione chiara e tempestiva con gli interessati |
| P3 | **Containment**: Limitare il danno prima di identificare la causa radice |
| P4 | **Evidence**: Preservare le evidenze per eventuali azioni legali |
| P5 | **Learn**: Ogni incidente e un'opportunita di miglioramento |

### 2.3 Definizioni

| Termine | Definizione |
|---------|-------------|
| **Incidente** | Qualsiasi evento che comprometta la sicurezza, privacy o disponibilita della piattaforma |
| **Breach** | Accesso non autorizzato a dati personali (GDPR Art. 4) |
| **Containment** | Azioni per limitare l'estensione dell'incidente |
| **Eradication** | Rimozione della causa radice |
| **Recovery** | Ripristino dei servizi e delle operazioni normali |
| **Forensics** | Raccolta e analisi di evidenze digitali |

### 2.4 Workflow Generale

```
DETECTION -> TRIAGE -> CLASSIFICAZIONE -> CONTAINMENT -> ERADICATION -> RECOVERY -> LESSONS LEARNED
    |           |            |                |              |            |              |
    |           |            |                |              |            |              |
  Alert     Priorita      P0/P1/P2/P3     Isolamento     Fix root     Restore      Post-mortem
  Monitor   Assegnazione    Playbook        Blocco         cause        normale      Documento
  Segnal.   Team IR       attivato        Mitigazione    Verifica     Verifica     Azioni
```

---

## 3. Classificazione Incidenti

### 3.1 Matrice di Priorita

| Priorita | Condizione | Tempo Risposta | Tempo Containment | Esempi |
|----------|-----------|----------------|-------------------|--------|
| **P0 - Critico** | Data breach in corso, account massivo compromesso, contenuto illegale (CSAM) | 15 minuti | 1 ora | Esfiltrazione DB, RCE attivo, ransomware |
| **P1 - Alto** | Memoriale abusivo, contenuto illegale singolo, account privilegiato compromesso | 1 ora | 4 ore | ATO admin, memoriale non autorizzato, doxxing |
| **P2 - Medio** | Spam, molestie individuali, bug sicurezza non sfruttato | 4 ore | 24 ore | Brigading, bug RLS, scraping |
| **P3 - Basso** | Enhancement sicurezza, false positive, questioni policy | 24 ore | 72 ore | Audit richiesto, aggiornamento certificati |

### 3.2 Categorie di Incidente

| ID | Categoria | Descrizione | Priorita Tipica |
|----|-----------|-------------|-----------------|
| INC-001 | Data Breach | Accesso non autorizzato a dati personali | P0 |
| INC-002 | Account Compromise | Account utente o admin compromesso | P0/P1 |
| INC-003 | Memoriale Abusivo | Creazione o gestione non autorizzata | P1 |
| INC-004 | Contenuto Illegale | CSAM, terrorismo, incitamento odio | P0 |
| INC-005 | Contenuto Offensivo | Offesa a defunto, doxxing, molestie | P1/P2 |
| INC-006 | Spam/Abuso | Comportamento distorto della piattaforma | P2 |
| INC-007 | Disponibilita | DoS, outage, degrado servizio | P0/P2 |
| INC-008 | Insider Threat | Azione malevola da dipendente/fornitore | P0/P1 |
| INC-009 | Vulnerabilita | Scoperta di bug di sicurezza | P2/P3 |
| INC-010 | Richiesta Legale | Ordinanza giudiziaria, richiesta dati | P1/P2 |

### 3.3 Decision Tree

```
INCIDENTE RILEVATO
       |
       v
+------------------+     +------------------+
| Contenuto CSAM,  | --> | P0 - INC-004     |
| terrorismo?      |     | Contenuto Illegale |
+------------------+     +------------------+
       | No
       v
+------------------+     +------------------+
| Data breach in   | --> | P0 - INC-001     |
| corso / confermato|    | Data Breach       |
+------------------+     +------------------+
       | No
       v
+------------------+     +------------------+
| Admin / Moderatore | -> | P0/P1 - INC-008  |
| compromesso?     |     | Insider Threat    |
+------------------+     +------------------+
       | No
       v
+------------------+     +------------------+
| Account massivi  | --> | P0 - INC-002     |
| compromessi?     |     | Account Compromise|
+------------------+     +------------------+
       | No
       v
+------------------+     +------------------+
| Memoriale        | --> | P1 - INC-003     |
| abusivo / doxxing|     | Memoriale Abusivo |
+------------------+     +------------------+
       | No
       v
+------------------+     +------------------+
| Molestie /       | --> | P1/P2 - INC-005  |
| contenuto offensivo|   | Contenuto Offensivo|
+------------------+     +------------------+
       | No
       v
+------------------+     +------------------+
| Spam / brigading | --> | P2 - INC-006     |
| / scraping?      |     | Spam/Abuso        |
+------------------+     +------------------+
       | No
       v
+------------------+     +------------------+
| Outage / DoS?    | --> | P0/P2 - INC-007  |
+------------------+     | Disponibilita     |
       | No              +------------------+
       v
+------------------+     +------------------+
| Vulnerabilita    | --> | P2/P3 - INC-009  |
| scoperta?        |     | Vulnerabilita     |
+------------------+     +------------------+
       | No
       v
+------------------+     +------------------+
| Richiesta        | --> | P1/P2 - INC-010  |
| legale?          |     | Richiesta Legale  |
+------------------+     +------------------+
       | No
       v
  P3 - Triage manuale
```

---

## 4. Playbook per Categoria

### 4.1 INC-001: Data Breach

#### Overview

| Attributo | Valore |
|-----------|--------|
| **Priorita** | P0 |
| **Owner** | CISO / Security Lead |
| **Team** | Security, Dev, Legal, DPO |
| **Trigger** | Alert sistema, segnalazione esterna, scoperta interna |

#### Detection

| Fonte | Descrizione | Priorita |
|-------|-------------|----------|
| D-01 | Alert SIEM: accesso anomalo a database | Alta |
| D-02 | Alert: query massiccie da IP sconosciuto | Alta |
| D-03 | Segnalazione utente: "I miei dati sono stati esposti" | Alta |
| D-04 | Report responsabile disclosure da ricercatore | Alta |
| D-05 | Notifica da Supabase / fornitore | Alta |
| D-06 | Monitoraggio dark web / paste sites | Media |

#### Containment (obiettivo: 1 ora)

```
STEP 1 (0-15 min):
  [ ] Attivare Incident Response Team (phone bridge)
  [ ] Designare Incident Commander
  [ ] Documentare ora di inizio incidente
  [ ] Aprire ticket interno con classificazione P0

STEP 2 (15-30 min):
  [ ] Identificare scope: quali dati, quali tabelle, quali utenti
  [ ] Revocare immediatamente credenziali compromesse
  [ ] Disabilitare account sospetti
  [ ] Bloccare IP sorgente a livello firewall/WAF
  [ ] Attivare modalita "read-only" se necessario (impatto valutato)

STEP 3 (30-60 min):
  [ ] Preservare snapshot database pre-containment
  [ ] Isolare sistemi compromessi
  [ ] Attivare logging massimale su tutti i sistemi
  [ ] Iniziare raccolta evidenze forensi
  [ ] NOTIFICA INTERNA: CEO, CTO, DPO, Legal
```

#### Eradication (obiettivo: 4 ore)

```
STEP 4 (1-2h):
  [ ] Identificare root cause (SQLi? credenziali leak? RLS bypass?)
  [ ] Applicare hotfix immediato
  [ ] Ruotare TUTTE le chiavi API e credenziali di servizio
  [ ] Verificare integrita RLS policies
  [ ] Scan completo vulnerabilita

STEP 5 (2-4h):
  [ ] Rimuovere backdoor o accessi persistenti
  [ ] Verificare che nessun altro sistema sia compromesso
  [ ] Conferma eradicazione con penetration test rapido
  [ ] Preparare report tecnico preliminare
```

#### Recovery (obiettivo: 24 ore)

```
STEP 6 (4-24h):
  [ ] Ripristinare servizi in modalita monitorata
  [ ] Attivare logging rinforzato (100% query log)
  [ ] Monitoraggio intensivo per 72h
  [ ] Verificare integrita dati (hash comparison campione)
  [ ] Comunicazione agli utenti interessati (vedi Sezione 6)

STEP 7 (24-72h):
  [ ] Valutazione GDPR breach notification (72h dalla scoperta)
  [ ] Notifica Garante Privacy se necessario
  [ ] Supporto agli utenti interessati (helpdesk dedicato)
  [ ] Review completa controlli di sicurezza
```

#### Lessons Learned (obiettivo: 1 settimana)

```
STEP 8 (entro 7 giorni):
  [ ] Post-mortem documentato
  [ ] RCA (Root Cause Analysis) completa
  [ ] Azioni correttive con owner e deadline
  [ ] Aggiornamento Threat Model
  [ ] Training team se necessario
  [ ] Revisione procedure IR
```

---

### 4.2 INC-002: Account Compromise

#### Overview

| Attributo | Valore |
|-----------|--------|
| **Priorita** | P0 (massivo) / P1 (singolo admin) / P2 (singolo utente) |
| **Owner** | Security Engineer |
| **Team** | Security, Dev, Support |

#### Playbook

```
DETECTION:
  - Alert login anomalo (geo, device, orario)
  - Segnalazione utente: "Non ho fatto io quell'azione"
  - Pattern: azioni fuori carattere per l'utente

CONTAINMENT (15 min):
  1. Bloccare account immediatamente
  2. Invalidare tutte le sessioni attive
  3. Revocare refresh tokens
  4. Se admin/moderatore: revocare privilegi temporaneamente

ERADICATION (1h):
  1. Analisi log: come e avvenuto il compromissione
     - Credential stuffing? -> Check HIBP
     - Phishing? -> Analisi email ricevute
     - Malware? -> Consigliare scan dispositivo
     - Insider? -> Investigazione interna
  2. Verificare azioni eseguite dall'attaccante
     - Quali dati ha visto?
     - Quali modifiche ha fatto?
     - Quali contenuti ha creato/cancellato?
  3. Se modifiche ai memoriali: revert al stato precedente
  4. Forzare reset password all'utente

RECOVERY (4h):
  1. Contattare utente (telefono/email) per verifica identita
  2. Riabilitare account con password nuova
  3. Forzare abilitazione MFA se non attiva
  4. Fornire report azioni eseguite dall'attaccante
  5. Monitoraggio account per 30 giorni

COMUNICAZIONE:
  - Utente: email dettagliata con azioni eseguite e consigli
  - Se custode: notifica a tutti i memoriali gestiti
  - Se admin: notifica a tutto il team management
```

---

### 4.3 INC-003: Memoriale Abusivo

#### Overview

| Attributo | Valore |
|-----------|--------|
| **Priorita** | P1 |
| **Owner** | Moderation Lead |
| **Team** | Moderation, Legal, Support |

#### Playbook

```
DETECTION:
  - Segnalazione "Contesta questo memoriale"
  - Alert automatico: documento non congruente
  - Contatto diretto da familiare (email/telefono)
  - Pattern: stesso creatore, molteplici memoriali

CONTAINMENT (1h):
  1. Se segnalazione da familiare legittimo:
     - SOSPENDERE memoriale immediatamente (non visibile pubblico)
     - Mantenere accesso per review interno
  2. Se alert automatico:
     - Mettere in stato "pending review"
     - Notificare moderatore on-call
  3. Documentare chi ha segnalato e quando

INVESTIGAZIONE (4h):
  1. Verificare documenti del creatore
  2. Controllare se esistono custodi esistenti
  3. Ricerca incrociata: nome defunto, date, luogo
  4. Se possibile: contatto telefonico con richiedente
  5. Se segnalante fornisce documenti: verifica congruenza

DECISIONE (24h):
  CASO A - Creatore non autorizzato:
    - Rimuovere memoriale completamente
    - Notificare creatore con motivazione
    - Sanzione: ban se intenzionale, warning se errore
    - Offrire supporto al familiare legittimo per creazione corretta

  CASO B - Contestazione infondata:
    - Ripristinare memoriale
    - Notificare entrambe le parti con motivazione
    - Annotare account segnalante per pattern

  CASO C - Ambiguo (entrambi hanno documenti validi):
    - Escalation a Senior Moderator
    - Richiesta documenti aggiuntivi ad entrambi (72h)
    - Mediazione se necessario
    - Se non risolvibile: chiusura memoriale con offerta rifiuto

COMUNICAZIONE:
  - Template: vedere Sezione 6.2
  - Mantenere tono empatico e rispettoso
  - Tempi: sempre entro 24h dalla decisione
```

---

### 4.4 INC-004: Contenuto Illegale

#### Overview

| Attributo | Valore |
|-----------|--------|
| **Priorita** | P0 |
| **Owner** | CISO / Legal |
| **Team** | Security, Legal, Moderation |
| **Nota**: CSAM = obbligo di report a polizia, NON rimuovere subito (evidenza) |

#### Playbook

```
DETECTION:
  - Segnalazione utente
  - Moderazione automatica (hash matching CSAM database)
  - Moderatore umano in review
  - Alert da autorita

CONTENUTO CSAM (Child Sexual Abuse Material):
  !!! SEGUIRE PROCEDURA ESATTA !!!

  1. NON rimuovere il contenuto immediatamente (evidenza)
  2. SOSPENDERE visibilita (solo moderatore puo vedere)
  3. Documentare:
     - URL completo
     - Hash SHA-256 del file
     - Timestamp upload
     - Account che ha caricato
     - IP address
     - User agent
     - Tutti i log correlati
  4. PRESERVARE:
     - Snapshot database
     - File originale (non toccare)
     - Log di accesso al file
  5. REPORT entro 24h:
     - Polizia Postale: https://www.commissariatodips.it
     - Linea diretta: 113
     - Hotline: https://www.hotline.it
  6. Designare un unico punto di contatto con le forze dell'ordine
  7. NESSUNA comunicazione esterna senza approvazione Legal
  8. Sospendere account caricatore immediatamente

CONTENUTO TERRORISMO / INCITAMENTO ODIO:
  1. RIMOZIONE IMMEDIATA del contenuto
  2. Sospensione account
  3. Preservare tutte le evidenze (log, screenshot)
  4. Report a:
     - Polizia Postale per terrorismo
     - Dipartimento Pubblica Sicurezza per odio
  5. Se provenienza estera: report a piattaforma EU (OSCE)

CONTENUTO VIOLENTO ESTREMO:
  1. Rimozione immediata
  2. Sospensione account
  3. Log e evidenze preservati 10 anni
  4. Report alle autorita se violenza reale
```

---

### 4.5 INC-005: Contenuto Offensivo

#### Overview

| Attributo | Valore |
|-----------|--------|
| **Priorita** | P1 (doxxing) / P2 (offesa generica) |
| **Owner** | Moderation Lead |
| **Team** | Moderation, Support |

#### Playbook

```
DETECTION:
  - Segnalazione utente (1-click "Segnala")
  - Keyword filter automatico
  - Sentiment analysis ML
  - Review moderatore in campionamento

DOXXING (P1):
  Containment:
    1. Rimozione IMMEDIATA contenuto (< 30 min)
    2. Redazione PII se in altri contenuti dello stesso utente
    3. Invalidazione cache CDN
    4. Sospensione account mittente
    5. Richiesta de-indexing motori ricerca

  Investigation:
    1. Verificare se PII era gia indicizzata
    2. Contattare persona il cui dato e stato esposto
    3. Valutare GDPR breach notification
    4. Documentare tutto per potenziale azione legale

  Recovery:
    1. Conferma rimozione alla vittima
    2. Monitoraggio per 30 giorni (ripubblicazione)
    3. Supporto legale se richiesto

OFFESA GENERICA (P2):
  Containment:
    1. Rimozione contenuto entro 4h
    2. Avvertimento all'utente (prima volta)
    3. Sanzione progressiva se recidivo

  Investigation:
    1. Valutare contesto (risposta a provocazione?)
    2. Verificare storico utente
    3. Se pattern: escalation sanzione
```

---

### 4.6 INC-006: Spam/Abuso

#### Overview

| Attributo | Valore |
|-----------|--------|
| **Priorita** | P2 |
| **Owner** | Moderation Team |
| **Team** | Moderation, Dev (per controlli tecnici) |

#### Playbook

```
DETECTION:
  - Filtri automatici
  - Rate limiting trigger
  - Segnalazioni utenti
  - Pattern analysis (stesso messaggio su N memoriali)

CONTAINMENT:
  1. Rimozione automatica contenuti spam
  2. Rate limiting account (se triggerato)
  3. Se botnet: bloccare range IP / fingerprint

ERADICATION:
  1. Analisi pattern per identificare sorgente
  2. Aggiornare filtri con nuovi pattern
  3. Se account coordinati: ban batch
  4. Aggiornare lista domini bloccati

RECOVERY:
  1. Monitoraggio efficacia controlli
  2. Tune threshold se troppi false positive
```

---

### 4.7 INC-007: Disponibilita

#### Overview

| Attributo | Valore |
|-----------|--------|
| **Priorita** | P0 (outage totale) / P2 (degrado) |
| **Owner** | DevOps / Tech Lead |
| **Team** | Dev, DevOps, Security |

#### Playbook

```
DETECTION:
  - Monitoraggio uptime (Pingdom/UptimeRobot)
  - Alert error rate > soglia
  - Segnalazioni utenti social media
  - Alert Supabase/Vercel

OUTAGE TOTALE (P0):
  Containment (15 min):
    1. Verificare stato Supabase (status.supabase.com)
    2. Verificare stato Vercel (status.vercel.com)
    3. Se provider: aprire ticket prioritario
    4. Se codice: rollback all'ultimo deploy stabile
    5. Attivare pagina di stato pubblica
    6. Comunicare su canale social

  Recovery:
    1. Se provider: attesa + comunicazione utenti
    2. Se codice: hotfix + deploy
    3. Post-recovery: root cause analysis

DoS ATTACKO (P0):
  Containment:
    1. Attivare WAF rules (rate limiting aggressivo)
    2. Bloccare IP sorgente
    3. Se DDoS: contattare Supabase/Vercel support
    4. Attivare challenge CAPTCHA globale
    5. Se estorsione: NON PAGARE, contattare polizia

  Recovery:
    1. Monitoraggio traffico post-attack
    2. Tune controlli preventivi
    3. Report alle autorita se estorsione
```

---

### 4.8 INC-008: Insider Threat

#### Overview

| Attributo | Valore |
|-----------|--------|
| **Priorita** | P0 |
| **Owner** | CISO / CEO |
| **Team** | Security, Legal, HR |
| **Nota**: Richiede gestione con massima riservatezza |

#### Playbook

```
DETECTION:
  - Alert: accesso a dati fuori dal ruolo
  - Alert: download massivo
  - Alert: accesso orario anomalo
  - Segnalazione collega
  - Anomalia in pattern di lavoro

CONTAINMENT (RISERVATO):
  1. NON confrontare il sospetto direttamente
  2. Raccogliere evidenze in modo stealth
  3. Limitare accesso privilegiato (in modo non sospetto)
  4. Attivare logging massimale sui suoi accessi
  5. Coinvolgere solo: CEO, CISO, Legal

INVESTIGAZIONE (RISERVATA):
  1. Forensics su accessi e azioni
  2. Analisi pattern nel tempo
  3. Verifica se dati sono stati esfiltrati
  4. Consulenza legale su procedura

AZIONE:
  Se confermato:
    1. Sospensione immediata accessi
    2. Sospensione lavorativa (con procedura HR)
    3. Report alle autorita se reato
    4. Azione legale civile se danno economico
    5. Comunicazione controllata (riservatezza)

  Se infondato:
    1. Documentazione archiviata
    2. Ripristino pieno accesso
    3. Lezione appresa su processo detection
```

---

### 4.9 INC-009: Vulnerabilita

#### Overview

| Attributo | Valore |
|-----------|--------|
| **Priorita** | P2 (sfruttabile) / P3 (teorica) |
| **Owner** | Security Engineer |
| **Team** | Security, Dev |

#### Playbook

```
DETECTION:
  - Penetration test interno/esterno
  - Responsible disclosure
  - Dependency scanning (Snyk/Dependabot)
  - Monitoraggio advisory (CVE)

VALUTAZIONE:
  1. Replicare la vulnerabilita (ambiente isolato)
  2. Valutare CVSS score
  3. Valutare exploitability sulla nostra architettura
  4. Valutare impact su dati sensibili

PRIORITIZZAZIONE:
  CVSS >= 9.0  -> P0, fix entro 24h
  CVSS 7.0-8.9 -> P1, fix entro 72h
  CVSS 4.0-6.9 -> P2, fix entro 2 settimane
  CVSS < 4.0   -> P3, fix next sprint

RESPONSIBLE DISCLOSURE:
  1. Confermare ricezione entro 24h
  2. Assegnare un ID interno
  3. Comunicare timeline prevista
  4. Al fix: testare e riconoscere il ricercatore
  5. Se negativo: spiegazione dettagliata
  6. Programma bug bounty (opzionale futuro)
```

---

### 4.10 INC-010: Richiesta Legale

#### Overview

| Attributo | Valore |
|-----------|--------|
| **Priorita** | P1 (ordine giudiziario) / P2 (richiesta informale) |
| **Owner** | Legal / DPO |
| **Team** | Legal, DPO, Dev (per estrazione dati) |

#### Playbook

```
RICEZIONE:
  1. Documentare data/ora ricezione
  2. Verificare autenticita mittente
  3. Verificare validita formale (firma, timbro, competenza)
  4. NON rispondere prima di consulto Legal

VALUTAZIONE (con Legal):
  Tipo A - Ordinanza giudiziaria valida:
    - Eseguire quanto richiesto
    - Documentare ogni passo
    - Tempi: come da ordinanza

  Tipo B - Richiesta forze ordine non vincolante:
    - Valutare caso per caso
    - Bilanciare privacy utente vs obbligo legale
    - Rispondere solo con ordine formale

  Tipo C - Richiesta avvocato privato:
    - NON rispondere senza ordine giudiziario
    - Notificare utente interessato (se non vietato)

  Tipo D - Richiesta GDPR (diritto accesso/cancellazione):
    - Verificare identita richiedente
    - Tempi: 30 giorni (prorogabili a 60)
    - Documentare completamente

ESECUZIONE:
  1. Estrazione dati nel formato richiesto (o equivalente)
  2. Verifica completezza
  3. Cifratura dati sensibili in transito
  4. Consegna tramite canale sicuro
  5. Fattura costi se ammissibile (art. 15 GDPR)

DOCUMENTAZIONE:
  - Copia della richiesta originale
  - Parere Legal
  - Dati estratti (checksum)
  - Prova consegna
  - Conservazione 10 anni
```

---

## 5. Contatti e Escalation

### 5.1 Incident Response Team

| Ruolo | Nome | Telefono | Email | Backup |
|-------|------|----------|-------|--------|
| Incident Commander | [DA COMPILARE] | [PRIORITARIO] | irc@ricordatidite.it | [BACKUP] |
| CISO / Security Lead | [DA COMPILARE] | [PRIORITARIO] | security@ricordatidite.it | [BACKUP] |
| DPO | [DA COMPILARE] | [SECONDARIO] | dpo@ricordatidite.it | [BACKUP] |
| Tech Lead | [DA COMPILARE] | [PRIORITARIO] | tech@ricordatidite.it | [BACKUP] |
| Legal | [DA COMPILARE] | [SECONDARIO] | legal@ricordatidite.it | [BACKUP] |
| Moderation Lead | [DA COMPILARE] | [SECONDARIO] | moderation@ricordatidite.it | [BACKUP] |
| CEO | [DA COMPILARE] | [RISERVATO] | [RISERVATO] | - |

### 5.2 Escalation Path

```
Livello 1 (On-call Engineer):
  - Riconoscimento incidente
  - Triage iniziale
  - Containment immediato (se possibile)
  - Escalation se P0 o oltre competenza

Livello 2 (Security Lead / Tech Lead):
  - Incidente P0/P1
  - Decisioni tecniche
  - Coordinamento team
  - Comunicazione interna

Livello 3 (CISO / CTO):
  - Data breach confermato
  - Richiesta legale
  - Comunicazione esterna
  - Decisioni strategiche

Livello 4 (CEO / Board):
  - GDPR breach notification
  - Impatto reputazionale significativo
  - Azione legale contro la piattaforma
  - Media inquiry
```

### 5.3 Contatti Esterni

| Entita | Contatto | Scopo |
|--------|----------|-------|
| **Supabase Security** | security@supabase.com | Incidenti infrastruttura, data breach |
| **Supabase Support** | support@supabase.com | Outage, degrado performance |
| **Vercel Support** | support@vercel.com | Outage frontend, Edge Functions |
| **Polizia Postale** | 113 / www.commissariatodips.it | CSAM, truffa, cybercrime |
| **Garante Privacy IT** | garante@gpdp.it / www.gpdp.it | GDPR breach notification |
| **CERT-AGID** | cert@agid.gov.it | Incidenti nazionali, coordinamento |
| **ISP/Hosting** | [DA COMPILARE] | Blocco IP, log aggiuntivi |
| **Forensics Esterno** | [DA COMPILARE] | Investigazione forense complessa |
| **Legal Esterno** | [DA COMPILARE] | Consulenza legale specializzata |
| **Cyber Insurance** | [DA COMPILARE] / [POLIZZA] | Attivazione polizza |

### 5.4 Matrice di Notifica

| Tipo Incidente | Interno | Fornitore | Autorita | Utenti | Pubblico |
|---------------|---------|-----------|----------|--------|----------|
| P0 Data Breach | Immediato | Immediato | 72h (GDPR) | 72h | Solo se necessario |
| P0 CSAM | Immediato | - | 24h (Polizia) | No | No |
| P1 ATO Admin | Immediato | Se correlato | Se necessario | Se impatto | No |
| P1 Memoriale abusivo | 1h | No | No | 24h | No |
| P2 Spam | 4h | No | No | No | No |
| P2 Bug sicurezza | 24h | Se upstream | No | Se impatto | Dopo fix |

---

## 6. Comunicazione

### 6.1 Principi di Comunicazione

| Principio | Descrizione |
|-----------|-------------|
| Tempestivita | Informare prima che la notizia trapeli |
| Onesta | Non nascondere o minimizzare |
| Empatia | Ricordare il contesto emotivo della piattaforma |
| Concretezza | Azioni specifiche, non promesse generiche |
| Proporzionalita | Livello di dettaglio adeguato all'audience |

### 6.2 Template: Comunicazione Utenti (Data Breach)

```
OGGETTO: Importante aggiornamento sulla sicurezza del tuo account - [ID INCIDENTE]

Gentile [NOME],

ci teniamo a informarti personalmente di un incidente di sicurezza che ha coinvolto
la piattaforma "Ricordati di Te".

CHE COSA E SUCCESSO
Il [DATA], abbiamo rilevato un accesso non autorizzato ai nostri sistemi che ha
potenzialmente esposto alcuni dati personali. L'incidente e stato contenuto il
[DATA] alle ore [ORA].

QUALI DATI SONO COINVOLTI
I seguenti dati potrebbero essere stati accessi:
- [ELENCO SPECIFICO DATI]
I seguenti dati NON sono stati coinvolti:
- Password (cifrate e non accessibili)
- Dati di pagamento (non conserviamo tali dati)

AZIONI GIA INTRAPRESE
- L'accesso non autorizzato e stato bloccato immediatamente
- Tutte le credenziali sono state rotte
- Una investigazione e in corso con esperti di sicurezza
- Le autorita competenti sono state informate

AZIONI RACCOMANDATE PER TE
1. Cambia la password della tua email se la riusi altrove
2. Attiva l'autenticazione a due fattori sul tuo account
3. Monitora i tuoi account per attivita sospette
4. Contattaci se noti qualcosa di anomalo

SUPPORTO
Abbiamo attivato una linea dedicata per rispondere alle tue domande:
- Email: breach-support@ricordatidite.it
- Telefono: [NUMERO DEDICATO]
- Orari: 24/7 per i prossimi 30 giorni

Ci scusiamo sinceramente per questo inconveniente. La sicurezza dei tuoi dati e
la nostra priorita assoluta.

Il Team di "Ricordati di Te"

[ID INCIDENTE: INC-2025-XXXX]
```

### 6.3 Template: GDPR Breach Notification (Garante Privacy)

```
MITTENTE: Ricordati di Te Srl / [RAGIONE SOCIALE]
DPO: [NOME DPO] - dpo@ricordatidite.it
DATA NOTIFICA: [DATA]

OGGETTO: Notifica di violazione di dati personali - Art. 33 e 34 GDPR

1. NATURA DELLA VIOLAZIONE
   Tipo: [accesso non autorizzato / perdita dati / alterazione]
   Categorie dati: [dati personali comuni / dati sensibili / dati giudiziari]

2. AMBITO
   Numero persone interessate: [N]
   Categorie persone: [defunti / familiari / utenti registrati]
   Categorie dati: [nomi, email, foto, biografie, ...]

3. PROBABILI CONSEGUENZE
   [Descrizione rischi per diritti e liberta delle persone fisiche]

4. MISURE ADOTTATE / PROPOSTE
   - Misure tecniche: [descrizione]
   - Misure organizzative: [descrizione]
   - Misure per gli interessati: [notifica, supporto, credit monitoring]

5. CAUSE DELLA VIOLAZIONE
   [Descrizione root cause nota al momento]

6. COMUNICAZIONE AGLI INTERESSATI
   Data comunicazione: [DATA]
   Mezzo: [email / posta]
   Contenuto: [allegato]

Allegati:
- [ ] Dettaglio tecnico
- [ ] Esempio comunicazione agli interessati
- [ ] Timeline incidente
```

### 6.4 Template: Comunicazione Autorita (Polizia Postale)

```
ALLA ATTENZIONE DELLA POLIZIA POSTALE E DELLE COMUNICAZIONI

Oggetto: Segnalazione [CSAM / truffa online / cyberstalking / estorsione]

Piattaforma: Ricordati di Te (https://ricordatidite.it)
Operatore: [RAGIONE SOCIALE], P.IVA [N], con sede in [INDIRIZZO]
Referente: [NOME], [RUOLO]
Contatto: security@ricordatidite.it / [TELEFONO]

DESCRIZIONE FATTO:
[Descrizione dettagliata dell'incidente]

DATI IDENTIFICATIVI:
- Username: [USERNAME]
- Email registrata: [EMAIL]
- IP address: [IP] (timestamp: [DATA])
- User Agent: [UA]
- Contenuto: [URL / ID]
- Hash SHA-256: [HASH]
- Timestamp upload: [DATA]

EVIDENZE PRESERVATE:
- [ ] File originale (checksum verificato)
- [ ] Log di accesso (30 giorni)
- [ ] Snapshot database al momento discovery
- [ ] Screenshot piattaforma
- [ ] Email/notifiche correlate

AZIONI INTRAPRESE:
- Contenuto sospeso in data [DATA]
- Account sospeso in data [DATA]
- Evidenze preservate in data [DATA]

Restiamo a disposizione per ogni chiarimento.

[NOME]
[RUOLO]
[RAGIONE SOCIALE]
```

### 6.5 Template: Comunicazione Fornitore (Supabase)

```
A: security@supabase.com
Cc: security@ricordatidite.it
Oggetto: [SECURITY] Potential incident involving project [PROJECT_REF]

Dear Supabase Security Team,

We are writing to report a potential security incident involving our project
hosted on Supabase.

Project Reference: [PROJECT_REF]
Organization: [ORG_ID]

Incident Summary:
[Description of the incident]

Timeline:
- [TIME]: [Event]
- [TIME]: [Event]

Evidence:
- [Logs, queries, suspicious activities]

Request:
Please confirm if there have been any infrastructure-level incidents
affecting our project during the specified timeframe.

We are available for a call at your earliest convenience.

Best regards,
[NAME]
Security Lead - Ricordati di Te
```

---

## 7. Forensics

### 7.1 Raccolta Evidenze

#### Principi

| Principio | Descrizione |
|-----------|-------------|
| **Chain of Custody** | Ogni evidenza deve avere un percorso documentato |
| **Integrita** | Hash crittografico per ogni file/evidenza |
| **Tempestivita** | Raccolta immediata, prima che venga sovrascritta |
| **Legal Admissibility** | Seguire procedure riconosciute per ammissibilita in tribunale |

#### Tipologie di Evidenze

| Tipo | Fonte | Metodo Raccolta | Retention |
|------|-------|-----------------|-----------|
| Log applicativi | Supabase Log Explorer | Esportazione JSON, SHA-256 | 10 anni |
| Log database | pgAudit | Esportazione, firma digitale | 10 anni |
| Log accesso | Supabase Auth | Esportazione JWT events | 10 anni |
| File contenuti | Storage bucket | Copia immutabile, hash | 10 anni |
| Snapshot DB | Supabase backups | Preservazione dedicata | 10 anni |
| Network log | Vercel Edge | Esportazione access log | 2 anni |
| Email | Resend dashboard | Esportazione con metadata | 10 anni |
| Screenshot | Manuale | Con timestamp, URL, firma | 10 anni |

#### Procedura di Raccolta

```
STEP 1: Identificazione
  - Identificare tutte le fonti di evidenza rilevanti
  - Documentare lo stato del sistema al momento discovery
  - Foto/screenshot dello stato iniziale

STEP 2: Preservazione
  - Creare snapshot di tutti i sistemi coinvolti
  - Esportare log in formato immutabile (WORM storage)
  - Calcolare hash SHA-256 di ogni file
  - Non modificare, aprire o accedere alle evidenze non necessarie

STEP 3: Documentazione
  - Form "Chain of Custody" per ogni evidenza
  - Chi ha raccolto, quando, dove, come
  - Chi ha avuto accesso successivamente

STEP 4: Archiviazione
  - Storage cifrato dedicato (non connesso a produzione)
  - Accesso solo al CISO e al Legal
  - Conservazione minima 10 anni
```

### 7.2 Chain of Custody Form

```
EVIDENCE ID: [INC-YYYY-NNNN-E###]

Raccolta:
  Data/Ora: _______________
  Raccolto da: _______________
  Ruolo: _______________
  Tipo evidenza: _______________
  Fonte: _______________
  Descrizione: _______________
  Hash SHA-256: _______________
  Metodo raccolta: _______________

Trasferimenti:
  Da: _______________  A: _______________
  Data: _______________  Firma: _______________
  Motivo: _______________

  Da: _______________  A: _______________
  Data: _______________  Firma: _______________
  Motivo: _______________

Analisi:
  Analizzato da: _______________
  Data: _______________
  Metodo: _______________
  Risultati: _______________

Note: _______________
```

### 7.3 Audit Log Analysis

#### Query di Analisi (PostgreSQL / Supabase)

```sql
-- 1. Accessi anomali per IP
SELECT 
    auth.uid() as user_id,
    ip_address,
    COUNT(*) as login_count,
    MIN(created_at) as first_login,
    MAX(created_at) as last_login
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, ip_address
HAVING COUNT(*) > 50;

-- 2. Query massive su tabelle sensibili
SELECT 
    query,
    usename,
    query_start,
    state,
    client_addr
FROM pg_stat_activity
WHERE query ILIKE '%memorials%' 
   OR query ILIKE '%profiles%'
   OR query ILIKE '%audit_log%'
ORDER BY query_start DESC;

-- 3. Modifiche sospette a contenuti
SELECT 
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by,
    changed_at
FROM audit_log
WHERE changed_at > NOW() - INTERVAL '24 hours'
  AND (action = 'DELETE' OR action = 'UPDATE')
ORDER BY changed_at DESC;

-- 4. Accesso a contenuti in quarantena
SELECT 
    user_id,
    content_id,
    accessed_at,
    access_type
FROM quarantine_access_log
WHERE accessed_at > NOW() - INTERVAL '7 days'
ORDER BY accessed_at DESC;
```

#### Timeline Analysis

```
STEP 1: Identificare punto di ingresso
  - Primo evento sospetto nei log
  - Login da IP/device anomalo
  - Primo contenuto sospetto

STEP 2: Ricostruire la catena
  - Sequenza di azioni dell'attaccante
  - Sistemi toccati in ordine cronologico
  - Pivot point (come si e spostato)

STEP 3: Identificare impact
  - Quali dati sono stati accessi
  - Quali modifiche sono state fatte
  - Quali dati sono stati esfiltrati (se possibile)

STEP 4: Identificare root cause
  - Vulnerabilita sfruttata
  - Errore umano
  - Mancanza di controllo
```

### 7.4 Preservation Checklist

```
[ ] Snapshot database completato (ID: ____)
[ ] Log auth esportati e hashati (SHA: ____)
[ ] Log applicazione esportati (SHA: ____)
[ ] Log database esportati (SHA: ____)
[ ] File contenuti copiati in storage forense (SHA: ____)
[ ] Configurazione sistema documentata
[ ] Screenshot stati iniziali
[ ] Email/notifiche correlate salvate
[ ] Chain of custody iniziata per ogni evidenza
[ ] Accesso a storage forense limitato (solo CISO + Legal)
[ ] Documentazione incidente iniziata
[ ] Notifica autorita (se richiesto) completata
```

---

## 8. Appendici

### 8.1 Glossario

| Termine | Definizione |
|---------|-------------|
| **CSAM** | Child Sexual Abuse Material |
| **RCA** | Root Cause Analysis |
| **CVSS** | Common Vulnerability Scoring System |
| **SIEM** | Security Information and Event Management |
| **WAF** | Web Application Firewall |
| **DPO** | Data Protection Officer |
| **PII** | Personally Identifiable Information |
| **RLS** | Row Level Security |
| **RCE** | Remote Code Execution |
| **ATO** | Account Takeover |

### 8.2 Riferimenti

| Documento | Rilevanza |
|-----------|-----------|
| NIST SP 800-61 Rev. 2 | Computer Security Incident Handling Guide |
| ENISA | Incident Management Framework |
| GDPR Art. 33-34 | Notifica breach |
| ISO/IEC 27035 | IT Security Incident Management |

### 8.3 Revision History

| Versione | Data | Autore | Modifiche |
|----------|------|--------|-----------|
| 1.0 | 2025-01-15 | Security Team | Versione iniziale |

---

**FINE DOCUMENTO**

*Questo documento e classificato CONFIDENZIALE - USO INTERNO. Non distribuire al di fuori dell'Incident Response Team.*
