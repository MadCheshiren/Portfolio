import { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowUpRight, Play, Pause, Mic } from 'lucide-react';
import { VOICEMAILS_UPDATED_EVENT, fetchVoicemails } from '../lib/voicemailStore';
import VoicemailPaperCard from './voicemail/VoicemailPaperCard';

export default function Footer() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [latestVoicemails, setLatestVoicemails] = useState([]);

  useEffect(() => {
    let active = true;
    const loadLatest = async () => {
      try {
        const res = await fetchVoicemails({ limit: 3 });
        if (active) {
          setLatestVoicemails(res.entries.slice(0, 3));
        }
      } catch {
        // Keep footer cleanly rendered if offline / unconfigured
      }
    };

    loadLatest();
    window.addEventListener(VOICEMAILS_UPDATED_EVENT, loadLatest);
    return () => {
      active = false;
      window.removeEventListener(VOICEMAILS_UPDATED_EVENT, loadLatest);
    };
  }, []);

  useEffect(() => {
    // 1. Detect prefers-reduced-motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e) => {
      setReducedMotion(e.matches);
      if (e.matches && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
    mediaQuery.addEventListener?.('change', handleMotionChange);

    const videoEl = videoRef.current;
    const containerEl = containerRef.current;
    if (!videoEl || !containerEl) {
      return () => {
        mediaQuery.removeEventListener?.('change', handleMotionChange);
      };
    }

    // If user prefers reduced motion or mobile data-saver is enabled, keep lightweight static poster
    const conn = navigator.connection;
    const isConstrained = Boolean(conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g');
    if (mediaQuery.matches || isConstrained) {
      return () => {
        mediaQuery.removeEventListener?.('change', handleMotionChange);
      };
    }

    // 2. Lifecycle management via IntersectionObserver (rootMargin: '150px 0px')
    // Play ONLY when near/in the viewport; pause immediately when scrolled away
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => setIsPlaying(true))
                .catch(() => {
                  // Autoplay policy or low power mode might block autoplay;
                  // silently keep poster visible without unhandled exception
                  setIsPlaying(false);
                });
            }
          } else {
            if (!videoEl.paused) {
              videoEl.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { rootMargin: '150px 0px', threshold: 0.01 }
    );

    observer.observe(containerEl);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener?.('change', handleMotionChange);
    };
  }, []);

  const togglePlayback = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLibrary = (e) => {
    e.preventDefault();
    window.location.hash = '#library';
  };

  const openVoicemail = (e) => {
    e.preventDefault();
    window.location.hash = '#voicemail';
  };

  return (
    <footer 
      ref={containerRef} 
      className="relative w-full bg-[#E3D6BF] text-[#2b2520] overflow-hidden"
    >
      {/* ========================================================
          1. EDITORIAL BRAND HEADER
          Presents archive identity, role statement, status, and Manila coords.
          Sits cleanly on the Chalk backdrop which blends seamlessly
          into the living video sky below.
          ======================================================== */}
      <div className="relative z-20 pt-16 md:pt-24 pb-6 md:pb-8 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 md:pb-10 border-b border-[#AABAAE]/50">
          <div>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-editorial tracking-tight text-[#933B5B] leading-[1.05]">
              Kirren Michael Fraginal
            </h2>
            <p className="mt-3 text-base md:text-lg text-[#9F9679] font-sans font-light max-w-xl leading-relaxed">
              Systems Thinker &amp; QA Architect, mapping how complex parts interact, 
              stress-testing edge cases, and turning strict constraints into intuitive experiences.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3">
            <div className="px-3 py-1 rounded-md border border-[#AABAAE]/75 bg-[#F5EFE0] text-[11px] font-mono text-[#933B5B] uppercase tracking-wider">
              Available for Opportunities
            </div>
            <div className="text-xs font-mono text-[#9F9679] text-left lg:text-right space-y-0.5">
              <div>MANILA, PHILIPPINES · GMT+8</div>
              <div className="text-[#AABAAE]">14.5995° N, 120.9842° E</div>
            </div>
          </div>
        </div>

        {/* ========================================================
            1B. CLICKABLE PAPER DISPATCH LOG (LATEST VOICEMAIL ENTRIES)
            Flat archival sheet displaying the latest public entries;
            clicking anywhere transports the visitor to #voicemail.
            ======================================================== */}
        <a
          href="#voicemail"
          onClick={openVoicemail}
          aria-label="Open Public Voicemail Box to see all entries or leave a voice note"
          className="group block mt-8 rounded-lg border border-[#933B5B]/35 hover:border-[#933B5B] bg-[#F5EFE0] p-5 sm:p-7 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#AABAAE]/65">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#9F9679]">
                <Mic size={12} className="text-[#933B5B]" />
                <span>Public Voicemail Box · Paper Log</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-editorial text-[#933B5B] tracking-tight leading-none">
                Latest Visitor Dispatches
              </h3>
            </div>

            <span className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#933B5B] group-hover:bg-[#B5728A] text-[#E3D6BF] font-mono text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold transition-colors shrink-0">
              <span>Leave a Voicemail or View All</span>
              <ArrowUpRight
                size={13}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </span>
          </div>

          {latestVoicemails.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#AABAAE]/55">
              {latestVoicemails.map((entry) => (
                <VoicemailPaperCard key={entry.id} entry={entry} compact />
              ))}
            </div>
          ) : (
            <p className="text-xs font-mono text-[#9F9679] py-2">
              No entries yet. Click this sheet to record a Whistle voicemail or leave a note.
            </p>
          )}
        </a>
      </div>

      {/* ========================================================
          2. LIVING COASTLINE ARTWORK & DIRECTORY CANVAS
          On Desktop (lg:):
            The 4 directory columns and colophon sit directly in the
            upper 35% white/cream sky negative space of the video canvas,
            while the mountains, golden sun, and ocean waves loop in the
            lower 65% unobstructed right below them.
          On Mobile (< lg:):
            The directory and colophon flow in standard flow with compact
            vertical rhythm, seamlessly transitioning into the video below
            without a detached void or text colliding with waves.
          Zero seam line:
            Upper edge of video dissolves into #ffffff via CSS mask +
            gradient overlay with zero gamma mismatch.
          ======================================================== */}
      <div className="relative w-full overflow-hidden">
        
        {/* Soft top gradient blend - guarantees zero hard seam line with Chalk background */}
        <div 
          className="absolute inset-x-0 top-0 h-28 md:h-44 bg-gradient-to-b from-[#E3D6BF] via-[#E3D6BF]/85 to-transparent z-10 pointer-events-none" 
          aria-hidden="true"
        />

        {/* Directory Links & Colophon Grid
            On lg+ screens: positioned absolute at the top of the canvas,
            nestled in the sky negative space above the mountains/sun.
            On smaller screens: relative in-flow for zero collision. */}
        <div className="relative lg:absolute lg:top-0 lg:inset-x-0 z-20 pt-4 lg:pt-8 pb-8 px-6 md:px-16 max-w-7xl mx-auto pointer-events-auto">
          {/* Navigation & Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pb-8 lg:pb-6">
            {/* Column 1: Main Directory */}
            <div className="space-y-3">
              <ul className="space-y-2 font-sans text-sm md:text-base">
                <li>
                  <a href="#home" className="text-[#933B5B] hover:text-[#B5728A] transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#skills" className="text-[#933B5B] hover:text-[#B5728A] transition-colors">
                    Technical Skills
                  </a>
                </li>
                <li>
                  <a href="#library" onClick={openLibrary} className="text-[#933B5B] hover:text-[#B5728A] transition-colors">
                    3D Library Archive
                  </a>
                </li>
                <li>
                  <a href="#voicemail" onClick={openVoicemail} className="text-[#933B5B] hover:text-[#B5728A] transition-colors">
                    Public Voicemail Box
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Interactive Features */}
            <div className="space-y-3">
              <ul className="space-y-2 font-sans text-sm md:text-base">
                <li>
                  <a 
                    href="#library" 
                    onClick={openLibrary}
                    className="group inline-flex items-center gap-1 text-[#933B5B] hover:text-[#B5728A] transition-colors"
                  >
                    <span>3D Bookshelf Archive</span>
                    <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </li>
                <li>
                  <a 
                    href="#voicemail" 
                    onClick={openVoicemail}
                    className="group inline-flex items-center gap-1 text-[#933B5B] hover:text-[#B5728A] transition-colors"
                  >
                    <span>Whistle Voicemail Wall</span>
                    <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/MadCheshiren/PayDaily" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-[#933B5B] hover:text-[#B5728A] transition-colors"
                  >
                    <span>PayDaily System</span>
                    <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Connect & Socials */}
            <div className="space-y-3">
              <ul className="space-y-2 font-sans text-sm md:text-base">
                <li>
                  <a 
                    href="https://github.com/MadCheshiren" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-[#933B5B] hover:text-[#B5728A] transition-colors"
                  >
                    <span>GitHub</span>
                    <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.linkedin.com/in/kirren-michael-fraginal-871368403" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-[#933B5B] hover:text-[#B5728A] transition-colors"
                  >
                    <span>LinkedIn</span>
                    <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:fraginalkirrenmichael@gmail.com" 
                    className="group inline-flex items-center gap-1 text-[#933B5B] hover:text-[#B5728A] transition-colors"
                  >
                    <span>Email Directly</span>
                    <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Colophon & Motion Control */}
            <div className="space-y-3">
              <div className="space-y-2 font-mono text-xs text-[#9F9679]">
                <div>
                  <span className="text-[#AABAAE] block uppercase">Typography</span>
                  <span className="text-[#933B5B]">Instrument Serif &amp; Plus Jakarta</span>
                </div>
                <div>
                  <span className="text-[#AABAAE] block uppercase">Framework</span>
                  <span className="text-[#933B5B]">React 19 + Tailwind v4</span>
                </div>
                
                {/* Playback controller for accessibility */}
                <div className="pt-1">
                  {reducedMotion ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#AABAAE]/50 bg-[#E3D6BF] text-[#9F9679] font-mono text-[11px] uppercase tracking-wider">
                      <span>Reduced Motion Active</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#AABAAE]/60 bg-[#E3D6BF]/90 hover:bg-[#E3D6BF] text-[#933B5B] font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                      title={isPlaying ? "Pause coastline seascape video" : "Play coastline seascape video"}
                    >
                      {isPlaying ? <Pause size={12} className="text-[#933B5B]" /> : <Play size={12} className="text-[#933B5B]" />}
                      <span>{isPlaying ? 'Pause Waves' : 'Play Waves'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Colophon Row */}
          <div className="pt-6 border-t border-[#AABAAE]/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono text-[#9F9679]">
            <div>
              &copy; {new Date().getFullYear()} Kirren Michael Fraginal. All rights reserved.
            </div>
            
            <div className="flex items-center gap-6">
              <span className="hidden sm:inline text-[#AABAAE]">
                Designed with editorial restraint
              </span>
              <button 
                type="button"
                onClick={scrollToTop}
                className="group inline-flex items-center gap-1.5 text-[#933B5B] hover:text-[#B5728A] font-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Back to top</span>
                <ArrowUp size={13} className="group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Canvas Container with CSS mask-image for pixel-perfect gamma-independent blend */}
        <div 
          className="relative w-full overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 100%)',
          }}
        >
          <video
            ref={videoRef}
            poster="/footer/coastline-poster.webp"
            muted
            loop
            playsInline
            preload="none"
            className="w-full h-auto aspect-[16/9] min-h-[260px] sm:min-h-[340px] md:min-h-[460px] lg:min-h-[580px] object-cover object-bottom block select-none pointer-events-none"
            aria-label="Looping coastline sunset artwork with ocean waves crashing on the shore"
          >
            <source src="/footer/coastline-loop.webm" type="video/webm" />
            <source src="/footer/coastline-loop.mp4" type="video/mp4" />
            {/* Lightweight WebP fallback image */}
            <img 
              src="/footer/coastline-poster.webp" 
              alt="Dreamy pastel coastline sunset artwork" 
              loading="lazy"
              decoding="async"
              className="w-full h-auto aspect-[16/9] object-cover object-bottom"
            />
          </video>
        </div>

      </div>
    </footer>
  );
}
