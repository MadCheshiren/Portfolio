/* =========================================================
   PORTFOLIO JAVASCRIPT - Main Functionality
   =========================================================
   Sections:
   1. Entrance Animation (Tegaki handwriting)
   2. Scroll Animations (reveal on scroll)
   3. Navigation Effects (hide on scroll, active state)
   4. Contact Form (terminal aesthetic)
   5. Project Filtering (category buttons)
   6. 3D Tilt Effect (project cards)
   7. Terminal Module (command line interface)
   8. Visual Novel Game (interactive story)
   ========================================================= */

// ---------------------------------------------------------
// 1. ENTRANCE ANIMATION (Tegaki Handwriting)
// ---------------------------------------------------------
// Plays handwriting animation on first visit, syncs with video
const EntranceAnimation = {
  overlay: null,
  video: null,
  heroReveal: null,
  navbar: null,
  terminalBtn: null,
  heroRevealed: false,
  splashTime: 1.2,
  tegakiEngine: null,
  DEV_MODE: false,  // true = always show, false = first visit only

  init() {
    // Skip animation for reduced motion preference or returning visitors
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.skipAnimation();
      return;
    }
    if (!this.DEV_MODE && localStorage.getItem('hasSeenEntrance')) {
      this.skipAnimation();
      return;
    }

    // Cache DOM elements
    this.overlay = document.getElementById('entrance-overlay');
    this.video = document.getElementById('hero-video');
    this.heroReveal = document.getElementById('hero-reveal');
    this.navbar = document.getElementById('navbar');
    this.terminalBtn = document.getElementById('terminal-toggle');

    if (!this.overlay || !this.video || !this.heroReveal) {
      this.skipAnimation();
      return;
    }
    
    // Hide UI elements and pause video during entrance
    if (this.navbar) this.navbar.classList.add('entrance-hidden');
    if (this.terminalBtn) this.terminalBtn.classList.add('entrance-hidden');
    this.video.pause();
    this.video.currentTime = 0;
    
    const splashAttr = this.video.dataset.splashTime;
    if (splashAttr) this.splashTime = parseFloat(splashAttr);
    
    this.setupTegaki();
    this.setupEventListeners();
  },

  // Handwriting animation using Tegaki library
  setupTegaki() {
    if (typeof window.TegakiEngine === 'undefined' || typeof window.caveatFont === 'undefined') {
      setTimeout(() => this.setupTegaki(), 200);
      return;
    }

    const container = document.getElementById('tegaki-name');
    if (!container) return;

    let fontData = window.caveatFont;
    if (fontData.default) fontData = fontData.default;

    try {
      window.TegakiEngine.registerBundle(fontData);
      this.tegakiEngine = new window.TegakiEngine(container, {
        text: 'Kirren',
        font: fontData,
        time: { mode: 'uncontrolled', speed: 1, loop: false }
      });
      // Show hint after 5 seconds
      setTimeout(() => {
        const hint = document.querySelector('.entrance-hint');
        if (hint) hint.classList.add('visible');
      }, 5000);
    } catch (err) {
      console.error('Tegaki setup failed:', err);
    }
  },

  // Click to skip entrance animation
  setupEventListeners() {
    this.overlay.addEventListener('click', () => this.reveal());
    this.overlay.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.reveal();
    }, { passive: false });
  },

  // Fade out overlay and start video
  reveal() {
    if (this.overlay.classList.contains('fade-out')) return;
    this.overlay.classList.add('fade-out');
    localStorage.setItem('hasSeenEntrance', 'true');
    if (this.tegakiEngine) this.tegakiEngine.destroy();
    this.startVideoAndWatch();
  },

  // Monitor video playback to reveal hero at splash moment
  startVideoAndWatch() {
    this.video.currentTime = 0;
    this.video.play();
    
    const checkTime = () => {
      if (!this.heroRevealed && this.video.currentTime >= this.splashTime) {
        this.revealHero();
      } else if (!this.heroRevealed) {
        requestAnimationFrame(checkTime);
      }
    };
    requestAnimationFrame(checkTime);
  },

  // Reveal hero content at specific video timestamp
  revealHero() {
    this.heroRevealed = true;
    this.heroReveal.classList.add('revealed');
    if (this.navbar) this.navbar.classList.remove('entrance-hidden');
    if (this.terminalBtn) this.terminalBtn.classList.remove('entrance-hidden');
  },

  // Skip animation for returning visitors
  skipAnimation() {
    const overlay = document.getElementById('entrance-overlay');
    if (overlay) overlay.style.display = 'none';
    const hero = document.getElementById('hero-reveal');
    if (hero) hero.classList.add('revealed');
    const nav = document.getElementById('navbar');
    const term = document.getElementById('terminal-toggle');
    if (nav) nav.classList.remove('entrance-hidden');
    if (term) term.classList.remove('entrance-hidden');
  }
};

