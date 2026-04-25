# Portfolio Website - Project Documentation

## Project Overview

**Project Name:** Professional Portfolio Website  
**Developer:** Kirren Michael Fraginal  
**Purpose:** A personal portfolio website showcasing web development projects, skills, and providing a way for potential employers or clients to get in touch.

---

## Project Description

This is a responsive, single-page portfolio website built with HTML, CSS, and JavaScript. It features a modern design with smooth animations, dark/light theme toggle, and interactive elements. The portfolio includes three main projects that demonstrate different aspects of web development skills: a Task Manager application, a Visual Novel game, and a Form Validator.

### Main Goals
- Showcase personal projects and technical skills
- Provide a professional online presence
- Demonstrate frontend development capabilities
- Create an engaging user experience with interactive elements
- Allow visitors to download resume and contact the developer

---

## Features

### 1. **Responsive Navigation**
- Floating pill-style navbar that stays fixed at the top
- Smooth scroll navigation to different sections (Home, About, Projects, Skills, Contact)
- Active section highlighting based on scroll position
- Mobile-responsive design with appropriate sizing

### 2. **Theme Toggle (Dark/Light Mode)**
- Toggle button to switch between dark and light themes
- Theme preference saved in localStorage
- Respects system preference on first visit
- Smooth transitions between themes

### 3. **Spline 3D Background**
- Interactive 3D background using Spline runtime
- Lazy-loaded when hero section becomes visible for performance
- Replaced morphing blob animations for better visual appeal
- WebGL-based rendering with GPU acceleration

### 4. **Scroll Animations**
- Fade-in animations when scrolling to sections
- Animated skill bars that fill when visible
- Smooth reveal effects for content

### 5. **Project Showcase**
- Filterable project cards (All, Frontend, Fullstack, UI/UX, Game)
- 3D tilt effect on project cards using GSAP (desktop only)
- Project cards with hover effects and smooth transitions

### 6. **Interactive Terminal**
- Modal-based terminal interface
- Commands: help, about, skills, contact, resume, clear, exit
- Easter egg feature for visitors to explore

### 7. **Visual Novel Game**
- Interactive text-based game about developer life
- Multiple choice story progression
- Emoji-based visual elements
- Modal-based game interface

### 8. **Contact Form**
- Functional contact form using Formspree
- Form validation with visual feedback
- Success/error message display
- Social media links (GitHub, LinkedIn, Email)

### 9. **Resume Download**
- Direct download link to PDF resume
- Located in hero section for easy access

### 10. **Scroll to Top Button**
- Floating button appears after scrolling down
- Smooth scroll back to top of page

### 11. **Performance Optimizations**
- Lazy loading for Spline 3D background (loads when hero section visible)
- Lazy loading for images
- WebP image format with JPEG fallback
- Resource hints (preconnect) for faster loading
- Throttled scroll event listeners for smooth performance
- Service Worker for PWA capabilities

### 12. **Accessibility Features**
- Keyboard navigation support
- ARIA labels for screen readers
- Focus management for modals
- `prefers-reduced-motion` support for users with motion sensitivity

---

## Technologies Used

### Core Technologies
| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure and semantic markup |
| **CSS3** | Styling, animations, and responsive design |
| **JavaScript (ES6+)** | Interactivity and dynamic functionality |

### CSS Framework & Styling
| Technology | Purpose |
|------------|---------|
| **Tailwind CSS** | Utility-first CSS framework for rapid styling |
| **Custom CSS** | Portfolio-specific styles, animations, and effects |
| **CSS Variables** | Theme colors and dynamic styling |
| **CSS Animations** | Fade-ins, transitions, and navbar floating animation |
| **Backdrop Filter** | Glass morphism effects |

### JavaScript Libraries & Features
| Technology | Purpose |
|------------|---------|
| **GSAP (GreenSock)** | 3D tilt animations for project cards |
| **Spline 3D Runtime** | Interactive 3D background (lazy-loaded) |
| **DOM Manipulation** | Dynamic content updates and interactions |
| **Event Listeners** | User interaction handling |
| **Intersection Observer** | Scroll-triggered animations and lazy loading |
| **LocalStorage** | Theme preference persistence |
| **Fetch API** | Form submission handling |
| **CSS Class Toggling** | Theme switching and UI states |
| **Service Worker** | PWA capabilities for offline support |

### External Services & APIs
| Service | Purpose |
|---------|---------|
| **Formspree** | Contact form backend handling |
| **Spline** | 3D scene hosting and runtime |
| **GitHub** | Project hosting and social link |
| **LinkedIn** | Professional networking link |

