import React from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SandboxModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SandboxModal({ isOpen, onOpenChange }: SandboxModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Preparing Your Environment</DialogTitle>
          <DialogDescription className="text-center">
            Creating a sandbox for your assignment...
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8">
          {/* Main centered circular animation container */}
          <div className="relative h-40 w-40 flex items-center justify-center">
            {/* Rotating rings */}
            {[80, 60, 40].map((size, index) => (
              <motion.div
                key={`ring-${index}`}
                className="absolute rounded-full border-2 border-primary/30"
                style={{ 
                  width: size, 
                  height: size,
                  top: "50%",
                  left: "50%",
                  marginLeft: -size/2,
                  marginTop: -size/2
                }}
                animate={{ 
                  rotate: 360,
                  borderColor: ["hsl(240, 50%, 70%)", "hsl(330, 50%, 70%)", "hsl(240, 50%, 70%)"]
                }}
                transition={{ 
                  rotate: { 
                    duration: 8 - index * 2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  },
                  borderColor: {
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }
                }}
              />
            ))}
            
            {/* Multiple pulsing rings */}
            {[0, 0.7, 1.4].map((delay, i) => (
              <motion.div
                key={`pulse-${i}`}
                className="absolute rounded-full border-2 border-primary/20"
                style={{
                  top: "50%",
                  left: "50%"
                }}
                initial={{ width: 0, height: 0, x: "-50%", y: "-50%" }}
                animate={{
                  width: [0, 120],
                  height: [0, 120],
                  opacity: [0, 0.8, 0],
                  x: "-50%", 
                  y: "-50%"
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: delay
                }}
              />
            ))}
            
            {/* Additional decorative circles */}
            {[20, 15, 10].map((size, idx) => (
              <motion.div
                key={`inner-circle-${idx}`}
                className="absolute rounded-full bg-primary/40"
                style={{
                  width: size,
                  height: size,
                  top: "50%",
                  left: "50%",
                  marginLeft: -size/2,
                  marginTop: -size/2
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{
                  duration: 2 + idx,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            ))}
            
            {/* Rotating dotted circle */}
            <svg className="absolute top-0 left-0 w-full h-full">
              <motion.circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke="hsl(240, 50%, 70%)"
                strokeWidth="1"
                strokeDasharray="5,5"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  transformOrigin: "center"
                }}
              />
            </svg>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground">
            This will only take a moment
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}