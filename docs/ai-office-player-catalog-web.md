# AI Office — player, catalogo e sito

Lavoro 6–7 settembre 2026, checkout locale non pubblicato. HUI-01/02 rimangono in revisione separata. Nessuna revisione indipendente o approvazione di rilascio dichiarata.

## Architettura e implementazione

- **PLY-01**: `audio-playback.ts` possiede entrambi i lettori. Ogni avvio ha una generazione cancellabile; pause/stop invalidano le creazioni asincrone e la dissolvenza, eliminano monitor e timeout, silenziano entrambi i lettori. Una creazione tardiva viene rilasciata senza riprodurre. Ripresa dal lettore originale, stop/unmount rilasciano le risorse. `useAudio` conserva generatori, preset e interfaccia pubblica.
- **PLY-02/04**: `practice-timing.ts` misura esclusivamente tempo attivo con un clock monotono. Fase, residuo, anello, scala del cerchio e posizione del grafico derivano dallo stesso istante. Nessuna animazione temporizzata indipendente nel grafico. Fasi frazionarie >=1s usano decimi coerenti; quelle <1s omettono il numero, mantenendo la durata del pattern. Pause multiple mantengono il residuo.
- **PLY-03/05**: protocolli non rappresentabili dal pattern e categorie non respiratorie usano passaggi manuali, con testo originale e avanzamento esplicito. Nessuna animazione generica presentata come dimostrazione. L'indice del passaggio resta invariato in pausa. Il timer misura la sessione, non i singoli passaggi. Tutorial e preparazione distinguono guida temporizzata e manuale. Nessun nuovo timing clinico o modifica al seed.
- **PLY-06**: `toExerciseSessionParams` è la sorgente comune per home, dettaglio e Quick Start; trasporta `safety_warning` e il pattern canonico completo. Avvertenza visibile in onboarding/preparazione e nelle istruzioni durante la pratica. Nessun avviso sintetico quando manca il dato. La revisione ha inoltre trovato e corretto il lancio iniziale dalle preferenze Quick Start: la sessione appartiene allo stack radice; prima del lancio viene verificato l'accesso RevenueCat.
- **PLY-07/08/10**: controllo centrale Pause/Resume, pausa anche nel countdown, opzioni grafiche nelle istruzioni, apertura istruzioni in pausa e ripresa esplicita. `AppState` interrompe countdown e pratica; tornare in primo piano non riparte. Si conserva l'auto-lock del sistema: anche il blocco schermo deve mettere in pausa; non è stato introdotto keep-awake. Etichette, ruoli, stati, focus del modal e annunci solo su cambi di fase/stato/passaggio. Movimento ridotto nasconde cerchio/grafico animati lasciando la guida testuale.
- **PLY-09**: contenuto attivo scorrevole, dimensioni della guida dipendenti dallo schermo, spazio inferiore misurato dal layout reale dei controlli, safe-area completa, pulsante centrale espandibile e comandi volume a capo. Queste sono correzioni da ispezione del codice, **non una verifica visuale nativa completata**.
- **HUI-04/05/06/08**: colori secondari centrali più leggibili; card premium senza opacità complessiva né titolo attenuato. Un solo percorso categorie, durata/livello selezionabili in un pannello esplicito; reset di ricerca/categoria/durata/livello come unico stato. Risultati e conteggio derivano dallo stesso filtro, scaffali recenti/preferiti presenti quando non si filtra. Titoli almeno due righe e descrizioni utili; una colonna sotto 390px o fontScale >1,15. “3 min or less” include 3 ed esclude 4, preservando 4–7 e 8+.
- **HUI-03**: sequenza sessione come lista separata da divisori; FAQ con domande/risposte senza card interne. Copy e CTA conservati. Header si dispone su più righe quando necessario.
- **HUI-07**: font Poppins/DM Serif Display sincronizzati dalle risorse mobile e CSS generato dai token mobile in fase di build, senza dipendenza mobile nel runtime web. Le immagini esistenti sono ora dichiarate anteprime precedenti e nominate secondo ciò che mostrano. **Mancano le tre nuove catture native richieste**. La configurazione TypeScript web è autonoma: ereditare il config Expo radice impediva la build del sito con le sole dipendenze web.

## Inventario dei protocolli speciali

