# Recalibra Mobile App

React Native Expo mobile application for vagus nerve stimulation and stress management.

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
bun install

# Start the development server
bun run --cwd apps/mobile start
```

### Running on Device/Simulator

```bash
# iOS Simulator
bun run --cwd apps/mobile ios

# Android Emulator
bun run --cwd apps/mobile android

# Web (development)
bun run --cwd apps/mobile web
```

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   └── ui/            # Base UI components (Button, Input, Card)
├── constants/         # Theme, colors, spacing
├── hooks/             # Custom React hooks
├── navigation/        # React Navigation configuration
│   ├── AuthNavigator.tsx
│   ├── MainTabNavigator.tsx
│   └── RootNavigator.tsx
├── screens/           # Screen components
│   ├── auth/          # Onboarding, Login, SignUp
│   ├── screening/     # Initial screening flow
│   ├── home/          # Home dashboard
│   ├── exercises/     # Exercise catalog, session, post-session
│   ├── progress/      # History & analytics
│   └── profile/       # Profile & settings
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## 🎨 Design System

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#2DD4BF` | Accent, buttons, active states |
| Background | `#0F1A19` | Main background |
| Background Card | `#1E3A34` | Card surfaces |
| Text Primary | `#FFFFFF` | Main text |
| Text Secondary | `#94A3B8` | Supporting text |

### Spacing

- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `xxl`: 48px

## 🔧 Configuration

### TypeScript Path Aliases

The project uses path aliases for cleaner imports:

```typescript
import { Button } from '@/components';
import { Colors } from '@/constants';
import { HomeScreen } from '@/screens';
```

## 📱 Features

### MVP Features

- [x] Onboarding flow
- [x] Authentication (Email, Google, Apple)
- [x] Initial health screening
- [x] Home dashboard with stress status
- [x] Exercise catalog with categories
- [x] Breathing exercise session with timer
- [x] Post-session check-in
- [x] Progress & history tracking
- [x] Profile & settings
- [x] Full exercise and audio catalog available for free

### Planned Features

- [ ] HRV integration via Apple Health/Google Fit
- [ ] Push notifications for reminders
- [ ] Offline support
- [ ] AI-powered exercise recommendations

## 🧩 Exercise seed data

The exercise catalog is driven by per-category seed JSON files in `src/data/`:

- `src/data/exercises_seed_breathing.json`
- `src/data/exercises_seed_water.json`
- `src/data/exercises_seed_movement.json`
- `src/data/exercises_seed_sensory.json`

To regenerate/refresh seed files:

```bash
# From repo root
bun ./apps/mobile/scripts/generate-exercises-seed.ts

# From apps/mobile
bun ./scripts/generate-exercises-seed.ts
```

## 🔊 Audio (binaural beats)

The app uses `expo-audio` for audio playback. Keep it installed and ensure iOS builds include the `expo-audio` config plugin.

## ✅ Typecheck

```bash
bunx tsc -p apps/mobile/tsconfig.json --noEmit
```

## 🧪 Testing

```bash
# Run tests
bun test

# Run with coverage
bun test --coverage
```

## 📦 Building

### Development Build

```bash
# Create development build
bunx expo prebuild

# Run on device
bunx expo run:ios
bunx expo run:android
```

### Production Build

```bash
# Install EAS CLI
bun add -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 📄 License

Private - Recalibra © 2024
