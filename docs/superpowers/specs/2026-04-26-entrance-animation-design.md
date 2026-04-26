# Entrance Animation Design Spec

## Overview

**Goal:** Create a dramatic entrance animation where Tegaki writes "Kirren" on a black screen, then clicking reveals the video background with a timed hero reveal synchronized to the splash moment.

**User Flow:**
1. Black screen with Tegaki handwriting animation of "Kirren"
2. Video plays muted/looped behind the overlay (pre-buffered)
3. User clicks → quick fade reveals video (already playing)
4. At video time ~1.2s (when red splash fills screen) → hero content fades in

---

## Architecture

### Components

**1. EntranceOverlay Component**
- Full-screen black div covering entire viewport
- Contains TegakiRenderer for "Kirren" text
- Click handler to trigger reveal
- Fades out quickly (300ms) on click

**2. VideoBackground (Modified)**
- Preloads immediately on page load
- Plays muted + looping behind overlay
- On reveal: continues playing from current position
- Watch currentTime to trigger hero reveal at ~1.2s

**3. HeroSection (Modified)**
- Initially hidden (opacity: 0, pointer-events: none)
- Revealed via CSS transition when video hits timing threshold
- All content (heading, subheading, buttons) fades in together

### State Management

- **First visit only:** Show entrance animation, store `hasSeenEntrance: true` in localStorage
- **Return visits:** Skip overlay, show hero immediately with video playing

### Timing Logic

```javascript
// Pseudo-code for timing
video.addEventListener('timeupdate', () => {
  if (video.currentTime >= 1.2 && !heroRevealed) {
    revealHero();
    heroRevealed = true;
  }
});
```

---

## Technical Details

### Tegaki Integration

**Font:** Caveat (handwriting style, bundled with Tegaki)
**Animation:** Write "Kirren" once, stays visible until clicked
**Position:** Centered on black screen

**Dependencies:**
- `tegaki` npm package
- Font import: `tegaki/fonts/caveat`

### Video Handling

**Attributes:**
- `preload="auto"`
- `autoplay muted loop playsinline`
- Hidden behind overlay via z-index

**Flow:**
1. Page load: Video starts playing muted + looping
2. Click: Overlay fades, video continues playing
3. Time check: At ~1.2s, hero fades in
4. After reveal: Video continues normally (can unmute if desired)

### CSS Classes

```css
/* Entrance overlay */
.entrance-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 300ms ease-out;
}

.entrance-overlay.fade-out {
  opacity: 0;
  pointer-events: none;
}

/* Hero hidden state */
.hero-content {
  opacity: 0;
  transition: opacity 800ms ease-out;
}

.hero-content.revealed {
  opacity: 1;
}
```

---

## Edge Cases

1. **Video fails to load:** Graceful fallback - hero reveals immediately on click, skip timing sync
2. **User clicks before Tegaki finishes:** Still works, just cuts animation short
3. **Reduced motion preference:** Respect `prefers-reduced-motion`, skip entrance entirely
4. **Mobile touch:** Ensure touch events work same as click

---

## Success Criteria

- [ ] Tegaki writes "Kirren" smoothly on black screen
- [ ] Click anywhere on overlay triggers fade
- [ ] Video is already playing when revealed (no loading delay)
- [ ] Hero content fades in at ~1.2s video time (splash moment)
- [ ] Animation only shows on first visit
- [ ] Return visits see hero immediately
- [ ] Works on mobile and desktop

---

## Files to Modify

1. **index.html:** Add entrance overlay div, Tegaki script, modify hero section
2. **portfolio.js:** Add entrance animation logic, video timing watcher, localStorage check
3. **portfolio.css:** Add entrance overlay and hero reveal styles

## New Dependencies

- `tegaki` - Handwriting animation library
- `tegaki/fonts/caveat` - Handwriting font
