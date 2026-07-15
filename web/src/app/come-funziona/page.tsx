"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const steps = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v18" />
        <path d="M5 10h14" />
        <path d="M5 14h14" />
        <rect width="18" height="18" x="3" y="3" rx="2" />
      </svg>
    ),
    title: "Crea un memoriale",
    description:
      "Dedica uno spazio online alla persona cara che non c'è più. In pochi semplici passaggi puoi creare un memoriale personalizzato con foto, ricordi, storie e tutto ciò che ne ha caratterizzato la vita. Il memoriale diventa un luogo virtuale dove la sua memoria vive e viene preservata per le generazioni future.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m22 21-3.86-3.86" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Invita chi conosceva la persona",
    description:
      "Condividi il memoriale con parenti, amici e tutte le persone che hanno avuto il privilegio di conoscere chi ami ricordare. Ogni persona invitata può contribuire con i propri ricordi, foto e storie, arricchendo il memoriale con prospettive diverse e momenti unici che solo lei poteva conoscere.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h.01" />
        <path d="M12 10h.01" />
        <path d="M16 10h.01" />
      </svg>
    ),
    title: "Condividi ricordi",
    description:
      "Scrivi pensieri, aneddoti e momenti speciali che hai condiviso con la persona amata. Carica fotografie di ogni epoca, video e documenti che raccontano la sua storia. Ogni contributo è un tassello prezioso che mantiene vivo il ricordo e crea un ritratto completo e autentico della sua vita.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
        <path d="m4.5 4.5 2.9 2.9" />
        <path d="m16.6 16.6 2.9 2.9" />
        <path d="M2 21l2.9-2.9" />
        <path d="m19.1 6.5 2.9-2.9" />
        <path d="m21 22-2.9-2.9" />
        <path d="m6.5 4.5-2.9-2.9" />
      </svg>
    ),
    title: "Custodisci la memoria",
    description:
      "Il memoriale resta nel tempo come un luogo sacro della memoria. Puoi sempre aggiungere nuovi contenuti, rivisitare i ricordi condivisi e far partecipare nuove persone. La memoria della persona cara viene preservata in modo sicuro e rispettoso, costruendo un patrimonio di ricordi per le generazioni presenti e future.",
  },
];

const faqs = [
  {
    question: "È gratuito creare un memoriale?",
    answer:
      "Sì, la creazione e la gestione di un memoriale base è completamente gratuita. Offriamo anche piani premium con funzionalità aggiuntive per chi desidera uno spazio ancora più personalizzato.",
  },
  {
    question: "Chi può vedere il memoriale?",
    answer:
      "Tu decidi chi può accedere al memoriale. Puoi renderlo privato (accessibile solo su invito), visibile solo ai membri della famiglia, o pubblico. Il controllo completo sulla privacy è nelle tue mani.",
  },
  {
    question: "Posso invitare persone che non sono della famiglia?",
    answer:
      "Certamente. Chiunque abbia conosciuto e amato la persona può essere invitato a contribuire: amici, colleghi, compagni di scuola, vicini di casa. Ogni prospettiva è preziosa per costruire un ricordo completo.",
  },
  {
    question: "I dati e le foto sono al sicuro?",
    answer:
      "Assolutamente sì. Utilizziamo sistemi di crittografia avanzati e server sicuri per proteggere tutti i contenuti. I dati non vengono mai condivisi con terze parti e vengono conservati in conformità con il GDPR.",
  },
  {
    question: "Posso eliminare il memoriale in futuro?",
    answer:
      "Sì, come creatore del memoriale hai sempre il pieno controllo. Puoi decidere di eliminare il memoriale in qualsiasi momento, oppure trasferire la gestione a un altro membro della famiglia.",
  },
  {
    question: "Per quanto tempo resta attivo il memoriale?",
    answer:
      "I memoriali creati sulla nostra piattaforma restano attivi nel tempo. Il nostro impegno è preservare questi ricordi come un patrimonio prezioso per le famiglie e per le generazioni future.",
  },
];

export default function ComeFunzionaPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Come funziona
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Quattro semplici passaggi per creare un luogo digitale dove ricordare
            e onorare chi hai amato. Un percorso semplice e rispettoso.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-2">
          {steps.map((step, index) => (
            <Card key={index} className="border-border/50">
              <CardHeader className="pb-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <CardTitle className="text-xl font-semibold">
                  {index + 1}. {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
            Domande frequenti
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="cursor-pointer border-border/50 transition-colors hover:bg-muted/30"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {faq.question}
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`shrink-0 text-muted-foreground transition-transform ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </CardHeader>
                {openFaq === index && (
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Pronto a creare un memoriale?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Inizia oggi stesso a costruire un luogo di ricordo per la persona che
            hai amato.
          </p>
          <div className="mt-8">
            <Link href="/memoriale/crea">
              <Button size="lg">Crea un memoriale</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
