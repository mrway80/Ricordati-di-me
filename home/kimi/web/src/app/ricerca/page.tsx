"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const memorials = [
  {
    slug: "antonio-rossi-1945",
    firstName: "Antonio",
    lastName: "Rossi",
    nickname: "Tony",
    birthDate: "1945-05-20",
    deathDate: "2023-11-12",
    birthPlace: "Napoli",
    deathPlace: "Milano",
    mainPhotoUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    guardianName: "Giulia Rossi",
    memberCount: 12,
    postCount: 8,
    photoCount: 24,
  },
  {
    slug: "elena-bianchi-1950",
    firstName: "Elena",
    lastName: "Bianchi",
    nickname: null,
    birthDate: "1950-09-08",
    deathDate: "2024-02-20",
    birthPlace: "Roma",
    deathPlace: "Roma",
    mainPhotoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    guardianName: "Marco Bianchi",
    memberCount: 8,
    postCount: 5,
    photoCount: 16,
  },
  {
    slug: "giuseppe-verdi-1938",
    firstName: "Giuseppe",
    lastName: "Verdi",
    nickname: "Beppe",
    birthDate: "1938-12-01",
    deathDate: "2022-08-15",
    birthPlace: "Palermo",
    deathPlace: "Firenze",
    mainPhotoUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    guardianName: "Anna Verdi",
    memberCount: 15,
    postCount: 12,
    photoCount: 38,
  },
  {
    slug: "francesca-neri-1960",
    firstName: "Francesca",
    lastName: "Neri",
    nickname: "Francy",
    birthDate: "1960-03-25",
    deathDate: "2024-05-10",
    birthPlace: "Bologna",
    deathPlace: "Bologna",
    mainPhotoUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
    guardianName: "Luca Neri",
    memberCount: 22,
    postCount: 15,
    photoCount: 42,
  },
];

function formatYear(dateStr: string): string {
  return new Date(dateStr).getFullYear().toString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function RicercaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMemorials, setFilteredMemorials] = useState(memorials);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredMemorials(memorials);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = memorials.filter(
      (m) =>
        m.firstName.toLowerCase().includes(query) ||
        m.lastName.toLowerCase().includes(query) ||
        (m.nickname && m.nickname.toLowerCase().includes(query)) ||
        m.birthPlace.toLowerCase().includes(query) ||
        m.deathPlace.toLowerCase().includes(query)
    );
    setFilteredMemorials(filtered);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Cerca un memoriale
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Trova il memoriale di una persona cara e unisciti alla community per
            condividere ricordi e momenti speciali.
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="container mx-auto px-4 -mt-8">
        <Card className="mx-auto max-w-2xl border-border/50 shadow-lg">
          <CardContent className="flex gap-3 p-4">
            <Input
              placeholder="Cerca per nome, cognome, città..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Cerca
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredMemorials.length} memoriale
            {filteredMemorials.length !== 1 ? "i" : ""} trovato
            {filteredMemorials.length !== 1 ? "i" : ""}
          </p>
        </div>

        {filteredMemorials.length === 0 ? (
          <div className="py-16 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <p className="text-lg font-medium text-foreground">
              Nessun memoriale trovato
            </p>
            <p className="mt-2 text-muted-foreground">
              Prova a cercare con altri termini o verifica la ortografia.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredMemorials.map((memorial) => (
              <Link
                key={memorial.slug}
                href={`/memoriale/${memorial.slug}`}
                className="group"
              >
                <Card className="h-full overflow-hidden border-border/50 transition-all duration-200 hover:shadow-lg hover:border-primary/30">
                  <CardContent className="flex gap-5 p-5">
                    {/* Photo */}
                    <div className="shrink-0">
                      <img
                        src={memorial.mainPhotoUrl}
                        alt={`${memorial.firstName} ${memorial.lastName}`}
                        className="h-24 w-24 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {memorial.firstName} {memorial.lastName}
                          {memorial.nickname && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              &ldquo;{memorial.nickname}&rdquo;
                            </span>
                          )}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatYear(memorial.birthDate)} —{" "}
                          {formatYear(memorial.deathDate)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                          {memorial.birthPlace} — {memorial.deathPlace}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-1"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                            </svg>
                            {memorial.memberCount} membri
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Custode: {memorial.guardianName}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          {memorial.postCount} ricordi
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              width="18"
                              height="18"
                              x="3"
                              y="3"
                              rx="2"
                              ry="2"
                            />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                          {memorial.photoCount} foto
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Non trovi il memoriale che cerchi?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Crea tu il memoriale per una persona cara e invita altri a
            contribuire con i propri ricordi.
          </p>
          <div className="mt-8">
            <Link href="/crea-memoriale">
              <Button size="lg">Crea un nuovo memoriale</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
