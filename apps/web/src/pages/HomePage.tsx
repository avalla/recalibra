import React from "react";
import { Link } from "wouter";

import { Container } from "@/components/Container";
import { SiteLayout } from "@/components/SiteLayout";

export function HomePage() {
  return (
    <SiteLayout
      title="Recalibra — Vagus nerve stimulation"
      description="Recalibra guides you through short, safe micro-exercises to support stress management and recovery: breathing, voice, movement, and gentle routines.">
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
                  Launching soon — coming to iOS and Android
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
                Guided micro-exercises to calm your nervous system.
              </h1>

              <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-slate-200">
                Recalibra combines breathing, voice, and movement into short, safe routines.
                Track stress before/after and build consistency without friction.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  className="inline-flex items-center justify-center rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-200"
                  href="mailto:contact@recalibra.it?subject=Recalibra%20%E2%80%94%20Contact&body=Hi%2C%20I%27d%20like%20to%20receive%20updates%20about%20Recalibra.%0A%0ADevice%3A%20iOS%2FAndroid%0A">
                  Contact
                </a>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-50 hover:bg-white/10">
                  Explore features
                </a>
              </div>

              <p className="mt-6 text-sm text-slate-400">
                Note: Recalibra is a wellness app, not a medical device.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-50">A typical session</div>
                    <div className="mt-1 text-sm text-slate-300">8–12 minutes</div>
                  </div>
                  <div className="rounded-xl bg-teal-300/10 px-3 py-1 text-xs font-medium text-teal-200">
                    Guided
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    {
                      title: "Check-in",
                      desc: "Stress level and session intention",
                      badge: "1 min",
                    },
                    {
                      title: "Exercise",
                      desc: "Breathing + voice + movement",
                      badge: "6–9 min",
                    },
                    {
                      title: "Check-out",
                      desc: "Reflection and quick notes",
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
                  <div className="text-sm font-semibold text-slate-50">HRV integration</div>
                  <div className="mt-1 text-sm text-slate-200">
                    Apple Health / Google Fit (with explicit consent).
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
              Designed to make recovery effortless.
            </h2>
            <p className="mt-3 text-slate-200">
              Short routines, clear guidance, safety-first messaging, and gentle consistency.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Exercise library",
                body: "Breathing, vocalization, movement, and low-impact techniques.",
              },
              {
                title: "Check-in / check-out",
                body: "Track how you feel before and after—without complexity.",
              },
              {
                title: "Safety prompts",
                body: "Clear guidance for water/cold exercises and sensitive conditions.",
              },
              {
                title: "Recommendations",
                body: "Personalized suggestions based on your habits.",
              },
              {
                title: "History",
                body: "Sessions and trends to understand what helps you most.",
              },
              {
                title: "Notifications",
                body: "Gentle reminders to keep you consistent.",
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
              Inside Recalibra.
            </h2>
            <p className="mt-3 text-slate-200">
              A few screenshots from the current build (UI is evolving).
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Exercise library",
                src: "/screenshots/exercise-catalog.png",
              },
              {
                title: "Exercise details",
                src: "/screenshots/exercise-detail.png",
              },
              {
                title: "Session player",
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
                Safety first.
              </h2>
              <p className="mt-3 text-slate-200">
                Some techniques (e.g., cold water) aren't suitable for everyone. The app includes screening and clear warnings.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: "Not a medical device",
                    body: "Recalibra supports wellbeing and does not diagnose or treat.",
                  },
                  {
                    title: "Listen to your body",
                    body: "Stop if you feel pain, dizziness, or significant discomfort.",
                  },
                  {
                    title: "Consent for health data",
                    body: "HRV and HealthKit/Fit are optional and can be revoked anytime.",
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
                <div className="text-sm font-semibold text-slate-50">FAQ</div>

                <div className="mt-4 space-y-4">
                  {[
                    {
                      q: "When is it coming out?",
                      a: "We're in the launch phase. Email us to receive updates.",
                    },
                    {
                      q: "Do I need a wearable?",
                      a: "No. HRV integration is optional.",
                    },
                    {
                      q: "What data do you collect?",
                      a: "Only what's necessary for the experience. See the Privacy Policy.",
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
                    Read the Privacy Policy
                  </Link>
                  <Link
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-50 hover:bg-white/10"
                    href="/terms">
                    Read the EULA
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
