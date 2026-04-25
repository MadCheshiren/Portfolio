/*
 * Portfolio Website - Main JavaScript File
 * Handles all interactive features and functionality
 */

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Throttle function to limit how often a function can fire
 * Used for scroll events to improve performance
 */
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

// ==========================================
// THEME MANAGEMENT
// ==========================================

function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme');
  
  // Check saved preference or system preference
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }
  
  themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
  });
}

// ==========================================
// SCROLL & NAVIGATION
// ==========================================

function initScrollAnimations() {
  // Reveal animations for sections
  const observerOptions = { 
    threshold: 0.1, 
    rootMargin: '0px 0px -50px 0px' 
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Animate skill bars when visible
        entry.target.querySelectorAll('.skill-fill').forEach(bar => {
          bar.style.width = bar.dataset.width;
        });
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initScrollToTop() {
  const scrollTopBtn = document.getElementById('scroll-top');
  
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  // Show/hide button based on scroll position
  window.addEventListener('scroll', throttle(() => {
    if (window.scrollY > 300) {
      scrollTopBtn.style.opacity = '1';
      scrollTopBtn.style.pointerEvents = 'auto';
    } else {
      scrollTopBtn.style.opacity = '0';
      scrollTopBtn.style.pointerEvents = 'none';
    }
  }, 100));
  
  // Initial state
  scrollTopBtn.style.opacity = '0';
  scrollTopBtn.style.pointerEvents = 'none';
}

function initNavbarEffects() {
  const navbar = document.getElementById('navbar');
  
  window.addEventListener('scroll', throttle(() => {
    if (window.scrollY > 20) {
      navbar.classList.add('shadow-lg');
    } else {
      navbar.classList.remove('shadow-lg');
    }
  }, 100));
}

function initActiveNavLinks() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link-item');

  window.addEventListener('scroll', throttle(() => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= (sectionTop - 200)) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').slice(1) === current) {
        link.classList.add('active');
      }
    });
  }, 100));
}

// ==========================================
// CONTACT FORM
// ==========================================

function initContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        btn.textContent = 'Sent!';
        status.classList.remove('hidden');
        form.reset();
        setTimeout(() => { 
          status.classList.add('hidden'); 
          btn.textContent = originalText; 
        }, 3000);
      } else {
        throw new Error('Failed');
      }
    } catch {
      btn.textContent = 'Error';
      setTimeout(() => { btn.textContent = originalText; }, 2000);
    }
    
    btn.disabled = false;
  });
}

// ==========================================
// PROJECT FILTERING
// ==========================================

function initProjectFiltering() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update button styles
      filterBtns.forEach(b => {
        b.classList.remove('bg-accent', 'text-white', 'shadow-glow');
        b.classList.add('glass');
      });
      btn.classList.remove('glass');
      btn.classList.add('bg-accent', 'text-white', 'shadow-glow');

      // Filter cards
      const filterValue = btn.getAttribute('data-filter');
      projectCards.forEach(card => {
        if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
          card.classList.remove('hidden-card');
        } else {
          card.classList.add('hidden-card');
        }
      });
    });
  });
}

// ==========================================
// 3D CARD EFFECTS (Desktop Only)
// ==========================================

function init3DTiltEffect() {
  // Only enable on devices with hover (desktop)
  if (!window.matchMedia('(hover: hover)').matches) return;
  
  document.querySelectorAll('.tilt-card').forEach(card => {
    // Use GSAP for smoother animations with force3D for GPU acceleration
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;
      
      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 1000,
        force3D: true
      });
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power2.out',
        transformPerspective: 1000,
        force3D: true
      });
    });
  });
}

// ==========================================
// CUSTOM CURSOR (Desktop Only)
// ==========================================

function initCustomCursor() {
  // DISABLED: Custom cursor removed due to Spline 3D GPU performance conflict
  // The Spline WebGL renderer competes with cursor animations causing lag
  // Using native cursor for better performance
  return;
}

// ==========================================
// INTERACTIVE TERMINAL
// ==========================================

function initTerminal() {
  const terminalModal = document.getElementById('terminal-modal');
  const terminalToggle = document.getElementById('terminal-toggle');
  const closeTerminal = document.getElementById('close-terminal');
  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');
  let terminalLastFocus = null;

  function openTerminal() {
    terminalLastFocus = document.activeElement;
    terminalModal.classList.remove('hidden');
    terminalInput.focus();
  }

  function closeTerminalFn() {
    terminalModal.classList.add('hidden');
    if (terminalLastFocus) terminalLastFocus.focus();
  }

  terminalToggle.addEventListener('click', openTerminal);
  closeTerminal.addEventListener('click', closeTerminalFn);
  
  terminalModal.addEventListener('click', (e) => {
    if (e.target === terminalModal) closeTerminalFn();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !terminalModal.classList.contains('hidden')) {
      closeTerminalFn();
    }
  });

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = terminalInput.value.trim().toLowerCase();
      addOutput(`guest@portfolio:~ $ ${command}`);
      processCommand(command);
      terminalInput.value = '';
    }
  });

  function addOutput(text, color = 'text-slate-300') {
    const div = document.createElement('div');
    div.className = color;
    div.textContent = text;
    terminalOutput.appendChild(div);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function processCommand(cmd) {
    switch (cmd) {
      case 'help':
        addOutput('Available commands:', 'text-yellow-300');
        addOutput('  help      - Show available commands');
        addOutput('  about     - Learn more about me');
        addOutput('  skills    - List my technical skills');
        addOutput('  contact   - Show contact information');
        addOutput('  resume    - Download my resume');
        addOutput('  clear     - Clear terminal screen');
        addOutput('  exit      - Close terminal');
        break;
      case 'about':
        addOutput('[About Me]', 'text-blue-400');
        addOutput('IT Student at STI College Naga. Learning web development and building projects to grow my skills.');
        break;
      case 'skills':
        addOutput('[Skills]', 'text-purple-400');
        addOutput('HTML & CSS, JavaScript (ES6+), Tailwind CSS, UI/UX Design, Accessibility (a11y), Creative Writing');
        break;
      case 'contact':
        addOutput('[Contact]', 'text-green-400');
        addOutput('Email: fraginalkirrenmichael@gmail.com');
        addOutput('GitHub: github.com/MadCheshiren');
        addOutput('LinkedIn: linkedin.com/in/kirren-michael-fraginal-871368403');
        break;
      case 'resume':
        addOutput('Preparing resume download...', 'text-yellow-300');
        setTimeout(() => addOutput('Resume downloaded!', 'text-green-400'), 1000);
        break;
      case 'clear':
        terminalOutput.innerHTML = '';
        break;
      case 'exit':
        closeTerminalFn();
        break;
      default:
        if (cmd !== '') addOutput(`Command not found: ${cmd}. Type 'help' for options.`, 'text-red-400');
    }
  }
}

