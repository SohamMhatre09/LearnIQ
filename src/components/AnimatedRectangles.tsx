import { useRef, useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

interface Rectangle {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  color: string;
}

export const AnimatedRectangles = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const controls = useAnimation();

  // Track mouse position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Add a new rectangle when moving
    if (Math.random() > 0.92) {
      addRectangle(e.clientX - rect.left, e.clientY - rect.top);
    }
  };
  
  // Add rectangles on click
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Create multiple rectangles in a burst
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        addRectangle(
          e.clientX - rect.left + (Math.random() - 0.5) * 40, 
          e.clientY - rect.top + (Math.random() - 0.5) * 40
        );
      }, i * 50);
    }
  };
  
  const addRectangle = (x: number, y: number) => {
    const newRectangle: Rectangle = {
      id: Date.now() + Math.random(),
      x,
      y,
      size: Math.random() * 30 + 10,
      rotation: Math.random() * 360,
      opacity: Math.random() * 0.5 + 0.3,
      color: Math.random() > 0.5 ? '#FFCC00' : '#FFFFFF'
    };
    
    setRectangles(prev => {
      const updated = [...prev, newRectangle];
      // Keep max 50 rectangles for performance
      if (updated.length > 50) {
        return updated.slice(-50);
      }
      return updated;
    });
    
    // Remove the rectangle after animation
    setTimeout(() => {
      setRectangles(prev => prev.filter(r => r.id !== newRectangle.id));
    }, 5000);
  };
  
  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{ pointerEvents: 'auto' }}
    >
      {rectangles.map((rect) => (
        <motion.div
          key={rect.id}
          className="absolute"
          initial={{ 
            x: rect.x, 
            y: rect.y, 
            rotate: rect.rotation,
            opacity: rect.opacity,
            scale: 0
          }}
          animate={{ 
            x: rect.x + (Math.random() - 0.5) * 200, 
            y: rect.y + (Math.random() * 200) + 50,
            rotate: rect.rotation + Math.random() * 180,
            opacity: 0,
            scale: 1
          }}
          transition={{ 
            duration: 3 + Math.random() * 2,
            ease: "easeOut"
          }}
          style={{ 
            width: rect.size, 
            height: rect.size, 
            border: `1px solid ${rect.color}`,
            backgroundColor: `${rect.color}10`
          }}
        />
      ))}
    </div>
  );
};