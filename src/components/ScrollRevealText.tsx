import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ScrollRevealTextProps {
  lines: string[];
  className?: string;
}

export const ScrollRevealText = ({ lines, className = "" }: ScrollRevealTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [totalRevealedChars, setTotalRevealedChars] = useState(0);
  
  // Calculate total characters across all lines
  const totalChars = lines.reduce((sum, line) => sum + line.length, 0);
  
  // Calculate how many characters to reveal per line
  const charsPerLine: number[] = lines.map(line => line.length);
  
  // Track which characters are revealed in each line
  const [revealedPerLine, setRevealedPerLine] = useState<number[]>(Array(lines.length).fill(0));
  
  // Handle wheel event for controlled scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isLocked) return;
      
      e.preventDefault();
      
      // Update total revealed characters based on scroll direction
      if (e.deltaY > 0) { // Scrolling down
        setTotalRevealedChars(prev => Math.min(prev + 1, totalChars));
      } else { // Scrolling up
        setTotalRevealedChars(prev => Math.max(prev - 1, 0));
      }
    };
    
    // Track if element is in viewport
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsLocked(true);
        window.addEventListener('wheel', handleWheel, { passive: false });
      } else {
        setIsLocked(false);
        window.removeEventListener('wheel', handleWheel);
      }
    }, { threshold: 0.7 });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (containerRef.current) observer.disconnect();
    };
  }, [isLocked, totalChars]);
  
  // Update revealed characters per line when total changes
  useEffect(() => {
    let remaining = totalRevealedChars;
    const newRevealedPerLine = [...revealedPerLine];
    
    for (let i = 0; i < lines.length; i++) {
      if (remaining <= 0) {
        newRevealedPerLine[i] = 0;
      } else if (remaining >= charsPerLine[i]) {
        newRevealedPerLine[i] = charsPerLine[i];
        remaining -= charsPerLine[i];
      } else {
        newRevealedPerLine[i] = remaining;
        remaining = 0;
      }
    }
    
    setRevealedPerLine(newRevealedPerLine);
    
    // When all characters are revealed, unlock scrolling
    if (totalRevealedChars === totalChars) {
      setTimeout(() => {
        setIsLocked(false);
      }, 500); // Small delay to appreciate the completed text
    }
  }, [totalRevealedChars, charsPerLine, lines.length, totalChars]);
  
  return (
    <div 
      ref={containerRef}
      className={`py-20 ${className} relative min-h-[60vh] flex items-start pt-20`}
    >
      <div className="space-y-8 w-full">
        {lines.map((line, lineIndex) => {
          const chars = line.split('');
          const currentLineRevealed = revealedPerLine[lineIndex];
          
          return (
            <div 
              key={lineIndex}
              className="overflow-hidden"
            >
              <p className="text-3xl md:text-5xl font-bold">
                {chars.map((char, charIndex) => (
                  <span
                    key={charIndex}
                    className={`inline-block transition-colors duration-300 ${
                      charIndex < currentLineRevealed 
                        ? "text-yellow-400" 
                        : "text-gray-400"
                    }`}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};