// ---------------------------------------------------------
// 2. SCROLL ANIMATIONS (Reveal on Scroll)
// ---------------------------------------------------------

// Throttle helper to limit scroll event frequency
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Reveal elements when they enter viewport
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  
  // Observe elements for scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        entry.target.querySelectorAll('.skill-fill').forEach(bar => {
          bar.style.width = bar.dataset.width;
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => observer.observe(el));
}

// ---------------------------------------------------------
// 3. NAVIGATION EFFECTS
// ---------------------------------------------------------

// Scroll-to-top button visibility
function initScrollToTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  
  window.addEventListener('scroll', throttle(() => {
    btn.style.opacity = window.scrollY > 300 ? '1' : '0';
    btn.style.pointerEvents = window.scrollY > 300 ? 'auto' : 'none';
  }, 100));
  
  btn.style.opacity = '0';
  btn.style.pointerEvents = 'none';
}

// Hide nav when scrolling down, show when scrolling up
function initNavbarEffects() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', throttle(() => {
    navbar.classList.toggle('shadow-lg', window.scrollY > 20);
  }, 100));
}

// Update active nav link based on current section
function initActiveNavLinks() {
  const sections = document.querySelectorAll('section');
  const links = document.querySelectorAll('.nav-link-item');
  if (!sections.length || !links.length) return;

  window.addEventListener('scroll', throttle(() => {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= (section.offsetTop - 200)) {
        current = section.getAttribute('id');
      }
    });
    
    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href').slice(1) === current);
    });
  }, 100));
}

// ---------------------------------------------------------
// 4. CONTACT FORM (Formspree Integration)
// ---------------------------------------------------------

// Submit contact form to Formspree with status feedback
function initContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      
      if (res.ok) {
        btn.textContent = 'Sent!';
        status.classList.remove('hidden');
        form.reset();
        setTimeout(() => { 
          status.classList.add('hidden'); 
          btn.textContent = original; 
        }, 3000);
      } else throw new Error('Failed');
    } catch {
      btn.textContent = 'Error';
      setTimeout(() => btn.textContent = original, 2000);
    }
    
    btn.disabled = false;
  });
}

// ---------------------------------------------------------
// 5. PROJECT FILTERING
// ---------------------------------------------------------

// Show/hide projects based on category filter buttons
function initProjectFiltering() {
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');
  if (!btns.length || !cards.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => {
        b.classList.remove('bg-accent', 'text-white', 'shadow-glow');
        b.classList.add('glass');
      });
      btn.classList.remove('glass');
      btn.classList.add('bg-accent', 'text-white', 'shadow-glow');

      const filter = btn.getAttribute('data-filter');
      cards.forEach(card => {
        card.classList.toggle('hidden-card', 
          filter !== 'all' && card.getAttribute('data-category') !== filter);
      });
    });
  });
}

// ---------------------------------------------------------
// 6. 3D TILT EFFECT (GSAP)
// ---------------------------------------------------------

// Mouse-following 3D tilt animation for project cards
function init3DTiltEffect() {
  if (!window.matchMedia('(hover: hover)').matches) return;
  
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -10;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10;
      
      gsap.to(card, { rotateX, rotateY, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out' });
    });
  });
}

// ---------------------------------------------------------
// 7. TERMINAL MODULE
// ---------------------------------------------------------
// Floating command-line interface with help/about/skills commands

