import OptionWheelProjects from './OptionWheelProjects';
import { BookOpen } from 'lucide-react';

const projects = [
  {
    id: 1,
    title: 'PayDaily POS',
    description: 'A web-based POS and financial management system for small sari-sari stores. Focuses on transaction flow, product management, and SQLite-backed records.',
    tags: ['Node.js', 'Express', 'SQLite', 'JS', 'CSS'],
    category: 'fullstack',
    featured: true,
    link: 'https://github.com/MadCheshiren/PayDaily',
    image: '/_legacy/assets/images/Screenshot%20of%20project.png'
  },
  {
    id: 2,
    title: 'The Stray Cat',
    description: 'A short, wholesome visual novel game. One rainy morning, you find a tiny kitten outside your door. What happens next is up to you.',
    tags: ['JavaScript', 'JSON', 'DOM API'],
    category: 'game',
    featured: true,
    link: '/_legacy/index.html',
    image: null
  },
  {
    id: 3,
    title: 'Task Manager',
    description: 'A clean and simple to-do list application focusing on DOM manipulation and CRUD operations.',
    tags: ['HTML', 'Tailwind', 'JS'],
    category: 'frontend',
    featured: false,
    link: '/_legacy/todo.html',
    image: null
  },
  {
    id: 4,
    title: 'Form Validator',
    description: 'Real-time form validation with helpful error messages and visual feedback for better user experience.',
    tags: ['HTML', 'JS'],
    category: 'frontend',
    featured: false,
    link: '/_legacy/validator.html',
    image: null
  }
];

export default function Projects({ onOpenLibrary }) {
  return (
    <section id="projects" className="py-24 px-6 overflow-hidden bg-[#E3D6BF]/40 border-b border-[#AABAAE]/40">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2 className="text-5xl md:text-6xl font-editorial tracking-tight text-[#933B5B]">Selected Work</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#933B5B] hover:bg-[#933B5B]/90 text-[#E3D6BF] rounded-full text-xs font-mono tracking-wider uppercase transition-colors shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#E3D6BF]" />
              <span>Enter 3D Hardcover Library</span>
            </button>
            <span className="text-xs font-mono text-[#9F9679] uppercase tracking-widest hidden sm:inline-block">
              [ ARCHIVE // 2024–2026 ]
            </span>
          </div>
        </div>

        {/* 3D Option Wheel Project Navigator & Card Display */}
        <OptionWheelProjects projects={projects} />
      </div>
    </section>
  );
}
