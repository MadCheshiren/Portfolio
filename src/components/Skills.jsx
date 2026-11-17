import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ShieldCheck, ArrowRight, Wrench, FolderGit2 } from 'lucide-react';

const SYSTEM_DOMAINS = [
  {
    id: 'constraint-modeling',
    index: '01',
    name: 'Constraint & Rule Modeling',
    category: 'ARCHITECTURE',
    tag: 'SYSTEM DYNAMICS',
    role: 'Defining how variables, limits, and rules interact so complex systems stay balanced and predictable.',
    projectRef: 'Procedural Kinematic Sandbox (#home)',
    ticks: 10,
    schematicType: 'parabola',
    systemFlow: {
      input: 'Player Jump Impulse, Gravity & Runway Width',
      rule: 'Parabolic Reach Envelope Solver (No Fixed Presets)',
      outcome: '100% Reachable, Non-Repeating Stage Topologies',
    },
    edgeCasesCaught: [
      'Replaced static map templates with a dynamic kinematic formula tied to jump physics',
      'Synchronized moving-platform velocity deltas (dx/dy) so momentum transfers cleanly',
      'Capped worst-case opposing platform oscillations so leaps never become impossible',
    ],
    instruments: ['System Math', 'State Machines', 'JavaScript', 'HTML5 Canvas'],
  },
  {
    id: 'qa-verification',
    index: '02',
    name: 'QA & Edge-Case Verification',
    category: 'VERIFICATION',
    tag: 'QUALITY ASSURANCE',
    role: 'Stress-testing assumptions, boundary conditions, and user flows to catch silent failures early.',
    projectRef: 'Validator Engine & Portfolio Audit Pipeline',
    ticks: 10,
    schematicType: 'pipeline',
    systemFlow: {
      input: 'Untrusted User Input & Boundary States',
      rule: 'Multi-Stage Schema & Constraint Validation Gates',
      outcome: 'Zero Silent Corruptions or Unhandled Crashes',
    },
    edgeCasesCaught: [
      'Caught and eliminated a 1,000ms level-loading bottleneck down to <16ms instant swaps',
      'Added ledge-forgiveness tolerances and coyote-time buffers to prevent unfair pixel-edge falls',
      'Enforced strict pre-commit schema checks to reject malformed data payloads automatically',
    ],
    instruments: ['QA Test Planning', 'Boundary Analysis', 'Python', 'Java'],
  },
  {
    id: 'state-flow',
    index: '03',
    name: 'State & Flow Architecture',
    category: 'ARCHITECTURE',
    tag: 'INTERACTION FLOW',
    role: 'Mapping multi-branching user journeys, state machines, and resource lifecycles without dead ends.',
    projectRef: 'StrayCat Narrative Engine & 3D Vault Lifecycle',
    ticks: 9,
    schematicType: 'tree',
    systemFlow: {
      input: 'User Decisions & Viewport Visibility Events',
      rule: 'Deterministic State Graph & Observer Guards',
      outcome: 'Seamless Transitions with Zero Off-Screen GPU Waste',
    },
    edgeCasesCaught: [
      'Paused heavy WebGL and 24FPS video loops automatically when scrolled out of view',
      'Preloaded the 3D Library archive during browser idle time for instant view switching',
      'Structured branching narrative states so choices never soft-lock progression',
    ],
    instruments: ['State Diagrams', 'Flow Modeling', 'React', 'TypeScript'],
  },
  {
    id: 'data-integrity',
    index: '04',
    name: 'Data & Ledger Integrity',
    category: 'DATA & LOGIC',
    tag: 'PERSISTENCE',
    role: 'Structuring clean relational models, transaction rules, and single-source-of-truth ledgers.',
    projectRef: 'PayDaily Financial Tracker System',
    ticks: 9,
    schematicType: 'schema',
    systemFlow: {
      input: 'Daily Financial Entries & Category Rules',
      rule: 'Normalized Relational Schema & ACID Aggregation',
      outcome: 'Audit-Ready Balances & Real-Time Spend Rollups',
    },
    edgeCasesCaught: [
      'Prevented duplicate transaction writes and floating-point rounding drift in daily totals',
      'Isolated category rollups so historical ledger records remain immutable when rules change',
      'Designed clear data contracts between local state and persistent storage layers',
    ],
    instruments: ['Relational Modeling', 'SQL', 'Node.js', 'Data Schemas'],
  },
  {
    id: 'workflow-automation',
    index: '05',
    name: 'Workflow & Process Automation',
    category: 'VERIFICATION',
    tag: 'OPERATIONS',
    role: 'Turning fragile, repetitive manual operations into repeatable, self-verifying pipelines.',
    projectRef: 'SysAdmin Diagnostic & Asset Pipelines',
    ticks: 9,
    schematicType: 'pipeline',
    systemFlow: {
      input: 'Raw System Logs, Media Assets & Environment Configs',
      rule: 'Automated Health Checks & Batch Transformation',
      outcome: 'Predictable Builds & Hands-Free Diagnostics',
    },
    edgeCasesCaught: [
      'Automated environment health checks to surface missing dependencies before runtime',
      'Transcoded heavy media into dual WebM/MP4 streams with static poster fallbacks',
      'Isolated experimental work into clean Git worktrees to keep production branches stable',
    ],
    instruments: ['System Diagnostics', 'Python', 'Git Worktrees', 'CLI Automation'],
  },
  {
    id: 'spatial-interfaces',
    index: '06',
    name: 'Spatial & Tactile Interfaces',
    category: 'ARCHITECTURE',
    tag: 'EXPERIENCE DESIGN',
    role: 'Translating abstract archives and technical specs into calm, intuitive 2D and 3D spaces.',
    projectRef: '3D Bookshelf Archive & Editorial Design System',
    ticks: 10,
    schematicType: 'frustum',
    systemFlow: {
      input: 'Project Archives, Credentials & Editorial Palette',
      rule: 'Spatial Hierarchy & High-Contrast Visual Restraint',
      outcome: 'An Interactive Archive You Explore Instead of Skim',
    },
    edgeCasesCaught: [
      'Consolidated scattered project and certificate sections into one unified 3D bookshelf vault',
      'Derived the entire site color system directly from the footer coastline illustration',
      'Balanced interactive 3D/canvas depth with quiet, readable editorial typography',
    ],
    instruments: ['Information Architecture', 'Figma', 'Three.js / WebGL', 'Tailwind CSS'],
  },
];

