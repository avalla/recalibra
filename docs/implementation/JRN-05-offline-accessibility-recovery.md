# JRN-05 — Offline, accessibilità e recupero del progresso

## Ambito

Verifica del percorso “Ritorno al centro” introdotto da JRN-01..04.
Il percorso deve funzionare senza rete, conservare il capitolo successivo in SQLite e restare utilizzabile con tecnologie assistive.

## Evidenze nel codice

- apps/mobile/src/db/schema.ts: tabelle locali journeys e journey_progress.
- apps/mobile/src/db/db.ts:ensureSeededJourneys(): seed idempotente durante il boot.
- apps/mobile/src/db/journeys.ts:getJourneyProgress(): ricostruzione del progresso dopo riapertura dell’app.
- apps/mobile/src/db/journeys.ts:completeJourneyChapter(): avanzamento persistente e rifiuto di capitoli bloccati.
- apps/mobile/src/screens/exercises/PostSessionScreen.tsx: dopo il salvataggio della sessione torna al capitolo successivo; lo skip torna allo stesso runner.
- apps/mobile/src/data/journeys.ts: definizione e contenuti sono bundled; gli esercizi sono già seed locali.
- apps/mobile/src/screens/journeys/JourneyDetailScreen.tsx: progressbar con valore semantico, capitoli con label/hint/state e refresh al focus.
- apps/mobile/src/screens/journeys/JourneyRunnerScreen.tsx: back button accessibile e limite dell’indice al progresso persistito.
- apps/mobile/src/components/ui/Button.tsx: ruolo, label e stato disabled/busy esposti a VoiceOver/TalkBack.

## Checklist riproducibile

### Statiche (eseguite)

- bunx tsc --noEmit da apps/mobile/ → pass.
- git diff --check → pass.

### Offline (da eseguire su simulatore/dispositivo)

1. Avviare l’app, aprire Home → Ritorno al centro.
2. Abilitare modalità aereo.
3. Aprire il capitolo corrente e verificare che contenuto, esercizio e runner siano disponibili.
4. Completare una sessione, chiudere forzatamente l’app e riaprirla.
5. Tornare al percorso: il capitolo successivo deve essere sbloccato e quelli successivi ancora bloccati.
6. Aprire un capitolo non sbloccato tramite deep link/manuale: il runner deve ricondurre al massimo capitolo consentito.

### Accessibilità (da eseguire su simulatore/dispositivo)

1. VoiceOver (iOS) o TalkBack (Android) attivo.
2. Verificare che Home card, back button, pulsanti e capitoli abbiano nomi comprensibili.
3. Verificare che il progresso annunci capitoli completati / totale.
4. Verificare che un capitolo bloccato annunci anche il motivo e non sia azionabile.
5. Aumentare il testo di sistema e verificare che titolo, descrizione e CTA restino leggibili e raggiungibili.

## Limiti

Non è stata eseguita una prova su dispositivo/simulatore in questo ambiente; i controlli sopra restano evidenza manuale richiesta per chiudere la requirement.
