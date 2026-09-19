# JRN-01 — modello e persistenza dei Percorsi

Il modello Journey è local-first: il contenuto editoriale vive in cataloghi
locali versionati (`apps/mobile/src/data/journeys/v1.ts`), mentre SQLite
conserva esclusivamente il progresso dell'utente.

## Contratto

- `Journey` contiene capitoli ordinati.
- `Chapter` contiene step ordinati.
- `JourneyStep` identifica un esercizio con un ID stabile.
- Un esercizio può comparire una sola volta nello stesso Journey; la
  validazione rifiuta duplicati prima della persistenza.
- Il puntatore di ripresa usa `journey_version`, `current_chapter_id` e
  `current_step_id`, mai la posizione numerica di un array.

## SQLite

`ensureJourneySchema` è una migrazione additiva e ripetibile:

- `journey_progress` contiene stato, versione del contenuto e puntatore di
  ripresa.
- `journey_step_progress` registra ogni step completato una sola volta e lo
  collega alla sessione che lo ha completato.
- `sessions.journey_id` e `sessions.journey_step_id` sono colonne nullable, per
  conservare tutte le sessioni esistenti senza riscriverle.

La prima inizializzazione è idempotente. Il completamento di uno step aggiorna
il record di progresso e il collegamento alla sessione nella stessa transazione;
una ripetizione dello stesso completamento non duplica lo step. Una versione di
contenuto diversa da quella salvata viene rifiutata esplicitamente: l'eventuale
migrazione editoriale sarà una decisione separata, non un effetto collaterale
dell'avvio dell'app.

La UI Home/detail è nel task JRN-02; contenuti di “Ritorno al centro” e voce
narrata restano nei task JRN-04/06. Il runner JRN-03 ora passa un contesto opzionale attraverso
player e reflection: il salvataggio della sessione resta invariato per i flussi
ordinari; per un Journey, la reflection completa lo step in modo idempotente e
apre lo step successivo solo quando il relativo esercizio locale è disponibile.
Un errore dopo il salvataggio conserva la sessione e offre un retry, evitando
duplicazioni.
