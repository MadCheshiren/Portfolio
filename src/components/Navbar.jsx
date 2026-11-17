import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'library', label: '3D Library', isHashRoute: true },
  { id: 'voicemail', label: 'VM Box', isHashRoute: true },
  { id: 'skills', label: 'Systems' },
];

export default function Navbar() {
  const [active, setActive] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems
        .filter(item => !item.isHashRoute)
        .map(item => document.getElementById(item.id));
      const activeScrollPos = window.scrollY + 220;

      for (const section of sections) {
        if (section && section.offsetTop <= activeScrollPos && (section.offsetTop + section.offsetHeight) > activeScrollPos) {
          setActive(section.id);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 w-full z-50 py-3 sm:py-5 pointer-events-none"
    >
      <div className="w-full px-3 sm:px-6 md:px-16 flex justify-between items-center gap-2 pointer-events-auto">
        {/* Logo */}
        <a 
          href="#home" 
          className="text-base sm:text-xl font-bold tracking-tighter text-[#933B5B] hover:text-[#B5728A] transition-colors px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-md bg-[#E3D6BF]/95 border border-[#AABAAE]/70 shrink-0"
        >
          kirren.
        </a>
        
        {/* Flat Editorial Nav */}
        <div className="flex items-center gap-0.5 sm:gap-1 p-1 rounded-md bg-[#E3D6BF]/95 border border-[#AABAAE]/70">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <a 
                key={item.id} 
                href={`#${item.id}`}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-sm text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-colors duration-200 relative whitespace-nowrap ${
                  isActive 
                    ? 'text-[#E3D6BF] font-semibold' 
                    : 'text-[#933B5B] hover:text-[#933B5B]/75'
                }`}
                onClick={() => setActive(item.id)}
              >
                {isActive && (
                  <motion.div 
                    layoutId="navbar-active"
                    className="absolute inset-0 rounded-sm z-0 bg-[#933B5B]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
