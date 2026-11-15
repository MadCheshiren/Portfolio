import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ExternalLink } from 'lucide-react';
import LineSidebar from './LineSidebar';

const certificates = [
  {
    id: 1,
    title: 'Java Fundamentals',
    issuer: 'Oracle',
    category: 'Oracle Certified Professional',
    description: 'Core Java programming concepts, OOP principles, and application development fundamentals certified by Oracle Academy.',
    link: '/certs/oracle-java-fundamentals.webp',
    image: '/certs/oracle-java-fundamentals.webp'
  },
  {
    id: 2,
    title: 'Certificate of Completion',
    issuer: 'TESDA',
    category: 'Competency Assessment',
    description: 'Technical Education and Skills Development Authority - Industry-relevant technical training, cybersecurity fundamentals, and competency certification.',
    link: '/certs/tesda-completion.webp',
    image: '/certs/tesda-completion.webp'
  }
];

export default function Certificates() {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeCert = certificates[activeIdx] || certificates[0];

  // Preload all certificate images on mount to eliminate loading jump
  useEffect(() => {
    certificates.forEach(cert => {
      const img = new Image();
      img.src = cert.image;
    });
  }, []);

  return (
    <section id="certificates" className="py-24 px-6 bg-[#E3D6BF]/40 overflow-hidden border-b border-[#AABAAE]/40">
      <div className="max-w-6xl mx-auto">
        
        {/* Editorial Section Header */}
        <div className="mb-16 flex items-baseline justify-between">
          <div>
            <h2 className="text-5xl md:text-6xl font-editorial tracking-tight text-[#933B5B] mb-3">Credentials</h2>
            <p className="text-lg font-light text-[#9F9679] max-w-2xl font-sans">Official certificates and completed training programs.</p>
          </div>
          <span className="text-xs font-mono text-[#9F9679] uppercase tracking-widest hidden sm:inline-block">[ CERTIFICATIONS ]</span>
        </div>

        {/* Timeline Layout Grid with LineSidebar */}
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Interactive React Bits Line Sidebar Timeline */}
          <div className="lg:col-span-4 bg-[#E3D6BF] p-6 md:p-8 rounded-3xl border border-[#AABAAE]/50 shadow-xs">
            <span className="text-xs font-mono text-[#9F9679] mb-6 block uppercase tracking-widest">[ TIMELINE INDEX ]</span>
            <LineSidebar
              items={certificates.map(c => `${c.issuer} — ${c.title}`)}
              accentColor="#933B5B"
              textColor="#9F9679"
              activeTextColor="#933B5B"
              markerColor="#AABAAE"
              showIndex={true}
              showMarker={true}
              proximityRadius={120}
              maxShift={20}
              markerLength={32}
              itemGap={24}
              defaultActive={0}
              onItemClick={(index) => setActiveIdx(index)}
            />
          </div>

          {/* Right Column: Full Untruncated Document Viewer with Fixed Minimum Height */}
          <div className="lg:col-span-8 w-full min-h-[580px] sm:min-h-[640px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-6"
              >
                {/* Meta details header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#AABAAE]/40">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-[#9F9679] mb-2">
                      <Award size={14} className="text-[#933B5B]" /> {activeCert.issuer} // {activeCert.category}
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-editorial text-[#933B5B]">{activeCert.title}</h3>
                  </div>

                  <a 
                    href={activeCert.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#933B5B] text-[#E3D6BF] font-sans text-xs font-bold rounded-xl hover:bg-[#933B5B]/90 transition-colors shrink-0"
                  >
                    Open Full HD <ExternalLink size={14} />
                  </a>
                </div>

                <p className="text-base text-[#9F9679] font-sans font-light leading-relaxed">
                  {activeCert.description}
                </p>

                {/* FULL UNTRUNCATED CERTIFICATE DOCUMENT DISPLAY WITH RESERVED MIN-HEIGHT */}
                <div className="w-full min-h-[400px] sm:min-h-[480px] bg-[#E3D6BF] rounded-2xl overflow-hidden p-2 sm:p-4 flex items-center justify-center border border-[#AABAAE]/40">
                  <img 
                    src={activeCert.image} 
                    alt={activeCert.title} 
                    className="w-full h-auto max-h-[600px] object-contain rounded-xl shadow-xs"
                  />
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
