---
name: Kirren Fraginal Portfolio
description: High-fashion editorial portfolio for Creative Developer & QA Specialist
colors:
  primary: "#18181b"
  neutral-bg: "#ffffff"
  surface-alt: "#fafafa"
  border-subtle: "#e4e4e7"
  text-primary: "#09090b"
  text-muted: "#71717a"
typography:
  display:
    fontFamily: "'Instrument Serif', serif"
    fontSize: "clamp(3.75rem, 8vw, 8rem)"
    fontWeight: 400
    lineHeight: "1"
  body:
    fontFamily: "'Plus Jakarta Sans', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 300
    lineHeight: "1.6"
  mono:
    fontFamily: "'Geist Mono', monospace"
    fontSize: "0.75rem"
    letterSpacing: "0.1em"
rounded:
  none: "0px"
  sm: "8px"
  md: "16px"
  lg: "24px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "64px"
  xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.none}"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "{colors.text-primary}"
---

# Design System: Kirren Fraginal Portfolio

## 1. Overview

**Creative North Star: "The High-Fashion Editorial Gallery"**

An ultra-refined, high-fashion editorial digital portfolio that merges raw technical precision with high-end print typography. Built on an uncompromised stark white canvas with extreme typographic contrast, color-preserving Bayer dithered alcohol ink art, 3D OptionWheel project navigation, and scroll-driven classical statue assembly.

**Key Characteristics:**
- Stark white canvas with deep charcoal and black editorial contrast.
- Custom Google Font pairing (`Instrument Serif` display + `Plus Jakarta Sans` body + `Geist Mono` metadata).
- Interactive tactile features (color-preserving Bayer dither canvas, 3D option wheel, scroll-triggered statue assembly).
- Zero decorative clutter, zero side-stripes, zero gradient text.

## 2. Colors

A stark, high-contrast monochrome palette accented by gold and black alcohol ink artwork.

### Primary
- **Deep Charcoal / Black** (`#18181b`): Used for primary headlines, active navigation pills, and hover inversion boxes.

### Neutral
- **Stark White** (`#ffffff`): Canonical surface background for maximum light-mode clarity.
- **Off-White Surface** (`#fafafa`): Background tint for alternating editorial sections like About and Contact.
- **Subtle Border Divider** (`#e4e4e7`): Clean 1px visual section separators.
- **Muted Text** (`#71717a`): Secondary metadata, subtitles, and mono tags.

### Named Rules
**The Rarity of Accent Rule.** Colored accents are strictly reserved for media assets (gold ink artwork, project screenshots, certificate documents). All UI framework elements remain stark black and white.

## 3. Typography

**Display Font:** `Instrument Serif` (Google Fonts)
**Body Font:** `Plus Jakarta Sans` (Google Fonts)
**Label/Mono Font:** `Geist Mono` (Google Fonts)

**Character:** High-fashion editorial print hierarchy meeting technical software precision.

### Hierarchy
- **Display** (`Instrument Serif`, regular 400, 6xl-9xl): Hero title `I'm Kirren` and major section headers.
- **Headline** (`Instrument Serif`, regular 400, 4xl-6xl): Sub-headers and project names.
- **Body** (`Plus Jakarta Sans`, light 300, 18px-24px, max line length 65ch): Paragraph bios and descriptions.
- **Label** (`Geist Mono`, regular 400, 12px, tracking-widest, uppercase): Metadata tags `[ PROFILE // KIRREN FRAGINAL ]`.

## 4. Elevation

Flat by default. Depth is conveyed through background color contrast and physics-driven motion rather than heavy drop shadows.

### Named Rules
**The Flat-By-Default Rule.** All cards and UI surfaces remain completely flat at rest. Depth is expressed through Z-index layering, blur depth in 3D OptionWheel, and motion.

## 5. Components

### Navigation
- **Style:** 100% transparent floating navbar with no header bar or backdrop blur box.
- **Text Color Inversion:** Dynamically flips between dark zinc (`#18181b`) over light sections and pure white (`#ffffff`) when crossing over dark sections (like Contact).

### Hero Bio Box
- **Shape:** 100% sharp rectangular box (`rounded-none`).
- **Interaction:** Sliding black background fill on hover that smoothly inverts text from dark zinc to pure white.

### Project OptionWheel
- **Style:** 3D vertical wheel with depth-based Gaussian blur on inactive project items.
- **Mobile Controller:** Side-anchored touch dial slider (`01 SLIDE`) for mobile viewports.

### Statue Assembly
- **Style:** 4 diagonal PNG slices cut in-place from the same canvas origin that fly in from scattered offsets and magnetically lock into position on scroll.

## 6. Do's and Don'ts

### Do:
- **Do** maintain strict left alignment to grid padding (`pl-6 md:pl-16`).
- **Do** use `Instrument Serif` for headlines and `Plus Jakarta Sans` for body text.
- **Do** keep cards borderless and flat.
- **Do** enforce 100% transparent navbar floating over page content.

### Don't:
- **Don't** use gradient text (`background-clip: text`).
- **Don't** use colored side-stripe borders on cards.
- **Don't** add drop shadows to skill or credential cards.
- **Don't** wrap the navbar in a solid or frosted background header bar.