| Variante | Esercizi (slug canonico) | Modalità |
| --- | --- | --- |
| double_inhale | physiological-sigh, physiological-sigh-2 | Temporizzata, seconda inspirazione distinta; conserva la convenzione precedente di 1s e il rest canonico |
| humming | bhramari | Temporizzata, espirazione etichettata Hum |
| roar | lion-s-breath | Temporizzata, espirazione etichettata Roar |
| ha_sound | ha-breath, zulu-warrior-breath | Temporizzata, espirazione HA |
| rapid | berserker-breath, bhastrika, breath-of-fire, burst-breathing | Manuale: ripetizioni non deducibili da quattro durate |
| rapid_exhale | kapalbhati | Manuale |
| holotropic | holotropic-breathwork, holotropic-light | Manuale |
| reverse | reverse-breathing | Manuale |
| nine_rounds | nine-round-breathing | Manuale: cambi di narice e round seguono il testo |
| viloma | viloma-pranayama | Manuale: interruzioni seguono il testo |
| wim_hof | wim-hof-breathing, wim-hof-method | Manuale: ritenzione personale e recupero non rappresentabili dal loop; nessun cerchio, anello o grafico suggerisce di inspirare durante la ritenzione |

Tutte le 11 varianti (18 esercizi) sono coperte dall'inventario automatico. Il seed resta la fonte clinico-editoriale; la modalità manuale è esplicita, non un'implementazione temporizzata integrale di questi protocolli.

## Evidenze eseguite

- `bun test`: **32 test, 643 asserzioni**, inclusi SQLite/additive migrations HUI-01/02, creazioni audio ritardate, pause/stop durante overlap, proprietà delle risorse, residui frazionari, inventario, payload canonici di tutti i 95 esercizi, combinazioni/reset filtri e confini delle durate.
- Typecheck mobile e web con `bunx tsc --noEmit`: passati. Build web: passata con le dipendenze del lockfile; rimane un warning preesistente del config Expo radice durante il caricamento del config di build, senza import Expo nel sito.
- Contrasto `textMuted`: 8,29:1 su background, 6,60:1 su backgroundLight, 5,73:1 su card, 5,44:1 su elevated. `textSecondary`: 10,23 / 8,15 / 7,08 / 6,72. Il test copre superfici solide; la revisione ha rimosso l'opacità persistente delle card premium del catalogo.
- Browser Chromium, sito reale locale: 320/375/414/768/1440px senza overflow orizzontale; font e immagini caricati, focus visibile con Tab, Privacy ed EULA raggiunte con Enter. Screenshot di verifica in `/private/tmp/recalibra-web-{larghezza}.png` (temporanei, non asset prodotto).
- Revisione locale del diff: eliminati timer/animazioni concorrenti e stili orfani, preservati entitlement, dati locali, seed e confini delle applicazioni. Nessuna dipendenza runtime aggiunta.

## Limiti e passaggio di consegne

**Il simulatore non ha completato le prove.** Il dispositivo iPhone 16e `1307FC01-9DA1-48F7-B782-8717F80DE2E2` era inizialmente disponibile, ma il riavvio ora fallisce con “Unable to boot device because we cannot determine the runtime bundle”. La shell Recalibra 1.0.0/1 presente in DerivedData (precedente al lavoro) è stata installata, ma il collegamento al JavaScript corrente non è arrivato a una sessione verificabile. Nessuno screenshot di questa shell viene presentato come nuova build. L'integrazione idb globale aveva anche un interprete mancante; il tentativo isolato in `/private/tmp` non ha risolto l'assenza del runtime iOS.

Per chiudere la revisione nativa: ripristinare un runtime disponibile, avviare una build mobile identificata sul checkout aggiornato e verificare audio prima/durante/dopo crossfade, pause in inhale/hold/exhale/rest, background durante countdown e pratica, blocco schermo, uscita/unmount, passi Body Scan/acqua/movimento, protocolli speciali, ogni percorso delle avvertenze. Eseguire VoiceOver/TalkBack, movimento ridotto, display piccolo/font grande, cerchio/grafico e focus modal. Registrare catture reali di catalogo/dettaglio/player senza dati personali.

PLY-09 e HUI-07 restano bloccati sulle evidenze native mancanti. Gli altri cambiamenti sono pronti alla revisione con questo limite esplicito; non sono certificati per il rilascio.

I18N-01 resta bloccato sulla conferma di `docs/adr-i18n-offline-proposal.md`, richiesta esplicitamente da `AI-OFFICE.md` (“Architecture changes: approval-required”). ADR proposta registrata in AI Office: `cc15108e-174f-48a4-9800-c1fbf1a9c0bd`. Nessuna risposta alla richiesta ricevuta al momento della consegna; non sono stati installati i18next/expo-localization né modificata la persistenza per la lingua.

## Aggiornamento I18N-01 — 7 settembre 2026

Dopo l’approvazione esplicita dell’ADR, I18N-01 è stato sbloccato e implementato. La precedente indicazione di attesa dell’approvazione architetturale è superata. Consegna e verifiche residue: [i18n-review.md](i18n-review.md).
