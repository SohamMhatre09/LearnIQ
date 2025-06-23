import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const LoadingExperience = ({ onComplete }) => {
  const [stage, setStage] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [consoleLines, setConsoleLines] = useState([]);
  const consoleRef = useRef(null);

  // Terminal typing effect
  useEffect(() => {
    const messages = [
      { text: '> Initializing system...', delay: 300 },
      { text: '> Loading assets: [██████████] 100%', delay: 1200 },
      { text: '> Establishing connection...', delay: 800 },
      { text: '> Connection secured.', delay: 600 },
      { text: '> Preparing experience...', delay: 700 },
      { text: '> System ready.', delay: 500 },
      { text: '> Launching sequence initiated.', delay: 400 },
    ];

    let timeoutIds = [];
    let cumulativeDelay = 0;
    
    if (stage === 0) {
      messages.forEach((message, index) => {
        cumulativeDelay += message.delay;
        const timeoutId = setTimeout(() => {
          setConsoleLines(prev => [...prev, message.text]);
          if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
          }
          
          // Progress bar advances with each message
          setLoadingProgress((index + 1) / messages.length);
          
          // When all messages are displayed, complete the loading
          if (index === messages.length - 1) {
            setTimeout(() => {
              // Set stage to final stage and trigger completion
              setStage(3);
              setTimeout(() => onComplete(), 800);
            }, 800);
          }
        }, cumulativeDelay);
        
        timeoutIds.push(timeoutId);
      });
    }
    
    return () => timeoutIds.forEach(id => clearTimeout(id));
  }, [stage, onComplete]);

  return (
    <AnimatePresence>
      {stage < 3 && (
        <motion.div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { 
              duration: 1, 
              ease: [0.22, 1, 0.36, 1] 
            } 
          }}
        >
          {/* Decorative particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400/30 rounded-full"
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: Math.random() * 100 + "%", 
                  opacity: 0.1 + Math.random() * 0.3,
                  scale: 0.5 + Math.random() * 1.5
                }}
                animate={{ 
                  y: [null, "-20%"],
                  opacity: [null, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3 + Math.random() * 5,
                  ease: "linear",
                  delay: Math.random() * 5
                }}
              />
            ))}
          </div>
          
          {/* Terminal section */}
          <motion.div
            className="relative w-11/12 max-w-lg mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            {/* Terminal window with frosted glass effect */}
            <div className="bg-gray-900/90 backdrop-blur-md rounded-lg overflow-hidden border border-gray-700 shadow-2xl">
              {/* Terminal header */}
              <div className="flex items-center px-4 py-2 bg-gray-800/80 border-b border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-xs text-gray-400 mx-auto pr-6">system-terminal</div>
              </div>
              
              {/* Terminal content */}
              <div 
                ref={consoleRef}
                className="p-4 h-60 overflow-y-auto font-mono text-sm text-green-500 bg-[#0d1117]/90"
              >
                {consoleLines.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-1"
                  >
                    {line}
                  </motion.div>
                ))}
                <motion.div 
                  className="w-3 h-5 bg-green-500 inline-block ml-1"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </div>
            </div>
            
            {/* Progress bar */}
            <motion.div 
              className="h-1 bg-gradient-to-r from-green-500 to-green-300 mt-2 rounded-full overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
          
          {/* Bottom loading text */}
          <motion.div 
            className="absolute bottom-10 text-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <motion.p 
              className="text-gray-400 text-xs md:text-sm"
              animate={{ 
                opacity: [0.4, 0.8, 0.4] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2 
              }}
            >
              Preparing your experience...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};