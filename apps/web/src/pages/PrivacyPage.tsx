import React from "react";

import { MarkdownPage } from "@/components/MarkdownPage";

import privacyPolicy from "../../../../docs/privacy-policy.md?raw";

export function PrivacyPage() {
  return <MarkdownPage title="Privacy Policy — Recalibra" markdown={privacyPolicy} />;
}