### Fonts & Icons
| Resource | Purpose |
|----------|---------|
| **Inter Font** | Modern, readable typography |
| **SVG Icons** | Scalable vector icons for UI elements |
| **Emoji** | Visual elements in projects and game |

### Development Tools
| Tool | Purpose |
|------|---------|
| **Git** | Version control |
| **GitHub** | Code repository hosting |
| **Vercel** | Website deployment and hosting |

---

## Project Structure

```
Portfolio/
├── index.html              # Main portfolio page
├── portfolio.css           # Custom styles and animations
├── portfolio.js            # Interactive functionality
├── scene.splinecode        # Spline 3D scene file
├── todo.html               # Task Manager project demo
├── validator.html          # Form Validator project demo
├── profile.jpg             # Profile image (JPEG fallback)
├── profile.webp            # Profile image (optimized format)
├── Kirren_Michael_Fraginal_Resume.pdf  # Downloadable resume
├── sw.js                   # Service Worker for PWA
├── vercel.json             # Deployment configuration
├── README.md               # Basic project info
├── PERFORMANCE_OPTIMIZATION_GUIDE.md     # Performance docs
└── PROJECT_DOCUMENTATION.md            # This file
```

---

## Key Projects Included

### 1. Task Manager
- **Type:** Frontend project
- **Technologies:** HTML, Tailwind CSS, JavaScript
- **Features:** Add, complete, delete tasks; local state management
- **Purpose:** Demonstrates DOM manipulation and CRUD operations

### 2. Dev Life: Visual Novel
- **Type:** Game project
- **Technologies:** JavaScript, JSON, DOM API
- **Features:** Interactive story, multiple choices, emoji visuals
- **Purpose:** Shows creative coding and state management

### 3. Form Validator
- **Type:** Frontend project
- **Technologies:** HTML, Tailwind CSS, JavaScript
- **Features:** Real-time validation, password strength indicator, error feedback
- **Purpose:** Demonstrates form handling and validation logic

---

## Design Features

### Visual Design
- **Color Scheme:** Indigo/purple accent colors with slate grays
- **Glass Morphism:** Semi-transparent backgrounds with blur effects
- **Gradient Backgrounds:** Subtle gradients for depth
- **Smooth Transitions:** 0.3s ease transitions for interactive elements
- **Border Radius:** Heavy use of rounded corners (rounded-3xl, rounded-full)

### Layout
- **Mobile-First:** Responsive design starting at mobile breakpoint
- **Grid System:** CSS Grid and Flexbox for layouts
- **Container:** Max-width containers (max-w-6xl, max-w-3xl)
- **Spacing:** Consistent padding and gap utilities

### Accessibility
- **Semantic HTML:** Proper heading hierarchy, section elements
- **ARIA Labels:** Accessible names for interactive elements
- **Focus States:** Visible focus indicators
- **Reduced Motion:** Respects prefers-reduced-motion setting
- **Color Contrast:** Sufficient contrast for readability

---

## Browser Compatibility

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support (with -webkit prefixes where needed)
- **Mobile Browsers:** iOS Safari, Chrome Mobile, Samsung Internet

---

## Future Enhancements (Optional Ideas)

1. **Blog Section:** Add a simple blog for sharing learnings
2. **Project Detail Pages:** Individual pages for each project with more details
3. **Animation Improvements:** More scroll-triggered animations
4. **Contact Backend:** Custom backend instead of Formspree
5. **Analytics:** Basic visitor tracking (privacy-friendly)
6. **PWA Features:** Install prompt, offline page (basic)
7. **Multi-language Support:** Add Filipino/English toggle

---

## Learning Outcomes

Through building this portfolio, the following skills were demonstrated and practiced:

1. **HTML/CSS:** Semantic markup, modern CSS features, responsive design
2. **JavaScript:** DOM manipulation, event handling, localStorage
3. **Tailwind CSS:** Utility classes, configuration, customization
4. **Git/GitHub:** Version control, collaboration, deployment
5. **Performance:** Image optimization, lazy loading, resource hints
6. **Accessibility:** ARIA labels, semantic HTML, keyboard navigation
7. **UI/UX Design:** Modern aesthetics, user experience considerations

---

## Contact Information

- **Name:** Kirren Michael Fraginal
- **Email:** fraginalkirrenmichael@gmail.com
- **GitHub:** github.com/MadCheshiren
- **LinkedIn:** linkedin.com/in/kirren-michael-fraginal-871368403
- **Location:** Naga City, Philippines

---

*Last Updated: April 2026*
