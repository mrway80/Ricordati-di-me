import { Metadata } from "next";
import Link from "next/link";
import { Heart, Shield, Users, Lock, Camera, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Un luogo per ricordare",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-24 sm:py-32 lg:py-40 text-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Heart className="h-4 w-4" />
            <span>Uno spazio sicuro per i tuoi ricordi</span>
          </div>

          <h1 className="memorial-title text-4xl sm:text-5xl lg:text-6xl">
            Ogni storia merita di essere
            <span className="text-primary"> ricordata</span>
          </h1>

          <p className="memorial-subtitle max-w-2xl mx-auto text-lg sm:text-xl">
            Crea un memoriale digitale per chi hai amato. Un luogo protetto dove familiari e
            amici possono condividere ricordi, fotografie e celebrare una vita vissuta.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto text-base px-8" >
              <Link href="/registrati">Crea un memoriale</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base px-8"
              
            >
              <Link href="/ricerca">Trova un memoriale</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="content-section py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="memorial-display-sm font-display text-3xl sm:text-4xl mb-4">
              Progettato con rispetto e cura
            </h2>
            <p className="memorial-subtitle max-w-xl mx-auto">
              Ogni funzione e pensata per proteggere la memoria dei tuoi cari e garantire
              un&apos;esperienza serena.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Governance familiare"
              description="I familiari mantengono il controllo completo sul memoriale, decidendo chi può pubblicare e cosa viene condiviso."
            />
            <FeatureCard
              icon={<Lock className="h-6 w-6" />}
              title="Privacy garantita"
              description="Scegli chi può vedere il memoriale: pubblico, su invito o completamente privato per solo la famiglia."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Community rispettosa"
              description="Amici e conoscenti possono partecipare in modo controllato, con messaggi di vicinanza e supporto."
            />
            <FeatureCard
              icon={<Camera className="h-6 w-6" />}
              title="Media protetti"
              description="Fotografie e video passano attraverso una pipeline di sicurezza con quarantena e approvazione."
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Biografia e timeline"
              description="Racconta la storia della persona attraverso una biografia dettagliata e una timeline degli eventi."
            />
            <FeatureCard
              icon={<Search className="h-6 w-6" />}
              title="Ricerca semplice"
              description="Trova memoriali per nome, luogo o data attraverso un sistema di ricerca rispettoso della privacy."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="content-section py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl mb-4">
              Come funziona
            </h2>
            <p className="memorial-subtitle max-w-xl mx-auto">
              In pochi passaggi puoi creare un memoriale duraturo e significativo.
            </p>
          </div>

          <div className="space-y-12">
            <Step
              number={1}
              title="Registrati e crea il memoriale"
              description="Crea un account gratuito e inizia a configurare la pagina memoriale con i dati biografici e le fotografie."
            />
            <Step
              number={2}
              title="Diventa il Custode della Memoria"
              description="In qualita di familiare diretto, diventi il custode responsabile della gestione e moderazione del memoriale."
            />
            <Step
              number={3}
              title="Invita familiari e amici"
              description="Invita le persone che conoscevano il tuo caro a partecipare e condividere i loro ricordi."
            />
            <Step
              number={4}
              title="Approva e custodisci"
              description="Ogni contenuto proposto passa attraverso la tua approvazione. Tu decidi cosa viene pubblicato."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="content-section py-20 bg-primary/[0.03]">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl">
            Inizia a custodire un ricordo
          </h2>
          <p className="memorial-subtitle text-lg">
            La registrazione e gratuita e richiede solo un minuto. Creare un memoriale e un
            gesto d&apos;amore che dura nel tempo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto text-base px-8" >
              <Link href="/registrati">Registrati gratuitamente</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base px-8"
              
            >
              <Link href="/come-funziona">Scopri di piu</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="memorial-card p-6 space-y-4">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="text-foreground-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg">
        {number}
      </div>
      <div className="space-y-2 pt-1">
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <p className="text-foreground-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
