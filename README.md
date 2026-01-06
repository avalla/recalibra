# 🧠 **Project: Vagus Nerve Stimulation App**

### 🎯 **Main objective**

Build an app (web/mobile) that helps people rebalance the autonomic nervous system through **guided vagal
stimulation**, biometric tracking (HRV, stress), personalized protocols and, in the future, potential hardware
integrations.

---

## 🚀 Quick start (monorepo)

```bash
bun install

# Mobile (Expo)
bun run --cwd apps/mobile start

# iOS / Android (dev builds)
bun run --cwd apps/mobile ios
bun run --cwd apps/mobile android
```

---

## 1️⃣ **Core Value Proposition**

> “5 minutes a day to recalibrate your nervous system.”

* Guided sessions → breathing, vocal, water, movement.
* Pre/post tracking (mood, stress, HRV).
* Micro-habits → periodic notifications.
* Data-driven personalization.
* Potential hardware (t-VNS) for an advanced version.

---

## 2️⃣ **Initial target (early adopters)**

* Stressed professionals (30–50 years old)
* Wellness/biohacking users (smartwatch users)
* People already using Calm, Breathwrk, Headspace
* Coaches / therapists interested in autonomic protocols

---

## 3️⃣ **Exercise types to include**

### **📦 Base category (MVP)**

* Guided breathing (diaphragmatic / heart coherence / box breathing)
* Humming / OM / vowels → glottic vibration
* Timer + phone vibration

### **💧 WATER exercises (evidence-based)**

| Exercise                              | Vagal stimulus       | In-app mode         |
|---------------------------------------|----------------------|---------------------|
| Splash cold water on the face         | Diving reflex        | Timer + guidance    |
| Gargling with water                   | CN IX–X              | Optional microphone |
| Ice pack on face/neck                 | Non-invasive VNS     | Safety alerts       |
| Drink slowly with guided breathing    | Vagal coordination   | Step-by-step audio  |

### **🧘 Physical movement**

* Neck stretching
* Eye yoga / slow gaze movements
* “Legs-up-the-wall” (anti-stress yoga pose)
* Voluntary yawning / jaw release

### **🔊 Sensory / vocal**

* Binaural sounds / white noise
* Smartphone vibrations (haptic patterns)
* Menthol/eucalyptus aromatherapy (recommended)
* Auricular pressure (light auriculotherapy)

---

## 4️⃣ **MVP features**

* Login + onboarding with health screening
* Basic guided sessions
* Stress perception tracking (1 to 10)
* Dashboard with session history
* “Vagal break” notifications
* RevenueCat → Freemium/Premium subscription
* (Optional) HRV from smartwatch via Apple Health/Google Fit

---

## 5️⃣ **Recommended tech stack**

| Component | Technology |
|------------|------------|
| Mobile | React Native + Expo (TypeScript) |
| Web | Vite + React (Bun runtime) |
| Data | Local SQLite (user-owned) |
| Billing | RevenueCat |
| Analytics | Mixpanel |
| AI tooling | LangChain (via MCP server `mcp-servers/llm-router`) |
| Backend | No remote backend required for core flows (Supabase may exist for legacy/unused flows) |

---

## 6️⃣ **Folder structure**

```
/apps
  /mobile            # Expo app
  /web               # Vite + React web app
/mcp-servers
  /llm-router        # MCP server (LangChain) used to review/enrich exercise seed data
/docs
  ...
/supabase            # Legacy/experimental schema & migrations
```

---

## 7️⃣ **Project roadmap**

| Phase | Goal                              |
|------|-----------------------------------|
| ⚙️ 0 | Name, branding, legal disclaimer  |
| 🚀 1 | MVP: sessions + basic tracking    |
| 📊 2 | HRV / AI personalization          |
| 🤝 3 | Coach dashboard + community       |
| 🔌 4 | Hardware companion                |
| 🧪 5 | Clinical trial / medical device   |

---

## 8️⃣ **Possible naming & branding**

Examples:

* **VAGUS.ONE**
* **RESET**
* **ANSAR** (Autonomic Nervous System AR)
* **VAGALITY**
* **RECALIBRA**

Palette: deep blues + aqua green → parasympathetic / calm
Font: Julius Sans One / Inter / Source Sans Pro

---

## 9️⃣ **Monetization**

* Freemium → breathing + basic tracking
* Premium → advanced protocols + water / movement
* AI Coaching + weekly reports
* Packages → “30 days to activate your vagus nerve”
* Therapist dashboard (B2B)

---

✔ Ready to save and use as a starting point for the project.
👉 I can also generate a **Supabase schema** or an **exercise protocol.json**. Or Windsurf rules for the monorepo.

Tell me what you want to build first!

