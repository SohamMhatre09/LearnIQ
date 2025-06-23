import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Code, Loader2, ArrowLeft, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      // In a real app, you would call an API here
      // For demo purposes, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitted(true);
      toast({
        title: "Email sent",
        description: "Check your inbox for password reset instructions",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div 
        className="absolute w-80 h-80 rounded-full bg-primary/5 blur-3xl"
        animate={{ 
          x: [0, 100, 0], 
          y: [0, 50, 0],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 20,
          ease: "easeInOut" 
        }}
        style={{ top: '20%', left: '20%' }}
      />
      <motion.div 
        className="absolute w-96 h-96 rounded-full bg-accent/5 blur-3xl"
        animate={{ 
          x: [0, -70, 0], 
          y: [0, 100, 0],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 25,
          ease: "easeInOut" 
        }}
        style={{ bottom: '20%', right: '20%' }}
      />
      
      <motion.div 
        className="w-full max-w-md px-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <motion.div 
                className="flex justify-center mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
              >
                {isSubmitted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <Mail className="h-10 w-10 text-green-500" />
                  </motion.div>
                ) : (
                  <Code className="h-10 w-10 text-primary" />
                )}
              </motion.div>
              <CardTitle className="text-2xl">
                {isSubmitted ? "Check your email" : "Forgot password"}
              </CardTitle>
              <CardDescription>
                {isSubmitted 
                  ? "We've sent you a link to reset your password" 
                  : "Enter your email to receive a password reset link"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your.email@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </motion.div>
                </form>
              ) : (
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-muted-foreground mb-4">
                    We've sent an email to <span className="font-medium text-foreground">{email}</span> with instructions to reset your password.
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSubmitted(false)}
                      className="w-full"
                    >
                      Try another email
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-muted-foreground">
                <motion.div
                  className="inline-flex items-center"
                  whileHover={{ x: -3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  <Link to="/login" className="text-primary hover:underline">
                    Back to login
                  </Link>
                </motion.div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}