const CATEGORIES = ['ALL SYSTEMS', 'ARCHITECTURE', 'VERIFICATION', 'DATA & LOGIC'];

function BlueprintSchematic({ type }) {
  return (
    <svg
      viewBox="0 0 280 92"
      className="w-full h-22 stroke-[#E3D6BF] fill-none"
      aria-hidden="true"
    >
      {/* Subtle Blueprint Grid Lines */}
      <g className="stroke-[#B5728A]/20" strokeWidth="0.75">
        <line x1="0" y1="23" x2="280" y2="23" />
        <line x1="0" y1="46" x2="280" y2="46" />
        <line x1="0" y1="69" x2="280" y2="69" />
        <line x1="70" y1="0" x2="70" y2="92" />
        <line x1="140" y1="0" x2="140" y2="92" />
        <line x1="210" y1="0" x2="210" y2="92" />
      </g>

      {type === 'parabola' && (
        <g>
          <rect x="18" y="66" width="52" height="10" className="fill-[#B5728A]/40 stroke-[#E3D6BF]" strokeWidth="1.2" />
          <rect x="195" y="44" width="64" height="10" className="fill-[#AABAAE]/40 stroke-[#E3D6BF]" strokeWidth="1.2" />
          <path
            d="M 54 64 Q 126 -10 214 42"
            className="stroke-[#E3D6BF]"
            strokeWidth="1.8"
            strokeDasharray="4 3"
          />
          <circle cx="132" cy="18" r="4" className="fill-[#B5728A] stroke-[#E3D6BF]" strokeWidth="1.2" />
          <text x="142" y="21" className="fill-[#E3D6BF] font-mono text-[8px] stroke-none">
            REACH ENVELOPE
          </text>
        </g>
      )}

      {type === 'frustum' && (
        <g>
          <circle cx="34" cy="46" r="4.5" className="fill-[#B5728A] stroke-[#E3D6BF]" strokeWidth="1.2" />
          <line x1="34" y1="46" x2="230" y2="14" className="stroke-[#AABAAE]" strokeWidth="1.1" strokeDasharray="3 3" />
          <line x1="34" y1="46" x2="230" y2="78" className="stroke-[#AABAAE]" strokeWidth="1.1" strokeDasharray="3 3" />
          <polygon points="150,22 230,14 230,78 150,68" className="fill-[#B5728A]/20 stroke-[#E3D6BF]" strokeWidth="1.3" />
          <rect x="168" y="30" width="12" height="32" className="fill-[#E3D6BF]/20 stroke-[#E3D6BF]" strokeWidth="1" />
          <rect x="184" y="26" width="14" height="36" className="fill-[#B5728A]/40 stroke-[#E3D6BF]" strokeWidth="1" />
          <rect x="202" y="32" width="12" height="30" className="fill-[#AABAAE]/30 stroke-[#E3D6BF]" strokeWidth="1" />
        </g>
      )}

      {type === 'tree' && (
        <g>
          <rect x="20" y="34" width="54" height="24" rx="3" className="fill-[#B5728A]/30 stroke-[#E3D6BF]" strokeWidth="1.2" />
          <text x="47" y="49" textAnchor="middle" className="fill-[#E3D6BF] font-mono text-[8px] stroke-none">TRIGGER</text>
          <path d="M 74 46 L 112 22 M 74 46 L 112 70" className="stroke-[#AABAAE]" strokeWidth="1.3" />
          <rect x="112" y="11" width="68" height="22" rx="3" className="fill-[#AABAAE]/25 stroke-[#E3D6BF]" strokeWidth="1.2" />
          <text x="146" y="25" textAnchor="middle" className="fill-[#E3D6BF] font-mono text-[7.5px] stroke-none">ACTIVE LOOP</text>
          <rect x="112" y="59" width="68" height="22" rx="3" className="fill-[#B5728A]/25 stroke-[#E3D6BF]" strokeWidth="1.2" />
          <text x="146" y="73" textAnchor="middle" className="fill-[#E3D6BF] font-mono text-[7.5px] stroke-none">IDLE GUARD</text>
          <path d="M 180 22 L 212 46 M 180 70 L 212 46" className="stroke-[#AABAAE]" strokeWidth="1.2" strokeDasharray="3 2" />
          <circle cx="228" cy="46" r="15" className="fill-[#E3D6BF]/15 stroke-[#E3D6BF]" strokeWidth="1.2" />
          <text x="228" y="49" textAnchor="middle" className="fill-[#E3D6BF] font-mono text-[7.5px] stroke-none">STABLE</text>
        </g>
      )}

      {(type === 'schema' || type === 'pipeline') && (
        <g>
          <rect x="18" y="24" width="62" height="44" rx="3" className="fill-[#B5728A]/20 stroke-[#E3D6BF]" strokeWidth="1.2" />
          <text x="49" y="49" textAnchor="middle" className="fill-[#E3D6BF] font-mono text-[7.5px] stroke-none">INPUT</text>
          <path d="M 80 46 L 112 46" className="stroke-[#AABAAE]" strokeWidth="1.5" />
          <polygon points="112,46 106,42 106,50" className="fill-[#E3D6BF] stroke-none" />
          <rect x="114" y="20" width="68" height="52" rx="3" className="fill-[#AABAAE]/25 stroke-[#E3D6BF]" strokeWidth="1.2" />
          <text x="148" y="44" textAnchor="middle" className="fill-[#E3D6BF] font-mono text-[7.5px] stroke-none">CONSTRAINT</text>
          <text x="148" y="55" textAnchor="middle" className="fill-[#E3D6BF] font-mono text-[7.5px] stroke-none">GATE</text>
          <path d="M 182 46 L 212 46" className="stroke-[#AABAAE]" strokeWidth="1.5" />
          <polygon points="212,46 206,42 206,50" className="fill-[#E3D6BF] stroke-none" />
          <rect x="214" y="28" width="50" height="36" rx="18" className="fill-[#E3D6BF]/20 stroke-[#E3D6BF]" strokeWidth="1.2" />
          <text x="239" y="49" textAnchor="middle" className="fill-[#E3D6BF] font-mono text-[7.5px] stroke-none">VERIFIED</text>
        </g>
      )}
    </svg>
  );
}

