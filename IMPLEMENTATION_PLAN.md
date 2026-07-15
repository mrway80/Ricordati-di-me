# IMPLEMENTATION PLAN — Ricordati di Te

## Milestone 0 — Fondazione (COMPLETATA)

### Obiettivo
Struttura repository, configurazione, design system, documentazione architetturale, database design, Supabase, Auth, RLS, logging, error handling, CI base.

### File Creati

#### Documentazione (12 file)
| File | Righe | Contenuto |
|------|-------|-----------|
| `docs/product/PRD.md` | ~737 | Product Requirements Document |
| `docs/architecture/ARCHITECTURE.md` | ~1.587 | Architettura completa con ADRs |
| `docs/architecture/DOMAIN-MAP.md` | ~1.773 | Mappa 11 bounded contexts |
| `docs/architecture/INVENTORY.md` | ~579 | Inventario tecnico e stack |
| `docs/architecture/STRUCTURE.md` | ~1.177 | Struttura directory dettagliata |
| `docs/database/DATA-MODEL.md` | ~1.496 | Schema database 38 tabelle |
| `docs/security/THREAT-MODEL.md` | ~1.200 | Threat Model STRIDE |
| `docs/security/ABUSE-CASES.md` | ~1.100 | 8 casi di abuso |
| `docs/security/INCIDENT-RESPONSE.md` | ~1.050 | Piano risposta incidenti |
| `docs/operations/DEPLOYMENT.md` | ~1.472 | Guida deployment e CI/CD |
| `docs/operations/ENVIRONMENT.md` | ~950 | Configurazione ambienti |
| `supabase/migrations/00000000000000_initial_schema.sql` | ~1.474 | Migrazione SQL completa |
| `supabase/migrations/00000000000001_rls_policies.sql` | ~1.781 | Policy RLS (~120 policy) |

#### Progetto Next.js
| File | Righe | Contenuto |
|------|-------|-----------|
| `next.config.ts` | ~73 | Config Next.js con security headers |
| `tsconfig.json` | ~31 | TypeScript strict mode |
| `tailwind.config.ts` | ~185 | Design system tokens |
| `src/app/globals.css` | ~116 | Stili globali e componenti |
| `src/app/layout.tsx` | ~89 | Root layout con font |
| `src/app/template.tsx` | ~9 | Layout wrapper |
| `src/app/page.tsx` | ~194 | Landing page |
| `src/app/layout-wrapper.tsx` | ~10 | AppLayout wrapper |
| `src/middleware.ts` | ~103 | Auth middleware |

#### Supabase Client (3 file)
| File | Righe | Contenuto |
|------|-------|-----------|
| `src/lib/supabase/client.ts` | ~26 | Browser client |
| `src/lib/supabase/server.ts` | ~32 | Server client |
| `src/lib/supabase/admin.ts` | ~24 | Admin client (service role) |

#### Tipi e Validazioni (4 file)
| File | Righe | Contenuto |
|------|-------|-----------|
| `src/types/index.ts` | ~290 | Tipi TypeScript completi |
| `src/types/database.ts` | ~79 | Database types |
| `src/validations/auth.ts` | ~78 | Schemi Zod auth |
| `src/validations/memorial.ts` | ~72 | Schemi Zod memorial |
| `src/validations/post.ts` | ~55 | Schemi Zod post |
| `src/validations/media.ts` | ~85 | Schemi Zod media |

#### Server Actions (4 file)
| File | Righe | Contenuto |
|------|-------|-----------|
| `src/app/actions/auth.ts` | ~183 | SignUp, SignIn, SignOut, Session |
| `src/app/actions/memorial.ts` | ~290 | CRUD memorial, guardian check |
| `src/app/actions/post.ts` | ~268 | CRUD post, approve/reject |
| `src/app/actions/media.ts` | ~275 | Upload session, quarantena, approve |

#### Componenti Layout (3 file)
| File | Righe | Contenuto |
|------|-------|-----------|
| `src/components/layout/AppLayout.tsx` | ~27 | Layout con Navbar/Footer |
| `src/components/layout/Navbar.tsx` | ~220 | Navbar responsive con auth |
| `src/components/layout/Footer.tsx` | ~87 | Footer con link |

#### Pagine (7 file)
| File | Righe | Contenuto |
|------|-------|-----------|
| `src/app/page.tsx` | ~194 | Landing page completa |
| `src/app/registrati/page.tsx` | ~192 | Registrazione con validazione |
| `src/app/login/page.tsx` | ~108 | Login con redirect |
| `src/app/dashboard/page.tsx` | ~210 | Dashboard con memoriali |
| `src/app/memoriale/crea/page.tsx` | ~315 | Creazione memoriale |
| `src/app/memoriale/[slug]/page.tsx` | ~200 | Visualizzazione memoriale |
| `src/app/memoriale/page.tsx` | ~5 | Redirect a ricerca |

#### Componenti Memoriale (5 file)
| File | Righe | Contenuto |
|------|-------|-----------|
| `src/app/memoriale/[slug]/MemorialFeed.tsx` | ~148 | Feed ricordi con approve/reject |
| `src/app/memoriale/[slug]/MediaGallery.tsx` | ~155 | Galleria foto con lightbox |
| `src/app/memoriale/[slug]/SupportWall.tsx` | ~152 | Muro messaggi vicinanza |
| `src/app/memoriale/[slug]/UploadMediaButton.tsx` | ~171 | Upload con drag&drop e progress |
| `src/app/memoriale/[slug]/CreatePostButton.tsx` | ~89 | Composer ricordi |
| `src/app/memoriale/[slug]/ApprovalQueue.tsx` | ~157 | Coda approvazione custode |

#### Utility
| File | Righe | Contenuto |
|------|-------|-----------|
| `src/lib/utils.ts` | ~125 | Helper functions |

#### Componenti UI shadcn (20+ componenti)
button, card, dialog, form, input, label, select, tabs, toast, textarea, avatar, dropdown-menu, badge, separator, skeleton, alert, progress, tooltip, scroll-area, sheet, breadcrumb, carousel

### Comandi Eseguiti
```bash
create-next-app web --typescript --tailwind --eslint --app --src-dir
npm install @supabase/supabase-js @supabase/ssr zod react-hook-form date-fns
npx shadcn@latest init -d
npx shadcn@latest add [20+ componenti]
npm run build  # SUCCESS
```

### Risultati
- **TypeScript**: 0 errori (strict mode)
- **Build Next.js**: SUCCESS (9 pagine generate)
- **Lint**: Non eseguito (limitazioni ambiente)
- **Test**: Struttura preparata, esecuzione in milestone successive

### Decisioni Architetturali
1. Next.js 16 App Router con Server Components default
2. Tailwind CSS v3 con design system custom (token caldi/ocra)
3. shadcn/ui per componenti base (adattati a Tailwind v3)
4. Supabase Auth + RLS per sicurezza
5. Server Actions per operazioni CRUD
6. Pattern repository/service leggero via actions
7. Upload media in quarantena con signed URLs

### Rischio Residui
- Test E2E da implementare con Playwright
- Configurazione Supabase reale richiede variabili d'ambiente
- Pipeline CI/CD da configurare su GitHub Actions
- Ottimizzazione performance (image CDN, caching)

### Prossimo Passo
Milestone 1 — Memoriale: migliorare UX creazione, aggiungere upload foto profilo/copertina, timeline biografica.

---
Data: 2026-07-15
