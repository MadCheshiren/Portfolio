# Entrance Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dramatic entrance animation with Tegaki handwriting, video reveal, and timed hero fade-in synchronized to the splash moment.

**Architecture:** Black overlay with Tegaki animation covers pre-loaded looping video. On click, overlay fades revealing video. Video time watcher triggers hero reveal at ~1.2s when red splash fills screen. First-visit-only via localStorage.

**Tech Stack:** HTML, CSS, Vanilla JS, Tegaki library, Caveat font

---

## File Structure

**Files to Modify:**
- `index.html:40-100` - Add entrance overlay div, Tegaki script import, modify hero section structure
- `index.html:15-20` - Add Tegaki CDN/script import
- `portfolio.css:25-50` - Add entrance overlay and hero reveal styles
- `portfolio.js:1-50` - Add entrance animation initialization module

**No New Files Created**

---

## Task 1: Add Tegaki Library Import

**Files:**
- Modify: `index.html:15-20` (in `<head>` after existing scripts)

- [ ] **Step 1: Add Tegaki script tag**

```html
<!-- After GSAP script -->
<script type="module">
  import { TegakiEngine } from 'https://esm.sh/tegaki/core';
  import caveat from 'https://esm.sh/tegaki/fonts/caveat';
  window.TegakiEngine = TegakiEngine;
  window.caveatFont = caveat;
</script>
```

- [ ] **Step 2: Verify script loads**

Open browser console, type `TegakiEngine`, expect: `class TegakiEngine`

---

## Task 2: Create Entrance Overlay HTML Structure

**Files:**
- Modify: `index.html:40-45` (immediately after `<body>` tag)

- [ ] **Step 1: Add entrance overlay div before page-gradient**

```html
<!-- Entrance Animation Overlay -->
<div id="entrance-overlay" class="entrance-overlay">
  <div class="entrance-content">
    <div id="tegaki-name"></div>
    <p class="entrance-hint">Click anywhere to enter</p>
  </div>
</div>
```

- [ ] **Step 2: Add CSS classes to overlay elements**

The overlay should cover full screen with z-index 9999, centered content.

---

## Task 3: Modify Hero Section for Reveal Animation

**Files:**
- Modify: `index.html:78-97` (hero section wrapper)

- [ ] **Step 1: Wrap hero content in reveal container**

Change from:
```html
<section id="home" class="min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden">
```

To:
```html
<section id="home" class="min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden">
  <div id="hero-reveal" class="hero-reveal">
```

- [ ] **Step 2: Close the wrapper div before </section>**

Add `</div>` before `</section>` closing tag.

- [ ] **Step 3: Verify HTML structure is valid**

Check that all divs are properly nested and closed.

---

## Task 4: Modify Video for Preloading and Looping

**Files:**
- Modify: `index.html:80-82` (video element attributes)

- [ ] **Step 1: Update video attributes**

Change:
```html
<video id="hero-video" class="hero-video" autoplay muted loop playsinline aria-hidden="true">
```

To:
```html
<video id="hero-video" class="hero-video" preload="auto" autoplay muted loop playsinline aria-hidden="true" data-splash-time="1.2">
```

- [ ] **Step 2: Verify video plays muted on page load**

Refresh page, video should be playing but silent (check via network tab or visual).

---

## Task 5: Add Entrance Overlay CSS Styles

**Files:**
- Modify: `portfolio.css:25-50` (after page-gradient, before hero-video styles)

- [ ] **Step 1: Add entrance overlay styles**

```css
/* Entrance Animation Overlay */
.entrance-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 400ms ease-out;
}

.entrance-overlay.fade-out {
  opacity: 0;
  pointer-events: none;
}

.entrance-content {
  text-align: center;
}

.entrance-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  margin-top: 2rem;
  opacity: 0;
  animation: fadeInHint 1s ease-out 3s forwards;
}

@keyframes fadeInHint {
  to { opacity: 1; }
}
```

- [ ] **Step 2: Add hero reveal styles**

```css
/* Hero Reveal Animation */
.hero-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 800ms ease-out, transform 800ms ease-out;
}

.hero-reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
```

- [ ] **Step 3: Verify styles compile without errors**

Check browser dev tools for any CSS syntax errors.

---

## Task 6: Initialize Tegaki Handwriting Animation

**Files:**
- Modify: `portfolio.js:1-50` (add at top of file)

- [ ] **Step 1: Add entrance animation module**

