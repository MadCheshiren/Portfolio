# Professional Portfolio

A modern, responsive professional portfolio website featuring a glassmorphic UI, interactive 3D cards, an embedded terminal emulator, and a "Dev Life" visual novel game.

## Features

- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode** — Persisted theme toggle with system preference detection
- **Interactive 3D Tilt Cards** — Project cards that react to mouse movement
- **Custom Terminal** — Functional CLI-style interface for portfolio navigation
- **Dev Life Visual Novel** — Text-based adventure game with branching story paths
- **Smooth Scroll Reveal** — Elements animate into view on scroll
- **Project Filtering** — Filter projects by category with smooth transitions
- **Contact Form** — Integrated with Formspree for real message delivery
- **Accessibility** — Keyboard navigation, ARIA attributes, focus management, `prefers-reduced-motion` support

## Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Glassmorphism, 3D transforms, animations, responsive design
- **JavaScript (ES6+)** — DOM manipulation, IntersectionObserver, Fetch API, async/await
- **Tailwind CSS** — Utility-first CSS framework (CDN)
- **Formspree** — Contact form backend

## Getting Started

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/portfolio.git
cd portfolio
```

2. Open `index.html` in your browser, or use a local dev server:
```bash
npx serve .
```

### Formspree Setup

Replace `YOUR_FORM_ID` in the contact form's `action` attribute with your actual Formspree form ID:

1. Sign up at [formspree.io](https://formspree.io)
2. Create a new form
3. Copy your form ID (e.g., `xabcdefgh`)
4. Update the form action: `action="https://formspree.io/f/xabcdefgh"`

## Deployment

### Vercel

The project includes a `vercel.json` for zero-config deployment:

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Deploy — that's it!

Or use the Vercel CLI:
```bash
npm i -g vercel
vercel
```

### GitHub Pages

1. Go to your repo Settings → Pages
2. Set source to the main branch
3. Your site will be live at `https://yourusername.github.io/portfolio/`

## Project Structure

```
portfolio/
├── index.html      # Main HTML structure
├── portfolio.css   # Custom styles (glassmorphism, animations, etc.)
├── portfolio.js    # All JavaScript logic
├── profile.jpg     # Profile photo
├── vercel.json     # Vercel deployment config
├── .gitignore      # Git ignore rules
└── README.md       # This file
```

## Customization

All placeholder content is marked with brackets:
- `[Name]` / `[Your Name]` — Your name
- `[Your Role/Tagline]` — Your professional title
- `[Brief personal background...]` — About me text
- `[Project Title N]` — Project names
- `[Project Screenshot]` — Replace with actual project images
- `your@email.com`, `github.com/yourusername`, etc. — Your contact info

## License

MIT
