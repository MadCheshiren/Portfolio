/* Portfolio JavaScript - Main Functionality */

// Utility: Throttle function calls
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

// Theme Toggle (Dark/Light Mode)
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const saved = localStorage.getItem('theme');
  
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }
  
  toggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
  });
}

// Scroll Reveal Animations
function initScrollAnimations() {
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
  }, { threshold: 0.05, rootMargin: '50px 0px 0px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Scroll to Top Button
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

// Navbar Scroll Effects
function initNavbarEffects() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', throttle(() => {
    navbar.classList.toggle('shadow-lg', window.scrollY > 20);
  }, 100));
}

// Active Nav Link Highlighting
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

// Contact Form Handling
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

// Project Category Filtering
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

// 3D Card Tilt Effect (Desktop Only)
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

// Interactive Terminal Modal
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

  // Terminal command data
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

// Visual Novel Game Modal - Lazy Load Story Data
function initVisualNovel() {
  const modal = document.getElementById('vn-modal');
  const openBtn = document.getElementById('open-vn');
  const closeBtn = document.getElementById('close-vn');
  if (!modal || !openBtn) return;
  
  let lastFocus = null;
  let story = null;

  // Inline story data as fallback for local file:// access
  const storyData = [
    { id: 1, speaker: 'Narrator', text: 'It is 7:00 AM. Your alarm goes off. You have a big deployment due today.', emoji: '⏰', choices: [{ text: '☕ Drink Coffee first', next: 2 }, { text: '💻 Jump straight into code', next: 3 }] },
    { id: 2, speaker: 'You', text: 'The coffee is hot. You feel energized and ready to tackle any bug.', emoji: '☕', choices: [{ text: 'Start coding...', next: 3 }] },
    { id: 3, speaker: 'System', text: 'ERROR: npm install failed. 404 Not Found.', emoji: '💀', choices: [{ text: 'Delete node_modules and retry', next: 4 }, { text: 'Panic and cry', next: 5 }] },
    { id: 4, speaker: 'You', text: 'That actually worked. The packages are installing successfully.', emoji: '📦', choices: [{ text: 'Push to production', next: 6 }, { text: 'Write tests first', next: 7 }] },
    { id: 5, speaker: 'Narrator', text: "You take a deep breath. Remember: It's just code.", emoji: '😢', choices: [{ text: 'Try deleting node_modules', next: 4 }] },
    { id: 6, speaker: 'Narrator', text: 'Yolo! You pushed it. The site is... actually working! You are a hero.', emoji: '🚀', choices: [{ text: 'Restart Story', next: 1 }] },
    { id: 7, speaker: 'Narrator', text: 'You found a critical bug in testing! You saved the company millions.', emoji: '🛡️', choices: [{ text: 'Restart Story', next: 1 }] }
  ];

  async function loadStory() {
    if (story) return story;
    // Try fetch first (works on HTTP servers), fallback to inline data (works locally)
    try {
      const response = await fetch('story.json');
      if (response.ok) {
        story = await response.json();
        return story;
      }
    } catch {
      // Fetch failed (likely file:// protocol), use inline data
    }
    story = storyData;
    return story;
  }

  async function open() {
    lastFocus = document.activeElement;
    modal.classList.remove('hidden');
    modal.focus();
    await loadStory();
    loadScene(1);
  }

  function close() {
    modal.classList.add('hidden');
    if (lastFocus) lastFocus.focus();
  }

  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => e.target === modal && close());
  document.addEventListener('keydown', (e) => e.key === 'Escape' && !modal.classList.contains('hidden') && close());

  const sceneEl = document.getElementById('vn-scene');
  const speakerEl = document.getElementById('vn-speaker');
  const textEl = document.getElementById('vn-text');
  const choicesEl = document.getElementById('vn-choices');
  const emojiEl = document.getElementById('vn-emoji');

  if (!sceneEl || !speakerEl || !textEl || !choicesEl || !emojiEl) return;

  function loadScene(id) {
    if (!story) return;
    const s = story.find(x => x.id === id);
    if (!s) return;

    sceneEl.style.opacity = '0';
    setTimeout(() => {
      emojiEl.textContent = s.emoji || '👨‍💻';
      speakerEl.textContent = s.speaker || 'Narrator';
      textEl.textContent = s.text;
      sceneEl.style.opacity = '1';
    }, 200);

    choicesEl.innerHTML = '';
    s.choices?.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'vn-choice-btn';
      btn.textContent = c.text;
      btn.onclick = () => loadScene(c.next);
      choicesEl.appendChild(btn);
    });
  }
}

// Initialize Everything on Page Load
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  initThemeToggle();
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
