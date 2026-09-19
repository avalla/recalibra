# App Store Connect Assets Guide - Recalibra

## Screenshot Requirements

### iPhone Screenshots
**Primary set:**
- 6.9" display: 1320 x 2868 pixels (iPhone 16 Pro Max)
- Apple also accepts 1260 x 2736 and 1290 x 2796 for the 6.9" slot

**Format:** PNG or JPEG, flattened without an alpha channel
**Quantity:** 1 to 10 screenshots per localization

**Current Italian set:** `RecalibraScreenshots/it-IT/6.9-inch/`

Reference: [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)

### iPad Screenshots
The current app configuration has `supportsTablet: false`, so an iPad set is not part of this release.

## Screenshot Content Guidelines

### Current Screenshots (in order):
1. **Home Screen**
   - Clean, welcoming interface
   - Clear value proposition
   - "Recalibra" logo visible

2. **Exercise Library**
   - Show variety of exercise categories
   - Breathing, water-based, vocal, movement tabs
   - Visual hierarchy of exercises

3. **Exercise Player**
   - Guided exercise in progress
   - Timer/progress indicator
   - Clear instructions visible

4. **Exercise Player**
   - Guided breathing phase in progress
   - Timer and progress indicator

5. **Paused Exercise**
   - Shows that the practice can be paused and resumed

6. **Progress Dashboard**
   - Stress tracking graphs
   - Session history
   - Achievement badges

### Design Requirements:
- **Device Frame:** Optional. The current set uses clean, unframed simulator captures.
- **Status Bar:** Show realistic status (time, battery, signal)
- **No Placeholder Text:** All text must be readable and final
- **Consistent Branding:** Use Recalibra color scheme and typography
- **Italian Text:** Primary language, English optional for international stores

## App Icon

**Requirements:**
- Size: 1024 x 1024 pixels
- Format: PNG without transparency
- No rounded corners (Apple adds them)
- No text smaller than 12pt

**Design Guidelines:**
- Clean, modern design
- Use the Recalibra leaf mark and dark teal field
- Recognizable at small sizes
- Avoid complex details

## Promotional Text

**Italian (170 characters max):**
"Ritrova il tuo equilibrio con esercizi guidati di respirazione, movimento e rilassamento, disponibili gratuitamente."

**English (170 characters max):**
"Find your balance with guided breathing, movement, and relaxation exercises, available for free."

## App Preview Video (Optional but Recommended)

**Requirements:**
- Duration: 15-30 seconds
- Format: .mov
- Resolution: Same as screenshots
- File size: Up to 500MB

**Content Sequence:**
1. App icon animation (2s)
2. Home screen swipe (3s)
3. Exercise categories showcase (5s)
4. Exercise player demo (5s)
5. HRV tracking visualization (4s)
6. Progress screen with session trends (3s)
7. App store download button (3s)

## Additional Assets

### Feature Graphic (for Google Play Store)
- Size: 1024 x 500 pixels
- Format: JPG or PNG
- No transparency
- App name and tagline

### Store Listing Screenshots
- Use same screenshots as App Store
- Add descriptive captions for each
- Highlight key features

## Text Guidelines

### Italian Translations:
- **Breathing Exercises**: Esercizi di respirazione
- **Water-Based**: Protocolli acquatici
- **Vocal Exercises**: Esercizi vocali
- **Movement**: Movimento
- **HRV Tracking**: Monitoraggio HRV
- **Free access**: Accesso gratuito

### Avoid:
- Medical claims ("cura", "tratta", "medico")
- Complex technical terms
- Small, unreadable text
- Placeholder content

## Review Checklist Before Upload

- [ ] All screenshots have correct dimensions
- [ ] Images are flattened and contain no alpha channel
- [ ] No placeholder text or "Lorem ipsum"
- [ ] Consistent branding across all assets
- [ ] Italian language is primary
- [ ] No copyrighted material without permission
- [ ] App icon is 1024x1024 without transparency
- [ ] Promotional text is under 170 characters
- [ ] All text is legible on mobile devices
- [ ] Screenshots reflect actual app functionality
- [ ] No PRO, premium, subscription, trial, price, or purchase badges are visible

## Common Pitfalls to Avoid

1. **Including device status bars with incorrect times**
2. **Using placeholder images or text**
3. **Showing features not yet implemented**
4. **Including competitor branding**
5. **Using copyrighted music in preview videos**
6. **Making medical claims**
7. **Forgetting to localize text for Italian market**

## File Naming Convention

```
01_Home.png
02_Esercizi.png
03_Dettaglio.png
04_Sessione.png
05_Pausa.png
06_Progressi.png
```

## Next Steps

1. Review the six captures in `RecalibraScreenshots/it-IT/6.9-inch/`
2. Upload them to the Italian 6.9" screenshot slot in App Store Connect
3. Preview the listing before submission
4. Create a separate localized set before enabling another storefront language

---

Remember: App Store Connect requires all assets to be final before submission. No placeholder content is allowed during review.
