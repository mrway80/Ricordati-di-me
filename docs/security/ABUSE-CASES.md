# Abuse Case Analysis - Piattaforma "Ricordati di Te"

**Versione**: 1.0  
**Data**: 2025-01-15  
**Classificazione**: CONFIDENZIALE  
**Autore**: Security Team  

---

## 1. Indice

1. [Introduzione](#2-introduzione)
2. [Casi di Abuso](#3-casi-di-abuso)
   - [AC-01: Creazione Abusiva Memoriali](#ac-01-creazione-abusiva-memoriali)
   - [AC-02: Appropriazione Identita](#ac-02-appropriazione-identita)
   - [AC-03: Contenuti Offensivi](#ac-03-contenuti-offensivi)
   - [AC-04: Spam e Promozioni](#ac-04-spam-e-promozioni)
   - [AC-05: Raccolte Fondi Abusive](#ac-05-raccolte-fondi-abusive)
   - [AC-06: Molestie tra Familiari](#ac-06-molestie-tra-familiari)
   - [AC-07: Memoriali di Minori](#ac-07-memoriali-di-minori)
   - [AC-08: Doxxing](#ac-08-doxxing)
3. [Detection Matrix](#4-detection-matrix)
4. [Mitigation Controls](#5-mitigation-controls)
5. [Appendici](#6-appendici)

---

## 2. Introduzione

### 2.1 Scopo

Il presente documento analizza i casi di abuso specifici della piattaforma "Ricordati di Te" e definisce strategie di detection, mitigazione, escalation e ricorso per ciascuno scenario. Il documento si integra con il Threat Model STRIDE e fornisce indicazioni operative per il team di moderazione e sviluppo.

### 2.2 Contesto Specifico

La natura memoriale della piattaforma crea una superficie di attacco unica:
- I soggetti del memoriale non possono piu fornire consenso
- I familiari possono avere rapporti conflittuali
- I contenuti hanno un alto valore emotivo e sono irripetibili
- La creazione di un memoriale non richiede il consenso della persona deceduta

### 2.3 Principi Guida

| ID | Principio |
|----|-----------|
| P1 | La dignita del defunto e prioritaria rispetto alla liberta di espressione |
| P2 | Il consenso dei familiari stretti e richiesto per ogni memoriale |
| P3 | La verifica dell'identita e fondamentale per l'assegnazione del ruolo di custode |
| P4 | Ogni decisione deve essere tracciata e reversibile |
| P5 | Il ricorso deve essere sempre disponibile e tempestivo |

---

## 3. Casi di Abuso

---

### AC-01: Creazione Abusiva Memoriali

#### Informazioni Generali

| Attributo | Valore |
|-----------|--------|
| **ID** | AC-01 |
| **Categoria** | Identita / Autorizzazione |
| **Severita** | CRITICA |
| **Threat Actor** | TA3 (Memoriale abusivo), TA1 (Troll) |
| **Asset Target** | Reputazione defunto, privacy famiglia |
| **Frequenza stimata** | 2-5 casi / mese (scala iniziale) |

#### Scenario Dettagliato

```
ATTACCANTE: Utente non collegato alla famiglia
VITTIMA: Persona deceduta + familiari
OBIETTIVO: Creare un memoriale senza autorizzazione

Scenario A - Trolling:
  Un utente crea un memoriale per una persona di cui non e parente,
  magari una persona pubblica o una vittima di un evento noto,
  per attirare attenzione o causare disagio.

Scenario B - Estorsione:
  Un utente crea un memoriale per una persona deceduta e poi
  contatta la famiglia chiedendo pagamento per trasferire la
  custodia o rimuovere il memoriale.

Scenario C - Cyberstalking:
  Un ex partner o conoscente crea un memoriale come forma di
  morboso attaccamento o per tormentare i familiari.

Scenario D - Persona pubblica:
  Creazione non autorizzata del memoriale di una figura pubblica
  da parte di fan o haters.
```

#### Detection

| Metodo | Descrizione | Priorita |
|--------|-------------|----------|
| D-01 | Documento identita non corrisponde a cognome del defunto | Alta |
| D-02 | IP geolocalizzazione discorde con luogo decesso/residenza | Media |
| D-03 | Account creato immediatamente prima della richiesta memoriale | Media |
| D-04 | Segnalazione da parte di familiari o conoscenti | Alta |
| D-05 | Pattern: stesso utente crea molteplici memoriali | Alta |
| D-06 | Cross-reference database decesso (ove disponibile legalmente) | Bassa |
| D-07 | Richiesta contestazione tramite form "Questo memoriale non e autorizzato" | Alta |

#### Mitigazione

| Fase | Controllo | Implementazione |
|------|-----------|-----------------|
| **Prevenzione** | Verifica documentale obbligatoria | Upload CI + certificato decesso per richiedente |
| **Prevenzione** | Prova di relazione | Documento che attesti il legame (cert. matrimonio, stato di famiglia) |
| **Prevenzione** | Cooldown 48h | Periodo obbligatorio tra creazione e pubblicazione |
| **Detection** | Review manuale | Operatore verifica ogni nuovo memoriale prima della pubblicazione |
| **Detection** | Notifica automatica | Email a indirizzi pubblici della famiglia (se reperibili) |
| **Risposta** | Form contestazione | Link visibile "Contesta questo memoriale" per chiunque |
| **Risposta** | Sospensione immediata | Al primo dubbio, il memoriale va in stato "sospeso" |
| **Risposta** | Richiesta documenti aggiuntivi | 72h per fornire prova aggiuntiva, altrimenti rimozione |

#### Escalation

```
Livello 1 (Auto): Algoritmo di rilevamento anomalie sospende memoriale
Livello 2 (Moderatore): Review manuale entro 24h dalla segnalazione
Livello 3 (Senior Moderatore): Casi ambigui, decisione finale entro 72h
Livello 4 (Legal): Minacce legali, contatto con parte legale entro 48h
Livello 5 (Dirigenza): Casi con visibilita mediatica
```

#### Ricorso

| Canale | Tempo Risposta | Procedura |
|--------|---------------|-----------|
| Form contestazione | 24h | Form online, ricevuta automatica con ticket ID |
| Email abuse@ricordatidite.it | 24h | Indirizzo dedicato, triage automatico |
| Raccomandata | 72h | Indirizzo fisico per casi legali |
| DPO (GDPR) | 30 giorni | Per violazioni privacy (art. 77 GDPR) |

#### Ricorso - Procedura Dettagliata

```
STEP 1: Ricezione segnalazione (automatico, timestamp)
STEP 2: Verifica autenticita segnalante (richiesta documento se necessario)
STEP 3: Sospensione immediata memoriale (visibilita solo al segnalante e staff)
STEP 4: Richiesta documenti al creatore del memoriale (72h deadline)
STEP 5: Valutazione da parte di 2 moderatori indipendenti
STEP 6: Decisione: conferma / rimozione / modifica
STEP 7: Comunicazione motivata a entrambe le parti
STEP 8: Possibilita di appello entro 14 giorni
STEP 9: Chiusura caso con archiviazione documenti (10 anni)
```

---

### AC-02: Appropriazione Identita

#### Informazioni Generali

| Attributo | Valore |
|-----------|--------|
| **ID** | AC-02 |
| **Categoria** | Spoofing / Identita |
| **Severita** | CRITICA |
| **Threat Actor** | TA3, TA4 |
| **Asset Target** | Controllo memoriale, identita familiare |
| **Frequenza stimata** | 1-3 casi / mese |

#### Scenario Dettagliato

```
ATTACCANTE: Persona che si spaccia per familiare
VITTIMA: Familiari legittimi, defunto
OBIETTIVO: Ottenere controllo del memoriale

Scenario A - Furto identita:
  Un malintenzionato ottiene documenti personali di un familiare
  (es. tramite phishing, furto fisico, data breach) e li usa per
  richiedere il ruolo di custode, sostituendo o aggiungendosi
  ai gestori legittimi.

Scenario B - Impersonificazione digitale:
  L'attaccante crea un account email simile a quello di un
  familiare (typosquatting) e richiede l'accesso al memoriale,
  sostenendo di aver perso l'accesso all'account originale.

Scenario C - Ex-coniuge/Partner:
  Un ex-coniuge, non piu avente diritto giuridico, utilizza
  documenti vecchi o contratti di convivenza per richiedere
  l'accesso come custode.

Scenario D - Figlio non riconosciuto:
  Un figlio non riconosciuto o estraneato richiede l'accesso
  al memoriale, creando conflitto con la famiglia nucleare.
```

#### Detection

| Metodo | Descrizione | Priorita |
|--------|-------------|----------|
| D-01 | Documento gia usato per altro account | Alta |
| D-02 | Email domain sospetto / email temporanea | Alta |
| D-03 | Richiesta da regione geografica inaspettata | Media |
| D-04 | Timing: richiesta subito dopo evento mediatico | Media |
| D-05 | Conflitto con custodi esistenti (segnalazione) | Alta |
| D-06 | Incroci tra dati forniti e database pubblici | Media |
| D-07 | Biometrica liveness check (selfie video) | Bassa (futuro) |

#### Mitigazione

| Fase | Controllo | Implementazione |
|------|-----------|-----------------|
| **Prevenzione** | MFA obbligatorio per custodi | TOTP + backup codes |
| **Prevenzione** | Verifica multi-livello | Documento + prova relazione + selfie |
| **Prevenzione** | Cooldown 7 giorni | Periodo di attesa per nuove richieste custodia |
| **Prevenzione** | Notifica a tutti i custodi | Email immediata a ogni cambio ruolo |
| **Detection** | Confronto biometrico (futuro) | Faccia su documento vs selfie |
| **Detection** | Cross-verification | Contatto telefonico al numero in pubblico registro |
| **Risposta** | Revoca immediata | Possibilita per custodi di bloccare nuove richieste |
| **Risposta** | Freeze 72h | Blocco temporaneo decisione in caso di contestazione |

#### Escalation

```
Livello 1 (Auto): Notifica a tutti i custodi esistenti per ogni richiesta
Livello 2 (Moderatore): Verifica documenti, confronto con custodi esistenti
Livello 3 (Senior Moderatore): Casi con documenti contraddittori
Livello 4 (Legal): Disputa legale tra pretendenti
Livello 5 (GDPR DPO): Se coinvolti dati personali di terzi
```

#### Ricorso

```
VIA A (Custode esistente):
  1. Riceve notifica richiesta nuovo custode
  2. Puo approvare / rifiutare / richiedere review entro 72h
  3. Se rifiuta, il richiedente puo appellarsi (Senior Moderatore)
  4. Decisione definitiva entro 14 giorni

VIA B (Richiedente rifiutato):
  1. Riceve motivazione rifiuto con dettagli
  2. Puo presentare documenti aggiuntivi entro 14 giorni
  3. Review da Senior Moderatore entro 7 giorni
  4. Decisione definitiva (non ulteriormente appellabile)
  5. Possibilita di contatto DPO per privacy concern
```

---

### AC-03: Contenuti Offensivi

#### Informazioni Generali

| Attributo | Valore |
|-----------|--------|
| **ID** | AC-03 |
| **Categoria** | Contenuto / Dignita |
| **Severita** | ALTA |
| **Threat Actor** | TA2, TA4 |
| **Asset Target** | Dignita del defunto, pace familiare |
| **Frequenza stimata** | 5-15 casi / mese |

#### Scenario Dettagliato

```
ATTACCANTE: Utente registrato (custode, collaboratore, visitatore)
VITTIMA: Defunto, familiari
OBIETTIVO: Pubblicare contenuti che vilipendono il defunto

Scenario A - Offesa postuma:
  Un collaboratore o visitatore pubblica commenti offensivi
  sulla persona deceduta, sulla sua vita, sulle sue scelte.
  Esempi: "era un bugiardo", "se l'e cercata", insulti personali.

Scenario B - Esposizione segreti:
  Pubblicazione di informazioni intime o segreti del defunto
  che la famiglia non desiderava rendere pubblici (malattie,
  orientamento sessuale, passato criminale, debiti).

Scenario C - Foto/video imbarazzanti:
  Upload di immagini o video che ritraevano la persona in
  situazioni compromettenti o private.

Scenario D - Accuse infondate:
  Pubblicazione di accuse gravi non provate (criminalita,
  abusi, tradimenti) senza fondamento.

Scenario E - Attribuzione religiosa non richiesta:
  Inserimento di simboli, preghiere o riti di una religione
  diversa da quella del defunto, contro la volonta della famiglia.
```

#### Detection

| Metodo | Descrizione | Priorita |
|--------|-------------|----------|
| D-01 | Keyword filtering automatico | Lista nera parole offensive (IT/EN) |
| D-02 | Sentiment analysis | ML model per rilevamento tono negativo estremo |
| D-03 | Segnalazioni utenti | Bottoni "Segnala contenuto inappropriato" |
| D-04 | Moderazione pre-pubblicazione | Prima pubblicazione richiede approvazione |
| D-05 | Moderazione post-pubblicazione | Campionamento contenuti pubblicati |
| D-06 | Flag automatico per nuovi utenti | Primi 3 contenuti sempre moderati |
| D-07 | Image analysis | OCR su immagini, rilevamento nudita/contenuto sensibile |

#### Mitigazione

| Fase | Controllo | Implementazione |
|------|-----------|-----------------|
| **Prevenzione** | Approvazione pre-pubblicazione | Primo contenuto di ogni utente approvato manualmente |
| **Prevenzione** | Linee guida chiare | Code of Conduct visibile in fase di pubblicazione |
| **Prevenzione** | Prompt di riflessione | "Sei sicuro? Questo contenuto rispetta la memoria di [Nome]?" |
| **Detection** | Auto-moderazione | ML model score > 0.7 → quarantena automatica |
| **Detection** | Moderatore umano | Team dedicato, formazione specifica su sensibilita memoriali |
| **Risposta** | Rimozione immediata | < 4h dalla segnalazione per contenuti gravi |
| **Risposta** | Sanzione progressiva | Avvertimento → sospensione 7d → ban permanente |
| **Risposta** | Notifica familiari | Email ai custodi per ogni rimozione contenuto dal loro memoriale |

#### Sanzioni Progressiva

| Violazione | 1a volta | 2a volta | 3a volta | Gravi |
|------------|----------|----------|----------|-------|
| Linguaggio offensivo | Avvertimento | Sosp. 7d | Ban | Ban immediato |
| Accuse infondate | Avvertimento | Sosp. 14d | Ban | Ban immediato |
| Contenuto intimo non consensuale | Sosp. 30d | Ban | Ban | Ban + legal |
| Hate speech | Ban | Ban | Ban | Ban + autorita |

#### Escalation

```
Livello 1 (Auto): Keyword filter blocca / quarantena
Livello 2 (Moderatore): Review entro 4h per contenuti segnalati
Livello 3 (Senior Moderatore): Contestazioni, contenuti ambigui
Livello 4 (Legal): Minacce, diffamazione, contenuto illegale (CSAM, etc.)
Livello 5 (Autorita): Contenuto criminalmente rilevante (report obbligatorio)
```

#### Ricorso

```
Per l'UTENTE che ha pubblicato:
  1. Notifica di rimozione con motivazione specifica
  2. 72h per presentare ricorso con motivazione
  3. Review da secondo moderatore (diverso dal primo)
  4. Decisione: conferma rimozione / ripristino
  5. Se ripristinato, annotazione nel profilo (pattern tracking)

Per i CUSTODI del memoriale:
  1. Notifica di ogni rimozione con link al contenuto
  2. Possibilita di approvare/rifiutare rimozione (override custode)
  3. Se override, responsabilita si sposta sul custode
```

---

### AC-04: Spam e Promozioni

#### Informazioni Generali

| Attributo | Valore |
|-----------|--------|
| **ID** | AC-04 |
| **Categoria** | Spam / Commerciale |
| **Severita** | MEDIA |
| **Threat Actor** | TA2, TA1 |
| **Asset Target** | Qualita contenuti, esperienza utente |
| **Frequenza stimata** | 20-50 casi / mese |

#### Scenario Dettagliato

```
ATTACCANTE: Utente con intenti commerciali
VITTIMA: Qualita del memoriale, utenti della piattaforma
OBIETTIVO: Utilizzare i memoriali per promozione commerciale

Scenario A - Servizi funebri:
  Agenzie funebri creano account e pubblicano contenuti su
  memoriali per promuovere i propri servizi.

Scenario B - Fioristi:
  Link a servizi di invio fiori in ogni commento o messaggio
  di condoglianze.

Scenario C - Fotografi/memorialisti:
  Promozione di servizi fotografici o di creazione memoriali
  fisici all'interno dei contenuti.

Scenario D - Prodotti "memoriali":
  Vendita di gioielli, tatuaggi, opere d'arte "in memoria"
  tramite link nei contenuti.

Scenario E - Falso ricordo:
  Post generici di condoglianze copiati e incollati su
  molteplici memoriali con firma commerciale.
```

#### Detection

| Metodo | Descrizione | Priorita |
|--------|-------------|----------|
| D-01 | Rilevamento URL | Regex per link commerciali |
| D-02 | Keyword matching | "sconto", "offerta", "acquista", "€/$" |
| D-03 | Pattern ripetuto | Stesso messaggio su molteplici memoriali |
| D-04 | Segnalazioni community | Utenti segnalano spam |
| D-05 | Profilo analisi | Bio con link commerciale |
| D-06 | Rate limiting | Max 3 messaggi/giorno su memoriali diversi |

#### Mitigazione

| Fase | Controllo | Implementazione |
|------|-----------|-----------------|
| **Prevenzione** | No follow su tutti i link | rel="nofollow ugc" su ogni URL |
| **Prevenzione** | Link obfuscation | Preview senza redirect diretto |
| **Prevenzione** | Rate limiting | Max 3 post/giorno, max 1 link/post |
| **Detection** | Auto-flag commerciale | Score ML per contenuto promozionale |
| **Detection** | Lista domini bloccati | Aggiornamento settimanale |
| **Risposta** | Rimozione contenuto | Automatica per score > soglia |
| **Risposta** | Ban dominio | Blocco permanente domini commerciali |
| **Risposta** | Account suspension | Per pattern ripetuto |

#### Escalation

```
Livello 1 (Auto): Rimozione automatica contenuto spam
Livello 2 (Moderatore): Review account, decisione sospensione
Livello 3 (Senior): Pattern organizzato (botnet, agenzia)
Livello 4 (Legal): Violazione ToS sistematica
```

#### Ricorso

| Caso | Procedura |
|------|-----------|
| Rimozione contenuto | Notifica + motivazione, possibilita di modifica e ripubblicazione |
| Sospensione account | Email con evidenza, 7 giorni per rispondere |
| Ban dominio | Form per richiesta sblocco (solo se dominio legittimo non commerciale) |

---

### AC-05: Raccolte Fondi Abusive

#### Informazioni Generali

| Attributo | Valore |
|-----------|--------|
| **ID** | AC-05 |
| **Categoria** | Truffa / Finanziaria |
| **Severita** | ALTA |
| **Threat Actor** | TA2, TA3 |
| **Asset Target** | Visitatori del memoriale, familiari |
| **Frequenza stimata** | 1-5 casi / mese |

#### Scenario Dettagliato

```
ATTACCANTE: Custode o collaboratore fraudolento
VITTIMA: Visitatori del memoriale, potenziali donatori
OBIETTIVO: Raccogliere fondi sotto false premesse

Scenario A - Falsa raccolta:
  Il custode inserisce un link a una raccolta fondi (GoFundMe,
  PayPal, ecc.) sostenendo che serva per "spese funebri" o
  "sostegno alla famiglia", ma i fondi vanno all'attaccante.

Scenario B - Associazione fantasma:
  Link a un'associazione benefica inesistente o con nessun
  collegamento con il defunto/famiglia.

Scenario C - Cryptocurrency scam:
  Indirizzi crypto per "donazioni in memoria" che sono wallet
  controllati dall'attaccante.

Scenario D - Doppia raccolta:
  Piu custodi creano raccolte separate senza coordinamento,
  causando confusione e potenziale frode.
```

#### Detection

| Metodo | Descrizione | Priorita |
|--------|-------------|----------|
| D-01 | Rilevamento link raccolte fondi | Regex per GoFundMe, PayPal, BTC, ETH |
| D-02 | Keyword: "dona", "raccolta fondi", "aiuta la famiglia" | Alta |
| D-03 | Verifica raccolta legittima | Contatto diretto con piattaforma esterna |
| D-04 | Pattern: account nuovo + link donazione | Media |
| D-05 | Segnalazione utenti | Alta |

#### Mitigazione

| Fase | Controllo | Implementazione |
|------|-----------|-----------------|
| **Prevenzione** | Link a raccolte fondi bloccati di default | Nessun link donazione senza verifica |
| **Prevenzione** | Processo verifica raccolta | Richiesta documentazione prova legittimita |
| **Prevenzione** | Raccolta fondi solo da custodi primari | Collaboratori non possono inserire link |
| **Detection** | Lista piattaforme approvate | Solo piattaforme verificate consentite |
| **Detection** | Review manuale ogni link donazione | Moderatore verifica prima approvazione |
| **Risposta** | Rimozione immediata link non approvato | Automatica |
| **Risposta** | Report a piattaforma esterna | Notifica a GoFundMe/PayPal di potenziale frode |
| **Risposta** | Sospensione account | Per raccolta fondi fraudolenta |

#### Escalation

```
Livello 1 (Auto): Blocco link raccolta fondi non approvati
Livello 2 (Moderatore): Verifica richiesta link donazione
Livello 3 (Senior): Casi di frode accertata
Livello 4 (Legal): Truffa, coinvolgimento forze dell'ordine
Livello 5 (Autorita): Report a polizia postale per truffa aggravata
```

#### Ricorso

```
Per richiedente legittimo:
  1. Form per richiesta approvazione link raccolta fondi
  2. Upload documento prova (decreto del tribunale, mandato,
     documento associazione ONLUS)
  3. Review entro 48h
  4. Se approvato, link con badge "Verificato" visibile
  5. Monitoraggio periodico (link ancora attivo?)

Per utente che ha inserito link non approvato:
  1. Notifica rimozione con spiegazione policy
  2. Possibilita di richiedere approvazione formale
  3. Se recidivo: sospensione
```

---

### AC-06: Molestie tra Familiari

#### Informazioni Generali

| Attributo | Valore |
|-----------|--------|
| **ID** | AC-06 |
| **Categoria** | Molestie / Conflitto |
| **Severita** | ALTA |
| **Threat Actor** | TA4 (Familiare conflittuale) |
| **Asset Target** | Pace familiare, memoriale come campo di battaglia |
| **Frequenza stimata** | 3-10 casi / mese |

#### Scenario Dettagliato

```
ATTACCANTE: Familiare con ruolo di custode/collaboratore
VITTIMA: Altri familiari, defunto
OBIETTIVO: Usare il memoriale per continuare conflitti familiari

Scenario A - Guerra edit:
  Due o piu custodi si modificano a vicenda le biografie,
  le foto e i contenuti, in un ciclo infinito di edit/revert.

Scenario B - Esclusione:
  Un custode rimuove sistematicamente i contenuti caricati
  da altri familiari, li rimuove come collaboratori, o
  cambia la visibilita a privato per escluderli.

Scenario C - Denigrazione:
  Pubblicazione di contenuti che denigrano altri familiari
  viventi, accusandoli di comportamenti verso il defunto.

Scenario D - Contesa ereditaria:
  Il memoriale diventa campo di battaglia per dispute
  ereditarie, con contenuti che citano testamenti, debiti,
  accuse di maltrattamento.

Scenario E - Rifiuto riconoscimento:
  Un familiare (es. figlio di seconda relazione) viene
  sistematicamente rimosso dai contenuti e dalla lista
  "familiari stretti".
```

#### Detection

| Metodo | Descrizione | Priorita |
|--------|-------------|----------|
| D-01 | Alert edit frequenti | > 5 edit/giorno sullo stesso campo | Alta |
| D-02 | Revert chain | Sequenza di modifiche che annullano a vicenda | Alta |
| D-03 | Rimozione collaboratori | Evento anomalo, trigger review | Media |
| D-04 | Keyword conflittuali | "testamento", "eredit", "debiti", accuse personali | Media |
| D-05 | Segnalazione da parte di familiari | Alta priorita | Alta |
| D-06 | Cambio visibilita frequente | Toggle pubblico/privato ripetuto | Media |

#### Mitigazione

| Fase | Controllo | Implementazione |
|------|-----------|-----------------|
| **Prevenzione** | Multiple custodi di default | Almeno 2 custodi necessari per modifiche critiche |
| **Prevenzione** | Lock su modifica | Un campo non puo essere modificato entro 24h dall'ultimo edit |
| **Prevenzione** | Governance familiare | Sezione "Regole del memoriale" modificabile solo da supermajority |
| **Detection** | Alert automatici | Sistema notifica admin per pattern conflittuali |
| **Detection** | Mediation flag | Contenuto con segnalazione interna per moderatore |
| **Risposta** | Congelamento temporaneo | Sospensione modifiche per 72h, moderatore interviene |
| **Risposta** | Mediation umana | Moderatore specializzato contatta le parti |
| **Risposta** | Split memoriale | Possibilita di creare sotto-memoriali separati |

#### Escalation

```
Livello 1 (Auto): Alert per pattern conflittuale
Livello 2 (Moderatore): Contatto con le parti, proposta mediazione
Livello 3 (Mediatore Specializzato): Intervento umano formato
Livello 4 (Legal): Minacce legali reciproche, richiesta parere legale
Livello 5 (Dirigenza): Casi estremi, possibile chiusura memoriale
```

#### Ricorso - Mediazione Strutturata

```
FASE 1 - Sospensione (0-24h):
  Il memoriale entra in modalita "congelamento".
  Nessuna modifica consentita. Contenuti visibili come sono.

FASE 2 - Ascolto (24-72h):
  Il moderatore contatta separatamente ogni parte.
  Ascolto attivo, documentazione posizioni.
  Nessuna decisione in questa fase.

FASE 3 - Proposta (72-168h):
  Il moderatore propone una soluzione:
  - Ripristino contenuti condivisi
  - Creazione sezioni personali per ogni familiare
  - Definizione regole di governance
  - Nomina moderatore interno familiare

FASE 4 - Accordo (168h+):
  Se tutte le parti accettano: ripristino con nuove regole.
  Se no accordo: opzione split memoriale o chiusura.

FASE 5 - Follow-up (30 giorni):
  Check-in automatico, verifica rispetto regole.
```

---

### AC-07: Memoriali di Minori

#### Informazioni Generali

| Attributo | Valore |
|-----------|--------|
| **ID** | AC-07 |
| **Categoria** | Minori / Protezione speciale |
| **Severita** | CRITICA |
| **Threat Actor** | Qualsiasi |
| **Asset Target** | Minore deceduto, famiglia |
| **Frequenza stimata** | 1-3 casi / mese |

#### Scenario Dettagliato

```
SOGGETTO: Persona deceduta minore di 18 anni
FAMIGLIA: Genitori/tutori in stato di lutto
RISCHI: Elevata vulnerabilita emotiva, protezione legale aggiuntiva

Scenario A - Memoriale non autorizzato:
  Creazione di un memoriale per un minore da parte di persone
  non autorizzate (compagni di scuola, insegnanti, estranei).
  I genitori non erano a conoscenza o non hanno consenitito.

Scenario B - Sfruttamento emotivo:
  Pubblicazione di contenuti estremamente crudi (foto dell'incidente,
  dettagli traumatici) che causano ulteriore dolore ai familiari.

Scenario C - Predatori:
  Account sospetti che interagiscono ripetutamente con il memoriale
  di un minore, mostrando un interesse morboso o inappropriato.

Scenario D - Cyberbullying postumo:
  Pubblicazione di contenuti che continuano il bullismo subito
  dal minore in vita, anche dopo la morte.

Scenario E - Dati sensibili minori:
  Pubblicazione di informazioni protette: scuola, indirizzo,
  diagnosi mediche, situazione familiare.
```

#### Detection

| Metodo | Descrizione | Priorita |
|--------|-------------|----------|
| D-01 | Flag automatico eta < 18 | Calcolo da data decesso vs data nascita | Alta |
| D-02 | Documento tutore | Richiesta obbligatoria documento tutela/guardian | Alta |
| D-03 | Verifica telefonica | Contatto diretto con genitore/tutore | Alta |
| D-04 | Monitoraggio interazioni | Alert per account sospetti su memoriali minori | Media |
| D-05 | Keyword sensibili minori | "suicidio", "bullismo", nomi scuole | Media |
| D-06 | Segnalazione scuole/istituzioni | Canale dedicato | Alta |

#### Mitigazione

| Fase | Controllo | Implementazione |
|------|-----------|-----------------|
| **Prevenzione** | Verifica tutore obbligatoria | Solo genitore/tutore legale puo creare | Molto Alta |
| **Prevenzione** | Doppia verifica | Due documenti: CI del tutore + certificato nascita minore | Alta |
| **Prevenzione** | Visibilita default privata | Solo familiari approvati possono vedere | Alta |
| **Prevenzione** | No contenuti traumatici | Policy esplicita, blocco upload foto incidenti | Alta |
| **Detection** | Moderatore specializzato minori | Personale formato su psicologia del lutto infantile | Alta |
| **Detection** | Consenso dei tutori | Entrambi i genitori devono approvare (ove possibile) | Media |
| **Risposta** | Rimozione immediata | Sospetto → immediato, verifica dopo | Alta |
| **Risposta** | Supporto psicologico | Link a risorse di supporto per famiglie in lutto | Media |
| **Risposta** | Report a autorita | Se segni di abuso, bullismo, o sfruttamento | Alta |

#### Escalation

```
Livello 1 (Auto): Flag per minore, visibilita ridotta
Livello 2 (Moderatore Specializzato): Review entro 12h
Livello 3 (Senior + Psicologo Consulente): Casi complessi
Livello 4 (Legal): Violazione diritti del minore
Livello 5 (Autorita): Segnalazione obbligatoria a servizi sociali/procura minorile
```

#### Ricorso

```
Per genitore/tutore:
  1. Form prioritario per minori con risposta entro 12h
  2. Verifica accelerata documenti
  3. Diritto di rimozione immediata per qualsiasi motivo
  4. Supporto dedicato via telefono/email
  5. Possibilita di chiusura completa memoriale in qualsiasi momento

Per segnalazione da terzi (scuola, istituzione):
  1. Form dedicato istituzioni
  2. Verifica identita istituzione
  3. Contatto con tutore per conferma
  4. Azione coordinata
```

---

### AC-08: Doxxing

#### Informazioni Generali

| Attributo | Valore |
|-----------|--------|
| **ID** | AC-08 |
| **Categoria** | Privacy / Information Disclosure |
| **Severita** | CRITICA |
| **Threat Actor** | TA2, TA4 |
| **Asset Target** | Dati personali familiari, indirizzi, contatti |
| **Frequenza stimata** | 1-5 casi / mese |

#### Scenario Dettagliato

```
ATTACCANTE: Utente malintenzionato o familiare conflittuale
VITTIMA: Familiari viventi del defunto
OBIETTIVO: Pubblicare dati personali sensibili senza consenso

Scenario A - Indirizzo familiare:
  Pubblicazione dell'indirizzo di casa dei familiari nel
  memoriale, rendendoli identificabili e potenzialmente
  esponendoli a rischi fisici.

Scenario B - Numeri telefono privati:
  Inserimento di numeri di telefono personali in contenuti
  pubblici, esponendo a chiamate indesiderate.

Scenario C - Dati sanitari:
  Rivelazione di diagnosi mediche del defunto o dei familiari
  (malattie genetiche, disturbi mentali, dipendenze).

Scenario D - Informazioni finanziarie:
  Pubblicazione di dettagli economici (testamento, debiti,
  proprietà, situazione patrimoniale).

Scenario E - Luogo di lavoro/scuola:
  Informazioni che permettono di identificare familiari al
  lavoro o a scuola, facilitando stalking o molestie.

Scenario F - Dati di terzi non consenzienti:
  Pubblicazione di informazioni su amici, partner,
  conoscenti del defunto che non hanno acconsentito.
```

#### Detection

| Metodo | Descrizione | Priorita |
|--------|-------------|----------|
| D-01 | OCR PII detection | Rilevamento automatico indirizzi, telefoni, email, CF | Alta |
| D-02 | Regex PII | Pattern per CAP, telefoni italiani, email, codici fiscali | Alta |
| D-03 | Keyword sensitivi | "indirizzo", "telefono", "testamento", "debito" | Media |
| D-04 | NER (Named Entity Recognition) | ML model per rilevamento nomi, luoghi, organizzazioni | Media |
| D-05 | Segnalazione utenti | Alta priorita | Alta |
| D-06 | Image EXIF data stripping | Rimozione metadati GPS da foto | Alta |

#### Mitigazione

| Fase | Controllo | Implementazione |
|------|-----------|-----------------|
| **Prevenzione** | PII scanning pre-pubblicazione | Ogni contenuto scansionato per dati personali | Alta |
| **Prevenzione** | EXIF stripping automatico | Rimozione metadati GPS, camera, timestamp | Alta |
| **Prevenzione** | Pseudonimizzazione default | Nomi completi ridotti a iniziali per non-custodi | Media |
| **Prevenzione** | Consenso esplicito PII | Checkbox per ogni dato personale inserito | Media |
| **Detection** | Auto-redazione PII | Sfocatura automatica indirizzi e telefoni rilevati | Alta |
| **Detection** | Moderatore prioritario | PII detection → escalation immediata | Alta |
| **Risposta** | Rimozione immediata | < 2h dalla detection | Alta |
| **Risposta** | Notifica interessato | Se PII di terzo rilevato, contatto immediato | Alta |
| **Risposta** | Cache invalidation | Rimozione da CDN/cache entro 1h | Alta |
| **Risposta** | Richiesta rimozione motori ricerca | richiesta de-indexing a Google/Bing | Media |

#### Escalation

```
Livello 1 (Auto): Redazione PII, contenuto in quarantena
Livello 2 (Moderatore): Review entro 2h, decisione rimozione/conferma
Livello 3 (Senior + DPO): Violazione GDPR, valutazione breach
Livello 4 (Legal): Obbligo notifica GDPR se dati sensibili
Livello 5 (Autorita): Se stalking, minacce, rischi per incolumita fisica
```

#### Ricorso

```
Per persona il cui dato e stato esposto:
  1. Form "Richiesta rimozione PII" - prioritario
  2. Rimozione entro 2h dalla segnalazione
  3. Conferma rimozione con screenshot
  4. Richiesta de-indexing motori di ricerca
  5. Valutazione breach notification (72h)
  6. Supporto legale se necessario
  7. Archiviazione caso per 10 anni

Per utente che ha pubblicato (dolo vs errore):
  - Dolo evidente: ban immediato
  - Errore in buona fede: avvertimento + educazione policy
  - Recidivo: sospensione progressiva
```

---

## 4. Detection Matrix

### 4.1 Layer di Detection

| Layer | Tecnologia | Coverage |
|-------|-----------|----------|
| L1 - Preventivo | Input validation, schema Zod, RLS | 100% richieste |
| L2 - Automatico | Keyword filter, regex PII, ML model | 100% contenuti |
| L3 - Comportamentale | Rate limiting, pattern analysis, reputation | 100% sessioni |
| L4 - Community | Segnalazioni utenti | Disponibile 24/7 |
| L5 - Umano | Moderatori, mediatori specialisti | Review entro 4h |
| L6 - Esterno | Penetration testing, audit terzi | Semestrale |

### 4.2 Detection per Abuse Case

| Abuse Case | L1 Preventivo | L2 Auto | L3 Comport. | L4 Community | L5 Umano |
|-----------|--------------|---------|-------------|--------------|----------|
| AC-01 Creazione abusiva | Verifica doc | Pattern multipli | IP analysis | Segnalazione | Review manuale |
| AC-02 Appropriazione identita | MFA | Doc cross-check | Device fingerprint | Contestazione | Verifica telefonica |
| AC-03 Contenuti offensivi | Approvazione pre-pubb | Sentiment ML | User reputation | Segnalazione | Moderatore dedicato |
| AC-04 Spam | Rate limiting | Keyword/URL filter | Pattern ripetuto | Segnalazione | Review account |
| AC-05 Raccolte fondi | Link bloccati | Regex piattaforme | Account age | Segnalazione | Verifica documentale |
| AC-06 Molestie familiari | Governance multipla | Edit conflict alert | Revert chain | Segnalazione | Mediatore specializzato |
| AC-07 Minori | Verifica tutore | Flag automatico | Interaction monitor | Segnalazione istituzioni | Moderatore specializzato |
| AC-08 Doxxing | PII scan | OCR/NER redaction | EXIF stripping | Segnalazione | Prioritario 2h |

---

## 5. Mitigation Controls

### 5.1 Control Map

| Control ID | Descrizione | Abuse Cases | Stato |
|------------|-------------|-------------|-------|
| MC-01 | Verifica documentale a due livelli | AC-01, AC-02, AC-07 | Da implementare |
| MC-02 | MFA obbligatorio custodi | AC-02 | Da implementare |
| MC-03 | Approvazione pre-pubblicazione | AC-03, AC-04 | Da implementare |
| MC-04 | Keyword filter + sentiment ML | AC-03, AC-04, AC-06 | Da implementare |
| MC-05 | Rate limiting multi-livello | AC-04, AC-05, AC-06 | Da implementare |
| MC-06 | PII detection OCR/NER | AC-08 | Da implementare |
| MC-07 | Governance multipla custodi | AC-01, AC-06 | Da implementare |
| MC-08 | Mediation workflow | AC-06 | Da implementare |
| MC-09 | Verifica tutore minori | AC-07 | Da implementare |
| MC-10 | Blocco link raccolte fondi | AC-05 | Da implementare |
| MC-11 | Audit log immutabile | Tutti | Da implementare |
| MC-12 | Segnalazione 1-click | Tutti | Da implementare |
| MC-13 | Cooldown modifiche | AC-01, AC-02, AC-06 | Da implementare |
| MC-14 | Versionamento contenuti | AC-03, AC-06 | Da implementare |
| MC-15 | EXIF stripping | AC-08 | Da implementare |

### 5.2 Implementazione Prioritaria

| Fase | Controlli | Timeline |
|------|-----------|----------|
| Sprint 1 | MC-03, MC-05, MC-12, MC-15 | Settimana 1-2 |
| Sprint 2 | MC-01, MC-02, MC-07, MC-13 | Settimana 3-4 |
| Sprint 3 | MC-04, MC-06, MC-14 | Settimana 5-6 |
| Sprint 4 | MC-08, MC-09, MC-10, MC-11 | Settimana 7-8 |

---

## 6. Appendici

### 6.1 Glossario

| Termine | Definizione |
|---------|-------------|
| **Custode** | Utente con pieno controllo sul memoriale |
| **Collaboratore** | Utente con permessi limitati (pubblicazione contenuti) |
| **Visitatore** | Utente che puo solo visualizzare memoriali pubblici |
| **PII** | Personally Identifiable Information |
| **OCR** | Optical Character Recognition |
| **NER** | Named Entity Recognition |
| **EXIF** | Exchangeable Image File Format (metadati foto) |
| **DPO** | Data Protection Officer |
| **CSAM** | Child Sexual Abuse Material |

### 6.2 Riferimenti Normativi

| Normativa | Articolo | Rilevanza |
|-----------|----------|-----------|
| GDPR 2016/679 | Art. 9 | Dati personali particolari |
| GDPR 2016/679 | Art. 17 | Diritto all'oblio |
| GDPR 2016/679 | Art. 33 | Notifica breach |
| GDPR 2016/679 | Art. 77 | Reclamo all'autorita |
| Codice Penale IT | Art. 612-ter | Stalking |
| Codice Penale IT | Art. 595 | Diffamazione |
| Codice Penale IT | Art. 640 | Truffa |
| L. 71/2017 | - | Bullismo cyber |
| L. 38/2009 | - | Minori, divieto pubblicazione dati |

### 6.3 Contatti Emergenza

| Ruolo | Contatto | Scopo |
|-------|----------|-------|
| Security Team | security@ricordatidite.it | Incidenti sicurezza |
| Abuse Team | abuse@ricordatidite.it | Casi di abuso |
| DPO | dpo@ricordatidite.it | Privacy, GDPR |
| Legal | legal@ricordatidite.it | Questioni legali |
| Moderazione | moderation@ricordatidite.it | Review contenuti |
| Supporto | support@ricordatidite.it | Assistenza utenti |

### 6.4 Revision History

| Versione | Data | Autore | Modifiche |
|----------|------|--------|-----------|
| 1.0 | 2025-01-15 | Security Team | Versione iniziale |

---

**FINE DOCUMENTO**

*Questo documento e classificato CONFIDENZIALE. Distribuzione limitata al Security Team, Moderation Team e Legal.*
