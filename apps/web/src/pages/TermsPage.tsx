import React from "react";

import { MarkdownPage } from "@/components/MarkdownPage";

import eula from "../../../../docs/eula.md?raw";

export function TermsPage() {
  return <MarkdownPage title="EULA — Recalibra" markdown={eula} />;
}
