import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Code, 
  ArrowRight, 
  ArrowDown,
  Menu,
  X,
  Plus,
  Minus,
  Check,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import CountUp from 'react-countup';

// Import new components
import { LoadingExperience } from "@/components/LoadingExperience";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { TrustedByMarquee } from "@/components/TrustedByMarquee";
import { AnimatedTestimonial } from "@/components/AnimatedTestimonial";
import { ComparisonGrid } from "@/components/ComparisonGrid";
import { AnimatedRectangles } from "@/components/AnimatedRectangles";

// Keep the import unchanged
import { ScrollRevealText } from "@/components/ScrollRevealText";

export default function Landing() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [activePricingTab, setActivePricingTab] = useState("monthly");
  const [activeSection, setActiveSection] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs for parallax sections
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const methodologyRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
  };

  // Scroll animations
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.98]);
  const yPosAnimation = useTransform(scrollYProgress, [0, 1], [0, 500]);
  
  // Parallax effect for hero section
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, 300]);
  const featuresY = useTransform(scrollY, [300, 1300], [0, 150]);
  const methodologyTextY = useTransform(scrollY, [1000, 2000], [0, 100]);

  // Prevent scroll during loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);
  
  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id') || "";
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation variants
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };
  
  const stagger = {
    animate: { 
      transition: { staggerChildren: 0.1 }
    }
  };

  const letterAnimation = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden selection:bg-yellow-300 selection:text-black font-sans">
      {/* Loading Experience */}
      <LoadingExperience onComplete={() => setIsLoading(false)} />
      
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Animated Rectangles */}
      <AnimatedRectangles />
      
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 relative z-10">
            <Code className="h-6 w-6" />
            <span className="font-bold tracking-tighter text-xl">LearnIQ</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-12">
            <a 
              href="#features" 
              className={`text-sm font-medium tracking-wide hover:text-yellow-400 transition-colors duration-300 ${activeSection === 'features' ? 'text-yellow-400' : 'text-foreground'}`}
            >
              Features
            </a>
            <a 
              href="#methodology" 
              className={`text-sm font-medium tracking-wide hover:text-yellow-400 transition-colors duration-300 ${activeSection === 'methodology' ? 'text-yellow-400' : 'text-foreground'}`}
            >
              Methodology
            </a>
            <a 
              href="#pricing" 
              className={`text-sm font-medium tracking-wide hover:text-yellow-400 transition-colors duration-300 ${activeSection === 'pricing' ? 'text-yellow-400' : 'text-foreground'}`}
            >
              Pricing
            </a>
            
            <div className="flex items-center gap-4">
              <Separator orientation="vertical" className="h-5" />
              <ThemeToggle />
              
              {isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-none px-4">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </Button>
              ) : (
                <Button variant="default" size="sm" asChild className="rounded-none px-6">
                  <Link to="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground p-1 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "100vh", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 top-[72px] bg-background z-40 flex flex-col overflow-hidden md:hidden"
            >
              <div className="container mx-auto px-6 py-10 flex flex-col h-full">
                <motion.div 
                  className="flex flex-col space-y-10 text-4xl font-light"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={stagger}
                >
                  <motion.a 
                    href="#features" 
                    onClick={() => setMenuOpen(false)}
                    className="hover:text-yellow-400 transition-colors" 
                    variants={fadeIn}
                  >
                    Features
                  </motion.a>
                  <motion.a 
                    href="#methodology" 
                    onClick={() => setMenuOpen(false)}
                    className="hover:text-yellow-400 transition-colors" 
                    variants={fadeIn}
                  >
                    Methodology
                  </motion.a>
                  <motion.a 
                    href="#pricing" 
                    onClick={() => setMenuOpen(false)}
                    className="hover:text-yellow-400 transition-colors" 
                    variants={fadeIn}
                  >
                    Pricing
                  </motion.a>
                </motion.div>
                
                <div className="mt-auto pt-10 border-t border-border">
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-4">
                      <Button variant="outline" asChild className="w-full rounded-none">
                        <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                          <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                        </Link>
                      </Button>
                      <Button variant="ghost" onClick={() => { handleLogout(); setMenuOpen(false); }} className="rounded-none">
                        <LogOut className="h-4 w-4 mr-2" /> Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Button asChild className="w-full">
                        <Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
                      </Button>
                      <Button variant="outline" asChild className="w-full rounded-none">
                        <Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className={`pt-24 ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}`}>
        {/* Hero section with parallax */}
        <section id="hero" className="min-h-[90vh] flex items-center relative overflow-hidden" ref={heroRef}>
          <motion.div style={{ y: heroY }} className="absolute inset-0 bg-grid-pattern opacity-5"></motion.div>
          
          <div className="container mx-auto px-6 py-20 relative">
            <motion.div
              className="max-w-4xl"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeIn} className="mb-6">
                <Badge className="px-4 py-2 bg-yellow-400 text-black text-xs font-medium rounded-none uppercase tracking-widest">
                  New Platform Launch
                </Badge>
              </motion.div>
              
              <motion.h1
                className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 font-display leading-tight"
              >
                {["Master", "the", "art", "of", "code"].map((word, i) => (
                  <motion.span
                    key={i}
                    className="inline-block mr-4 relative"
                    variants={letterAnimation}
                    custom={i}
                  >
                    {i === 0 ? <span className="text-yellow-400">{word}</span> : word}
                    {i === 0 && (
                      <motion.div
                        className="absolute -bottom-2 left-0 right-0 h-1 bg-yellow-400"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                      />
                    )}
                  </motion.span>
                ))}
              </motion.h1>
              
              <motion.p
                variants={fadeIn}
                className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 font-light"
              >
                A brutally simple approach to programming education. 
                No fluff, no nonsense. Just pure, focused knowledge.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-5">
                {isAuthenticated ? (
                  <Button size="lg" className="rounded-none px-10 py-6 text-base font-medium bg-yellow-400 text-black hover:bg-yellow-500" asChild>
                    <Link to="/dashboard">
                      <span>Go to dashboard</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="rounded-none px-10 py-6 text-base font-medium bg-yellow-400 text-black hover:bg-yellow-500" asChild>
                    <Link to="/register">
                      <span>Start learning</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                
                <Button size="lg" variant="outline" className="rounded-none px-10 py-6 text-base font-normal">
                  <span>Explore courses</span>
                </Button>
              </motion.div>
            </motion.div>
            
            <div className="hidden md:block absolute -bottom-10 -right-10 w-96 h-96">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="w-full h-full relative"
              >
                <motion.div 
                  className="absolute top-0 left-0 w-40 h-40 border border-yellow-400"
                  animate={{ 
                    rotate: [0, 5, 0, -5, 0],
                    scale: [1, 1.01, 1, 0.99, 1] 
                  }}
                  transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute bottom-0 right-0 w-60 h-60 border border-border"
                  animate={{ 
                    rotate: [0, -5, 0, 5, 0],
                    scale: [1, 0.99, 1, 1.01, 1] 
                  }}
                  transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-10 left-0 right-0 flex justify-center"
            animate={{ y: [0, 10, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </section>

        {/* Trusted By Marquee */}
        <TrustedByMarquee />

        {/* Counter stats - minimal design */}
        <section className="py-24 bg-muted/10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { number: '100+', text: 'Interactive Courses' },
                { number: '10k+', text: 'Active Students' },
                { number: '98%', text: 'Success Rate' }
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  className="flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.2 }}
                >
                  <span className="text-5xl md:text-6xl font-bold text-yellow-400 mb-2 font-mono">
                    <CountUp end={parseInt(stat.number) || 100} suffix={stat.number.includes('+') ? '+' : ''} duration={2.5} />
                  </span>
                  <span className="text-lg text-muted-foreground font-light">{stat.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features section with parallax */}
        <section id="features" className="py-32 relative" ref={featuresRef}>
          <motion.div style={{ y: featuresY }} className="absolute inset-0 bg-grid-pattern opacity-5"></motion.div>
          
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-sm uppercase tracking-widest text-yellow-400 mb-2 block font-medium">Features</span>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-16 font-display">
                Brutally simple.<br />Remarkably effective.
              </h2>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
              {[
                {
                  title: "Interactive Learning",
                  description: "Practice coding directly in your browser with our integrated editor. No setup required, just start coding."
                },
                {
                  title: "AI-Powered Assistance",
                  description: "Personalized guidance and hints when you need them. Our AI adapts to your learning style."
                },
                {
                  title: "Structured Curriculum",
                  description: "A carefully designed learning path that builds skills systematically from fundamentals to advanced concepts."
                },
                {
                  title: "Real-time Feedback",
                  description: "Immediate assessment of your code with specific suggestions for improvement."
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="mb-6">
                    <span className="text-6xl font-light text-yellow-400/20 font-mono">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 font-display">{feature.title}</h3>
                  <p className="text-muted-foreground font-light">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


        {/* Comparison section */}
        <section className="py-32 bg-muted/40 relative">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-sm uppercase tracking-widest text-yellow-400 mb-2 block font-medium">Comparison</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 font-display">
                How do we compare?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                See why our approach outperforms traditional learning methods.
              </p>
            </motion.div>
            
            <ComparisonGrid />
          </div>
        </section>

        {/* Methodology section with parallax text */}
        <section id="methodology" className="py-32 relative bg-black text-white" ref={methodologyRef}>
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-gradient-to-b from-black to-transparent" />
          </div>
          
          <div className="container mx-auto px-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
              <div className="md:col-span-5">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                  style={{ y: methodologyTextY }}
                >
                  <span className="text-sm uppercase tracking-widest text-yellow-400 mb-2 block font-medium">Methodology</span>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 font-display">
                    The Art & Science of Coding
                  </h2>
                  <p className="text-lg text-gray-300 mb-8 font-light">
                    Our methodology is built on expertise and intuition, combining established learning 
                    science with innovative approaches to make coding accessible to everyone.
                  </p>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="rounded-none text-white border-white hover:text-yellow-400 hover:border-yellow-400 group font-medium"
                  >
                    Learn about our method
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </div>
              
              <div className="md:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  <Accordion type="single" collapsible className="border-t border-white/20">
                    {[
                      {
                        title: "Learning Through Practice",
                        content: "Hands-on coding exercises and projects with real-time feedback and execution. Learning by doing is at the core of our teaching philosophy."
                      },
                      {
                        title: "Personalized AI Guidance",
                        content: "Tailored learning experiences with our AI that adapts to your specific needs, strengths, and weaknesses."
                      },
                      {
                        title: "Project-Based Curriculum",
                        content: "Build real applications with industry-standard tools and workflows that prepare you for professional software development."
                      }
                    ].map((item, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border-b border-white/20">
                        <AccordionTrigger className="text-xl font-medium py-6 hover:text-yellow-400 transition-colors font-display">
                          {item.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-300 pb-6 font-light">
                          {item.content}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials section */}
        <section className="py-32 relative overflow-hidden">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-sm uppercase tracking-widest text-yellow-400 mb-2 block">Testimonials</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-12">
                What our students say
              </h2>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <AnimatedTestimonial 
                quote="LearnIQ's brutally simple approach helped me transition from a non-technical role to a full-stack developer position in just 6 months."
                name="Jane Doe"
                title="Software Engineer"
                company="TechCorp"
                imageSrc="https://i.pravatar.cc/100?img=1"
                delay={0}
              />
              <AnimatedTestimonial 
                quote="The focused curriculum eliminates all unnecessary complexity. I learned more in 3 months than I did in a year of self-study."
                name="John Smith"
                title="Frontend Developer"
                company="WebSolutions"
                imageSrc="https://i.pravatar.cc/100?img=2"
                delay={1}
              />
              <AnimatedTestimonial 
                quote="The AI assistance is like having a personal tutor available 24/7. It adapts to how I learn and challenges me appropriately."
                name="Alex Johnson"
                title="Backend Engineer"
                company="DataTech"
                imageSrc="https://i.pravatar.cc/100?img=3"
                delay={2}
              />
            </div>
          </div>
        </section>

        {/* Pricing section */}
        <section id="pricing" className="py-32 bg-muted/10 relative">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-sm uppercase tracking-widest text-yellow-400 mb-2 block">Pricing</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that works for you. All plans include access to our learning platform.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                <Card className="rounded-none border border-border h-full">
                  <CardHeader>
                    <CardTitle className="text-xl">Free</CardTitle>
                    <CardDescription>For beginners exploring coding</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">₹ 0</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>10 basic assignments</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>Limited progress tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>Community support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {isAuthenticated ? (
                      <Button variant="outline" className="w-full rounded-none" asChild>
                        <Link to="/dashboard">Go to Dashboard</Link>
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full rounded-none" asChild>
                        <Link to="/register">Sign Up for Free</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
              
              {/* Pro plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                <Card className="rounded-none border-2 border-yellow-400 relative h-full">
                  <div className="absolute top-0 right-0 -mt-2 -mr-2">
                    <Badge className="bg-yellow-400 text-black rounded-none px-3 py-1">Popular</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">Pro</CardTitle>
                    <CardDescription>For serious learners</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">
                        ₹ {activePricingTab === "monthly" ? "199" : "159"}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {activePricingTab === "annual" && (
                        <span className="text-xs ml-2 text-yellow-400">Billed annually</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>100+ premium assignments</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>Full progress tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>AI-powered assistance</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>Email support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {isAuthenticated ? (
                      <Button className="w-full rounded-none bg-yellow-400 text-black hover:bg-yellow-500" asChild>
                        <Link to="/dashboard">Access Pro Features</Link>
                      </Button>
                    ) : (
                      <Button className="w-full rounded-none bg-yellow-400 text-black hover:bg-yellow-500" asChild>
                        <Link to="/register">Get Started</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
              
              {/* Enterprise plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                <Card className="rounded-none border border-border h-full">
                  <CardHeader>
                    <CardTitle className="text-xl">Enterprise</CardTitle>
                    <CardDescription>For teams and organizations</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">
                        ₹ {activePricingTab === "monthly" ? "99" : "79"}
                      </span>
                      <span className="text-muted-foreground">/user/month</span>
                      {activePricingTab === "annual" && (
                        <span className="text-xs ml-2 text-yellow-400">Billed annually</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>All Pro features</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>Team management</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>Custom assignments</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-yellow-400 shrink-0" />
                        <span>Priority support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full rounded-none">
                      Contact Sales
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-32 bg-black text-white relative overflow-hidden">
          <motion.div
            className="absolute top-20 right-20 w-40 h-40 border border-yellow-400"
            animate={{ 
              rotate: [0, 90, 180, 270, 360],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity,
              ease: "linear" 
            }}
          />
          
          <motion.div
            className="absolute bottom-20 left-20 w-20 h-20 border border-yellow-400"
            animate={{ 
              rotate: [360, 270, 180, 90, 0],
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity,
              ease: "linear" 
            }}
          />
          
          <div className="container mx-auto px-6 relative">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center"
              >
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 font-display">
                  Ready to master<br />the art of coding?
                </h2>
                <p className="text-xl text-gray-300 mb-12 font-light">
                  Start your journey today with our brutally simple approach to coding education.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-5">
                  {isAuthenticated ? (
                    <Button size="lg" className="rounded-none px-10 py-6 text-base font-medium bg-yellow-400 text-black hover:bg-yellow-500" asChild>
                      <Link to="/dashboard">
                        <span>Go to dashboard</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg" className="rounded-none px-10 py-6 text-base font-medium bg-yellow-400 text-black hover:bg-yellow-500" asChild>
                      <Link to="/register">
                        <span>Start for free</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="rounded-none px-10 py-6 text-base font-normal border-white text-white hover:bg-white/10"
                  >
                    <span>View pricing</span>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - minimalist */}
      <footer className="py-16 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2 mb-6">
                <Code className="h-5 w-5" />
                <span className="font-bold">LearnIQ</span>
              </div>
              <p className="text-muted-foreground max-w-xs">
                A brutally simple approach to coding education, crafted with attention to detail.
              </p>
            </div>
            
            <div className="md:col-span-8 md:col-start-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-sm font-medium mb-4">Resources</h3>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors">Documentation</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors">Tutorials</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors">Blog</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-4">Company</h3>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors">About</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors">Careers</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors">Contact</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-4">Legal</h3>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors">Terms</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors">Privacy</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors">Cookies</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} LearnIQ. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.093 4.093 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom styles for typography and aesthetics */}
      <style jsx>{`
        .bg-grid-pattern {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }

        /* Font family definitions */
        .font-display {
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          letter-spacing: -0.03em;
        }

        .font-mono {
          font-family: 'SF Mono', 'Roboto Mono', monospace;
        }

        .font-sans {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* Add font weight variations */
        .font-light {
          font-weight: 300;
        }
      `}</style>
    </div>
  );
}