function initTerminal() {
  const modal = document.getElementById('terminal-modal');
  const toggle = document.getElementById('terminal-toggle');
  const closeBtn = document.getElementById('close-terminal');
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');
  if (!modal || !toggle || !input || !output) return;
  let lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    modal.classList.remove('hidden');
    input.focus();
  }

  function close() {
    modal.classList.add('hidden');
    if (lastFocus) lastFocus.focus();
  }

  toggle.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => e.target === modal && close());
  document.addEventListener('keydown', (e) => e.key === 'Escape' && !modal.classList.contains('hidden') && close());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim().toLowerCase();
      add(`guest@portfolio:~ $ ${cmd}`);
      process(cmd);
      input.value = '';
    }
  });

  function add(text, color = 'text-slate-300') {
    const div = document.createElement('div');
    div.className = color;
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  // Available terminal commands
  const commands = {
    help: { color: 'text-yellow-300', title: 'Available commands:', lines: [
      '  help      - Show available commands',
      '  about     - Learn more about me',
      '  skills    - List my technical skills',
      '  projects  - View my featured projects',
      '  contact   - Show contact information',
      '  resume    - Download my resume',
      '  clear     - Clear terminal screen',
      '  exit      - Close terminal'
    ]},
    about: { color: 'text-blue-400', title: '[About Me]', lines: ['IT Student at STI College Naga. Learning web development and building projects to grow my skills.'] },
    skills: { color: 'text-purple-400', title: '[Technical Skills]', lines: [
      'Frontend: HTML5, CSS3, JavaScript (ES6+), Tailwind CSS',
      'Tools: Git, VS Code, Chrome DevTools',
      'Design: UI/UX Design, Accessibility (a11y), Responsive Design'
    ]},
    projects: { color: 'text-blue-400', title: '[Featured Projects]', lines: [
      '• Task Manager - To-do list with CRUD operations',
      '• Dev Life Visual Novel - Interactive text-based game',
      '• Form Validator - Client-side validation with real-time feedback',
      '• Portfolio Website - Responsive site with video background'
    ]},
    contact: { color: 'text-green-400', title: '[Contact Information]', lines: [
      'Email: fraginalkirrenmichael@gmail.com',
      'GitHub: github.com/MadCheshiren',
      'LinkedIn: linkedin.com/in/kirren-michael-fraginal-871368403',
      'Location: Naga City, Philippines'
    ]}
  };

  function process(cmd) {
    if (commands[cmd]) {
      const c = commands[cmd];
      add(c.title, c.color);
      c.lines.forEach(line => add(line));
      return;
    }
    
    if (cmd === 'resume') {
      add('Downloading resume...', 'text-yellow-300');
      const download = (url, isBlob = false) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Kirren_Michael_Fraginal_Resume.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (isBlob) URL.revokeObjectURL(url);
      };
      fetch('Kirren_Michael_Fraginal_Resume.pdf')
        .then(r => r.ok ? r.blob() : Promise.reject())
        .then(blob => {
          download(URL.createObjectURL(blob), true);
          add('Resume downloaded!', 'text-green-400');
        })
        .catch(() => {
          download('Kirren_Michael_Fraginal_Resume.pdf');
          add('Resume downloaded!', 'text-green-400');
        });
    } else if (cmd === 'clear') {
      output.innerHTML = '';
    } else if (cmd === 'exit') {
      close();
    } else if (cmd) {
      add(`Command not found: ${cmd}. Type 'help' for options.`, 'text-red-400');
    }
  }
}

// === Visual Novel Game ===
// Simple interactive story showcasing basic JavaScript concepts:
// - State management (story data, current scene)
// - DOM manipulation (updating elements dynamically)
// - Event handling (clicks, keyboard)
// - Async/await (loading external data)

