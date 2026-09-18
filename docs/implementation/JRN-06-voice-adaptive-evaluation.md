# JRN-06 — Valutazione voce narrata e percorsi adattivi

## Decisione

Non introdurre ora una pipeline TTS, un provider remoto o una logica adattiva opaca.
Il primo incremento deve restare locale, deterministico e opzionale: tracce vocali bundled con trascrizione testuale equivalente, più regole adattive basate solo su dati già persistiti.

## Evidenze

- apps/mobile/src/hooks/useAudio.ts espone preset audio e raccomandazioni per categoria/livello di stress; l’audio è generato/localizzato nel runtime e non rappresenta voce narrata.
- apps/mobile/src/components/AudioSelector.tsx consente selezione e anteprima dei preset esistenti.
- apps/mobile/assets/videos/ contiene video di esercizi, ma non tracce vocali narrate o trascrizioni.
- apps/mobile/src/data/journeys.ts contiene contenuti testuali e slug di esercizi; journey_progress conserva solo stato locale del percorso.
- Il progetto è local-first: non esiste un backend runtime per generare o scaricare audio.

## Raccomandazione incrementale

### Voce narrata

1. Definire lingua, tono, durata, diritti e formato prima di produrre asset.
2. Aggiungere per capitolo un asset audio locale opzionale e una trascrizione testuale sempre disponibile.
3. Riutilizzare il controllo audio esistente; se la traccia manca o non è riproducibile, mantenere il runner testuale e i cue visivi.
4. Testare pausa, ripresa, interruzione app e sincronizzazione con il capitolo senza rendere la voce obbligatoria.

### Percorsi adattivi

Usare soltanto segnali locali già presenti:

- capitolo corrente e capitoli completati;
- stress pre/post delle sessioni;
- categoria, durata e livello dell’esercizio.

Regole iniziali proposte:

- se il post-stress non migliora, riproporre una pratica breve di regolazione prima di sbloccare contenuti più intensi;
- se il capitolo viene interrotto, riprendere dallo stesso capitolo;
- non saltare capitoli automaticamente e non usare il valore di stress come diagnosi;
- mantenere sempre un percorso lineare e una scelta manuale esplicita.

## Decisioni ancora necessarie

- lingua/e e voce;
- produzione/licenza degli asset;
- soglie e copy delle regole adattive;
- eventuale registrazione degli esiti adattivi per la progress view;
- validazione clinica e test con utenti assistivi.

## Esito JRN-06

Valutazione completata come proposta tecnica. L’implementazione è intenzionalmente rinviata finché le decisioni sopra non sono confermate; aggiungere TTS o adattività automatica ora allargherebbe il perimetro e introdurrebbe dipendenze non richieste.
