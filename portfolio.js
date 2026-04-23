document.addEventListener('DOMContentLoaded', () => {
  // Year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Throttle function for scroll events
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

  // Core Web Vitals Monitoring
  function sendToAnalytics({ metric, value }) {
    console.log(`[Performance] ${metric}: ${value.toFixed(2)}ms`);
  }

  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          sendToAnalytics({ metric: 'LCP', value: entry.startTime });
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.log('LCP observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        sendToAnalytics({ metric: 'CLS', value: clsValue });
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.log('CLS observer not supported');
    }

    // Interaction to Next Paint (INP)
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const inp = entry.processingEnd - entry.processingStart;
          sendToAnalytics({ metric: 'INP', value: inp });
        }
      }).observe({ type: 'event', buffered: true });
    } catch (e) {
      console.log('INP observer not supported');
    }
  }

  // Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }
  themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
  });

  // Scroll Reveal & Skill Bars
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
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
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Scroll to Top
  const scrollTopBtn = document.getElementById('scroll-top');
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', throttle(() => {
    if (window.scrollY > 300) {
      scrollTopBtn.style.opacity = '1';
      scrollTopBtn.style.pointerEvents = 'auto';
    } else {
      scrollTopBtn.style.opacity = '0';
      scrollTopBtn.style.pointerEvents = 'none';
    }
  }, 100));
  scrollTopBtn.style.opacity = '0';
  scrollTopBtn.style.pointerEvents = 'none';

  // Navbar background on scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', throttle(() => {
    if (window.scrollY > 20) {
      navbar.classList.add('shadow-lg');
    } else {
      navbar.classList.remove('shadow-lg');
    }
  }, 100));

  // Active Nav Link Highlight
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

  // Contact Form Handler
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
        setTimeout(() => { status.classList.add('hidden'); btn.textContent = originalText; }, 3000);
      } else {
        throw new Error('Failed');
      }
    } catch {
      btn.textContent = 'Error';
      setTimeout(() => { btn.textContent = originalText; }, 2000);
    }
    btn.disabled = false;
  });


  // Project Filtering
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-accent', 'text-white', 'shadow-glow');
        b.classList.add('glass');
      });
      btn.classList.remove('glass');
      btn.classList.add('bg-accent', 'text-white', 'shadow-glow');

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

  // 1. 3D Tilt Effect on Project Cards (desktop only)
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  // 2. Custom Magnetic Cursor (desktop only)
  if (window.matchMedia('(hover: hover)').matches) {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const hoverTargets = document.querySelectorAll('a, button, input, textarea, .tilt-card');

    window.addEventListener('mousemove', (e) => {
      cursorDot.style.left = `${e.clientX}px`;
      cursorDot.style.top = `${e.clientY}px`;
      cursorOutline.style.left = `${e.clientX}px`;
      cursorOutline.style.top = `${e.clientY}px`;
    });

    hoverTargets.forEach(target => {
      target.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
      target.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });
  }

  // 3. Interactive Terminal
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
        addOutput('HTML & CSS, JavaScript (ES6+), Tailwind CSS, UI/UX Design, Accessibility (a11y)');
        break;
      case 'contact':
        addOutput('[Contact]', 'text-green-400');
        addOutput('Email: fraginalkirrenmichael@gmail.com');
        addOutput('GitHub: github.com/MadCheshiren');
        addOutput('LinkedIn: linkedin.com/in/kirren-michael-fraginal-871368403');
        break;
      case 'resume':
        addOutput('Preparing resume download...', 'text-yellow-300');
        setTimeout(() => addOutput('Resume downloaded! (Simulation)', 'text-green-400'), 1000);
        break;
      case 'clear':
        terminalOutput.innerHTML = '';
        break;
      case 'exit':
        terminalModal.classList.add('hidden');
        break;
      default:
        if (cmd !== '') addOutput(`Command not found: ${cmd}. Type 'help' for options.`, 'text-red-400');
    }
  }

  // 4. Visual Novel Engine
  const vnModal = document.getElementById('vn-modal');
  const openVnBtn = document.getElementById('open-vn');
  const closeVnBtn = document.getElementById('close-vn');
  let lastFocusedElement = null;

  function openVN() {
    lastFocusedElement = document.activeElement;
    vnModal.classList.remove('hidden');
    vnModal.focus();
    initVisualNovel();
  }

  function closeVN() {
    vnModal.classList.add('hidden');
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  if (openVnBtn && vnModal) {
    openVnBtn.addEventListener('click', openVN);
  }
  
  if (window.matchMedia('(hover: hover)').matches) {
  vnModal.focus();
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
});

async function initVisualNovel() {
  // Embed story data directly to avoid fetch() issues with file:// protocol
  const storyData = [
    { "id": 1, "speaker": "Narrator", "text": "It is 7:00 AM. Your alarm goes off. You have a big deployment due today.", "emoji": "⏰", "choices": [{ "text": "☕ Drink Coffee first", "next": 2 }, { "text": "💻 Jump straight into code", "next": 3 }] },
    { "id": 2, "speaker": "You", "text": "The coffee is hot. You feel energized and ready to tackle any bug.", "emoji": "☕", "choices": [{ "text": "Start coding...", "next": 3 }] },
    { "id": 3, "speaker": "System", "text": "ERROR: npm install failed. 404 Not Found.", "emoji": "💀", "choices": [{ "text": "Delete node_modules and retry", "next": 4 }, { "text": "Panic and cry", "next": 5 }] },
    { "id": 4, "speaker": "You", "text": "That actually worked. The packages are installing successfully.", "emoji": "📦", "choices": [{ "text": "Push to production", "next": 6 }, { "text": "Write tests first", "next": 7 }] },
    { "id": 5, "speaker": "Narrator", "text": "You take a deep breath. Remember: It's just code.", "emoji": "😢", "choices": [{ "text": "Try deleting node_modules", "next": 4 }] },
    { "id": 6, "speaker": "Narrator", "text": "Yolo! You pushed it. The site is... actually working! You are a hero.", "emoji": "🚀", "choices": [{ "text": "Restart Story", "next": 1 }] },
    { "id": 7, "speaker": "Narrator", "text": "You found a critical bug in testing! You saved the company millions.", "emoji": "🛡️", "choices": [{ "text": "Restart Story", "next": 1 }] }
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
