# 🧠 **Progetto: App per la stimolazione del Nervo Vago**

### 🎯 **Obiettivo principale**

Creare un’app (web/mobile) che aiuti le persone a riequilibrare il sistema nervoso autonomo tramite **stimolazione vagale guidata**, tracking biometrico (HRV, stress), protocolli personalizzati e, in futuro, possibili integrazioni hardware.

---

## 1️⃣ **Core Value Proposition**

> “5 minuti al giorno per ricalibrare il tuo sistema nervoso.”

* Sessioni guidate → respirazione, vocali, acqua, movimento.
* Tracking pre/post (umore, stress, HRV).
* Micro-abitudini → notifiche periodiche.
* Personalizzazione basata sui dati.
* Potenziale hardware (t-VNS) per versione avanzata.

---

## 2️⃣ **Target iniziale (early adopters)**

* Professionisti stressati (30–50 anni)
* Utenti wellness/biohacking (usano smartwatch)
* Persone che già usano Calm, Breathwrk, Headspace
* Coach / terapisti interessati a protocolli autonomici

---

## 3️⃣ **Tipologie di esercizi integrabili**

### **📦 Categoria base (MVP)**

* Respirazione guidata (diaframmatica / coerenza cardiaca / box)
* Humming / OM / vocali → vibrazione glottica
* Timer + vibrazione telefono

### **💧 Esercizi con ACQUA (scientificamente validati)**

| Esercizio                           | Stimolo vagale       | Modalità app        |
| ----------------------------------- | -------------------- | ------------------- |
| Splash acqua fredda sul viso        | Diving reflex        | Timer + guida       |
| Gargarismi con acqua                | Nervi IX-X           | Microfono opzionale |
| Ice pack su viso/collo              | VNS non invasiva     | Alert sicurezza     |
| Bere lentamente con respiro guidato | Coordinazione vagale | Audio step-by-step  |

### **🧘 Movimento fisico**

* Allungamento cervicale
* Eye yoga / sguardi lenti
* “Legs-up-the-wall” (posizione yoga antistress)
* Sbadiglio volontario / rilascio mandibolare

### **🔊 Sensoriale / vocale**

* Suoni binaurali / rumore bianco
* Vibrazioni smartphone (haptic patterns)
* Aromaterapia mentolata/eucalipto (consigliata)
* Pressione auricolare (auricoloterapia light)

---

## 4️⃣ **Funzionalità MVP**

* Login + onboarding con screening sanitario
* Sessioni guidate base
* Tracking percezione stress (da 1 a 10)
* Dashboard con storico sessioni
* Notifiche “pausa vagale”
* Supabase backend con RLS
* Stripe/Outseta → abbonamento Freemium/Premium
* (Opzionale) HRV da smartwatch via Apple Health/Google Fit

---

## 5️⃣ **Stack Tecnico Consigliato**

| Componente | Tecnologia                        |
| ---------- | --------------------------------- |
| UI Web/App | ViteJS + React + Tailwind         |
| Mobile     | React Native / Capacitor (fase 2) |
| Backend    | Supabase (auth, storage, DB, RLS) |
| Billing    | Outseta + Stripe                  |
| Analytics  | Mixpanel / PostHog                |
| AI         | LangChain + Supabase Vector Store |
| Queue/task | Supabase Queue (pgmq)             |

---

## 6️⃣ **Struttura cartelle (ipotetica)**

```
/app
  /web (vitejs)
  /mobile (react-native - fase 2)
  /packages
    /ui
    /supabase
    /shared (utils/types)
/supabase
  schema.sql
  policies.sql
  seed.sql
/docs
  lean-canvas.md
  exercise-protocols.md
  roadmap.md
```

---

## 7️⃣ **Roadmap Progetto**

| Fase | Obiettivo                         |
| ---- | --------------------------------- |
| ⚙️ 0 | Nome, branding, disclaimer legale |
| 🚀 1 | MVP: sessioni + tracking base     |
| 📊 2 | HRV / AI personalizzazione        |
| 🤝 3 | Coach dashboard + community       |
| 🔌 4 | Hardware companion                |
| 🧪 5 | Trial clinico / medical device    |

---

## 8️⃣ **Possibile Naming & Branding**

Esempi:

* **VAGUS.ONE**
* **RESET**
* **ANSAR** (Autonomic Nervous System AR)
* **VAGALITY**
* **RECALIBRA**

Palette: blu profondi + verde acqua → parasimpatico / calma
Font: Julius Sans One / Inter / Source Sans Pro

---

## 9️⃣ **Monetizzazione**

* Freemium → respirazione + tracking base
* Premium → protocolli avanzati + acqua / movimento
* AI Coaching + report settimanali
* Pacchetti → “30 giorni per attivare il tuo nervo vago”
* Dashboard per terapisti (B2B)

---

✔ Pronto da salvare e usare come base per il progetto.
👉 Posso anche generarti **schema Supabase** o **protocol.json** per gli esercizi. Oppure WINDsurf rules per il monorepo.

Dimmi cosa vuoi creare per primo! 🚀
