import { Separator } from "@/components/ui/separator";

const sections = [
  {
    title: "Il nostro impegno",
    content: [
      "Ricordati di Te è progettato per essere accessibile a tutti, indipendentemente dalle capacità o dalle tecnologie assistive utilizzate. Ci impegniamo a rispettare le linee guida WCAG 2.1 livello AA.",
    ],
  },
  {
    title: "Funzionalità di accessibilità",
    content: [
      "Navigazione da tastiera per tutte le funzioni principali. Contrasto dei colori adeguato per una lettura confortevole. Testi alternativi per le immagini significative. Struttura semantica delle pagine con titoli e landmark appropriati. Form con etichette associate e messaggi di errore chiari.",
    ],
  },
  {
    title: "Segnalazioni e miglioramenti",
    content: [
      "Se riscontri barriere all'accessibilità o hai suggerimenti per migliorare l'esperienza, contattaci a supporto@ricordatidite.it. Risponderemo entro 5 giorni lavorativi.",
    ],
  },
];

export default function AccessibilitaPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Accessibilità
          </h1>
          <p className="mt-4 text-muted-foreground">Ultimo aggiornamento: 15 luglio 2026</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          {sections.map((section, index) => (
            <div key={index}>
              <h2 className="mb-4 text-xl font-semibold tracking-tight">{section.title}</h2>
              {section.content.map((paragraph, pIndex) => (
                <p key={pIndex} className="text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {index < sections.length - 1 && <Separator className="mt-8" />}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
