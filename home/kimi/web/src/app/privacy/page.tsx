import { Separator } from "@/components/ui/separator";

const sections = [
  {
    title: "Titolare del trattamento",
    content: [
      "Il titolare del trattamento dei dati personali è Ricordati di Te S.r.l., con sede legale in Via Roma 123, 00100 Roma (RM), Partita IVA 12345678901, indirizzo email privacy@ricordatidite.it.",
      "Per qualsiasi questione relativa alla privacy e al trattamento dei dati personali, è possibile contattare il titolare ai recapiti sopra indicati.",
    ],
  },
  {
    title: "Dati raccolti",
    content: [
      "Raccogliamo i seguenti tipi di dati personali:",
      "Dati di registrazione: nome, cognome, indirizzo email, password crittografata. Dati del profilo: fotografia profilo, relazione con la persona ricordata, biografia. Dati dei memoriali: nome, cognome, date di nascita e decesso, luoghi, fotografie, video, storie e ricordi condivisi dalla community. Dati di navigazione: indirizzo IP, tipo di browser, pagine visitate, tempo di permanenza, cookie tecnici. Dati di comunicazione: messaggi inviati attraverso la piattaforma, segnalazioni, richieste di supporto.",
    ],
  },
  {
    title: "Finalità del trattamento",
    content: [
      "I dati personali vengono trattati per le seguenti finalità:",
      "Fornitura del servizio: creazione e gestione dei memoriali, gestione degli account utente, condivisione dei contenuti tra i membri invitati. Comunicazioni: invio di notifiche relative all'attività sui memoriali, aggiornamenti sul servizio, risposte alle richieste di supporto. Sicurezza: prevenzione di frodi, abusi e attività illegali, monitoraggio della sicurezza della piattaforma. Miglioramento del servizio: analisi statistiche anonime per comprendere l'utilizzo della piattaforma e migliorarne l'esperienza utente.",
    ],
  },
  {
    title: "Base giuridica",
    content: [
      "Il trattamento dei dati personali si basa sui seguenti presupposti giuridici, ai sensi dell'articolo 6 del GDPR:",
      "Esecuzione di un contratto: il trattamento è necessario per l'erogazione del servizio richiesto dall'utente. Obblighi legali: adempimento degli obblighi previsti dalla legge. Interesse legittimo: garanzia della sicurezza della piattaforma e prevenzione degli abusi. Consenso: per attività di marketing diretto e utilizzo di cookie non tecnici, per i quali viene richiesto un consenso esplicito e revocabile in qualsiasi momento.",
    ],
  },
  {
    title: "Conservazione dei dati",
    content: [
      "I dati personali vengono conservati per il tempo strettamente necessario alle finalità per cui sono stati raccolti:",
      "Dati dell'account: conservati per tutta la durata della registrazione sulla piattaforma. Dati dei memoriali: conservati fino a quando il memoriale rimane attivo, salvo richiesta di eliminazione da parte del custode o degli eredi. Dati di navigazione: conservati per un periodo massimo di 12 mesi, in forma anonimizzata o aggregata. I dati possono essere conservati oltre questi termini solo se necessario per adempiere a obblighi legali o per accertare, esercitare o difendere un diritto in sede giudiziaria.",
    ],
  },
  {
    title: "Diritti degli interessati",
    content: [
      "Ai sensi degli articoli 15-22 del GDPR, gli utenti hanno il diritto di:",
      "Accesso: ottenere la conferma del trattamento dei propri dati personali e una copia degli stessi. Rettifica: richiedere la correzione dei dati inesatti o l'integrazione di quelli incompleti. Cancellazione: richiedere l'eliminazione dei dati personali quando non sussistono più i presupposti per il trattamento. Limitazione: ottenere la limitazione del trattamento in determinati casi previsti dalla legge. Portabilità: ricevere i dati in formato strutturato, di uso comune e leggibile da dispositivo automatico. Opposizione: opporsi al trattamento dei dati per motivi legittimi. Revoca del consenso: revocare in qualsiasi momento il consenso prestato, senza pregiudicare la liceità del trattamento basata sul consenso prima della revoca. Reclamo: proporre reclamo all'Autorità Garante per la Protezione dei Dati Personali.",
      "Per esercitare i propri diritti, gli utenti possono contattare il titolare del trattamento all'indirizzo email privacy@ricordatidite.it.",
    ],
  },
  {
    title: "Cookie",
    content: [
      "La piattaforma utilizza i seguenti tipi di cookie:",
      "Cookie tecnici: necessari per il funzionamento della piattaforma e l'erogazione del servizio. Questi cookie non richiedono il consenso dell'utente. Cookie analitici: utilizzati per raccogliere informazioni statistiche anonime sull'utilizzo della piattaforma, al fine di migliorarne le prestazioni. Cookie di terze parti: la piattaforma può integrare servizi di terze parti (ad esempio per l'hosting delle immagini) che potrebbero utilizzare cookie propri. Cookie di profilazione: non utilizziamo cookie di profilazione per la pubblicità comportamentale.",
      "L'utente può gestire le preferenze relative ai cookie attraverso le impostazioni del proprio browser. È possibile bloccare o eliminare i cookie, tenendo presente che tale scelta potrebbe influire sulla fruizione di alcune funzionalità della piattaforma.",
    ],
  },
  {
    title: "Sicurezza dei dati",
    content: [
      "Adottiamo misure tecniche e organizzative adeguate per garantire la sicurezza dei dati personali e prevenire accessi non autorizzati, perdita, distruzione o alterazione dei dati:",
      "Crittografia: tutti i dati sensibili vengono trasmessi e conservati in forma crittografata. Accesso limitato: solo il personale autorizzato può accedere ai dati personali, in base al principio del privilegio minimo. Monitoraggio: la piattaforma è costantemente monitorata per rilevare e prevenire potenziali minacce alla sicurezza. Backup: i dati vengono sottoposti a backup regolari per garantire la loro disponibilità in caso di incidenti.",
    ],
  },
  {
    title: "Contatti",
    content: [
      "Per qualsiasi domanda, richiesta o reclamo relativo alla privacy e al trattamento dei dati personali, è possibile contattarci ai seguenti recapiti:",
      "Email: privacy@ricordatidite.it. Indirizzo postale: Ricordati di Te S.r.l., Via Roma 123, 00100 Roma (RM). PEC: ricordatidite@pec.it. Risponderemo a tutte le richieste entro 30 giorni dalla ricezione.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Informativa sulla Privacy
          </h1>
          <p className="mt-4 text-muted-foreground">
            Ultimo aggiornamento: 15 luglio 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-8 text-muted-foreground leading-relaxed">
            La presente informativa descrive le modalità di trattamento dei dati
            personali degli utenti che utilizzano la piattaforma Ricordati di
            Te. Il rispetto della privacy e la protezione dei dati personali
            sono fondamentali per noi. Ti invitiamo a leggere attentamente
            questa informativa prima di utilizzare i nostri servizi.
          </p>

          <Separator className="my-8" />

          <div className="space-y-10">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="mb-4 text-xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.content.map((paragraph, pIndex) => (
                    <p
                      key={pIndex}
                      className="text-muted-foreground leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
