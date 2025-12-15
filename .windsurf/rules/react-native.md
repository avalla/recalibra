---
trigger: always_on
---

# 🪁 Windsurf Rules — React Native + Expo

## 🎯 Objective

Build a **React Native Expo** app following modern best practices, strong typing (TypeScript), secure data handling,
offline resilience, and fast OTA deployments.

---

## 📁 Folder Structure

```

assets/
src/
components/
screens/
navigation/
hooks/
utils/
App.js
app.json

````

---

## ⚙️ Tech Stack

| Component       | Recommended Choice                               |
|-----------------|--------------------------------------------------|
| Framework       | React Native (functional components + hooks)     |
| Runtime         | Expo SDK                                         |
| Language        | TypeScript                                       |
| Navigation      | React Navigation                                 |
| Styling         | StyleSheet (or light styled-components)          |
| Icons           | Expo Vector Icons                                |
| Secure Storage  | Expo SecureStore                                 |
| Offline Support | AsyncStorage + Query Caching (e.g., React Query) |
| OTA Updates     | Expo OTA Updates                                 |

---

## ✅ Best Practices

- Use **functional components with React Hooks**
- Leverage **Expo SDK APIs** whenever possible
- Implement navigation using **React Navigation**
- Use **Expo’s asset system** for fonts and images
- Add **error boundaries** and crash reporting (Sentry or similar)
- Integrate **push notifications** via Expo
- Use **TypeScript** for strict typing
- Apply **StyleSheet** for consistent styling
- Use **Expo Vector Icons** for icons
- Store sensitive data securely with **Expo SecureStore**
- Implement **offline support and caching**
- Follow **React Native performance best practices**
- Enable **OTA updates** for quick rollouts

---

## 🚫 Avoid

- Class components
- Non-Expo APIs when an Expo alternative exists
- Logging secrets or sensitive info
- Heavy synchronous work on the UI thread

---

## ⚡️ Performance Tips

- Use `useMemo` and `useCallback` to prevent unnecessary re-renders
- Wrap pure UI components with `React.memo`
- Optimize lists using `keyExtractor`, `getItemLayout`, and `windowSize`
- Lazy load heavy screens and code-split routes
- Pass stable props and avoid inline objects or functions

---

## 🧭 Navigation

- Type route parameters (`RootStackParamList`)
- Organize navigators under `src/navigation/`
- Keep screens in `src/screens/` with minimal coupling
- Support **deep linking** if relevant

---

## 🎨 Asset Management

- Preload fonts and images using `Asset` and `Font` APIs
- Use `require()` or static `import` for proper bundling
- Support multiple scales (`@2x`, `@3x`)

---

## 🔔 Notifications

- Handle permission requests gracefully
- Register device tokens and subscribe to topics
- Route notifications to correct screens

---

## 🌐 Offline Support

- Persist cache (e.g., AsyncStorage + React Query)
- Show **offline/online state indicators**
- Implement retry buttons and network error UIs

---

## 🚀 OTA Updates

- Configure **staging** and **production** channels
- Manage changelogs and compatibility
- Always test OTA builds before publishing

---

## 🧱 Security Guidelines

- Keep **all tokens and secrets** in SecureStore only
- Never commit credentials to the repository
- Validate all API inputs and outputs
- Use **HTTPS/TLS** and enable certificate pinning if required

---

## 🧩 Naming Conventions

| Element    | Convention                            |
|------------|---------------------------------------|
| Components | PascalCase                            |
| Hooks      | `useXxx` in `src/hooks/`              |
| Utils      | Pure functions in `src/utils/`        |
| Screens    | `Screen` suffix (e.g., `LoginScreen`) |

Prefer **absolute imports** (baseUrl = `src/`).

---

## 🧰 Setup Checklist

- [ ] Initialize Expo project with TypeScript
- [ ] Install and configure React Navigation
- [ ] Add crash/error reporting (Sentry or similar)
- [ ] Integrate Expo SecureStore
- [ ] Add Expo Vector Icons and base theme
- [ ] Set up the folder structure as above
- [ ] Enable OTA updates and define release channels

---

## 🧪 Quality & Testing

- Use **ESLint + Prettier + TypeScript strict mode**
- Add unit tests for hooks and utils (Jest or React Testing Library)
- Measure list and screen performance for large datasets

---

## 🏁 Definition of Done

- App builds and runs on **iOS and Android** without blocking warnings
- Navigation is type-safe and functional
- Error boundaries and crash reporting are operational
- SecureStore is implemented for sensitive data
- Offline caching and recovery logic work correctly
- OTA updates tested and functional in staging

---

## 🤖 AI Behavior

> The following rules define how the **Windsurf AI Agent** should behave when working in this project.

### General Style

- Maintain a **professional, technical tone**
- Prefer **concise, consistent, and idiomatic** code
- Use **TypeScript-first** and follow **React Native community standards**
- Assume an **Expo-managed workflow** (no custom native builds unless specified)

### Code Generation

- Follow the folder and naming conventions above
- Generate **React function components** using hooks
- Include **strict typing** for props, routes, and API responses
- Include **StyleSheet-based styling** blocks where applicable
- Use **absolute imports** (`@/components/...`)
- Favor **Expo SDK features** (e.g., Camera, Location, Notifications)
- Include **skeleton, loading, and error states** by default

### Review & Validation

- Flag code that violates these guidelines
- Suggest improvements for **performance, security, and maintainability**
- Explain design choices briefly when refactoring or generating new code
- Keep generated files lint-clean and Prettier-compliant

---

## 💅 Code Style Reference

Below is a minimal reference template for all new components and hooks.
This ensures consistency across human and AI-generated code.

### 🧱 Example Component

```tsx
// src/components/ButtonPrimary.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type ButtonPrimaryProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export const ButtonPrimary: React.FC<ButtonPrimaryProps> = ({ label, onPress, disabled }) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  label: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
});
````

---

### ⚙️ Example Hook

```tsx
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return isOnline;
};
```

---

### 🧭 Import & Formatting Guidelines

* Use **absolute imports**:

  ```tsx
  import { ButtonPrimary } from "@/components/ButtonPrimary";
  ```
* Group imports in this order:

    1. React and React Native core
    2. Third-party packages
    3. Internal modules (`@/components`, `@/hooks`, `@/utils`)
* Always use **named exports** (no default exports)
* Use **2-space indentation** and trailing commas
* Prefer **const assertions** and explicit return types

---

> 🌀 **Note:** This Windsurf rulebook is a living document.
> Keep it up to date as your project evolves — especially after major Expo or React Native updates.