import { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Skills from './components/Skills';
import Footer from './components/Footer';
import HomePlatformGame from './components/HomePlatformGame';

// Lazy-load the heavy 3D bookshelf library to keep the initial page bundle lightweight
const ProjectsLibraryView = lazy(() => import('./components/bookshelf/ProjectsLibraryView'));

function App() {
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#library' || window.location.hash === '#projects-library') {
        setShowLibrary(true);
      } else {
        setShowLibrary(false);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Idle preload of the 3D bookshelf chunk on unrestricted connections so navigation feels instant
  useEffect(() => {
    const conn = navigator.connection;
    if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') {
      return;
    }

    const preload = () => {
      import('./components/bookshelf/ProjectsLibraryView');
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preload);
      return () => window.cancelIdleCallback(idleId);
    } else {
      const timerId = setTimeout(preload, 4000);
      return () => clearTimeout(timerId);
    }
  }, []);

  if (showLibrary) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#2A1820] flex flex-col items-center justify-center text-[#E3D6BF] p-6">
            <div className="w-8 h-8 border-2 border-[#933B5B] border-t-[#E3D6BF] rounded-full animate-spin mb-4" />
            <span className="font-mono text-xs text-[#B5728A] uppercase tracking-widest">[ LOADING ARCHIVE // 3D LIBRARY ]</span>
          </div>
        }
      >
        <ProjectsLibraryView
          onBackToPortfolio={() => {
            window.location.hash = '#home';
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#E3D6BF] text-[#2b2520] relative selection:bg-[#B5728A] selection:text-white">
      <Navbar />
      <main className="relative z-10">
        {/* Home Section: Level Devil-inspired Interactive Platform Game */}
        <section 
          id="home" 
          className="min-h-[100dvh] sm:min-h-screen flex flex-col justify-center px-3 sm:px-6 md:px-12 pt-16 sm:pt-24 md:pt-28 pb-8 sm:pb-14 relative border-b border-[#AABAAE]/40"
        >
          <div className="max-w-5xl mx-auto w-full mb-3 sm:mb-6 text-left flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-editorial text-[#933B5B] tracking-tight leading-none">
                Level Portfolio
              </h1>
            </div>
            <p className="text-[11px] sm:text-sm font-mono text-[#9F9679] max-w-md sm:text-right leading-snug">
              A live constraint-driven sandbox. Every stage is dynamically solved from jump velocity, gravity, and momentum—no fixed presets.
            </p>
          </div>

          <HomePlatformGame />
        </section>

        <Skills />
      </main>
      <Footer />
    </div>
  );
}

export default App;
