# Environment Configuration - Piattaforma "Ricordati di Te"

**Versione**: 1.0  
**Data**: 2025-01-15  
**Classificazione**: CONFIDENZIALE  
**Autore**: DevOps / Security Team  

---

## 1. Indice

1. [Introduzione](#2-introduzione)
2. [Overview Ambienti](#3-overview-ambienti)
3. [Configurazione Variabili d'Ambiente](#4-configurazione-variabili-dambiente)
4. [Configurazione Supabase per Ambiente](#5-configurazione-supabase-per-ambiente)
5. [Configurazione Vercel](#6-configurazione-vercel)
6. [Secret Management](#7-secret-management)
7. [Rotazione Chiavi](#8-rotazione-chiavi)
8. [Checklist Deploy](#9-checklist-deploy)
9. [Appendici](#10-appendici)

---

## 2. Introduzione

### 2.1 Scopo

Il presente documento definisce la configurazione degli ambienti per la piattaforma "Ricordati di Te":
- **Local**: Sviluppo locale del singolo sviluppatore
- **Development**: Ambiente condiviso per il team di sviluppo
- **Staging**: Ambiente di pre-produzione per QA e UAT
- **Production**: Ambiente live con dati reali

### 2.2 Principi

| ID | Principio |
|----|-----------|
| P1 | **No secret in code**: Nessun segreto nel codice sorgente |
| P2 | **Environment parity**: Stessa configurazione (dove possibile) tra env |
| P3 | **Least privilege**: Ogni ambiente ha i minimi permessi necessari |
| P4 | **Audit trail**: Ogni modifica a variabili e loggata |
| P5 | **No prod access from dev**: I dati di produzione non sono accessibili da ambienti di sviluppo |

---

## 3. Overview Ambienti

### 3.1 Matrice Ambienti

| Ambiente | URL | Branch | Dati | Accesso |
|----------|-----|--------|------|---------|
| **Local** | http://localhost:3000 | Feature branch | Fake/Seed | Sviluppatori |
| **Development** | https://dev.ricordatidite.it | `develop` | Fake/Anonimizzati | Team interno |
| **Staging** | https://staging.ricordatidite.it | `release/*` | Snapshot anonimizzato | Team + QA |
| **Production** | https://ricordatidite.it | `main` | Dati reali | Solo produzione |

### 3.2 Isolamento

```
AMBIENTI ISOLATI - NESSUNA CONDIVISIONE

Local        Dev          Staging      Production
  |            |            |            |
  |--[DB]     |--[DB]      |--[DB]      |--[DB]
  |   seed    |   seed+    |   anon     |   real
  |           |   fake     |   snapshot |   data
  |--[Auth]   |--[Auth]    |--[Auth]    |--[Auth]
  |   local   |   dev      |   staging  |   prod
  |--[Storage]|--[Storage] |--[Storage] |--[Storage]
  |   local   |   dev      |   staging  |   prod
```

---

## 4. Configurazione Variabili d'Ambiente

### 4.1 Schema Variabili

Le variabili sono organizzate per categoria. Ogni variabile ha:
- **Nome**: Nome esatto della variabile
- **Descrizione**: A cosa serve
- **Obbligatoria**: Se e richiesta per l'avvio
- **Sensibile**: Se contiene dati sensibili (secret)
- **Ambienti**: Valori o pattern per ogni ambiente

### 4.2 Variabili di Autenticazione (Supabase Auth)

```env
# ============================================
# SUPABASE AUTH - Obbligatorie in tutti gli env
# ============================================

# URL progetto Supabase
# Pattern: https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
# Local: http://localhost:54321 (Supabase CLI local)
# Dev:   https://[dev-project].supabase.co
# Staging: https://[staging-project].supabase.co
# Prod:  https://[prod-project].supabase.co

# Chiave anonima (pubblica, sicura per client)
# Usata per operazioni client-side
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
# Ogni ambiente ha la propria chiave

# Chiave di servizio (SERVER-SIDE ONLY!)
# Usata solo in Edge Functions / Server Components
# MAI esposta al client
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
# WARNING: Questa chiave bypassa RLS. Usare con estrema cautela.
```

### 4.3 Variabili Applicative

```env
# ============================================
# APPLICAZIONE
# ============================================

# Ambiente di esecuzione
# Valori: local | development | staging | production
NODE_ENV=production

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false          # Local/Dev: false, Staging/Prod: true
NEXT_PUBLIC_ENABLE_SENTRY=false             # Local: false, Dev: false, Staging: true, Prod: true
NEXT_PUBLIC_MAINTENANCE_MODE=false          # Solo per deploy critici

# URL applicazione (per redirect e link)
NEXT_PUBLIC_APP_URL=https://ricordatidite.it
# Local: http://localhost:3000
# Dev: https://dev.ricordatidite.it
# Staging: https://staging.ricordatidite.it
# Prod: https://ricordatidite.it
```

### 4.4 Variabili Email (Resend)

```env
# ============================================
# RESEND - Email Service
# ============================================

# API Key Resend
RESEND_API_KEY=re_xxxxxxxx
# Ogni ambiente ha la propria API key
# Local: re_test_xxxxxxxx (ambiente di test Resend)
# Dev: re_test_xxxxxxxx
# Staging: re_test_xxxxxxxx
# Prod: re_live_xxxxxxxx

# Email mittente
RESEND_FROM_EMAIL=noreply@ricordatidite.it
# Local: noreply@dev.ricordatidite.it
# Dev: noreply@dev.ricordatidite.it
# Staging: noreply@staging.ricordatidite.it
# Prod: noreply@ricordatidite.it

# Email per notifiche e abuse
ABUSE_EMAIL=abuse@ricordatidite.it
SECURITY_EMAIL=security@ricordatidite.it
DPO_EMAIL=dpo@ricordatidite.it
SUPPORT_EMAIL=support@ricordatidite.it
```

### 4.5 Variabili Moderazione AI

```env
# ============================================
# MODERAZIONE CONTENUTI
# ============================================

# OpenAI / Azure OpenAI per moderazione
OPENAI_API_KEY=sk-xxxxxxxx
# Solo Staging e Production
# Local/Dev: moderazione manuale/mock

# Azure Content Safety (opzionale)
AZURE_CONTENT_SAFETY_KEY=xxxxxxxx
AZURE_CONTENT_SAFETY_ENDPOINT=https://xxxx.cognitiveservices.azure.com

# Threshold moderazione automatica (0-1)
MODERATION_AUTO_REJECT_THRESHOLD=0.85
MODERATION_AUTO_APPROVE_THRESHOLD=0.15
MODERATION_HUMAN_REVIEW_THRESHOLD=0.50
```

### 4.6 Variabili Storage

```env
# ============================================
# STORAGE - Supabase Storage
# ============================================

# Limite upload (in bytes)
MAX_FILE_SIZE_PHOTO=52428800        # 50 MB
MAX_FILE_SIZE_VIDEO=209715200      # 200 MB
MAX_FILE_SIZE_AUDIO=10485760       # 10 MB

# Quota utente (in bytes)
USER_STORAGE_QUOTA_BASE=2147483648          # 2 GB
USER_STORAGE_QUOTA_PREMIUM=10737418240      # 10 GB

# CDN URL per asset pubblici
NEXT_PUBLIC_CDN_URL=https://xxxxxx.supabase.co/storage/v1/object/public
```

### 4.7 Variabili Monitoring

```env
# ============================================
# MONITORING & LOGGING
# ============================================

# Sentry DSN (client-side)
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
# Ogni ambiente ha il proprio progetto Sentry

# Sentry DSN (server-side)
SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx

# Log level
LOG_LEVEL=info          # Local: debug, Dev: debug, Staging: info, Prod: warn

# Datadog / Grafana (opzionale)
DD_API_KEY=xxxxxxxx
DD_APP_KEY=xxxxxxxx
```

### 4.8 Variabili Sicurezza

```env
# ============================================
# SICUREZZA
# ============================================

# JWT Secret (gestito da Supabase, non configurabile)
# Il secret JWT e gestito internamente da Supabase Auth

# Encryption key per dati sensibili (se applicabile)
ENCRYPTION_KEY=base64:xxxxxxxx
# Solo Production - per cifratura dati extra-sensibili
# Generata con: openssl rand -base64 32

# HIBP API Key (Have IBeenPwned)
HIBP_API_KEY=xxxxxxxx
# Per check password in fase di registrazione

# hCaptcha (per protezione bot)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=xxxxxxxx
HCAPTCHA_SECRET_KEY=xxxxxxxx
# Solo Staging e Production per flussi sensibili

# Webhook secret per verifica integrita
WEBHOOK_SECRET=whsec_xxxxxxxx
# Per verificare che i webhook provengano da Supabase
```

### 4.9 File .env per Ambiente

#### Local (.env.local)

```env
# ============================================
# LOCAL ENVIRONMENT
# ============================================
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=local

# Supabase (local via CLI)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Feature flags (tutto disabilitato)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false
NEXT_PUBLIC_MAINTENANCE_MODE=false

# Email (mock in local)
RESEND_API_KEY=re_test_mock_local
RESEND_FROM_EMAIL=noreply@localhost

# Moderazione (mock)
OPENAI_API_KEY=sk-test-mock
MODERATION_AUTO_REJECT_THRESHOLD=0.85
MODERATION_AUTO_APPROVE_THRESHOLD=0.15

# Storage
MAX_FILE_SIZE_PHOTO=52428800
MAX_FILE_SIZE_VIDEO=209715200
USER_STORAGE_QUOTA_BASE=2147483648

# Logging
LOG_LEVEL=debug

# Sicurezza (mock)
HIBP_API_KEY=test-mock
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
HCAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000
```

#### Development (.env.development)

```env
# ============================================
# DEVELOPMENT ENVIRONMENT
# ============================================
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=https://dev.ricordatidite.it

# Supabase (project dev isolato)
NEXT_PUBLIC_SUPABASE_URL=https://[DEV_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[DEV_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[DEV_SERVICE_KEY]

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false

# Email
RESEND_API_KEY=re_test_[DEV_KEY]
RESEND_FROM_EMAIL=noreply@dev.ricordatidite.it

# Moderazione
OPENAI_API_KEY=sk-test_[DEV_KEY]
MODERATION_AUTO_REJECT_THRESHOLD=0.85
MODERATION_AUTO_APPROVE_THRESHOLD=0.15

# Storage
MAX_FILE_SIZE_PHOTO=52428800
MAX_FILE_SIZE_VIDEO=209715200
USER_STORAGE_QUOTA_BASE=2147483648

# Logging
LOG_LEVEL=debug

# Sicurezza
HIBP_API_KEY=[DEV_HIBP_KEY]
```

#### Staging (.env.staging)

```env
# ============================================
# STAGING ENVIRONMENT
# ============================================
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.ricordatidite.it

# Supabase (project staging isolato)
NEXT_PUBLIC_SUPABASE_URL=https://[STAGING_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[STAGING_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[STAGING_SERVICE_KEY]

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SENTRY=true

# Email
RESEND_API_KEY=re_test_[STAGING_KEY]
RESEND_FROM_EMAIL=noreply@staging.ricordatidite.it

# Moderazione
OPENAI_API_KEY=sk-[STAGING_KEY]
AZURE_CONTENT_SAFETY_KEY=[STAGING_KEY]
AZURE_CONTENT_SAFETY_ENDPOINT=https://[STAGING].cognitiveservices.azure.com
MODERATION_AUTO_REJECT_THRESHOLD=0.85
MODERATION_AUTO_APPROVE_THRESHOLD=0.15

# Storage
MAX_FILE_SIZE_PHOTO=52428800
MAX_FILE_SIZE_VIDEO=209715200
USER_STORAGE_QUOTA_BASE=2147483648

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://[STAGING_SENTRY]

# Sicurezza
HIBP_API_KEY=[STAGING_HIBP_KEY]
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=[STAGING_SITE_KEY]
HCAPTCHA_SECRET_KEY=[STAGING_SECRET_KEY]
```

#### Production (.env.production)

```env
# ============================================
# PRODUCTION ENVIRONMENT
# ============================================
# WARNING: Queste variabili sono SENSIBILI.
# Non condividere mai questo file.
# ============================================
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://ricordatidite.it

# Supabase (project production)
NEXT_PUBLIC_SUPABASE_URL=https://[PROD_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[PROD_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[PROD_SERVICE_KEY]

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SENTRY=true
NEXT_PUBLIC_MAINTENANCE_MODE=false

# Email
RESEND_API_KEY=re_live_[PROD_KEY]
RESEND_FROM_EMAIL=noreply@ricordatidite.it
ABUSE_EMAIL=abuse@ricordatidite.it
SECURITY_EMAIL=security@ricordatidite.it
DPO_EMAIL=dpo@ricordatidite.it
SUPPORT_EMAIL=support@ricordatidite.it

# Moderazione
OPENAI_API_KEY=sk-[PROD_KEY]
AZURE_CONTENT_SAFETY_KEY=[PROD_KEY]
AZURE_CONTENT_SAFETY_ENDPOINT=https://[PROD].cognitiveservices.azure.com
MODERATION_AUTO_REJECT_THRESHOLD=0.85
MODERATION_AUTO_APPROVE_THRESHOLD=0.15

# Storage
MAX_FILE_SIZE_PHOTO=52428800
MAX_FILE_SIZE_VIDEO=209715200
USER_STORAGE_QUOTA_BASE=2147483648
USER_STORAGE_QUOTA_PREMIUM=10737418240

# Logging
LOG_LEVEL=warn
SENTRY_DSN=https://[PROD_SENTRY]
NEXT_PUBLIC_SENTRY_DSN=https://[PROD_SENTRY_PUBLIC]

# Sicurezza
ENCRYPTION_KEY=[PROD_ENCRYPTION_KEY]
HIBP_API_KEY=[PROD_HIBP_KEY]
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=[PROD_SITE_KEY]
HCAPTCHA_SECRET_KEY=[PROD_SECRET_KEY]
WEBHOOK_SECRET=whsec_[PROD_WEBHOOK_SECRET]
```

---

## 5. Configurazione Supabase per Ambiente

### 5.1 Project Matrix

| Ambiente | Project Ref | Region | Piano | Note |
|----------|-------------|--------|-------|------|
| Local | `supabase_local` | localhost | CLI | Docker containers |
| Development | `[DEV_REF]` | eu-west-3 | Pro | Isolato, dati fake |
| Staging | `[STAGING_REF]` | eu-west-3 | Pro | Snapshot anonimizzato |
| Production | `[PROD_REF]` | eu-west-3 | Pro/Team | Dati reali, HA |

### 5.2 Configurazione Auth

```sql
-- ============================================
-- SUPABASE AUTH CONFIGURATION
-- Applicare in ogni ambiente
-- ============================================

-- 1. Password policy (Produzione)
ALTER SYSTEM SET auth.password_min_length = 12;
-- Dev/Staging: 8 per testing, Prod: 12

-- 2. JWT expiry
-- Production: 3600 secondi (1 ora)
-- Dev: 7200 secondi (2 ore) per comodita testing

-- 3. Session configuration
-- ENABLE refresh token rotation
-- ENABLE automatic reuse detection

-- 4. MFA configuration (Production)
-- ENABLE MFA for role 'custode'
-- REQUIRE MFA for sensitive operations

-- 5. Email templates (personalizzate per brand)
-- Confirmation email: template custom
-- Recovery email: template custom
-- Invite email: template custom
-- Magic link: template custom
-- Change email: template custom
```

### 5.3 Row Level Security (RLS)

```sql
-- ============================================
-- RLS POLICIES - Dev/Staging/Production
-- ============================================

-- FORCE RLS su tutte le tabelle con dati utente
ALTER TABLE memorials FORCE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE photos FORCE ROW LEVEL SECURITY;
ALTER TABLE videos FORCE ROW LEVEL SECURITY;
ALTER TABLE audio FORCE ROW LEVEL SECURITY;
ALTER TABLE comments FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

-- Verifica RLS attiva
SELECT 
    schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE rowsecurity = true 
  AND schemaname = 'public';

-- Policy di base: solo owner puo modificare
CREATE POLICY "Users can only access own data" 
ON profiles FOR ALL 
USING (auth.uid() = user_id);

-- Policy memoriali: accesso basato su ruolo
CREATE POLICY "Memorial access control"
ON memorials FOR SELECT
USING (
    visibility = 'public' 
    OR auth.uid() IN (
        SELECT user_id FROM memorial_roles 
        WHERE memorial_id = memorials.id
    )
);
```

### 5.4 Backup Configuration

| Ambiente | Tipo | Frequenza | Retention | PITR |
|----------|------|-----------|-----------|------|
| Local | Nessuno | - | - | No |
| Development | Automatico | Giornaliero | 7 giorni | No |
| Staging | Automatico | Giornaliero | 14 giorni | Si (7d) |
| Production | Automatico | Continuo (PITR) | 30 giorni | Si (30d) |

```sql
-- Verifica backup in Supabase Dashboard
-- Verifica PITR: Project Settings > Database

-- Per staging: creare snapshot anonimizzato da produzione
-- Script: scripts/anonymize-and-snapshot.sql
-- Eseguire: solo in maintenance window
-- Verificare: nessun dato reale nei log
```

### 5.5 Storage Buckets

| Ambiente | Bucket | Privacy | CORS | Limite |
|----------|--------|---------|------|--------|
| All | `memorial-photos` | private | Strict | 50MB |
| All | `memorial-videos` | private | Strict | 200MB |
| All | `memorial-audio` | private | Strict | 10MB |
| All | `memorial-documents` | private | Strict | 10MB |
| All | `moderation-queue` | private | None | 50MB |
| All | `profile-avatars` | public | Strict | 5MB |

```sql
-- Storage policies
CREATE POLICY "Authenticated users can upload to memorial-photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'memorial-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
        SELECT memorial_id::text 
        FROM memorial_roles 
        WHERE user_id = auth.uid()
    )
);
```

---

## 6. Configurazione Vercel

### 6.1 Projects

| Ambiente | Project Name | Branch | Framework |
|----------|-------------|--------|-----------|
| Development | ricordatidite-dev | `develop` | Next.js |
| Staging | ricordatidite-staging | `release/*` | Next.js |
| Production | ricordatidite-prod | `main` | Next.js |

### 6.2 Environment Variables (Vercel Dashboard)

Configurare in: Project Settings > Environment Variables

```
# Esempio configurazione Vercel per Production:

NEXT_PUBLIC_SUPABASE_URL          [Production only]
NEXT_PUBLIC_SUPABASE_ANON_KEY     [Production only]
SUPABASE_SERVICE_ROLE_KEY         [Production only]  [Encrypted]
RESEND_API_KEY                    [Production only]  [Encrypted]
OPENAI_API_KEY                    [Production only]  [Encrypted]
SENTRY_DSN                        [Production only]  [Encrypted]
ENCRYPTION_KEY                    [Production only]  [Encrypted]
HCAPTCHA_SECRET_KEY               [Production only]  [Encrypted]
WEBHOOK_SECRET                    [Production only]  [Encrypted]
```

### 6.3 Security Headers

```javascript
// next.config.js - Security Headers
const securityHeaders = [
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' blob: data: https://*.supabase.co",
            "media-src 'self' https://*.supabase.co",
            "connect-src 'self' https://*.supabase.co https://*.sentry.io wss://*.supabase.co",
            "font-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; ')
    },
    {
        key: 'X-Frame-Options',
        value: 'DENY'
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()'
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
    }
];

module.exports = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
};
```

### 6.4 Deploy Protection

| Ambiente | Branch Protection | Preview Deploy | Approval |
|----------|-------------------|----------------|----------|
| Development | No | Yes | Auto |
| Staging | Yes (release/*) | Yes | 1 reviewer |
| Production | Yes (main) | No | 2 reviewers + Security |

---

## 7. Secret Management

### 7.1 Principi

| ID | Principio |
|----|-----------|
| SM-01 | **Vault**: Tutti i secret in un vault centralizzato |
| SM-02 | **No local copy**: Nessun secret su macchine sviluppatori |
| SM-03 | **Rotation**: Rotazione periodica obbligatoria |
| SM-04 | **Audit**: Ogni accesso a secret e loggato |
| SM-05 | **Least access**: Solo chi necessita puo accedere |

### 7.2 Vault Solution

Per la piattaforma "Ricordati di Te" si raccomanda:

**Primary**: HashiCorp Vault (self-hosted) o Doppler (SaaS)
**Alternative**: 1Password Secrets Automation / GitHub Secrets (per CI/CD)

| Ambiente | Metodo Secret | Storage |
|----------|--------------|---------|
| Local | `.env.local` (non committato) | File locale |
| Development | Vercel Env + Vault | Vercel + Vault Dev |
| Staging | Vercel Env + Vault | Vercel + Vault Staging |
| Production | Vault + Runtime Injection | Vault Production |

### 7.3 Access Control Matrix

| Ruolo | Local | Dev | Staging | Production |
|-------|-------|-----|---------|------------|
| Developer | Read all | Read all | Read non-secret | No access |
| Tech Lead | Read all | Read all | Read all | Read non-secret |
| Security Lead | Read all | Read all | Read all | Read all |
| CISO | Read all | Read all | Read all | Read/Write all |
| DevOps | Read all | Read all | Read all | Read/Write all |

### 7.4 Injection in Runtime

```
PRODUCTION SECRET FLOW

[HashiCorp Vault] 
       |
       |--[Auth via IAM Role]
       v
[Vercel Edge Function / Server Component]
       |
       |--[Secret inject at runtime]
       v
[Application uses secret]
       |
       |--[Secret NEVER logged]
       v
[Memory only, cleared on shutdown]
```

```typescript
// Esempio: accesso secret in Edge Function
// NEVER log secrets, NEVER return to client

export async function handler(req: Request) {
  // Legge secret da environment (iniettato da Vault)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Usa il secret
  const supabase = createClient(url, serviceKey!);
  
  // NEVER: console.log(serviceKey);
  // NEVER: return new Response(JSON.stringify({ key: serviceKey }));
  
  // OK: usa il client per operazioni server-side
  const { data, error } = await supabase.from('sensitive_table').select('*');
  
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 7.5 Check Security Secrets

```bash
#!/bin/bash
# scripts/secret-check.sh
# Da eseguire in CI/CD pipeline

echo "Checking for secrets in code..."

# 1. Check con git-secrets
git secrets --scan

# 2. Check con detect-secrets
detect-secrets scan

# 3. Check regex comuni
PATTERNS=(
    "sk-[a-zA-Z0-9]{48}"           # OpenAI
    "eyJ[A-Za-z0-9-_]*\.eyJ"       # JWT
    "re_[a-zA-Z0-9]{24}"           # Resend
    "whsec_[a-zA-Z0-9]{24}"        # Webhook
    "password\s*[:=]\s*['\"][^'\"]+" # Password in chiaro
    "api[_-]?key\s*[:=]\s*['\"][^'\"]+" # API key in chiaro
)

for pattern in "${PATTERNS[@]}"; do
    echo "Checking pattern: $pattern"
    if grep -riE "$pattern" src/ --include="*.ts" --include="*.tsx" --include="*.js"; then
        echo "POTENTIAL SECRET FOUND!"
        exit 1
    fi
done

echo "No secrets found in code."
exit 0
```

---

## 8. Rotazione Chiavi

### 8.1 Chiavi e Rotazione

| Chiave | Frequenza Rotazione | Metodo | Owner |
|--------|---------------------|--------|-------|
| Supabase JWT Secret | Su richiesta / dopo breach | Dashboard > Settings | CISO |
| Supabase Service Role Key | Su richiesta / dopo breach | Dashboard > Settings | CISO |
| Supabase Anon Key | Su richiesta | Dashboard > Settings | Tech Lead |
| Resend API Key | 90 giorni | Resend Dashboard | DevOps |
| OpenAI API Key | 90 giorni | OpenAI Dashboard | DevOps |
| Sentry DSN | Su richiesta | Sentry Dashboard | Tech Lead |
| Encryption Key | 180 giorni | Generazione manuale + Vault | CISO |
| hCaptcha Secret | 180 giorni | hCaptcha Dashboard | DevOps |
| Webhook Secret | Su richiesta | Supabase Dashboard | Tech Lead |
| Database Password | 90 giorni | Supabase Dashboard | CISO |
| CI/CD Token | 90 giorni | GitHub/Vercel Settings | DevOps |

### 8.2 Procedura di Rotazione

```
ROTATION KEY PROCEDURE

PHASE 1: Preparation (T-7 days)
  [ ] Ticket di rotazione creato
  [ ] Notifica team (24h prima)
  [ ] Verificare nessun deploy in corso
  [ ] Preparare nuova chiave

PHASE 2: Rotation (T-0)
  [ ] Generare nuova chiave
  [ ] Aggiornare Vault
  [ ] Aggiornare Vercel Environment Variables
  [ ] Deploy per propagare nuova chiave
  [ ] Verificare funzionamento applicazione
  [ ] Monitorare errori per 30 minuti

PHASE 3: Validation (T+30min)
  [ ] Smoke test tutti i flussi critici
  [ ] Verificare log: nessun errore auth/API
  [ ] Conferma da monitoring dashboard

PHASE 4: Cleanup (T+24h)
  [ ] Revocare vecchia chiave
  [ ] Verificare: nessun sistema usa vecchia chiave
  [ ] Documentare rotazione nel log
  [ ] Chiudere ticket

EMERGENCY ROTATION (post-breach):
  [ ] Rotazione IMMEDIATA di TUTTE le chiavi
  [ ] Nessuna fase di attesa
  [ ] Monitoraggio intensivo 24h
  [ ] Post-mortem entro 48h
```

### 8.3 Calendario Rotazione

```
2025 ROTATION CALENDAR

Gennaio:
  [ ] 15 - Resend API Key (Dev/Staging/Prod)
  [ ] 20 - OpenAI API Key

Febbraio:
  [ ] 01 - Encryption Key (Production)

Marzo:
  [ ] 15 - Resend API Key
  [ ] 20 - OpenAI API Key
  [ ] 25 - Database Password

Aprile:
  [ ] 01 - hCaptcha Secret
  [ ] 15 - CI/CD Token

Maggio:
  [ ] 15 - Resend API Key
  [ ] 20 - OpenAI API Key

Giugno:
  [ ] 01 - Encryption Key
  [ ] 15 - Database Password

Luglio:
  [ ] 15 - Resend API Key
  [ ] 20 - OpenAI API Key

Agosto:
  [ ] 01 - hCaptcha Secret
  [ ] 15 - CI/CD Token

Settembre:
  [ ] 15 - Resend API Key
  [ ] 20 - OpenAI API Key
  [ ] 25 - Database Password

Ottobre:
  [ ] 01 - Encryption Key

Novembre:
  [ ] 15 - Resend API Key
  [ ] 20 - OpenAI API Key

Dicembre:
  [ ] 01 - hCaptcha Secret
  [ ] 15 - CI/CD Token
  [ ] 20 - Database Password
  [ ] 28 - Annual key review
```

### 8.4 Rollback Procedure

```
In caso di problemi dopo rotazione:

1. NON riattivare la vecchia chiave (security risk)
2. Verificare che la nuova chiave sia correttamente configurata
3. Se la nuova chiave non funziona:
   a. Generare ULTERIORE nuova chiave
   b. NON tornare alla vecchia
4. Escalation a Tech Lead + CISO se impatto > 1 ora
5. Documentare nella post-mortem
```

---

## 9. Checklist Deploy

### 9.1 Pre-Deploy Checklist

```
[ ] Tutti i test passano (unit, integration, e2e)
[ ] Security scan passa (npm audit, secret check)
[ ] RLS policies testate e verificate
[ ] Environment variables aggiornate
[ ] Nessun secret hardcoded nel codice
[ ] Changelog aggiornato
[ ] Rollback plan pronto
[ ] Monitoring dashboard aperta
[ ] Team on-call notificato
```

### 9.2 Deploy Checklist

```
[ ] Deploy su Staging prima di Production
[ ] Smoke test su Staging completato
[ ] Approval da Security per Production
[ ] Deploy su Production in maintenance window (se necessario)
[ ] Verificare monitoring: error rate, latency
[ ] Verificare tutti i servizi esterni (Supabase, Resend, etc.)
```

### 9.3 Post-Deploy Checklist

```
[ ] Monitoring per 2h post-deploy
[ ] Nessun alert critico
[ ] Error rate sotto soglia
[ ] Latency normale
[ ] Tutti i flussi utente funzionanti
[ ] Comunicazione team esito deploy
[ ] Ticket aggiornato e chiuso
```

---

## 10. Appendici

### 10.1 Comandi Utili

```bash
# ============================================
# SUPABASE CLI
# ============================================

# Login
supabase login

# Start local environment
supabase start

# Status
supabase status

# Stop
supabase stop

# Reset database (local)
supabase db reset

# Link project
supabase link --project-ref [PROJECT_REF]

# Push migrations
supabase db push

# Pull schema
supabase db pull

# Generate types
supabase gen types typescript --project-id [PROJECT_REF] --schema public > types/supabase.ts

# ============================================
# VERCEL CLI
# ============================================

# Login
vercel login

# Deploy development
vercel --target=development

# Deploy staging
vercel --target=staging

# Deploy production
vercel --target=production

# Pull environment variables
vercel env pull .env.local

# List environment variables
vercel env ls

# Add environment variable
vercel env add [NAME] [environment]

# Remove environment variable
vercel env rm [NAME] [environment]

# ============================================
# SECRET GENERATION
# ============================================

# Generate secure random key (32 bytes, base64)
openssl rand -base64 32

# Generate secure random key (hex)
openssl rand -hex 32

# Generate JWT secret
openssl rand -base64 64

# Generate password
openssl rand -base64 24
```

### 10.2 Troubleshooting

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| `AuthApiError: Invalid API Key` | Wrong ANON key | Verificare `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `JWT expired` | Clock skew | Sincronizzare NTP, verificare timezone |
| `new row violates row-level security` | RLS policy mancante | Verificare policy, usare service role per seed |
| `storage object not found` | Bucket o path errato | Verificare nome bucket e path |
| `429 Too Many Requests` | Rate limit | Verificare piano Supabase, implementare backoff |
| `postgrest: connection pool exhausted` | Troppe connessioni | Aumentare pool size o implementare connection pooling |

### 10.3 Riferimenti

| Documento | URL |
|-----------|-----|
| Supabase Docs | https://supabase.com/docs |
| Supabase Auth | https://supabase.com/docs/guides/auth |
| Supabase Storage | https://supabase.com/docs/guides/storage |
| Supabase RLS | https://supabase.com/docs/guides/auth/row-level-security |
| Next.js Env | https://nextjs.org/docs/app/building-your-application/configuring/environment-variables |
| Vercel Env | https://vercel.com/docs/concepts/projects/environment-variables |
| Resend Docs | https://resend.com/docs |
| OWASP Secrets | https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html |

### 10.4 Revision History

| Versione | Data | Autore | Modifiche |
|----------|------|--------|-----------|
| 1.0 | 2025-01-15 | DevOps / Security | Versione iniziale |

---

**FINE DOCUMENTO**

*Questo documento e classificato CONFIDENZIALE. Contiene istruzioni per l'accesso a sistemi di produzione. Distribuzione limitata al DevOps e Security Team.*
