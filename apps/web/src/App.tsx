import React from "react";
import { Route, Switch } from "wouter";

import { HomePage } from "./pages/HomePage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}