function initVisualNovel() {
  // Get DOM elements
  const modal = document.getElementById('vn-modal');
  const openBtn = document.getElementById('open-vn');
  const closeBtn = document.getElementById('close-vn');
  if (!modal || !openBtn) return;

  // Track state
  let lastFocus = null;  // Store focus before opening modal (for accessibility)
  let story = null;      // Will hold story data

  // Hardcoded story data (fallback if fetch fails)
  // Each scene has: id, speaker, text, emoji, and array of choices
  const storyData = [
    { id: 1, speaker: 'Narrator', text: 'It is 7:00 AM. Your alarm goes off. You have a big deployment due today.', emoji: '⏰', choices: [{ text: '☕ Drink Coffee first', next: 2 }, { text: '💻 Jump straight into code', next: 3 }] },
    { id: 2, speaker: 'You', text: 'The coffee is hot. You feel energized and ready to tackle any bug.', emoji: '☕', choices: [{ text: 'Start coding...', next: 3 }] },
    { id: 3, speaker: 'System', text: 'ERROR: npm install failed. 404 Not Found.', emoji: '💀', choices: [{ text: 'Delete node_modules and retry', next: 4 }, { text: 'Panic and cry', next: 5 }] },
    { id: 4, speaker: 'You', text: 'That actually worked. The packages are installing successfully.', emoji: '📦', choices: [{ text: 'Push to production', next: 6 }, { text: 'Write tests first', next: 7 }] },
    { id: 5, speaker: 'Narrator', text: "You take a deep breath. Remember: It's just code.", emoji: '😢', choices: [{ text: 'Try deleting node_modules', next: 4 }] },
    { id: 6, speaker: 'Narrator', text: 'Yolo! You pushed it. The site is... actually working! You are a hero.', emoji: '🚀', choices: [{ text: 'Restart Story', next: 1 }] },
    { id: 7, speaker: 'Narrator', text: 'You found a critical bug in testing! You saved the company millions.', emoji: '🛡️', choices: [{ text: 'Restart Story', next: 1 }] }
  ];

  // Try loading story from external JSON, fallback to inline data
  async function loadStory() {
    if (story) return story;  // Already loaded
    try {
      const response = await fetch('story.json');
      if (response.ok) {
        story = await response.json();
        return story;
      }
    } catch {
      // Fetch failed (file:// protocol or missing file) - use inline data
    }
    story = storyData;
    return story;
  }

  // Open modal and start at scene 1
  async function open() {
    lastFocus = document.activeElement;
    modal.classList.remove('hidden');
    modal.focus();
    await loadStory();
    loadScene(1);
  }

  // Close modal and restore focus
  function close() {
    modal.classList.add('hidden');
    if (lastFocus) lastFocus.focus();
  }

  // Event listeners for opening/closing
  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => e.target === modal && close());  // Click backdrop to close
  document.addEventListener('keydown', (e) => e.key === 'Escape' && !modal.classList.contains('hidden') && close());

  // Get scene elements - BOLD VN
  const sceneEl = document.getElementById('vn-scene');
  const speakerEl = document.getElementById('vn-speaker');
  const speakerAvatar = document.getElementById('vn-speaker-avatar');
  const textEl = document.getElementById('vn-text');
  const choicesEl = document.getElementById('vn-choices');
  const emojiEl = document.getElementById('vn-emoji');
  const sceneNumEl = document.getElementById('vn-scene-num');
  const progressEl = document.getElementById('vn-progress');

  if (!sceneEl || !speakerEl || !textEl || !choicesEl || !emojiEl) return;

  // Speaker avatar mapping
  const speakerEmojis = {
    'Narrator': '🎭',
    'You': '😎',
    'System': '⚙️'
  };

  // Typewriter effect
  function typeText(element, text, speed = 30) {
    element.innerHTML = '<span class="typing-cursor"></span>';
    let i = 0;
    const span = document.createElement('span');
    element.insertBefore(span, element.firstChild);

    function type() {
      if (i < text.length) {
        span.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }
    type();
  }

  // Load and display a scene by ID
  function loadScene(id) {
    if (!story) return;
    const s = story.find(x => x.id === id);
    if (!s) return;

    // Update progress bar and scene counter
    const progress = ((s.id - 1) / (story.length - 1)) * 100;
    if (progressEl) progressEl.style.width = `${progress}%`;
    if (sceneNumEl) sceneNumEl.textContent = s.id;

    // Scene transition with pulse effect
    sceneEl.classList.add('transitioning');
    sceneEl.style.opacity = '0';

    setTimeout(() => {
      emojiEl.textContent = s.emoji || '👨‍💻';
      speakerEl.textContent = s.speaker || 'Narrator';

      // Update speaker avatar
      if (speakerAvatar) {
        speakerAvatar.textContent = speakerEmojis[s.speaker] || '🎭';
      }

      // Typewriter effect for text
      typeText(textEl, s.text);

      sceneEl.style.opacity = '1';
      sceneEl.classList.remove('transitioning');
    }, 200);

    // Create bold choice buttons
    choicesEl.innerHTML = '';
    s.choices?.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'vn-choice-btn';
      btn.innerHTML = `<span class="mr-2">▶</span> ${c.text}`;
      btn.onclick = () => loadScene(c.next);
      choicesEl.appendChild(btn);
    });
  }
}
// === End Visual Novel Game ===

// ---------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------
// Start all modules when page loads

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  EntranceAnimation.init();
  initScrollAnimations();
  initScrollToTop();
  initNavbarEffects();
  initActiveNavLinks();
  initContactForm();
  initProjectFiltering();
  init3DTiltEffect();
  initTerminal();
  initVisualNovel();
});
