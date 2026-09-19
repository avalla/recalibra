# Proposta ADR — localizzazione mobile offline IT/EN

Stato: accettata dall’utente il 7 settembre 2026. Approvazione esplicita in conversazione; ADR AI Office `cc15108e-174f-48a4-9800-c1fbf1a9c0bd` accettata. Task I18N-01 `16c4d663-e5a3-4fe1-8df1-f533dac31e2d`.

## Decisione proposta

Introdurre `expo-localization` per la lingua nativa e `i18next` con `react-i18next` per cataloghi locali, interpolazioni, plurali e aggiornamento delle schermate. Prima dell'installazione, verificare versioni e API compatibili con Expo SDK 54 tramite documentazione corrente. Nessun caricamento remoto o servizio AI durante l'uso dell'app.

Prima versione: italiano e inglese. Preferenza **Sistema / Italiano / English** in una nuova riga di impostazioni SQLite; migrazione additiva e idempotente. Scelta esplicita prevale sul sistema; lingua non supportata e traduzioni mancanti ricadono sull'inglese. La modalità Sistema rivaluta la lingua al ritorno in foreground. I cataloghi sono compresi nella build.

Gli esercizi restano canonici in SQLite, con ID, slug, categoria, obiettivo, tempi, pattern, audio ed entitlement immutati. I testi tradotti sono dizionari indicizzati per ID, applicati alla presentazione. Cache e raccomandazioni conservano oggetti canonici; ricerca e ordinamento usano una proiezione localizzata. Lo storico localizza il nome tramite ID, senza toccare note personali o sessioni.

Le schermate deriveranno i testi dalla lingua corrente, anche se già montate. Il player conserva il proprio stato temporale e audio; un cambio lingua non ricrea la sessione. Payload di navigazione con testi non saranno la fonte delle traduzioni: ID e dati canonici restano il collegamento stabile. I messaggi della scala stress e i filtri vengono estratti dopo le correzioni HUI.

Date, numeri, durate e plurali seguono la lingua. Prezzi rimangono quelli restituiti dallo store. Le notifiche future vengono aggiornate con gli stessi giorni/orari, rimuovendo le precedenti per evitare duplicati. I dialoghi OS/store restano soggetti alle regole native.

## Alternative considerate

- Tradurre direttamente le righe degli esercizi: scartato perché confonde contenuto e identità e richiede riscritture al cambio lingua.
- Servizio di traduzione remoto: scartato perché viola l'invariante offline e introduce backend/runtime non richiesti.
- Solo UI, esercizi inglesi: più piccolo, ma non soddisfa il task che include tutti i 95 esercizi.

## Verifica e limiti

Parità delle chiavi e dei placeholder, fallback, plurali, identità degli esercizi, raccomandazioni, migrazione su installazioni esistenti, preferenza al riavvio, cambio lingua durante una pratica e riprogrammazione notifiche. QA nativa IT/EN con testo lungo e screen reader. Le traduzioni di istruzioni e avvertenze richiedono revisione editoriale specialistica prima della chiusura; una traduzione prodotta durante lo sviluppo non equivale a tale revisione.

L'approvazione riguarda questa soluzione e l'ambito IT/EN, non una release né la validazione editoriale o clinica dei contenuti.
