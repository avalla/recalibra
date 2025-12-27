---
trigger: always_on
description: Apply this rule on web projects
---

# General Code Style & Formatting

- Follow the Airbnb Style Guide for code formatting.
- Use PascalCase for React component file names (e.g., UserCard.tsx, not user-card.tsx).
- Prefer named exports for components.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError, isValid, canEdit).
- Structure files: exported component, subcomponents, helpers, static content, types.
- Follow ViteJs, React official documentation for setting up and configuring projects.
- Use the function keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.
- Use Prettier for consistent code formatting.
- Structure components for testing with playwright (text / role based testing)
- Keep components small and focused (single responsibility principle).
- Use early returns to reduce nested conditions.
- Prefer const over let, avoid var.
- Use meaningful comments that explain "why" not "what".

# TypeScript Best Practices

- Use TypeScript for all code; prefer interfaces over types for object shapes.
- Avoid any and enums; use explicit types and maps instead.
- Use functional components with TypeScript interfaces.
- Enable strict mode in TypeScript for better type safety.
- Use generic types for reusable components.
- Prefer union types over enums when possible.
- Use type guards for runtime type checking.
- Export types separately from values.
- Use Pick, Omit, and Partial utility types for object manipulation.
- Avoid type assertions (as) unless absolutely necessary.

# Project Structure & Architecture

- Use ViteJs and React 18 and react-router-dom
- Organize files by feature/domain, not by file type.
```
src/
  features/
    auth/
      components/
      hooks/
      services/
      types/
    listings/
      components/
      hooks/
      services/
      types/
  shared/
    components/
    hooks/
    utils/
    types/
  pages/
  layouts/
```
- Use absolute imports with path aliases (@/features, @/shared, etc.).
- Keep business logic in custom hooks, not in components.
- Separate UI components from business logic components.
- Use barrel exports (index.ts) for cleaner imports.

# Styling & UI

- Implement responsive design with mobile-first approach.
- Use Tailwind CSS for styling (avoid styled-components).
- Implement dark mode support using Tailwind CSS dark mode.
- Ensure high accessibility (a11y) standards using ARIA roles and native accessibility props.
- Use CSS animations and transitions for smooth UX.
- Use semantic HTML5 elements (header, nav, main, section, article, aside, footer).
- Maintain consistent spacing using Tailwind's spacing scale.
- Use CSS variables for theme colors and values.
- Test color contrast for accessibility.
- Provide focus states for all interactive elements.
- Use loading skeletons and spinners for better perceived performance.


# State Management & Logic

- Use React Context for global state (auth, theme, etc.).
- Use local state for UI-only state.
- Use useReducer for complex local state logic.
- Implement proper state updates (immutable patterns).
- Avoid prop drilling by using context or custom hooks.
- Use useCallback and useMemo for performance optimization.
- Extract complex logic into custom hooks.
- Use state machines for complex state flows (XState if needed).

# Performance & Optimization

- Use React.memo() for expensive components.
- Implement code splitting with lazy loading.
- Optimize images (WebP format, lazy loading).
- Use virtual scrolling for large lists.
- Implement proper bundle analysis.
- Use the Profiler API for performance debugging.
- Minimize re-renders with proper dependency arrays.
- Use Intersection Observer for lazy loading.
- Implement service worker for offline support.
- Optimize Core Web Vitals (LCP, FID, CLS).

# Security & Best Practices

- Sanitize user inputs before rendering.
- Use CSP headers for XSS protection.
- Implement proper error boundaries.
- Validate all data on both client and server.
- Use HTTPS for all API calls.
- Implement proper authentication checks.
- Store secrets in environment variables, not in code.
- Use Content Security Policy headers.
- Implement proper logout and token refresh.
- Never expose sensitive data in the frontend.

# Error Handling & Logging

- Implement error boundaries for graceful error handling.
- Log errors with proper context.
- Show user-friendly error messages.
- Implement retry mechanisms for failed requests.
- Use toast notifications for non-critical errors.
- Implement proper 404 and 500 error pages.
- Track errors for debugging and improvement.

# SEO & Meta Tags

- Use React Helmet for managing document head.
- Implement proper meta tags for social sharing.
- Use structured data (JSON-LD) for SEO.
- Implement proper URL structure.
- Use semantic HTML for better SEO.
- Implement breadcrumb navigation.
- Add alt text to all images.
- Use proper heading hierarchy (h1-h6).
- Implement sitemap and robots.txt.
- Monitor Core Web Vitals for SEO impact.

# Internationalization (i18n)

- Use react-i18next for translations.
- Store translations in JSON files.
- Implement language detection and switching.
- Format dates, numbers, and currencies locally.
- Support RTL languages if needed.
- Use translation keys, not hardcoded strings.
- Implement pluralization rules.
- Test all languages in UI.
- Keep translations in sync with development.

# Deployment & CI/CD

- Use environment-specific configurations.
- Implement proper build optimization.
- Use GitHub Actions for CI/CD.
- Implement automated testing in pipeline.
- Use feature flags for gradual rollouts.
- Monitor application performance in production.
- Implement proper logging and monitoring.
- Use CDN for static assets.
- Implement proper rollback strategies.
- Document deployment process.

# Code Review Guidelines

- Review for performance implications.
- Check for security vulnerabilities.
- Ensure accessibility standards are met.
- Verify test coverage.
- Check for proper error handling.
- Review for code duplication.
- Ensure consistent styling patterns.
- Check for proper TypeScript usage.
- Review for SEO best practices.
- Verify responsive design implementation.
