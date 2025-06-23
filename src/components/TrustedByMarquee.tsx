import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const brands = [
  'EDU Academy', 'LearnCode Institute', 'TechPrep School', 
  'Dev University', 'CodeMaster Academy', 'JSU Learning', 
  'WebDev School', 'Programming Core', 'Algorithm Institute', 
  'Data Structures College'
];

export const TrustedByMarquee = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Duplicate the array for seamless looping
  const displayBrands = [...brands, ...brands];
  
  return (
    <div className="relative w-full overflow-hidden py-10 bg-black text-white">
      {/* Gradient fadeout edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-black to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-black to-transparent" />
      
      <div className="mb-6 text-center">
        <span className="text-yellow-400 uppercase text-sm font-medium tracking-widest">Trusted By 10+ Schools</span>
      </div>
      
      <div ref={containerRef} className="w-full overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap"
          animate={{
            x: [0, -50 * brands.length], // Move by the width of half the items
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 35,
              ease: "linear",
            }
          }}
        >
          {displayBrands.map((brand, index) => (
            <div 
              key={index} 
              className="flex-shrink-0 px-8 py-2 flex items-center justify-center text-xl font-medium opacity-80"
            >
              {brand}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};