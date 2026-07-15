import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const principles = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
      </svg>
    ),
    title: "Rispetto",
    description:
      "Ogni memoriale è uno spazio sacro dedicato alla memoria di una persona cara. Trattiamo ogni contenuto, ogni storia e ogni ricordo con il massimo rispetto. Non tolleriamo linguaggio offensivo, commenti inappropriati o qualsiasi comportamento che possa mancare di rispetto alla memoria del defunto o ai sentimenti dei familiari.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: "Veridicità",
    description:
      "Condividi solo contenuti autentici e veritieri. I ricordi che pubblichiamo devono essere fedeli alla realtà e basati su esperienze realmente vissute. Non alterare fotografie in modo fuorviante, non inventare storie e non pubblicare informazioni false sulla persona ricordata. L'autenticità è il fondamento di ogni memoriale.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m16 18 2-2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3l2 2" />
        <path d="m8 11 4 4 4-4" />
        <path d="M12 3v12" />
      </svg>
    ),
    title: "Consenso",
    description:
      "Rispetta sempre la volontà della famiglia e dei parenti stretti. Prima di pubblicare foto o storie che coinvolgono altre persone, assicurati di avere il loro consenso. Il custode del memoriale ha il diritto di decidere quali contenuti sono appropriati e di rimuovere quelli che non rispettano la sensibilità della famiglia.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Privacy",
    description:
      "Proteggi la privacy tua e di chi ami. Non condividere informazioni personali sensibili come indirizzi, numeri di telefono o documenti privati. Rispetta la privacy degli altri membri della community e non raccogliere dati personali senza autorizzazione. La piattaforma è progettata per proteggere i tuoi dati secondo gli standard GDPR.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Inclusività",
    description:
      "Tutti sono i benvenuti su Ricordati di Te, indipendentemente dalla loro origine, religione, cultura o orientamento. Ogni persona ha il diritto di ricordare e onorare chi ha amato secondo le proprie tradizioni e credenze. Abbracciamo la diversità e rifiutiamo ogni forma di discriminazione.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    title: "Empatia",
    description:
      "Mettiti nei panni degli altri prima di pubblicare un commento o un contenuto. Ogni persona prova il lutto in modo diverso e ogni famiglia ha la sua sensibilità. Sii gentile nelle parole, paziente nelle interazioni e comprensivo verso le emozioni altrui. Un piccolo gesto di empatia può fare una grande differenza per chi è in difficoltà.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
    title: "Responsabilità",
    description:
      "Ogni azione sulla piattaforma ha conseguenze. Sei responsabile dei contenuti che pubblichi e dei commenti che lasci. Pensa sempre alle ripercussioni che le tue parole possono avere su familiari e amici della persona ricordata. Utilizza la piattaforma in modo etico e responsabile, contribuendo a mantenere un ambiente positivo e rispettoso.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Permanenza",
    description:
      "I ricordi che condividiamo restano nel tempo come un patrimonio prezioso per le generazioni future. Contribuisci a costruire un archivio di memoria che possa essere tramandato. I memoriali sono luoghi di memoria duraturi: scegli con cura i contenuti che pubblichi, sapendo che diventeranno parte di un ricordo permanente e significativo.",
  },
];

export default function PrincipiPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            I Principi della Community
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Questi valori guidano ogni interazione sulla piattaforma e ci
            aiutano a mantenere uno spazio di ricordo sereno, rispettoso e
            autentico per tutti.
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-muted-foreground leading-relaxed">
            Ricordati di Te è molto più di una piattaforma: è una community di
            persone unite dal desiderio di preservare la memoria di chi hanno
            amato. Per garantire che ogni memoriale sia un luogo sereno e
            rispettoso, abbiamo definito otto principi fondamentali che ogni
            membro si impegna a rispettare. Questi valori sono il cuore della
            nostra community e la base su cui costruiamo un ambiente accogliente
            per tutti.
          </p>
        </div>
      </section>

      <Separator />

      {/* Principles Grid */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {principles.map((principle, index) => (
            <Card key={index} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {principle.icon}
                </div>
                <CardTitle className="text-lg font-semibold">
                  {index + 1}. {principle.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {principle.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Closing */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Un impegno condiviso
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Il rispetto di questi principi è un impegno che ci unisce tutti.
            Ogni membro della community contribuisce a creare un ambiente dove
            il dolore del lutto può essere condiviso con delicatezza, dove i
            ricordi possono essere celebrati con gioia e dove la memoria delle
            persone care trova uno spazio protetto e duraturo. Se riscontri
            comportamenti che violano questi principi, ti invitiamo a segnalarli
            al team di moderazione.
          </p>
        </div>
      </section>
    </div>
  );
}
