# Video Prompts per RunComfy

Prompt per generare video dimostrativi degli esercizi con AI (AnimateDiff/SVD).

## Specifiche tecniche
- **Risoluzione**: 512x512 o 768x768
- **FPS**: 24-30
- **Formato**: MP4 o WebM
- **Colori brand**: Teal #4FD1C5, Background #0A1A1F

---

## 1. Physiological Sigh
**File**: `physiological-sigh.mp4`

```
A calm person demonstrating a double inhale breathing technique. Side profile view. 
First they take a deep breath in through the nose (chest expands), then a second short sharp inhale at the top (shoulders rise slightly), followed by a long slow exhale through the mouth.
Minimalist style, dark teal background (#0A1A1F), soft lighting, peaceful atmosphere.
Looping animation, 8 seconds duration. Smooth slow motion.
```

---

## 2. Box Breathing
**File**: `box-breathing.mp4`

```
Abstract geometric visualization of box breathing. A glowing square outline where each side lights up in sequence: bottom (inhale 4s), right (hold 4s), top (exhale 4s), left (hold 4s).
Cyan/teal glow (#4FD1C5) on dark background (#0A1A1F).
Minimalist, meditative style. Smooth animations.
16 second perfect loop.
```

---

## 3. 4-7-8 Breathing
**File**: `4-7-8-breathing.mp4`

```
Serene person sitting in meditation pose demonstrating 4-7-8 breathing.
Subtle chest movement: gentle rise (4 beats), pause still (7 beats), slow deflation (8 beats).
Soft ethereal lighting, dark peaceful background.
Numbers 4-7-8 appear subtly as floating text during each phase.
19 second loop, calming ambient atmosphere.
```

---

## 4. Cold Exposure
**File**: `cold-exposure.mp4`

```
Artistic visualization of cold water therapy. A human silhouette standing under a shower.
Water transitions from warm orange tones to cool blue/cyan.
Breath visible as gentle vapor. Person stands calm and composed.
Dark background, cinematic lighting, droplets catching light.
10 second loop, empowering mood.
```

---

## 5. Humming / Bee Breath
**File**: `humming.mp4`

```
Close-up of peaceful face with closed eyes, lips gently closed, demonstrating humming breath.
Visible vibration waves emanating from throat/chest area as soft glowing rings.
Teal energy ripples spreading outward with each hum.
Dark calming background, meditative atmosphere.
8 second loop, serene expression.
```

---

## 6. Stress Buster (General Breathing)
**File**: `stress-buster.mp4`

```
Abstract calming visualization. A luminous orb gently expanding and contracting like breathing.
Soft teal glow (#4FD1C5) pulsing rhythmically.
Particle effects flowing inward on inhale, outward on exhale.
Dark space-like background with subtle stars.
10 second perfect loop, hypnotic and relaxing.
```

---

## 7. Vagal Toning
**File**: `vagal-toning.mp4`

```
Anatomical artistic visualization of the vagus nerve lighting up.
Stylized human silhouette with glowing pathway from brain through neck to stomach.
Calming teal bioluminescent glow traveling down the nerve path.
Dark background, scientific yet artistic style.
8 second loop, educational and calming.
```

---

## 8. Deep Relaxation
**File**: `deep-relaxation.mp4`

```
Person lying down in savasana pose (corpse pose), breathing slowly.
Camera slowly zooms out. Body sinks deeper into relaxation with each breath.
Soft ambient lighting, floating particles of light.
Dark serene environment, feeling of weightlessness.
12 second loop, deeply peaceful.
```

---

## Note per RunComfy

### Modelli consigliati
- **AnimateDiff** - Per animazioni fluide e loop perfetti
- **Stable Video Diffusion (SVD)** - Per video più realistici
- **Wan 2.1** - Per qualità cinematografica

### Workflow suggerito
1. Genera il video con il prompt
2. Esporta in MP4 (H.264)
3. Comprimi per mobile (max 2MB per video)
4. Rinomina secondo la convenzione sopra
5. Posiziona in `apps/mobile/assets/videos/`

### Integrazione nell'app
Una volta generati i video, aggiornare `ExerciseInstructions.tsx` per caricarli:
```typescript
const videos = {
  'physiological-sigh': require('../../assets/videos/physiological-sigh.mp4'),
  'box-breathing': require('../../assets/videos/box-breathing.mp4'),
  // etc...
};
```