// ==========================================
// VISUAL NOVEL GAME
// ==========================================

function initVisualNovel() {
  const vnModal = document.getElementById('vn-modal');
  const openVnBtn = document.getElementById('open-vn');
  const closeVnBtn = document.getElementById('close-vn');
  let lastFocusedElement = null;

  function openVN() {
    lastFocusedElement = document.activeElement;
    vnModal.classList.remove('hidden');
    vnModal.focus();
    startVisualNovelGame();
  }

  function closeVN() {
    vnModal.classList.add('hidden');
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  if (openVnBtn && vnModal) {
    openVnBtn.addEventListener('click', openVN);
  }

  if (closeVnBtn && vnModal) {
    closeVnBtn.addEventListener('click', closeVN);
  }

  if (vnModal) {
    vnModal.addEventListener('click', (e) => {
      if (e.target === vnModal) closeVN();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !vnModal.classList.contains('hidden')) {
        closeVN();
      }
    });
  }
}

async function startVisualNovelGame() {
  // Story data embedded directly
  const storyData = [
    { 
      id: 1, 
      speaker: "Narrator", 
      text: "It is 7:00 AM. Your alarm goes off. You have a big deployment due today.", 
      emoji: "⏰", 
      choices: [
        { text: "☕ Drink Coffee first", next: 2 }, 
        { text: "💻 Jump straight into code", next: 3 }
      ] 
    },
    { 
      id: 2, 
      speaker: "You", 
      text: "The coffee is hot. You feel energized and ready to tackle any bug.", 
      emoji: "☕", 
      choices: [
        { text: "Start coding...", next: 3 }
      ] 
    },
    { 
      id: 3, 
      speaker: "System", 
      text: "ERROR: npm install failed. 404 Not Found.", 
      emoji: "💀", 
      choices: [
        { text: "Delete node_modules and retry", next: 4 }, 
        { text: "Panic and cry", next: 5 }
      ] 
    },
    { 
      id: 4, 
      speaker: "You", 
      text: "That actually worked. The packages are installing successfully.", 
      emoji: "📦", 
      choices: [
        { text: "Push to production", next: 6 }, 
        { text: "Write tests first", next: 7 }
      ] 
    },
    { 
      id: 5, 
      speaker: "Narrator", 
      text: "You take a deep breath. Remember: It's just code.", 
      emoji: "😢", 
      choices: [
        { text: "Try deleting node_modules", next: 4 }
      ] 
    },
    { 
      id: 6, 
      speaker: "Narrator", 
      text: "Yolo! You pushed it. The site is... actually working! You are a hero.", 
      emoji: "🚀", 
      choices: [
        { text: "Restart Story", next: 1 }
      ] 
    },
    { 
      id: 7, 
      speaker: "Narrator", 
      text: "You found a critical bug in testing! You saved the company millions.", 
      emoji: "🛡️", 
      choices: [
        { text: "Restart Story", next: 1 }
      ] 
    }
  ];

  const sceneEl = document.getElementById('vn-scene');
  const speakerEl = document.getElementById('vn-speaker');
  const textEl = document.getElementById('vn-text');
  const choicesEl = document.getElementById('vn-choices');
  const emojiEl = document.getElementById('vn-emoji');

  if (!sceneEl || !speakerEl || !textEl || !choicesEl || !emojiEl) return;

  function loadScene(id) {
    const scene = storyData.find(s => s.id === id);
    if (!scene) return;

    // Fade effect
    sceneEl.style.opacity = '0';
    setTimeout(() => {
      emojiEl.innerText = scene.emoji || '👨‍💻';
      speakerEl.innerText = scene.speaker || 'Narrator';
      textEl.innerText = scene.text;
      sceneEl.style.opacity = '1';
    }, 200);

    // Render choices
    choicesEl.innerHTML = '';
    if (scene.choices) {
      scene.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'vn-choice-btn';
        btn.innerText = choice.text;
        btn.onclick = () => loadScene(choice.next);
        choicesEl.appendChild(btn);
      });
    }
  }

  loadScene(1);
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Initialize all features
  initThemeToggle();
  initScrollAnimations();
  initScrollToTop();
  initNavbarEffects();
  initActiveNavLinks();
  initContactForm();
  initProjectFiltering();
  init3DTiltEffect();
  initCustomCursor();
  initTerminal();
  initVisualNovel();
});
