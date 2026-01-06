import React from "react";

import { Container } from "@/components/Container";
import { SiteLayout } from "@/components/SiteLayout";

export function SupportPage() {
  return (
    <SiteLayout title="Support — Recalibra" description="Contact Recalibra support.">
      <Container className="py-16">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Support</h1>
          <p className="mt-3 max-w-xl text-slate-200">
            For help or questions, email us at{" "}
            <a
              className="font-semibold text-teal-300 no-underline hover:underline"
              href="mailto:contact@recalibra.it">
              contact@recalibra.it
            </a>
            .
          </p>
        </div>
      </Container>
    </SiteLayout>
  );
}
