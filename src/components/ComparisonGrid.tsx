import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface ComparisonItem {
  feature: string;
  traditional: boolean;
  learniq: boolean;
  youtube: boolean;
}

const comparisonData: ComparisonItem[] = [
  {
    feature: "Interactive coding exercises",
    traditional: false,
    learniq: true, 
    youtube: false,
  },
  {
    feature: "Real-time feedback",
    traditional: false,
    learniq: true, 
    youtube: false,
  },
  {
    feature: "Personalized learning path",
    traditional: false,
    learniq: true, 
    youtube: false,
  },
  {
    feature: "Project-based learning",
    traditional: true,
    learniq: true, 
    youtube: false,
  },
  {
    feature: "Certificate of completion",
    traditional: true,
    learniq: true, 
    youtube: false,
  },
  {
    feature: "24/7 Support",
    traditional: false,
    learniq: true, 
    youtube: false,
  },
];

function ComparisonGrid() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  
  const columnVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5,
        delay: i * 0.1
      }
    })
  };
  
  const rowVariants = {
    initial: { opacity: 0, x: -10 },
    animate: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { 
        duration: 0.3,
        delay: i * 0.05
      }
    }),
    hover: {
      backgroundColor: "rgba(255, 204, 0, 0.05)"
    }
  };
  
  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[700px] mx-auto max-w-4xl">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 md:gap-6 mb-6 pb-4 border-b border-border">
            <motion.div 
              className="col-span-1 flex items-center"
              variants={columnVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={0}
            >
              <span className="font-bold text-lg text-foreground">Features</span>
            </motion.div>
            {[
              { name: "Traditional Bootcamp", highlight: false },
              { name: "LearnIQ", highlight: true },
              { name: "YouTube Tutorials", highlight: false },
            ].map((column, i) => (
              <motion.div 
                key={i}
                className={`col-span-1 flex items-center justify-center text-center relative ${
                  column.highlight 
                    ? 'text-yellow-400 font-bold' 
                    : 'text-muted-foreground font-medium'
                }`}
                variants={columnVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                custom={i + 1}
              >
                <span>{column.name}</span>
                {column.highlight && (
                  <motion.div 
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 bg-yellow-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  />
                )}
              </motion.div>
            ))}
          </div>        
          
          {/* Rows */}
          {comparisonData.map((item, rowIndex) => (
            <motion.div 
              key={rowIndex}
              className="grid grid-cols-4 gap-4 md:gap-6 py-4 px-2 border-b border-border/30 rounded-lg transition-all duration-300 hover:bg-yellow-400/5"
              variants={rowVariants}
              initial="initial"
              whileInView="animate"
              whileHover="hover"
              viewport={{ once: true }}
              custom={rowIndex}
              onMouseEnter={() => setHoveredRow(rowIndex)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <div className="col-span-1 font-medium text-foreground flex items-center">
                {item.feature}
              </div>
              
              {/* Traditional Bootcamp */}
              <div className="col-span-1 flex items-center justify-center">
                {item.traditional ? (
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    className="flex items-center justify-center"
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Check className="h-5 w-5 text-green-500" />
                  </motion.div>
                ) : (
                  <X className="h-5 w-5 text-red-500 opacity-70" />
                )}
              </div>
              
              {/* LearnIQ */}
              <div className="col-span-1 flex items-center justify-center">
                {item.learniq ? (
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    className="flex items-center justify-center"
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Check className="h-5 w-5 text-yellow-400" />
                  </motion.div>
                ) : (
                  <X className="h-5 w-5 text-red-500 opacity-70" />
                )}
              </div>
              
              {/* YouTube Tutorials */}
              <div className="col-span-1 flex items-center justify-center">
                {item.youtube ? (
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    className="flex items-center justify-center"
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Check className="h-5 w-5 text-green-500" />
                  </motion.div>
                ) : (
                  <X className="h-5 w-5 text-red-500 opacity-70" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ComparisonGrid;
export { ComparisonGrid };