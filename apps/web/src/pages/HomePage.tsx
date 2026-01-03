import React from "react";
import { Link } from "wouter";

import { Container } from "@/components/Container";
import { SiteLayout } from "@/components/SiteLayout";

export function HomePage() {
  return (
    <SiteLayout
      title="Recalibra — Stimolazione del nervo vago"
      description="Recalibra ti guida in micro-esercizi per aiutarti a gestire stress e recupero: respiro, voce, movimento e routine sicure.">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-teal-400/15 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-500/15 blur-3xl" />
        </div>

        <Container className="py-20">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-teal-300" />
                  Beta privata — nuove sessioni ogni settimana
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  <img
                    src="/brand/icon.png"
                    alt=""
                    className="h-4 w-4 rounded"
                    loading="eager"
                    decoding="async"
                  />
                  iOS & Android
                </div>
              </div>

              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
                Micro-esercizi guidati per calmare il sistema nervoso.
              </h1>

              <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-slate-200">
                Recalibra unisce respiro, voce e movimento in routine brevi e sicure.
                Misura stress prima/dopo e costruisci costanza senza frizioni.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  className="inline-flex items-center justify-center rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-200"
                  href="mailto:hello@avalla.com?subject=Recalibra%20%E2%80%94%20Richiesta%20beta&body=Ciao%20Avalla%2C%20vorrei%20accedere%20alla%20beta%20di%20Recalibra.%0A%0ADevice%3A%20iOS%2FAndroid%0ACitt%C3%A0%3A%20">
                  Richiedi accesso beta
                </a>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-50 hover:bg-white/10">
                  Scopri le funzionalità
                </a>
              </div>

              <p className="mt-6 text-sm text-slate-400">
                Nota: Recalibra è un’app di wellness, non un dispositivo medico.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-50">Una sessione tipica</div>
                    <div className="mt-1 text-sm text-slate-300">8–12 minuti</div>
                  </div>
                  <div className="rounded-xl bg-teal-300/10 px-3 py-1 text-xs font-medium text-teal-200">
                    Guidata
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    {
                      title: "Check-in",
                      desc: "Stress e intenzione della sessione",
                      badge: "1 min",
                    },
                    {
                      title: "Esercizio",
                      desc: "Respiro + voce + movimento",
                      badge: "6–9 min",
                    },
                    {
                      title: "Check-out",
                      desc: "Riflessione e note rapide",
                      badge: "1–2 min",
                    },
                  ].map((step) => (
                    <div
                      key={step.title}
                      className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/30 p-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-50">
                          {step.title}
                        </div>
                        <div className="mt-1 text-sm text-slate-300">{step.desc}</div>
                      </div>
                      <div className="shrink-0 rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-300">
                        {step.badge}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-indigo-500/10 p-4">
                  <div className="text-sm font-semibold text-slate-50">Integrazione HRV</div>
                  <div className="mt-1 text-sm text-slate-200">
                    Apple Health / Google Fit (con consenso esplicito).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <section id="features" className="border-t border-white/10">
        <Container className="py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50">
              Progettata per rendere il recupero semplice.
            </h2>
            <p className="mt-3 text-slate-200">
              Routine brevi, contenuti chiari, attenzione alla sicurezza e alla
              costanza.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Catalogo esercizi",
                body: "Respiro, vocalizzazione, movimento e tecniche a impatto basso.",
              },
              {
                title: "Check-in / check-out",
                body: "Traccia come ti senti prima e dopo, senza complicazioni.",
              },
              {
                title: "Avvisi di sicurezza",
                body: "Messaggi chiari per esercizi con acqua/ghiaccio e condizioni sensibili.",
              },
              {
                title: "Raccomandazioni",
                body: "Suggerimenti personalizzati basati sulle tue abitudini.",
              },
              {
                title: "Cronologia",
                body: "Sessioni e trend per capire cosa ti aiuta davvero.",
              },
              {
                title: "Notifiche",
                body: "Promemoria gentili per mantenere la costanza.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-semibold text-slate-50">
                  {item.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="screenshots" className="border-t border-white/10">
        <Container className="py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50">
              Dentro Recalibra.
            </h2>
            <p className="mt-3 text-slate-200">
              Alcune schermate dell’app in beta (UI in evoluzione).
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Catalogo esercizi",
                src: "/screenshots/exercise-catalog.png",
              },
              {
                title: "Dettaglio esercizio",
                src: "/screenshots/exercise-detail.png",
              },
              {
                title: "Player sessione",
                src: "/screenshots/exercise-player-session.png",
              },
            ].map((shot) => (
              <figure
                key={shot.title}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="aspect-[9/19] w-full bg-slate-950/30">
                  <img
                    src={shot.src}
                    alt={shot.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <figcaption className="border-t border-white/10 px-4 py-3 text-sm text-slate-200">
                  {shot.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      <section id="safety" className="border-t border-white/10">
        <Container className="py-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-50">
                Sicurezza prima di tutto.
              </h2>
              <p className="mt-3 text-slate-200">
                Alcune tecniche (es. acqua fredda) non sono adatte a tutti. In app
                trovi screening e avvisi.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: "Non è un dispositivo medico",
                    body: "Recalibra supporta il benessere, non diagnostica né cura.",
                  },
                  {
                    title: "Ascolta i segnali del corpo",
                    body: "Interrompi se senti dolore, vertigini o disagio marcato.",
                  },
                  {
                    title: "Consenso per dati salute",
                    body: "HRV e HealthKit/Fit sono opzionali e revocabili.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-slate-950/30 p-6">
                    <div className="text-sm font-semibold text-slate-50">
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-200">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-semibold text-slate-50">Domande frequenti</div>

                <div className="mt-4 space-y-4">
                  {[
                    {
                      q: "Quando esce?",
                      a: "Siamo in beta privata. Scrivici per accedere e ricevere aggiornamenti.",
                    },
                    {
                      q: "Serve un wearable?",
                      a: "No. L’integrazione HRV è opzionale.",
                    },
                    {
                      q: "Che dati raccogliete?",
                      a: "Solo quanto necessario per l’esperienza. Leggi la Privacy Policy.",
                    },
                  ].map((faq) => (
                    <div key={faq.q} className="rounded-xl bg-slate-950/30 p-4">
                      <div className="text-sm font-semibold text-slate-50">{faq.q}</div>
                      <div className="mt-2 text-sm text-slate-200">{faq.a}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-50 hover:bg-white/10"
                    href="/privacy">
                    Leggi la Privacy Policy
                  </Link>
                  <Link
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-50 hover:bg-white/10"
                    href="/terms">
                    Leggi l’EULA
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