```javascript
// Entrance Animation Module
const EntranceAnimation = {
  overlay: null,
  video: null,
  heroReveal: null,
  heroRevealed: false,
  splashTime: 1.2, // seconds when splash fills screen
  
  init() {
    // Check if already seen
    if (localStorage.getItem('hasSeenEntrance')) {
      this.skipAnimation();
      return;
    }
    
    this.overlay = document.getElementById('entrance-overlay');
    this.video = document.getElementById('hero-video');
    this.heroReveal = document.getElementById('hero-reveal');
    
    if (!this.overlay || !this.video || !this.heroReveal) {
      console.warn('[Entrance] Missing elements, skipping animation');
      this.skipAnimation();
      return;
    }
    
    // Get splash time from video data attribute
    const splashAttr = this.video.dataset.splashTime;
    if (splashAttr) this.splashTime = parseFloat(splashAttr);
    
    this.setupTegaki();
    this.setupEventListeners();
    this.setupVideoWatcher();
  },
  
  setupTegaki() {
    // Wait for TegakiEngine and font to load
    if (typeof TegakiEngine === 'undefined' || typeof caveatFont === 'undefined') {
      setTimeout(() => this.setupTegaki(), 100);
      return;
    }
    
    const container = document.getElementById('tegaki-name');
    if (!container) return;
    
    // Register font bundle globally
    TegakiEngine.registerBundle(caveatFont);
    
    // Create Tegaki engine for "Kirren"
    this.tegakiEngine = new TegakiEngine(container, {
      text: 'Kirren',
      font: 'caveat',
      time: { mode: 'uncontrolled', speed: 1, loop: false }
    });
  },
  
  setupEventListeners() {
    // Click anywhere on overlay to reveal
    this.overlay.addEventListener('click', () => this.reveal());
    this.overlay.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.reveal();
    }, { passive: false });
  },
  
  reveal() {
    if (this.heroRevealed) return;
    
    // Fade out overlay
    this.overlay.classList.add('fade-out');
    
    // Mark as seen
    localStorage.setItem('hasSeenEntrance', 'true');
    
    // Video continues playing, hero reveal happens via time watcher
  },
  
  setupVideoWatcher() {
    // Watch video time to trigger hero reveal at splash moment
    this.video.addEventListener('timeupdate', () => {
      if (!this.heroRevealed && this.video.currentTime >= this.splashTime) {
        this.revealHero();
      }
    });
  },
  
  revealHero() {
    this.heroRevealed = true;
    this.heroReveal.classList.add('revealed');
    
    // Unmute video if desired (optional)
    // this.video.muted = false;
  },
  
  skipAnimation() {
    // Hide overlay immediately
    const overlay = document.getElementById('entrance-overlay');
    if (overlay) overlay.style.display = 'none';
    
    // Show hero immediately
    const heroReveal = document.getElementById('hero-reveal');
    if (heroReveal) heroReveal.classList.add('revealed');
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  EntranceAnimation.init();
});
```

- [ ] **Step 2: Test that module loads without errors**

Open browser console, expect no errors. Check `EntranceAnimation` object exists.

---

## Task 7: Add Reduced Motion Support

**Files:**
- Modify: `portfolio.js:45-50` (in EntranceAnimation.init method)

- [ ] **Step 1: Check for reduced motion preference**

Add at start of `init()` method:

```javascript
init() {
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    this.skipAnimation();
    return;
  }
  
  // Check if already seen
  if (localStorage.getItem('hasSeenEntrance')) {
    this.skipAnimation();
    return;
  }
  
  // ... rest of init
}
```

- [ ] **Step 2: Test with prefers-reduced-motion enabled**

In browser dev tools, enable "Prefers reduced motion" in accessibility settings, refresh page, expect animation to be skipped.

---

## Task 8: Add Caveat Font for Tegaki

**Files:**
- Modify: `index.html:15-20` (in `<head>`)

- [ ] **Step 1: Add font preconnect and load**

After existing preconnect links:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Verify font loads**

Check Network tab for font request, or apply `font-family: 'Caveat', cursive` to a test element.

---

## Task 9: Integration Testing

**Files:**
- Test: Manual browser testing

- [ ] **Step 1: Clear localStorage and test first visit**

```javascript
localStorage.removeItem('hasSeenEntrance');
location.reload();
```

Expect:
1. Black screen appears
2. "Kirren" writes itself
3. Video playing behind (muted)
4. Click fades overlay
5. At ~1.2s, hero content fades in

- [ ] **Step 2: Test return visit**

Refresh page again (without clearing localStorage).

Expect:
1. No black screen
2. Hero visible immediately
3. Video playing normally

- [ ] **Step 3: Test mobile touch**

Use browser device emulation or actual mobile device.

Expect: Touch works same as click to reveal.

- [ ] **Step 4: Test video fallback**

Block video URL in network tab, refresh page.

Expect: Hero reveals immediately on click (graceful fallback).

---

## Task 10: Final Verification

- [ ] **Step 1: Verify all success criteria**

- [x] Tegaki writes "Kirren" smoothly on black screen
- [x] Click anywhere on overlay triggers fade
- [x] Video is already playing when revealed (no loading delay)
- [x] Hero content fades in at ~1.2s video time (splash moment)
- [x] Animation only shows on first visit
- [x] Return visits see hero immediately
- [x] Works on mobile and desktop
- [x] Respects prefers-reduced-motion

- [ ] **Step 2: Review code for DRY violations**

Check for any duplicate code or opportunities to simplify.

---

## Summary

This plan implements a dramatic entrance animation with these components:

1. **HTML Structure:** Entrance overlay div with Tegaki container, hero reveal wrapper
2. **CSS Styles:** Full-screen overlay, fade transitions, hero reveal animation
3. **JavaScript Module:** EntranceAnimation object handling Tegaki, click events, video timing, localStorage
4. **Dependencies:** Tegaki library (ESM import), Caveat Google Font

**Total Estimated Time:** 45-60 minutes for all tasks
