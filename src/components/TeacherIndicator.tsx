import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { motion } from "framer-motion";

export function TeacherIndicator() {
  const { user } = useAuth();
  
  if (user?.role !== "teacher") {
    return null;
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Badge variant="outline" className="bg-primary/10 text-primary flex items-center gap-1">
        <Pencil className="h-3 w-3" />
        Teacher Account
      </Badge>
    </motion.div>
  );
}