export default function Skills() {
  const [activeCategory, setActiveCategory] = useState('ALL SYSTEMS');
  const [selectedId, setSelectedId] = useState(SYSTEM_DOMAINS[0].id);
  const inspectorRef = useRef(null);

  const filteredItems =
    activeCategory === 'ALL SYSTEMS'
      ? SYSTEM_DOMAINS
      : SYSTEM_DOMAINS.filter((item) => item.category === activeCategory);

  const activeSpec =
    SYSTEM_DOMAINS.find((item) => item.id === selectedId) ||
    filteredItems[0] ||
    SYSTEM_DOMAINS[0];

  return (
    <section
      id="skills"
      className="relative py-14 sm:py-20 md:py-24 px-4 sm:px-6 bg-[#E3D6BF] border-t border-b border-[#933B5B]/25 overflow-hidden"
    >
      {/* Subtle Architectural Drafting Background Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(170, 186, 174, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(170, 186, 174, 0.45) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Editorial Headline + Interactive Domain Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-editorial tracking-tight text-[#933B5B] leading-[0.95] mb-4">
              Systems Thinking <span className="italic font-normal text-[#B5728A]">&amp;</span> Architecture
            </h2>
            <p className="text-base sm:text-lg text-[#9F9679] max-w-xl font-sans leading-relaxed">
              Code is just the instrument. Select any domain below to inspect how I model rules,
              trace cause-and-effect, and catch edge cases before they break.
            </p>
          </div>

          {/* Domain Filter Bar */}
          <div
            className="flex flex-wrap items-center border border-[#933B5B]/35 rounded-md bg-[#F5EFE0] overflow-hidden"
            role="tablist"
            aria-label="Filter systems domains"
          >
            {CATEGORIES.map((category, idx) => {
              const isActive = activeCategory === category;
              const count =
                category === 'ALL SYSTEMS'
                  ? SYSTEM_DOMAINS.length
                  : SYSTEM_DOMAINS.filter((s) => s.category === category).length;

              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveCategory(category);
                    const nextList =
                      category === 'ALL SYSTEMS'
                        ? SYSTEM_DOMAINS
                        : SYSTEM_DOMAINS.filter((s) => s.category === category);
                    if (nextList.length > 0 && !nextList.some((s) => s.id === selectedId)) {
                      setSelectedId(nextList[0].id);
                    }
                  }}
                  className={`px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                    idx > 0 ? 'border-l border-[#933B5B]/20' : ''
                  } ${
                    isActive
                      ? 'bg-[#933B5B] text-[#E3D6BF] font-semibold'
                      : 'text-[#933B5B] hover:bg-[#E3D6BF]/60'
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`text-[10px] ${
                      isActive ? 'text-[#E3D6BF]/80' : 'text-[#9F9679]'
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main 12-Column Exposed Hairline Blueprint Split Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#933B5B] rounded-lg overflow-hidden bg-[#E3D6BF]">
          {/* LEFT 7 COLUMNS: Interactive Systems Ledger Rows */}
          <div className="lg:col-span-7 divide-y divide-[#933B5B]/20 border-b lg:border-b-0 lg:border-r border-[#933B5B]">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const isSelected = activeSpec.id === item.id;
                return (
                  <motion.button
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    type="button"
                    onMouseEnter={() => setSelectedId(item.id)}
                    onFocus={() => setSelectedId(item.id)}
                    onClick={() => {
                      setSelectedId(item.id);
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }}
                    className={`w-full text-left grid grid-cols-12 items-center px-4 sm:px-5 py-4 sm:py-5 transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-[#933B5B] text-[#E3D6BF]'
                        : 'bg-[#E3D6BF] hover:bg-[#AABAAE]/20 text-[#933B5B]'
                    }`}
                  >
                    {/* Index Column */}
                    <div className="col-span-2 flex flex-col">
                      <span
                        className={`text-2xl sm:text-3xl font-editorial leading-none ${
                          isSelected ? 'text-[#E3D6BF]' : 'text-[#933B5B]'
                        }`}
                      >
                        {item.index}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${
                          isSelected ? 'text-[#AABAAE]' : 'text-[#9F9679]'
                        }`}
                      >
                        {item.category.split(' ')[0]}
                      </span>
                    </div>

                    {/* Title & Systems Role */}
                    <div className="col-span-7 pr-3">
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span
                          className={`text-base sm:text-lg font-bold font-sans tracking-tight ${
                            isSelected ? 'text-[#E3D6BF]' : 'text-[#933B5B]'
                          }`}
                        >
                          {item.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider ${
                            isSelected ? 'text-[#E3D6BF]/75' : 'text-[#9F9679]'
                          }`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-1.5 line-clamp-2 font-sans leading-relaxed ${
                          isSelected ? 'text-[#E3D6BF]/85' : 'text-[#9F9679]'
                        }`}
                      >
                        {item.role}
                      </p>
                    </div>

                    {/* Precision Tick Meter */}
                    <div className="col-span-3 flex flex-col items-end justify-center">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 10 }).map((_, idx) => {
                          const filled = idx < item.ticks;
                          return (
                            <span
                              key={idx}
                              className={`h-3.5 w-1 transition-all ${
                                filled
                                  ? isSelected
                                    ? 'bg-[#E3D6BF]'
                                    : 'bg-[#933B5B]'
                                  : isSelected
                                    ? 'bg-[#E3D6BF]/25'
                                    : 'bg-[#AABAAE]/50'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase tracking-widest ${
                          isSelected ? 'text-[#AABAAE]' : 'text-[#9F9679]'
                        }`}
                      >
                        {item.instruments[0]}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* RIGHT 5 COLUMNS: Flat Systems Inspector (separated by 1px hairline rules) */}
          <div ref={inspectorRef} className="lg:col-span-5 bg-[#933B5B] text-[#E3D6BF] p-5 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSpec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col h-full justify-between gap-6"
              >
                <div className="space-y-5">
                  {/* Top Header */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#B5728A]/40">
                    <span className="text-sm font-editorial text-[#E3D6BF] tracking-wide">
                      DOMAIN {activeSpec.index}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3D6BF]/80">
                      {activeSpec.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-3xl sm:text-4xl font-editorial text-[#E3D6BF] tracking-tight mb-2">
                      {activeSpec.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#E3D6BF]/85 font-sans leading-relaxed">
                      {activeSpec.role}
                    </p>
                  </div>

                  {/* Schematic & Input -> Rule -> Outcome Flow (flat, hairline divided) */}
                  <div className="pt-4 border-t border-[#B5728A]/35 space-y-3">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[#AABAAE]">
                      <Layers size={11} />
                      <span>System Model</span>
                    </div>
                    <BlueprintSchematic type={activeSpec.schematicType} />

                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#B5728A]/30 pt-3 border-t border-[#B5728A]/30 text-[11px] font-sans">
                      <div className="py-2 sm:py-0 sm:pr-3">
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-[#AABAAE] mb-0.5">
                          1. Input
                        </span>
                        <span className="text-[#E3D6BF] font-medium leading-snug block">
                          {activeSpec.systemFlow.input}
                        </span>
                      </div>
                      <div className="py-2 sm:py-0 sm:px-3">
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-[#B5728A] mb-0.5">
                          2. Rule / Logic
                        </span>
                        <span className="text-[#E3D6BF] font-medium leading-snug block">
                          {activeSpec.systemFlow.rule}
                        </span>
                      </div>
                      <div className="py-2 sm:py-0 sm:pl-3">
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-[#AABAAE] mb-0.5">
                          3. Outcome
                        </span>
                        <span className="text-[#E3D6BF] font-medium leading-snug block">
                          {activeSpec.systemFlow.outcome}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Failure Modes & Edge Cases Solved */}
                  <div className="pt-4 border-t border-[#B5728A]/35">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#AABAAE] mb-2.5">
                      <ShieldCheck size={13} className="text-[#B5728A]" />
                      <span>Edge Cases Solved</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#E3D6BF]/90 font-sans leading-relaxed">
                      {activeSpec.edgeCasesCaught.map((edgeCase) => (
                        <li key={edgeCase} className="flex items-start gap-2">
                          <ArrowRight size={12} className="text-[#B5728A] shrink-0 mt-1" />
                          <span>{edgeCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Instruments & Applied Project Footnote */}
                <div className="pt-4 border-t border-[#B5728A]/40 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#AABAAE] flex items-center gap-1.5">
                    <Wrench size={12} className="text-[#B5728A]" />
                    <span>Instruments</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono text-[#E3D6BF]/90">
                    {activeSpec.instruments.map((tool, i) => (
                      <span key={tool}>
                        {tool}
                        {i < activeSpec.instruments.length - 1 ? ' ·' : ''}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-3 border-t border-[#B5728A]/30 text-[#E3D6BF]">
                    <span className="flex items-center gap-1.5 text-[#AABAAE]">
                      <FolderGit2 size={13} />
                      <span>APPLIED IN</span>
                    </span>
                    <span className="truncate ml-2 font-semibold">{activeSpec.projectRef}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
