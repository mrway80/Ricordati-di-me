import { Separator } from "@/components/ui/separator";

const sections = [
  {
    title: "Accettazione dei termini",
    content: [
      "I presenti Termini e Condizioni regolano l'utilizzo della piattaforma Ricordati di Te. Accedendo al servizio, creando un account o utilizzando qualsiasi funzionalità della piattaforma, l'utente dichiara di aver letto, compreso e accettato integralmente i presenti termini.",
      "Qualora l'utente non intenda accettare i presenti termini, è tenuto a non utilizzare il servizio e a procedere immediatamente alla cancellazione del proprio account. Il titolare si riserva il diritto di modificare i presenti termini in qualsiasi momento, dandone comunicazione agli utenti attraverso la piattaforma o via email.",
    ],
  },
  {
    title: "Descrizione del servizio",
    content: [
      "Ricordati di Te è una piattaforma online dedicata alla creazione di memoriali digitali per persone decedute. Il servizio consente agli utenti di: creare pagine commemorative personalizzate; invitare familiari e amici a partecipare; condividere ricordi, fotografie, storie e messaggi; conservare e preservare la memoria della persona cara nel tempo.",
      "Il servizio è fornito 'così com'è' e il titolare non garantisce che la piattaforma sia sempre disponibile o priva di errori. Possono essere previsti periodi di manutenzione durante i quali l'accesso al servizio potrebbe essere temporaneamente sospeso.",
    ],
  },
  {
    title: "Registrazione e account",
    content: [
      "Per utilizzare le funzionalità della piattaforma è necessario registrarsi creando un account personale. L'utente si impegna a fornire informazioni veritiere, accurate e complete durante la registrazione, e a mantenerle aggiornate.",
      "Le credenziali di accesso sono personali e intransferibili. L'utente è responsabile della riservatezza della propria password e di ogni attività che avvenga tramite il proprio account. In caso di uso non autorizzato del proprio account, l'utente è tenuto a informare immediatamente il titolare.",
    ],
  },
  {
    title: "Contenuti degli utenti",
    content: [
      "Gli utenti mantengono la titolarità dei contenuti che pubblicano sulla piattaforma, concedendo a Ricordati di Te una licenza non esclusiva, gratuita e trasferibile per l'uso, la riproduzione, la distribuzione e la visualizzazione dei contenuti nell'ambito del servizio.",
      "L'utente dichiara e garantisce di detenere tutti i diritti necessari sui contenuti pubblicati, inclusi i diritti di proprietà intellettuale e i diritti all'immagine delle persone ritratte. L'utente si assume la piena responsabilità per i contenuti pubblicati, manlevando il titolare da qualsiasi reclamo o controversia derivante dalla pubblicazione di contenuti non autorizzati o illeciti.",
    ],
  },
  {
    title: "Governance familiare",
    content: [
      "Il memoriale è gestito da un 'custode', designato al momento della creazione. Il custode ha la responsabilità di amministrare il memoriale, moderare i contenuti e gestire gli inviti alla partecipazione.",
      "In caso di controversie tra i membri di un memoriale, il custode ha l'autorità finale sulle decisioni relative alla gestione dei contenuti. Se il custode non è più in grado di gestire il memoriale, può designare un successore o richiedere il trasferimento della custodia al titolare della piattaforma.",
    ],
  },
  {
    title: "Proibizioni",
    content: [
      "È strettamente vietato utilizzare la piattaforma per: pubblicare contenuti offensivi, diffamatori, osceni, discriminatori o che incitino all'odio; violare i diritti di proprietà intellettuale o i diritti alla privacy di terzi; utilizzare la piattaforma per scopi commerciali o pubblicitari non autorizzati; diffondere malware, virus o altri codici dannosi; raccogliere dati personali di altri utenti senza il loro consenso; impersonare altre persone o fornire informazioni false; disturbare, minacciare o molestare altri utenti.",
      "Il titolare si riserva il diritto di rimuovere qualsiasi contenuto che violi le presenti proibizioni e di sospendere o cancellare gli account degli utenti responsabili di tali violazioni.",
    ],
  },
  {
    title: "Moderazione",
    content: [
      "La piattaforma è moderata attraverso un sistema combinato di moderazione da parte del custode del memoriale e di interventi del team di Ricordati di Te. I contenuti segnalati dagli utenti vengono esaminati nel più breve tempo possibile.",
      "Il titolare si riserva il diritto di rimuovere, senza preavviso, qualsiasi contenuto che ritenga in violazione dei presenti termini o potenzialmente dannoso per la piattaforma o per gli utenti. Le decisioni di moderazione sono insindacabili e non danno diritto a risarcimenti o indennizzi.",
    ],
  },
  {
    title: "Limitazione di responsabilità",
    content: [
      "Ricordati di Te non è responsabile per i contenuti pubblicati dagli utenti. Il titolare non garantisce l'accuratezza, la completezza o la veridicità dei contenuti condivisi sulla piattaforma. Gli utenti utilizzano i contenuti degli altri utenti a proprio rischio.",
      "Nella misura massima consentita dalla legge applicabile, il titolare non sarà responsabile per danni indiretti, incidentali, speciali, consequenziali o punitivi derivanti dall'uso o dall'impossibilità di utilizzare il servizio, inclusa la perdita di dati, profitti o opportunità di business.",
    ],
  },
  {
    title: "Modifiche ai termini",
    content: [
      "Il titolare si riserva il diritto di modificare i presenti Termini e Condizioni in qualsiasi momento. Le modifiche entreranno in vigore dalla data di pubblicazione sulla piattaforma. Gli utenti verranno informati delle modifiche sostanziali tramite email o notifica sulla piattaforma.",
      "L'uso continuato del servizio dopo la pubblicazione delle modifiche costituisce accettazione dei nuovi termini. Qualora l'utente non accetti le modifiche, dovrà cessare l'utilizzo del servizio e procedere alla cancellazione dell'account.",
    ],
  },
  {
    title: "Legge applicabile e foro competente",
    content: [
      "I presenti Termini e Condizioni sono regolati dalla legge italiana. Per qualsiasi controversia derivante dall'interpretazione, esecuzione o violazione dei presenti termini, sarà competente il foro del luogo di residenza o domicilio dell'utente, se situato nel territorio italiano.",
      "Per gli utenti non residenti in Italia, ove consentito dalla legge, sarà competente il Foro di Roma. Prima di rivolgersi all'autorità giudiziaria, le parti si impegnano a tentare una risoluzione amichevole della controversia contattando il titolare all'indirizzo email indicato nella sezione 'Contatti' della piattaforma.",
    ],
  },
];

export default function TerminiPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Termini e Condizioni
          </h1>
          <p className="mt-4 text-muted-foreground">
            Data di entrata in vigore: 15 luglio 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-8 text-muted-foreground leading-relaxed">
            I presenti Termini e Condizioni costituiscono un accordo legale tra
            l'utente e Ricordati di Te S.r.l. e regolano l'accesso e
            l'utilizzo della piattaforma e dei suoi servizi. Ti invitiamo a
            leggere attentamente questi termini prima di utilizzare il nostro
            servizio.
          </p>

          <Separator className="my-8" />

          <div className="space-y-10">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="mb-4 text-xl font-semibold tracking-tight">
                  {index + 1}. {section.title}
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
