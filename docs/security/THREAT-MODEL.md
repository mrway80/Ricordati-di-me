# Threat Model - Piattaforma "Ricordati di Te"

**Versione**: 1.0  
**Data**: 2025-01-15  
**Metodologia**: STRIDE  
**Classificazione**: CONFIDENZIALE  
**Autore**: Security Team  

---

## 1. Indice

1. [Introduzione](#2-introduzione)
2. [Asset Inventory](#3-asset-inventory)
3. [Threat Actors](#4-threat-actors)
4. [Threat Analysis STRIDE](#5-threat-analysis-stride)
5. [Risk Matrix](#6-risk-matrix)
6. [Countermeasures](#7-countermeasures)
7. [Residual Risk](#8-residual-risk)
8. [Appendici](#9-appendici)

---

## 2. Introduzione

### 2.1 Scopo

Il presente documento costituisce il Threat Model completo della piattaforma "Ricordati di Te", social network memoriale dedicato alla conservazione e condivisione di ricordi di persone decedute. La metodologia adottata e STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).

### 2.2 Contesto

La piattaforma gestisce dati altamente sensibili:
- Dati personali di persone decedute (art. 9 GDPR - categorie particolari)
- Dati di familiari e persone strettamente connesse
- Contenuti multimediali (foto, video, audio) di valore sentimentale
- Dinamiche familiari potenzialmente conflittuali

### 2.3 Scope

| Componente | Incluso |
|-----------|---------|
| Frontend (Next.js) | Si |
| API Edge Functions (Supabase) | Si |
| Database PostgreSQL (Supabase) | Si |
| Storage bucket fotografie/video | Si |
| Sistema autenticazione (Supabase Auth) | Si |
| RLS Policies | Si |
| Sistema moderazione contenuti | Si |
| Audit logging | Si |
| Pipeline backup/restore | Si |
| Integrazione email (Resend) | Si |

### 2.4 Threat Model Assumptions

| ID | Assunzione |
|----|-----------|
| A1 | Supabase e considerato trusted infrastructure provider |
| A2 | I familiari legittimi agiscono in buona fede nella maggioranza dei casi |
| A3 | Le richieste delle forze dell'ordine sono legittime e documentate |
| A4 | Il canale email di verifica e considerato sicuro per il livello di rischio |

---

## 3. Asset Inventory

### 3.1 Dati Personali dei Defunti

| Attributo | Sensibilita | Classificazione |
|-----------|-------------|-----------------|
| Nome completo | Alta | GDPR Art. 9 (dato relativo a decesso) |
| Data di nascita | Alta | Identificativo diretto |
| Data decesso | Alta | Dato sensibile culturale |
| Biografia/storia vita | Critica | Contenuto unico e irripetibile |
| Luogo nascita/decesso | Alta | Informazione personale |
| Relazioni familiari | Critica | Dato genetico/biometrico implicito |

**Protezione**: RLS strict, accesso solo custodi approvati, audit log completo.

### 3.2 Dati Personali dei Familiari

| Attributo | Sensibilita | Classificazione |
|-----------|-------------|-----------------|
| Email | Media | Identificativo diretto |
| Nome e cognome | Media | Identificativo diretto |
| Documento identita | Critica | Dato personale sensibile |
| Relazione con defunto | Alta | Contesto familiare |
| Indirizzo IP | Media | Dato di navigazione |

**Protezione**: Cifratura at-rest, accesso solo admin con giustificazione, log accesso.

### 3.3 Contenuti Multimediali

| Tipo | Sensibilita | Note |
|------|-------------|------|
| Fotografie | Alta | Valore sentimentale irreproducibile |
| Video | Alta | Contenuto potenzialmente intimo |
| Audio (registrazioni) | Critica | Voce della persona - dato biometrico implicito |
| Documenti scansionati | Alta | Atti, lettere, documenti personali |

**Protezione**: Storage privato, RLS su bucket, watermark opzionale, backup geografico.

### 3.4 Credenziali Utente

| Componente | Protezione |
|------------|-----------|
| Password | bcrypt/Argon2 via Supabase Auth, minimo 12 caratteri |
| JWT Token | Firma asimmetrica RS256, expiry 1 ora |
| Refresh Token | Rotazione automatica, invalidazione su logout |
| API Keys | Vault (non in codice), rotazione 90 giorni |

### 3.5 Log di Audit

| Tipo | Retention | Immutabilita |
|------|-----------|--------------|
| Accessi memoriale | 10 anni | Append-only, hash chain |
| Azioni moderazione | 10 anni | Append-only, firmato digitalmente |
| Modifiche contenuti | 7 anni | Versionamento completo |
| Login/logout | 2 anni | Tamper-evident |

### 3.6 Asset Classification Matrix

| Asset | Livello | Owner | Custode |
|-------|---------|-------|---------|
| Dati defunto | CRITICO | Famiglia | Piattaforma |
| Contenuti multimediali | CRITICO | Famiglia | Piattaforma |
| Dati familiari | ALTO | Utente | Piattaforma |
| Audit log | ALTO | Piattaforma | Piattaforma |
| Credenziali | ALTO | Utente | Piattaforma |
| Configurazione sistema | MEDIO | Admin | Piattaforma |

---

## 4. Threat Actors

### 4.1 Profili Attaccanti

#### TA1: Utente Anonimo

| Attributo | Descrizione |
|-----------|-------------|
| **Motivazione** | Curiosita, vandalismo, trolling |
| **Capacita** | Bassa, strumenti pubblici |
| **Risorse** | Limitate |
| **Risk Level** | Medio (volume alto, impatto variabile) |

**Obiettivi tipici**: Accesso memoriali privati, scraping, spam.

#### TA2: Utente Registrato Malintenzionato

| Attributo | Descrizione |
|-----------|-------------|
| **Motivazione** | Vendetta personale, danneggiamento reputazione |
| **Capacita** | Media, conoscenza piattaforma |
| **Risorse** | Account valido, tempo |
| **Risk Level** | Alto (accesso legittimo, intento malevolo) |

**Obiettivi tipici**: Pubblicazione contenuti offensivi, manipolazione memoriali altrui.

#### TA3: Creatore di Memoriale Abusivo

| Attributo | Descrizione |
|-----------|-------------|
| **Motivazione** | Trolling, estorsione, ciberstalking |
| **Capacita** | Media-alta, pazienza nel bypassare controlli |
| **Risorse** | Documenti falsi, tempo |
| **Risk Level** | Critico (impatto reputazionale, legale) |

**Obiettivi tipici**: Creazione memoriale non autorizzato, appropriazione identita defunto.

#### TA4: Familiare Conflittuale

| Attributo | Descrizione |
|-----------|-------------|
| **Motivazione** | Rissa familiare, rivalita, negazione rapporto |
| **Capacita** | Alta, conoscenza intima della vittima |
| **Risorse** | Accesso legittimo, documenti reali |
| **Risk Level** | Alto (difficile da rilevare, accesso valido) |

**Obiettivi tipici**: Modifica biografia, rimozione foto, bloccare accesso ad altri familiari.

#### TA5: Ex-Membro con Accesso Residuo

| Attributo | Descrizione |
|-----------|-------------|
| **Motivazione** | Vendetta, accesso a informazioni |
| **Capacita** | Media, conosce il sistema |
| **Risorse** | Vecchie credenziali, conoscenza processi |
| **Risk Level** | Medio-Alto |

**Obiettivi tipici**: Accesso tramite token non scaduti, backdoor in contenuti.

#### TA6: Moderatore Compromesso

| Attributo | Descrizione |
|-----------|-------------|
| **Motivazione** | Estorsione, ideologia, coercizione |
| **Capacita** | Alta, accesso privilegiato |
| **Risorse** | Pannello moderazione, visibilita contenuti |
| **Risk Level** | Alto (insider threat) |

**Obiettivi tipici**: Cancellazione tracce, accesso dati sensibili, manipolazione decisioni.

#### TA7: Admin Insider Threat

| Attributo | Descrizione |
|-----------|-------------|
| **Motivazione** | Economico, ideologico, coercizione esterna |
| **Capacita** | Molto alta, accesso completo |
| **Risorse** | Accesso database, configurazione, log |
| **Risk Level** | Critico |

**Obiettivi tipici**: Esfiltrazione massiva dati, manipolazione sistema, backdoor.

#### TA8: Attaccante Esterno Organizzato

| Attributo | Descrizione |
|-----------|-------------|
| **Motivazione** | Economico (ransomware, estorsione), ideologico |
| **Capacita** | Molto alta, strumenti sofisticati |
| **Risorse** | Botnet, 0-day budget, team |
| **Risk Level** | Alto (ma probabilita bassa per target niche) |

**Obiettivi tipici**: Data breach, ransomware, defacement, cryptomining.

#### TA9: Forze dell'Ordine / Richieste Legali

| Attributo | Descrizione |
|-----------|-------------|
| **Motivazione** | Indagine legittima, richiesta dati |
| **Capacita** | N/A - canali legali |
| **Risorse** | Ordinanze, mandati |
| **Risk Level** | Medio (gestione processo) |

**Obiettivi tipici**: Richiesta dati memoriali, conservazione evidenza.

### 4.2 Threat Actor Capability Matrix

| Attore | Knowledge | Access | Resources | Stealth | Overall |
|--------|-----------|--------|-----------|---------|---------|
| TA1 Anonimo | Low | None | Low | Low | Low |
| TA2 Registrato mal. | Medium | User | Medium | Medium | Medium |
| TA3 Memoriale abusivo | Medium | User | Medium | Low-Med | Medium |
| TA4 Familiare conflittuale | High | User+ | High | High | **High** |
| TA5 Ex-membro | Medium | Residual | Low | Medium | Medium |
| TA6 Moderatore comp. | High | Privileged | Medium | High | **High** |
| TA7 Admin insider | Very High | Full | High | Very High | **Critical** |
| TA8 Attaccante esterno | Very High | None-Full | Very High | Medium | **High** |
| TA9 Forze ordine | N/A | Legal | Legal | N/A | N/A |

---

## 5. Threat Analysis STRIDE

### 5.1 Spoofing (S)

> **Definizione**: Falsificazione dell'identita di un utente, sistema o entita.

---

#### T1: Impersonificazione Familiare per Controllo Memoriale

| Attributo | Valore |
|-----------|--------|
| **ID** | T1-SPOOF-001 |
| **Categoria** | Spoofing |
| **Threat Actor** | TA3 (Memoriale abusivo), TA4 (Familiare conflittuale) |
| **Asset Target** | Dati defunto, controllo memoriale |
| **Description** | Un attaccante si presenta come familiare legittimo del defunto per ottenere il ruolo di custode o gestore del memoriale. Utilizza documenti falsi o reali rubati per superare la verifica identita. |
| **Prerequisites** | Accesso a documenti dell'utente; conoscenza basica del processo di verifica |
| **Attack Path** | 1. Creazione account → 2. Richiesta ruolo custode → 3. Upload documenti falsi/rubati → 4. Attesa approvazione → 5. Accesso completo al memoriale |

**Impact Analysis**:
- Compromissione completa del memoriale
- Modifica biografia, rimozione contenuti
- Pubblicazione contenuti offensivi in nome della famiglia
- Danno reputazionale irreversibile
- Esposizione legale per la piattaforma (art. 9 GDPR)

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T1-M1 | Verifica documentale a due livelli | Operatore umano + cross-check database | Alta |
| T1-M2 | Richiesta di documenti multipli | CI + certificato decesso + prova relazione | Alta |
| T1-M3 | Cooldown 48h tra richiesta e approvazione | Implementato in workflow | Media |
| T1-M4 | Notifica a tutti i custodi esistenti | Email automatica con opzione contestazione | Alta |
| T1-M5 | Limitazione modifiche per prime 72h | Rate limiting su cambiamenti significativi | Media |
| T1-M6 | Audit trail completo verifica | Ogni documento, reviewer, decisione loggata | Alta |

---

#### T2: Account Takeover tramite Credential Stuffing

| Attributo | Valore |
|-----------|--------|
| **ID** | T2-SPOOF-002 |
| **Categoria** | Spoofing |
| **Threat Actor** | TA1, TA2, TA3, TA8 |
| **Asset Target** | Account utente, memoriali gestiti |
| **Description** | Utilizzo di credenziali leakate da altri breach per accedere agli account della piattaforma. Sfrutta il riuso di password comune. |

**Impact Analysis**:
- Accesso non autorizzato a memoriali privati
- Furto di contenuti personali
- Modifica o cancellazione contenuti
- Impersonificazione del familiare

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T2-M1 | Rate limiting login | Max 5 tentativi / 15 min per IP+email | Alta |
| T2-M2 | Check password against known breaches | Integrazione HaveIBeenPwned API | Alta |
| T2-M3 | MFA obbligatorio per custodi | TOTP via app autenticatore | Molto Alta |
| T2-M4 | Email notification su nuovo dispositivo | Alert automatico con link revoca | Alta |
| T2-M5 | Password policy robusta | Min 12 char, complessita, no common | Media |
| T2-M6 | Session binding | Token legato a fingerprint browser | Media |

---

#### T3: Email Spoofing per Verifica Custodia

| Attributo | Valore |
|-----------|--------|
| **ID** | T3-SPOOF-003 |
| **Categoria** | Spoofing |
| **Threat Actor** | TA2, TA3 |
| **Asset Target** | Processo di verifica email |
| **Description** | Manipolazione del canale email per intercettare o reindirizzare le comunicazioni di verifica. Compromissione account email del familiare. |

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T3-M1 | SPF/DKIM/DMARC su dominio | Configurazione DNS strict reject | Alta |
| T3-M2 | Link di verifica one-time | Token casuale 256-bit, expiry 24h | Alta |
| T3-M3 | Conferma out-of-band per cambio email | Richiesta MFA o contatto telefonico | Alta |
| T3-M4 | Logging completo invii email | Tracciamento apertura, click (privacy-safe) | Media |

---

### 5.2 Tampering (T)

> **Definizione**: Modifica non autorizzata di dati, contenuti o configurazioni.

---

#### T4: Modifica Non Autorizzata Biografia del Defunto

| Attributo | Valore |
|-----------|--------|
| **ID** | T4-TAMP-001 |
| **Categoria** | Tampering |
| **Threat Actor** | TA2, TA4 |
| **Asset Target** | Biografia/storia del defunto |
| **Description** | Un utente con accesso legittimo (o compromesso) modifica la biografia del defunto con informazioni false, offensive o fuorvianti. |

**Impact Analysis**:
- Danno reputazionale alla memoria della persona
- Dolore alle famiglie
- Disinformazione pubblica

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T4-M1 | Versionamento contenuti | Ogni modifica salvata con autore e timestamp | Molto Alta |
| T4-M2 | Approvazione multipla per modifiche significative | 2 custodi devono approvare | Alta |
| T4-M3 | Notifica immediata a tutti i custodi | Email + in-app notification | Alta |
| T4-M4 | Rollback immediato (24h) | Qualsiasi custode puo annullare | Alta |
| T4-M5 | Moderazione automatica contenuti | Keyword filtering, sentiment analysis | Media |

---

#### T5: Alterazione Contenuti dopo Approvazione

| Attributo | Valore |
|-----------|--------|
| **ID** | T5-TAMP-002 |
| **Categoria** | Tampering |
| **Threat Actor** | TA6 (Moderatore), TA7 (Admin) |
| **Asset Target** | Contenuti in stato approvato |
| **Description** | Un moderatore o admin altera il contenuto dopo l'approvazione, modificando testi o sostituendo media. |

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T5-M1 | Hash SHA-256 di ogni contenuto | Verifica integrita ad ogni accesso | Alta |
| T5-M2 | Storage WORM (Write Once Read Many) | Versionamento immutabile storage | Alta |
| T5-M3 | Dual-control per modifiche admin | Richiesta approvazione secondo admin | Alta |
| T5-M4 | Alert su modifiche post-approvazione | SIEM rule automatica | Alta |

---

#### T6: Manipolazione Audit Log

| Attributo | Valore |
|-----------|--------|
| **ID** | T6-TAMP-003 |
| **Categoria** | Tampering |
| **Threat Actor** | TA7 (Admin insider) |
| **Asset Target** | Audit logs |
| **Description** | Cancellazione o modifica dei log di audit per nascondere tracce di attivita malevola. |

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T6-M1 | Append-only log | PostgreSQL con permessi di sola scrittura | Alta |
| T6-M2 | Esportazione log remota in tempo reale | Stream a sistema esterno immutabile | Molto Alta |
| T6-M3 | Hash chain su log entries | Ogni entry include hash della precedente | Molto Alta |
| T6-M4 | Monitoraggio accesso tabelle log | Alert su SELECT/DELETE anomali | Alta |

---

#### T7: Modifica Stato Moderazione

| Attributo | Valore |
|-----------|--------|
| **ID** | T7-TAMP-004 |
| **Categoria** | Tampering |
| **Threat Actor** | TA6 (Moderatore) |
| **Asset Target** | Flag moderazione contenuti |
| **Description** | Manipolazione dello stato di moderazione per far approvare contenuti illeciti o bloccare contenuti legittimi. |

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T7-M1 | Stato moderazione immutabile via RLS | UPDATE solo tramite stored procedure | Alta |
| T7-M2 | Log separato per ogni cambio stato | Tabella moderation_audit | Alta |
| T7-M3 | Review random periodica | Campionamento 10% decisioni moderatore | Media |
| T7-M4 | Separazione dei compiti | Un moderatore non puo approvare i propri flag | Alta |

---

### 5.3 Repudiation (R)

> **Definizione**: Negazione di aver eseguito un'azione, impedendo il tracing.

---

#### T8: Negazione Azioni di Moderazione

| Attributo | Valore |
|-----------|--------|
| **ID** | T8-REPU-001 |
| **Categoria** | Repudiation |
| **Threat Actor** | TA6 (Moderatore) |
| **Asset Target** | Decisioni di moderazione |
| **Description** | Un moderatore nega di aver approvato/rifiutato un contenuto contestato. |

**Mitigazione**:
- Audit log firmato con ID moderatore e timestamp
- Screenshot del contenuto al momento della decisione
- Motivazione obbligatoria per ogni decisione
- Impossibilita di cancellare decisioni

---

#### T9: Negazione Pubblicazione Contenuto Offensivo

| Attributo | Valore |
|-----------|--------|
| **ID** | T9-REPU-002 |
| **Categoria** | Repudiation |
| **Threat Actor** | TA2 (Utente malintenzionato) |
| **Asset Target** | Contenuti pubblicati |
| **Description** | Utente nega di aver pubblicato un contenuto offensivo, sostenendo account compromesso. |

**Mitigazione**:
- Session binding con fingerprint device
- IP logging (anonimizzato dopo 90 giorni)
- Timestamping affidabile (NTP-synced)
- Audit trail completo della sessione

---

### 5.4 Information Disclosure (I)

> **Definizione**: Esposizione non autorizzata di informazioni a utenti non privilegiati.

---

#### T10: Accesso a Memoriale Privato

| Attributo | Valore |
|-----------|--------|
| **ID** | T10-INFO-001 |
| **Categoria** | Information Disclosure |
| **Threat Actor** | TA1, TA8 |
| **Asset Target** | Memoriali con visibilita ristretta |
| **Description** | Bypass dei controlli di accesso per visualizzare memoriali configurati come privati. |

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T10-M1 | RLS strict su ogni query | `memorials.user_id = auth.uid()` | Molto Alta |
| T10-M2 | No API endpoint che bypassano RLS | Verifica code review obbligatoria | Alta |
| T10-M3 | Test automatici RLS | Suite di test per ogni policy | Alta |
| T10-M4 | Penetration testing semestrale | Audit esterno | Alta |

---

#### T11: Leak Contenuti in Quarantena

| Attributo | Valore |
|-----------|--------|
| **ID** | T11-INFO-002 |
| **Categoria** | Information Disclosure |
| **Threat Actor** | TA6 (Moderatore) |
| **Asset Target** | Contenuti sotto moderazione |
| **Description** | Esfiltrazione di contenuti segnalati o in quarantena da parte di personale con accesso. |

**Mitigazione**:
- Accesso ai contenuti quarantena solo con giustificazione
- Watermark automatico sui contenuti visualizzati in moderazione
- Logging di ogni accesso a contenuti quarantena
- Cifratura aggiuntiva per contenuti sensibili in moderazione

---

#### T12: Enumerazione Utenti

| Attributo | Valore |
|-----------|--------|
| **ID** | T12-INFO-003 |
| **Categoria** | Information Disclosure |
| **Threat Actor** | TA1, TA8 |
| **Asset Target** | Elenco utenti registrati |
| **Description** | Raccolta sistematica di email o nomi utente tramite timing attacks, errori diversi per user esistente/non esistente, o endpoint pubblici. |

**Mitigazione**:
- Messaggio generico per login falliti ("Credenziali non valide")
- Rate limiting su endpoint di registrazione
- Nega esistenza email in reset password
- Disabilita endpoint di listing utenti pubblici

---

#### T13: Scraping Massivo Memoriali

| Attributo | Valore |
|-----------|--------|
| **ID** | T13-INFO-004 |
| **Categoria** | Information Disclosure |
| **Threat Actor** | TA1, TA8 |
| **Asset Target** | Tutti i memoriali pubblici |
| **Description** | Estrazione automatizzata di tutti i dati dei memoriali pubblici tramite bot. |

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T13-M1 | Rate limiting avanzato | Max 30 req/min per IP, 100 per user | Alta |
| T13-M2 | CAPTCHA su accessi ripetuti | hCaptcha dopo 50 req in 5 min | Alta |
| T13-M3 | Bot detection | Fingerprinting, behavior analysis | Media |
| T13-M4 | Terms of Service espliciti | Divieto di scraping, base legale per azioni | Bassa |
| T13-M5 | API keys obbligatorie per accesso programmatico | Revocabili, rate-limited | Alta |

---

#### T14: Leak Dati in Log

| Attributo | Valore |
|-----------|--------|
| **ID** | T14-INFO-005 |
| **Categoria** | Information Disclosure |
| **Threat Actor** | TA7 (Admin con accesso log) |
| **Asset Target** | File di log applicativi |
| **Description** | Logging accidentale di dati sensibili (PII, password, token) nei log di sistema. |

**Mitigazione**:
- Policy no-PII in log: filtraggio automatico
- Scansione automatica log pre-commit
- Classificazione dati: redazione automatica campi sensibili
- Accesso log solo a ruolo dedicato Security

---

### 5.5 Denial of Service (DoS)

> **Definizione**: Impedimento del servizio agli utenti legittimi.

---

#### T15: Upload Massivo File

| Attributo | Valore |
|-----------|--------|
| **ID** | T15-DOS-001 |
| **Categoria** | Denial of Service |
| **Threat Actor** | TA1, TA2 |
| **Asset Target** | Storage, bandwidth |
| **Description** | Caricamento di file di grandi dimensioni o in grande quantita per esaurire risorse storage. |

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T15-M1 | Limite dimensione singolo file | Max 50MB foto, 200MB video | Alta |
| T15-M2 | Limite upload giornaliero | Max 100 file / utente / giorno | Alta |
| T15-M3 | Quota storage per utente | Max 2GB base, 10GB premium | Alta |
| T15-M4 | Scan virus/malware | ClamAV su ogni upload | Alta |
| T15-M5 | Rate limiting upload | Max 10 upload / minuto | Alta |

---

#### T16: Spam Contenuti

| Attributo | Valore |
|-----------|--------|
| **ID** | T16-DOS-002 |
| **Categoria** | Denial of Service |
| **Threat Actor** | TA1, TA2 |
| **Asset Target** | Qualita dei memoriali, moderazione |
| **Description** | Pubblicazione massiva di contenuti spam su memoriali (pubblicita, link, messaggi). |

**Mitigazione**:
- Rate limiting su creazione contenuti
- Filtro keyword per spam noto
- Reputazione utente: account nuovi hanno limiti maggiori
- Auto-moderazione: contenuti sospetti vanno in quarantena

---

#### T17: Brigading Segnalazioni

| Attributo | Valore |
|-----------|--------|
| **ID** | T17-DOS-003 |
| **Categoria** | Denial of Service |
| **Threat Actor** | TA2, TA4 |
| **Asset Target** | Sistema di moderazione |
| **Description** | Coordinamento di massa per segnalare falsamente un contenuto/memoriale legittimo, sovraccaricando il sistema di moderazione. |

**Mitigazione**:
- Ponderazione segnalazioni: utenti affidabili vs. nuovi
- Max segnalazioni per utente / giorno
- Analisi pattern segnalazioni (stesso target, stesso timestamp)
- Escalation umana solo dopo filtri automatici

---

### 5.6 Elevation of Privilege (E)

> **Definizione**: Ottenimento di permessi superiori a quelli assegnati.

---

#### T18: Escalation da Collaboratore a Custode

| Attributo | Valore |
|-----------|--------|
| **ID** | T18-ELEV-001 |
| **Categoria** | Elevation of Privilege |
| **Threat Actor** | TA2 (Utente malintenzionato) |
| **Asset Target** | Ruolo utente nel memoriale |
| **Description** | Un collaboratore con permessi limitati trova un modo per elevarsi a custode, ottenendo pieno controllo. |

**Mitigazione**:
- RLS controlla il ruolo su ogni operazione
- Cambio ruolo richiede approvazione custode esistente
- Stored procedure per cambio ruolo, non UPDATE diretto
- Audit log di ogni cambio ruolo

---

#### T19: Bypass RLS tramite SQL Injection

| Attributo | Valore |
|-----------|--------|
| **ID** | T19-ELEV-002 |
| **Categoria** | Elevation of Privilege |
| **Threat Actor** | TA2, TA8 |
| **Asset Target** | Database, tutti i dati |
| **Description** | Sfruttamento di vulnerabilita SQL injection nelle Edge Functions o query client per bypassare le Row Level Security. |

**Mitigazione**:

| ID | Controllo | Implementazione | Efficacia |
|----|-----------|-----------------|-----------|
| T19-M1 | Query parameterizzate esclusive | Nessuna concatenazione SQL | Molto Alta |
| T19-M2 | ORM/Query builder verificato | Uso esclusivo Supabase client | Alta |
| T19-M3 | RLS sempre abilitata | `ALTER TABLE ... FORCE ROW LEVEL SECURITY` | Molto Alta |
| T19-M4 | Penetration testing SQLi | Test semestrali con sqlmap/burp | Alta |
| T19-M5 | WAF/Filter in ingresso | Regole per pattern SQLi comuni | Media |
| T19-M6 | Principio del minimo privilegio | DB user con permessi minimi | Alta |

---

#### T20: Modifica Ruoli tramite Mass Assignment

| Attributo | Valore |
|-----------|--------|
| **ID** | T20-ELEV-003 |
| **Categoria** | Elevation of Privilege |
| **Threat Actor** | TA2 |
| **Asset Target** | Endpoint API aggiornamento profilo |
| **Description** | Manipolazione del payload JSON per includere campi non esposti (es. `role`, `is_admin`) durante l'aggiornamento del profilo. |

**Mitigazione**:
- Whitelist campi aggiornabili per endpoint
- RLS impedisce modifiche a campi privilegiati
- Validazione schema (Zod) su ogni input
- Campi sensibili esclusi dal DTO di update

---

## 6. Risk Matrix

### 6.1 Scala di Valutazione

**Probabilita**:

| Valore | Livello | Descrizione |
|--------|---------|-------------|
| 1 | Rara | < 1% / anno, exploit complesso |
| 2 | Improbabile | 1-10% / anno, condizioni specifiche |
| 3 | Possibile | 10-50% / anno, attaccante motivato |
| 4 | Probabile | 50-80% / anno, tooling pubblico |
| 5 | Quasi certa | > 80% / anno, attacco banale |

**Impatto**:

| Valore | Livello | Descrizione |
|--------|---------|-------------|
| 1 | Negligibile | Nessun danno significativo |
| 2 | Minore | Impatto limitato, recupero rapido |
| 3 | Moderato | Danno reputazionale, sanzioni minori |
| 4 | Maggiore | Data breach, sanzioni GDPR significative |
| 5 | Catastrofico | Breach massivo, chiusura piattaforma |

**Risk Score = Probabilita x Impatto**:

| Score | Rating | Azione |
|-------|--------|--------|
| 1-4 | Basso | Accettare, monitorare |
| 5-9 | Medio | Mitigare entro 90 giorni |
| 10-16 | Alto | Mitigare entro 30 giorni |
| 17-25 | Critico | Mitigare immediatamente |

### 6.2 Risk Matrix Completa

| Threat ID | Categoria | Threat | Prob. | Impatto | Score | Rating |
|-----------|-----------|--------|-------|---------|-------|--------|
| T1 | Spoofing | Impersonificazione familiare | 3 | 5 | **15** | **Critico** |
| T2 | Spoofing | Account takeover credential stuffing | 4 | 4 | **16** | **Critico** |
| T3 | Spoofing | Email spoofing verifica | 2 | 4 | **8** | **Medio** |
| T4 | Tampering | Modifica biografia non autorizzata | 3 | 4 | **12** | **Alto** |
| T5 | Tampering | Alterazione contenuti post-approvazione | 2 | 4 | **8** | **Medio** |
| T6 | Tampering | Manipolazione audit log | 1 | 5 | **5** | **Medio** |
| T7 | Tampering | Modifica stato moderazione | 2 | 3 | **6** | **Medio** |
| T8 | Repudiation | Negazione azioni moderazione | 2 | 3 | **6** | **Medio** |
| T9 | Repudiation | Negazione pubblicazione offensiva | 3 | 3 | **9** | **Medio** |
| T10 | Info Disclosure | Accesso memoriale privato | 2 | 5 | **10** | **Alto** |
| T11 | Info Disclosure | Leak contenuti quarantena | 2 | 4 | **8** | **Medio** |
| T12 | Info Disclosure | Enumerazione utenti | 3 | 3 | **9** | **Medio** |
| T13 | Info Disclosure | Scraping massivo | 4 | 3 | **12** | **Alto** |
| T14 | Info Disclosure | Leak dati in log | 3 | 4 | **12** | **Alto** |
| T15 | DoS | Upload massivo file | 3 | 2 | **6** | **Medio** |
| T16 | DoS | Spam contenuti | 4 | 2 | **8** | **Medio** |
| T17 | DoS | Brigading segnalazioni | 3 | 2 | **6** | **Medio** |
| T18 | Elevation | Escalation collaboratore→custode | 2 | 4 | **8** | **Medio** |
| T19 | Elevation | Bypass RLS SQL injection | 2 | 5 | **10** | **Alto** |
| T20 | Elevation | Mass assignment ruoli | 2 | 4 | **8** | **Medio** |

### 6.3 Risk Heat Map

```
Impatto
  5 | [T6]        [T1] [T2] [T10] [T19]
  4 |             [T4] [T5] [T11] [T14] [T18] [T20]
  3 |        [T7][T8] [T9] [T12] [T13]
  2 |   [T15] [T16] [T17]
  1 |
    +-----------------------------------
      1    2    3    4    5
              Probabilita

Legenda: Score >= 10 (Alto/Critico) evidenziato
```

### 6.4 Threat Prioritizzati (Score >= 10)

| Rank | Threat | Score | Categoria | Deadline Mitigazione |
|------|--------|-------|-----------|---------------------|
| 1 | T2 Account takeover | 16 | Spoofing | Immediata |
| 2 | T1 Impersonificazione | 15 | Spoofing | Immediata |
| 3 | T10 Accesso memoriale privato | 10 | Info Disclosure | 30 giorni |
| 3 | T19 Bypass RLS SQLi | 10 | Elevation | 30 giorni |
| 5 | T4 Modifica biografia | 12 | Tampering | 30 giorni |
| 5 | T13 Scraping massivo | 12 | Info Disclosure | 30 giorni |
| 5 | T14 Leak dati in log | 12 | Info Disclosure | 30 giorni |

---

## 7. Countermeasures

### 7.1 Counterme per Threat Prioritizzati

#### T1: Impersonificazione Familiare

| Controllo | Stato | Owner | Deadline | Verifica |
|-----------|-------|-------|----------|----------|
| Verifica documentale a due livelli | Da implementare | Security | T+14d | Review manuale |
| Cooldown 48h approvazione | Da implementare | Dev | T+7d | Test automatico |
| Notifica contestazione custodi | Da implementare | Dev | T+14d | Test E2E |
| Rate limiting modifiche 72h | Da implementare | Dev | T+14d | Pen test |

#### T2: Account Takeover

| Controllo | Stato | Owner | Deadline | Verifica |
|-----------|-------|-------|----------|----------|
| MFA obbligatorio custodi | Da implementare | Security | T+7d | Audit config |
| Check password HIBP | Da implementare | Dev | T+7d | Test unit |
| Rate limiting login | Da implementare | Dev | T+3d | Stress test |
| Alert nuovo dispositivo | Da implementare | Dev | T+14d | Test E2E |

#### T10: Accesso Memoriale Privato

| Controllo | Stato | Owner | Deadline | Verifica |
|-----------|-------|-------|----------|----------|
| RLS strict con FORCE | Da implementare | Dev | T+7d | SQL audit |
| Test automatici RLS | Da implementare | QA | T+14d | CI/CD pipeline |
| Pen test semestrale | Pianificato | Security | T+90d | Report esterno |

#### T19: Bypass RLS SQL Injection

| Controllo | Stato | Owner | Deadline | Verifica |
|-----------|-------|-------|----------|----------|
| FORCE ROW LEVEL SECURITY | Da implementare | Dev | T+3d | Config audit |
| Query parameterizzate 100% | Da implementare | Dev | T+7d | Code review |
| Pen test SQLi | Pianificato | Security | T+30d | Report esterno |

### 7.2 Security Controls Catalog

#### Autenticazione

| ID | Controllo | Livello | Implementazione |
|----|-----------|---------|-----------------|
| AC-01 | Password policy | Alta | Min 12 char, complessita, HIBP check |
| AC-02 | MFA | Alta | TOTP obbligatorio per custodi |
| AC-03 | Rate limiting login | Alta | 5 tentativi / 15 min |
| AC-04 | Session management | Alta | JWT 1h, refresh rotation, binding |
| AC-05 | Password reset | Media | Token 256-bit, expiry 1h, one-time |

#### Autorizzazione

| ID | Controllo | Livello | Implementazione |
|----|-----------|---------|-----------------|
| AZ-01 | RLS su tutte le tabelle | Critica | FORCE ROW LEVEL SECURITY |
| AZ-02 | RBAC a 4 livelli | Alta | admin, custode, collaboratore, visitatore |
| AZ-03 | Principle of least privilege | Alta | DB user minimi per Edge Functions |
| AZ-04 | Approvazione multipla | Alta | 2 custodi per modifiche critiche |

#### Audit

| ID | Controllo | Livello | Implementazione |
|----|-----------|---------|-----------------|
| AU-01 | Audit log append-only | Critica | Tabella con permessi restrictivi |
| AU-02 | Hash chain log | Alta | SHA-256 concatenato |
| AU-03 | Esportazione remota | Alta | Stream in tempo reale |
| AU-04 | Versionamento contenuti | Alta | Ogni modifica salvata |
| AU-05 | Immutabilita 10 anni | Alta | Policy retention |

#### Input Validation

| ID | Controllo | Livello | Implementazione |
|----|-----------|---------|-----------------|
| IV-01 | Parameterized queries | Critica | Nessuna concatenazione SQL |
| IV-02 | Schema validation | Alta | Zod su ogni input |
| IV-03 | File type validation | Alta | Magic number, non solo extension |
| IV-04 | Content sanitization | Alta | DOMPurify per HTML, escape output |
| IV-05 | Rate limiting API | Alta | Per endpoint, per user, per IP |

#### Infrastructure

| ID | Controllo | Livello | Implementazione |
|----|-----------|---------|-----------------|
| INF-01 | HTTPS everywhere | Critica | TLS 1.3, HSTS |
| INF-02 | CSP headers | Alta | Policy strict, report-uri |
| INF-03 | CORS restrictivo | Alta | Solo domini autorizzati |
| INF-04 | Backup cifrati | Alta | Cifratura AES-256, retention 30d |
| INF-05 | Monitoring | Alta | Alert anomalie in tempo reale |

---

## 8. Residual Risk

### 8.1 Matrice Risk Treatment

| Threat | Risk Originale | Trattamento | Risk Residuale | Giustificazione |
|--------|---------------|-------------|----------------|-----------------|
| T1 Impersonificazione | 15 Critico | Mitigare | 6 Medio | Verifica doc + cooldown + notifica |
| T2 Account takeover | 16 Critico | Mitigare | 4 Basso | MFA + HIBP + rate limiting |
| T3 Email spoofing | 8 Medio | Mitigare | 3 Basso | SPF/DKIM/DMARC + token sicuri |
| T4 Modifica biografia | 12 Alto | Mitigare | 4 Basso | Versionamento + approvazione multipla |
| T5 Alterazione contenuti | 8 Medio | Mitigare | 3 Basso | Hash + WORM + dual-control |
| T6 Manipolazione log | 5 Medio | Mitigare | 2 Basso | Append-only + hash chain + export |
| T7 Modifica moderazione | 6 Medio | Mitigare | 3 Basso | RLS + moderation_audit + separazione |
| T8 Negazione moderazione | 6 Medio | Mitigare | 2 Basso | Log firmato + motivazione obbligatoria |
| T9 Negazione pubblicazione | 9 Medio | Mitigare | 3 Basso | Session binding + audit trail |
| T10 Accesso memoriale privato | 10 Alto | Mitigare | 2 Basso | RLS strict + test automatici |
| T11 Leak quarantena | 8 Medio | Mitigare | 3 Basso | Accesso giustificato + watermark |
| T12 Enumerazione utenti | 9 Medio | Mitigare | 3 Basso | Messaggi generici + rate limiting |
| T13 Scraping | 12 Alto | Mitigare | 6 Medio | Rate limiting + CAPTCHA + bot detection |
| T14 Leak dati in log | 12 Alto | Mitigare | 3 Basso | No-PII policy + redazione automatica |
| T15 Upload massivo | 6 Medio | Mitigare | 2 Basso | Limiti dimensione/quota/rate |
| T16 Spam | 8 Medio | Mitigare | 4 Basso | Rate limiting + filtri + reputazione |
| T17 Brigading | 6 Medio | Mitigare | 3 Basso | Ponderazione segnalazioni + pattern |
| T18 Escalation ruoli | 8 Medio | Mitigare | 2 Basso | RLS + stored procedure + audit |
| T19 Bypass RLS SQLi | 10 Alto | Mitigare | 2 Basso | Parameterized queries + FORCE RLS |
| T20 Mass assignment | 8 Medio | Mitigare | 2 Basso | Whitelist + RLS + schema validation |

### 8.2 Risk Acceptance

| ID | Risk Accettato | Livello | Giustificazione | Review |
|----|---------------|---------|----------------|--------|
| RA-01 | T13 Scraping residuo | Medio | Impossibile eliminare completamente; controlli riducono a volume gestibile | Trimestrale |
| RA-02 | Familiare conflittuale (TA4) | Alto* | Accesso legittimo con documenti reali; mitigato con governance | Per caso |

*Il risk del familiare conflittuale e intrinseco al modello di business e non puo essere eliminato tecnologicamente. Richiede processi di governance e moderazione umana.

### 8.3 Risk Transferred

| ID | Risk Trasferito | A chi | Come |
|----|----------------|-------|------|
| RT-01 | Infrastruttura cloud | Supabase | SLA contrattuale, SOC2, DPA |
| RT-02 | Data breach insurance | Assicurazione | Cyber insurance policy |
| RT-03 | Penetration testing | Vendor esterno | Contratto con security firm |

### 8.4 Risk Summary

```
Prima della mitigazione:
  Critico:  2  ████████████████████
  Alto:     5  ███████████████
  Medio:   13  ████████
  Basso:    0

Dopo la mitigazione:
  Critico:  0
  Alto:     0
  Medio:    2  ██ (T13 scraping, TA4 familiare conflittuale)
  Basso:   18  ████████████████
```

---

## 9. Appendici

### 9.1 Glossario

| Termine | Definizione |
|---------|-------------|
| **RLS** | Row Level Security - controllo accesso a livello di riga database |
| **MFA** | Multi-Factor Authentication |
| **TOTP** | Time-based One-Time Password |
| **HIBP** | Have I Been Pwned - database password leakate |
| **WORM** | Write Once Read Many - storage immutabile |
| **DPA** | Data Processing Agreement |
| **SIEM** | Security Information and Event Management |
| **E2E** | End-to-End testing |

### 9.2 Riferimenti

| Documento | Versione | Link |
|-----------|----------|------|
| OWASP ASVS | 4.0 | https://github.com/OWASP/ASVS |
| OWASP Top 10 2021 | 2021 | https://owasp.org/Top10/ |
| GDPR Art. 9 | Reg. 2016/679 | Dati personali particolari |
| NIST SP 800-30 | Rev. 1 | Risk Assessment Guide |
| STRIDE Reference | Microsoft | https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats |

### 9.3 Revision History

| Versione | Data | Autore | Modifiche |
|----------|------|--------|-----------|
| 1.0 | 2025-01-15 | Security Team | Versione iniziale |

---

**FINE DOCUMENTO**

*Questo documento e classificato CONFIDENZIALE. Distribuzione limitata al Security Team e ai Dev Lead.*
