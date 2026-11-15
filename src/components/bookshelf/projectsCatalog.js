export const projectsCatalog = [
  {
    id: 'paydaily-pos',
    vol: 'VOL. I',
    title: 'PayDaily POS',
    subtitle: 'Point of Sale & Inventory Management System',
    author: 'K. Fraginal',
    year: '2025',
    category: 'FULLSTACK SYSTEM',
    taxonomy: '[ SPEC-01 // COMMERCE & POS ]',
    thickness: 0.45,
    coverColor: '#1c2838', // Deep Navy Leather
    foilColor: '#d4af37',  // Gold Foil
    accentColor: '#3b82f6',
    description: 'A resilient web-based POS and financial record system engineered for small retail merchants and sari-sari stores, featuring transaction queuing, item tracking, and local SQLite data persistence.',
    problemStatement: 'Micro-retail merchants operate under tight margins with spotty internet connectivity. Existing POS solutions are either overly complex cloud-only systems or manual paper logbooks vulnerable to bookkeeping errors.',
    architecture: [
      'Node.js & Express REST Backend',
      'SQLite relational database with WAL (Write-Ahead Logging)',
      'Vanilla JS dynamic DOM engine with zero heavy framework overhead',
      'Tailwind CSS modular design system'
    ],
    features: [
      'Instant barcode scanning and checkout cart calculation',
      'Offline transaction queuing with auto-sync resilience',
      'Daily revenue analytics & inventory reorder thresholds',
      'Exportable financial logbooks (CSV/JSON)'
    ],
    tags: ['Node.js', 'Express', 'SQLite', 'JavaScript', 'Tailwind CSS'],
    repoUrl: 'https://github.com/MadCheshiren/PayDaily',
    demoUrl: 'https://github.com/MadCheshiren/PayDaily',
  },
  {
    id: 'stray-cat-vn',
    vol: 'VOL. II',
    title: 'The Stray Cat',
    subtitle: 'Choice-Driven Visual Novel Game Engine',
    author: 'K. Fraginal',
    year: '2024',
    category: 'INTERACTIVE FICTION',
    taxonomy: '[ SPEC-02 // GAME ENGINE ]',
    thickness: 0.38,
    coverColor: '#2b262d', // Dark Charcoal Linen
    foilColor: '#e2e8f0',  // Silver Foil
    accentColor: '#ec4899',
    description: 'A wholesome, atmosphere-rich interactive story and lightweight visual novel engine. Built from scratch using native Web APIs, custom audio crossfading, and branch state management.',
    problemStatement: 'Heavy game engines (RenPy, Unity) introduce large bundle sizes and slow initial loading for web browsers. This engine delivers instantaneous 60fps story playback with zero external runtime dependencies.',
    architecture: [
      'Pure DOM API state machine with zero framework dependencies',
      'JSON-driven script parser with conditional decision trees',
      'HTML5 Web Audio API engine for ambient music crossfading',
      'Local Storage save-state & log system'
    ],
    features: [
      'Non-linear dialogue branching with persistent choices',
      'Dynamic character sprite crossfading & text typewriter effect',
      'Custom save / load state management with quick-save slots',
      'Full touch and keyboard responsive navigation'
    ],
    tags: ['JavaScript', 'HTML5 Audio API', 'JSON Scripting', 'DOM API', 'CSS Animations'],
    repoUrl: 'https://github.com/MadCheshiren/Portfolio',
    demoUrl: '/_legacy/index.html',
  },
  {
    id: 'sysadmin-qa-suite',
    vol: 'VOL. III',
    title: 'SysAdmin & QA Suite',
    subtitle: 'Automated Infrastructure & Testing Pipeline',
    author: 'K. Fraginal',
    year: '2025',
    category: 'QA & INFRASTRUCTURE',
    taxonomy: '[ SPEC-03 // QA & SYSADMIN ]',
    thickness: 0.42,
    coverColor: '#1d3326', // Forest Green Leather
    foilColor: '#fef08a',  // Warm Gold Foil
    accentColor: '#22c55e',
    description: 'A comprehensive quality assurance and system health monitoring suite designed for verifying application integrity, API endpoint reliability, and automated end-to-end regression testing.',
    problemStatement: 'Manual testing across rapid deployment cycles causes undetected edge-case bugs and system downtime. Automated synthetic testing ensures continuous verification prior to production release.',
    architecture: [
      'Modular automated test runners for REST & UI flows',
      'System health heartbeat monitors & log analysis tools',
      'Structured test planning pipeline with risk coverage mapping',
      'Cross-browser integration verification suite'
    ],
    features: [
      'Automated synthetic user journey & API health probes',
      'Detailed assertion logging with automatic error tracebacks',
      'System resource & service uptime telemetry dashboards',
      'Reproducible test environment configurations'
    ],
    tags: ['Quality Assurance', 'System Administration', 'Automated Testing', 'Node.js', 'Bash'],
    repoUrl: 'https://github.com/MadCheshiren/Portfolio',
    demoUrl: 'https://github.com/MadCheshiren/Portfolio',
  },
  {
    id: 'form-validator-dom',
    vol: 'VOL. IV',
    title: 'Form & DOM Engine',
    subtitle: 'Real-Time Validation & UX Components',
    author: 'K. Fraginal',
    year: '2024',
    category: 'FRONTEND ENGINE',
    taxonomy: '[ SPEC-04 // FRONTEND INTERACTION ]',
    thickness: 0.35,
    coverColor: '#4a251b', // Terracotta Rust Leather
    foilColor: '#fed7aa',  // Copper Foil
    accentColor: '#f97316',
    description: 'A high-performance real-time input validation and user feedback system engineered to provide instant accessibility compliance, masked inputs, and visual error states.',
    problemStatement: 'Standard HTML form validations provide poor visual feedback and inconsistent cross-browser error messaging, leading to high form drop-off rates.',
    architecture: [
      'Asynchronous validation pipeline with regex & custom rules',
      'Accessible ARIA live-region status announcements',
      'Micro-animation visual feedback engine',
      'Zero-dependency standalone component module'
    ],
    features: [
      'Real-time debounced field validation with zero layout shift',
      'Custom regex rule engines for emails, passwords & phone numbers',
      'Accessible focus trapping & ARIA error state announcements',
      'Lightweight 3KB minified footprint'
    ],
    tags: ['JavaScript', 'HTML5', 'Tailwind CSS', 'Accessibility', 'DOM API'],
    repoUrl: 'https://github.com/MadCheshiren/Portfolio',
    demoUrl: '/_legacy/validator.html',
  }
];
