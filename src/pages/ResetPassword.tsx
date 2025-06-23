import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Code, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Both fields are required",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      // In a real app, you'd call an API using the token from the URL
      // For demo purposes, just simulate a success response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      toast({
        title: "Success",
        description: "Your password has been reset successfully",
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
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
        className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl"
        animate={{ 
          x: [0, 100, 0], 
          y: [0, 50, 0],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 20,
          ease: "easeInOut" 
        }}
        style={{ bottom: '10%', left: '10%' }}
      />
      <motion.div 
        className="absolute w-72 h-72 rounded-full bg-accent/5 blur-3xl"
        animate={{ 
          x: [0, -70, 0], 
          y: [0, 100, 0],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 25,
          ease: "easeInOut" 
        }}
        style={{ top: '10%', right: '10%' }}
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
                {isSuccess ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <Check className="h-10 w-10 text-green-500" />
                  </motion.div>
                ) : (
                  <Code className="h-10 w-10 text-primary" />
                )}
              </motion.div>
              <CardTitle className="text-2xl">
                {isSuccess ? "Password Reset Complete" : "Reset Your Password"}
              </CardTitle>
              <CardDescription>
                {isSuccess 
                  ? "Your password has been successfully updated" 
                  : "Enter your new password below"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </motion.div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </motion.div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </motion.div>
                </form>
              ) : (
                <motion.div
                  className="flex flex-col items-center space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-muted-foreground text-center">
                    Your password has been reset. You will be redirected to the login page automatically.
                  </p>
                  <motion.div
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity,
                      ease: "linear" 
                    }}
                  />
                </motion.div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {!isSuccess && (
                <div className="text-sm text-center text-muted-foreground">
                  Remember your password?{" "}
                  <motion.span whileHover={{ scale: 1.05 }}>
                    <Link to="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </motion.span>
                </div>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}