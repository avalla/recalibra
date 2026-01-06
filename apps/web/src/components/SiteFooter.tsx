import React from "react";
import { Link } from "wouter";

import { Container } from "@/components/Container";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-10">
      <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-300">
          <div className="text-slate-200">Andrea Valla</div>
          <div>© {new Date().getFullYear()} Recalibra. All rights reserved.</div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link className="text-slate-300 hover:text-slate-100" href="/support">
            Support
          </Link>
          <Link className="text-slate-300 hover:text-slate-100" href="/privacy">
            Privacy
          </Link>
          <Link className="text-slate-300 hover:text-slate-100" href="/terms">
            EULA
          </Link>
          <a
            className="text-slate-300 hover:text-slate-100"
            href="mailto:contact@recalibra.it">
            contact@recalibra.it
          </a>
        </div>
      </Container>
    </footer>
  );
}
