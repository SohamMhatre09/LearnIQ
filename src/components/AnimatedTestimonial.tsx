import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface TestimonialProps {
  quote: string;
  name: string;
  title: string;
  company: string;
  imageSrc: string;
  delay?: number;
}

export const AnimatedTestimonial = ({ 
  quote, 
  name, 
  title, 
  company, 
  imageSrc,
  delay = 0 
}: TestimonialProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: delay * 0.2 }}
    >
      <Card 
        className="rounded-none border-none shadow-lg overflow-hidden h-full bg-gradient-to-br from-background to-muted/80 relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-8 flex flex-col h-full">
          <div className="flex-grow">
            <motion.p 
              className="text-lg md:text-xl font-medium leading-relaxed mb-10"
              initial={{ opacity: 1 }}
              animate={{ opacity: isHovered ? 0.8 : 1 }}
              transition={{ duration: 0.3 }}
            >
              "{quote}"
            </motion.p>
          </div>
          
          <motion.div 
            className="flex items-center"
            animate={{
              y: isHovered ? -10 : 0
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-14 w-14 rounded-full overflow-hidden mr-5">
              <img 
                src={imageSrc || `https://i.pravatar.cc/100?u=${name}`} 
                alt={name} 
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-bold">{name}</h4>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0,
                  height: isHovered ? 'auto' : 0 
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-sm text-muted-foreground">
                  {title}, {company}
                </p>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Glowing border effect on hover */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ transformOrigin: 'left' }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};