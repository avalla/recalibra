import React from "react";
import { Link } from "wouter";

import { Container } from "@/components/Container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-300/80 to-indigo-400/80 shadow-sm" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Recalibra</div>
            <div className="text-xs text-slate-300">Vagus-first wellness</div>
          </div>
        </Link>

        <nav className="flex items-center gap-4 text-sm text-slate-200">
          <a
            className="hidden rounded-lg px-3 py-2 text-slate-200 hover:bg-white/5 md:inline"
            href="#features">
            Funzionalità
          </a>
          <a
            className="hidden rounded-lg px-3 py-2 text-slate-200 hover:bg-white/5 md:inline"
            href="#safety">
            Sicurezza
          </a>
          <a
            className="rounded-lg bg-white/10 px-3 py-2 text-slate-50 hover:bg-white/15"
            href="mailto:hello@avalla.com?subject=Recalibra%20%E2%80%94%20Beta%20access">
            Richiedi accesso
          </a>
        </nav>
      </Container>
    </header>
  );
}
