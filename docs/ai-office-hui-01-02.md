# HUI-01 / HUI-02 — valutazioni stress esplicite

Data: 2026-09-06. Implementazione pronta per revisione; accettazione nativa ancora da verificare.

Task AI Office:

- HUI-01: `030376d0-b727-4af1-a3e1-f95572a1d657`
- HUI-02: `6da438fd-b219-445f-aa10-1e868bd29167`

## Difetto e decisione

La traccia nel codice iniziale era: sensazione “Wired or anxious” → `seedStress: 8` → salto del check-in → check-out inizializzato a 5 → “-3 points”, senza una valutazione numerica dichiarata. Quick Start poteva usare lo stress precedente o 5. Il controllo finale mostrava faccine basso-alto, etichette High-Low e un cursore composto da View statiche.

Piano eseguito: eliminare il passaggio di stime come risposte, condividere il selettore, registrare la provenienza in SQLite, unificare i calcoli, aggiungere regressioni e rivedere il diff.

Home, Quick Start e catalogo entrano ora nello stesso check-in senza scelta iniziale. Il rating è richiesto prima dell'avvio; i pulsanti alternativi di avvio passano dalla stessa validazione. Le sensazioni orientano la raccomandazione dell'esercizio, ma non producono valori numerici di stress. Il selettore condiviso propone 1, 3, 5, 7 e 10, con descrizioni testuali e stato radio accessibile. Il check-in può scorrere anche con testo ingrandito.

Il check-out parte senza risposta. Presenta un confronto solo dopo la scelta, con messaggi per diminuzione, stabilità e aumento che descrivono le valutazioni senza attribuire effetti causali all'esercizio. “Save without a rating” e la chiusura salvano durata, completamento e note con stress finale NULL. Il normale salvataggio richiede una risposta. Durante il salvataggio sono bloccati invii ripetuti e modifiche al rating; un errore locale conserva l'input per riprovare.

## Dati e compatibilità

La migrazione aggiunge `pre_stress_recorded` e `post_stress_recorded` con default 0. È ripetibile e non cambia i valori o le note esistenti. I dati storici restano nel database e nella cronologia, ma non alimentano confronti o medie come risposte esplicite: la loro provenienza non è ricostruibile. Anche il vecchio SessionManager non sostituisce più il check-out mancante con il valore iniziale.

Statistiche e cronologia richiedono indicatori espliciti e valori validi. Le medie includono anche stabilità e peggioramento; assenza di dati e variazione zero restano distinti. Conteggio delle sessioni e minuti continuano a includere le pratiche senza check-out.

SQLite resta locale; nessuna nuova dipendenza o integrazione runtime. Nessuna modifica ai confini di autenticazione, abbonamento o sito marketing.

## Verifiche eseguite

- `bun test` dalla root: 12 test superati, 0 falliti, 64 asserzioni.
- `bunx tsc --noEmit` da `apps/mobile`: superato prima e dopo le modifiche.
- `git diff --check`: superato.
- Revisione locale del diff: flussi di ingresso, validazione comune all'avvio, salvataggio nullo, migrazione, lettura e aggregazione, stato selezionato e scorrimento del check-in. Questa è una revisione dell'autore, non una revisione indipendente.

Le prove di persistenza usano vere query SQLite con Bun su un database temporaneo e un adattatore dell'interfaccia Expo. Coprono upgrade ripetuto, conservazione dei dati storici, chiusura/riapertura, risposte mancanti e valori invalidi. Non verificano il bridge nativo Expo SQLite.

Le prove del controllo ispezionano le proprietà e invocano i gestori del componente reale, con primitive native sostituite. Coprono stato iniziale, estremi, scelta intermedia e disabilitazione. Non sono un rendering nativo né una prova VoiceOver/TalkBack.

## Verifiche native ancora richieste

`xcrun simctl list devices booted` non ha restituito dispositivi avviati. In questa sessione non sono state eseguite build, prove visuali o prove su dispositivo. Nessuna chiusura dei task o approvazione indipendente è implicita.

| Percorso / caso | Risultato atteso |
| --- | --- |
| Home → sensazione → Begin | Check-in senza selezione; nessuna stima usata come risposta |
| Quick Start con e senza cronologia | Check-in nuovo; nessun valore precedente selezionato |
| Catalogo → dettaglio → avvio | Stesso selettore e blocco dell'avvio prima della scelta |
| Tutorial → Start senza rating | Ritorno alla scelta iniziale, nessuna sessione iniziata |
| Fine pratica, nessuna scelta | Stato neutro e nessun delta |
| Prima 7 / dopo 3, 5 / 5, 3 / 7 | Diminuzione, invariato, aumento coerenti |
| Salta check-out / chiudi | Pratica salvata senza rating; esclusa dai confronti |
| Riavvio app dopo il salvataggio | Dati e indicatori espliciti conservati; progressi corretti |
| VoiceOver iOS / TalkBack Android | Etichette, valore, stato selezionato e disabilitato comprensibili |
| Schermo piccolo e testo ingrandito | Tutte le opzioni leggibili, raggiungibili e selezionabili mediante scorrimento |

Riferimento API accessibilità: [React Native accessibility](https://reactnative.dev/docs/accessibility), consultato tramite Context7; i tipi installati RN 0.81 sono stati verificati dal typecheck.
