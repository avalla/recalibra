import React from "react";
import { Link } from "wouter";

import { Container } from "@/components/Container";
import { SiteLayout } from "@/components/SiteLayout";

export function NotFoundPage() {
  return (
    <SiteLayout title="Pagina non trovata — Recalibra">
      <Container className="py-16">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <div className="text-sm font-semibold text-slate-50">404</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
            Pagina non trovata
          </h1>
          <p className="mt-3 max-w-xl text-slate-200">
            Il link potrebbe essere errato o la pagina non esiste più.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-200">
              Torna alla home
            </Link>
          </div>
        </div>
      </Container>
    </SiteLayout>
  );
}
