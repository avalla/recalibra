import React, { useEffect } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

interface SiteLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function SiteLayout({ children, title, description }: SiteLayoutProps) {
  useEffect(() => {
    document.title = title;

    if (!description) return;

    const meta = document.querySelector('meta[name="description"]');
    if (!meta) return;

    meta.setAttribute("content", description);
  }, [description, title]);

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-50">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
