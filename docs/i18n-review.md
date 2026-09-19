# I18N-01 — consegna per revisione

7 settembre 2026. Implementazione dell’[ADR approvata](adr-i18n-offline-proposal.md), task AI Office `16c4d663-e5a3-4fe1-8df1-f533dac31e2d`.

## Risultato

La lingua mobile si sceglie da Impostazioni → Lingua: dispositivo, Italiano, English. La scelta è salvata in `app_settings` SQLite; una lingua di sistema non supportata usa l’inglese. La modalità dispositivo rivaluta la lingua al ritorno in foreground. I cataloghi UI e i testi dei 95 esercizi sono inclusi nella build; non ci sono richieste di traduzione o backend aggiuntivi.

L’aggiornamento comprende onboarding e screening, home, catalogo e ricerca, dettaglio, preparazione e player, valutazione dello stress, cronologia, preferenze, audio e messaggi applicativi. I dialoghi già aperti del sistema operativo restano sotto controllo nativo. I dati personali non vengono tradotti.

## Confini architetturali verificati

- `i18n/core.ts` contiene risorse e formattazione; `controller.ts` serializza le preferenze; `runtime.ts` collega SQLite ed Expo. Il provider aggiorna i consumer senza una chiave di remount sulla navigazione o sul player.
- `db/language-schema.ts` aggiunge una tabella e il default con operazioni idempotenti. Non modifica sessioni, note, preferiti, screening o esercizi esistenti.
- `useExercises` e `useSessions` mantengono i dati canonici e offrono proiezioni localizzate separate. La ricerca usa la proiezione; scoring, cache, payload del player ed entitlement continuano a usare identità e dati canonici.
- I dizionari degli esercizi sono indicizzati per ID. Le traduzioni coprono nome, descrizione, passaggi, storia, benefici, consigli e avvertenze; categoria, obiettivo, origine, slug, pattern e tempi restano canonici. Il vecchio campo `is_premium` resta solo per compatibilità dei dati e non limita l’accesso. Lo storico risolve il nome tramite ID. Nessuna migrazione riscrive i testi degli esercizi.
- Il componente ausiliario `ExerciseInstructions` usa lo stesso catalogo: eliminata la vecchia copia dei protocolli. Il fallback per un esercizio sconosciuto richiede di leggere le sue istruzioni, senza inventare un ritmo.
- Il servizio dei promemoria legge le impostazioni salvate e serializza la sincronizzazione. Riusa identificatori stabili per giorno, migra i vecchi identificatori e cancella solo richieste di pratica obsolete. Giorni e ora restano invariati. Dopo un errore ritenta al foreground. Il cambio lingua non richiede autorizzazioni OS né token push remoti; è stata rimossa la richiesta superflua di un token Expo dal vecchio hook locale.
- Gli errori di salvataggio della lingua lasciano attiva la preferenza precedente e mostrano un messaggio. Le modifiche rapide non possono invertire l’ordine dei salvataggi.

## Verifica eseguita

- `bun test tests`: **43 test superati, 4.624 asserzioni**, test di regressione di stress, audio, temporizzazione, routing e filtri, più test i18n e scheduling.
- `bun test ./tests/native/i18n-mounted.check.tsx`: **1 test superato, 11 asserzioni**, consumer React montato nel provider reale; cambio IT/EN preserva clock, passaggio e note, aggiorna testi e nome dell’esercizio e rimuove i listener allo smontaggio. Le integrazioni native sono simulate: questo test non equivale al player su dispositivo.
- TypeScript mobile e web: superato.
- Export Metro/Hermes iOS: superato, 1.734 moduli. Artefatto locale `/private/tmp/recalibra-i18n-ios-export`; non è una build nativa installabile.
- Build sito marketing: superata. Resta il warning preesistente del tsconfig root relativo a `expo/tsconfig.base`.
- `git diff --check`: superato.

I test i18n verificano parità di chiavi e placeholder, plurali, fallback, date e decimali; confrontano tutti i campi testuali inglesi con il seed e l’integrità dei campi canonici dei 95 esercizi. Verificano inoltre ricerca italiana, nomi nello storico, ranking invariato, migrazione ripetuta su SQLite esistente, riapertura del database, preferenze serializzate, gestione dei fallimenti e promemoria senza duplicati.

## Verifiche necessarie prima della chiusura

1. **QA nativa IT/EN** su una nuova build con `expo-localization`: dispositivo/simulatore con runtime disponibile, avvio e riavvio offline, variazione lingua di sistema e override, testo ingrandito e VoiceOver/TalkBack su schermate lunghe. Durante una pratica verificare timer, fase, pausa, audio e istruzioni, poi storico e note. Controllare sul sistema operativo gli identificatori, la lingua e l’orario dei promemoria. Il simulatore disponibile in questa sessione non è avviabile per runtime bundle mancante; non è stato certificato il comportamento nativo.
2. **Revisione editoriale specialistica** dei 95 esercizi e delle descrizioni audio. Le traduzioni sono una bozza di sviluppo, non una validazione clinica. Sono stati preservati i contenuti sorgente, comprese affermazioni preesistenti su sistema nervoso, HRV, frequenze/benefici, tradizioni e controindicazioni. In particolare, verificare le affermazioni su DNA/tossine delle frequenze audio e la coerenza delle avvertenze delle pratiche avanzate. Eventuali correzioni vanno concordate su entrambi i cataloghi, mantenendo le istruzioni tecniche coerenti.
3. **Revisione indipendente dell’implementazione** secondo la pipeline AI Office. L’approvazione dell’ADR non è l’approvazione di questa consegna o di una release.

La chiusura del task rimane subordinata a queste verifiche. Nessun commit, push o pubblicazione eseguiti.
