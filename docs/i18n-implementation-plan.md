# I18N-01 — piano approvato

1. Aggiungere dipendenze compatibili, cataloghi IT/EN offline e preferenza SQLite sistema/it/en idempotente. Inizializzare prima del rendering e rivalutare la lingua sistema al foreground.
2. Estrarre i testi UI con interpolazioni e plurali, localizzare date/numeri e collegare il selettore accessibile nelle impostazioni. Le schermate montate si aggiornano senza cambiare chiave o ricreare il player.
3. Tradurre tutti i 95 esercizi in dizionari per ID. Canonici in DB/cache/raccomandazioni, proiezione localizzata in catalogo/ricerca/dettaglio/player/storico. Nessuna traduzione di note utente o modifica a ID, slug, pattern, entitlement.
4. Centralizzare la sostituzione dei promemoria locali preservando giorni/orari; serializzare le operazioni per evitare duplicati. Nessuna richiesta di credenziali né caricamento remoto di traduzioni.
5. Verificare chiavi, placeholder, copertura dei testi, fallback, plurali, preferenza persistita, invarianti, notifiche e cambi durante la pratica. Typecheck e suite completa; prove native/editoriali restano separate e documentate se non disponibili.

Approvazione architetturale già ricevuta; nessuna nuova richiesta di approvazione per questa implementazione. Il blocco nativo noto non impedisce implementazione e test deterministici.

## Esito implementazione — 7 settembre 2026

Fondazione, preferenza SQLite, proiezioni dei 95 esercizi, estrazione UI, scheduling locale e test implementati. Evidenze e verifiche ancora necessarie in [i18n-review.md](i18n-review.md). La QA nativa e la revisione specialistica restano aperte; non segnare il task completato sulla sola base dei test automatici.
