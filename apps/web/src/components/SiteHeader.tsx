import React from "react";
import { Link } from "wouter";

import { Container } from "@/components/Container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 shadow-sm">
            <img
              src="/brand/logo.svg"
              alt="Recalibra"
              className="h-6 w-6"
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Recalibra</div>
            <div className="text-xs text-slate-300">Vagus-first wellness</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm text-slate-200">
          <a
            className="hidden rounded-lg px-3 py-2 text-slate-200 hover:bg-white/5 md:inline"
            href="#features">
            Features
          </a>
          <a
            className="hidden rounded-lg px-3 py-2 text-slate-200 hover:bg-white/5 md:inline"
            href="#screenshots">
            Screenshots
          </a>
          <a
            className="hidden rounded-lg px-3 py-2 text-slate-200 hover:bg-white/5 md:inline"
            href="#safety">
            Safety
          </a>
          <Link className="rounded-lg px-3 py-2 text-slate-200 hover:bg-white/5" href="/support">
            Support
          </Link>
          <a
            className="rounded-lg bg-white/10 px-3 py-2 text-slate-50 hover:bg-white/15"
            href="mailto:contact@recalibra.it?subject=Recalibra%20%E2%80%94%20Contact">
            Contact
          </a>
        </nav>
      </Container>
    </header>
  );
}
