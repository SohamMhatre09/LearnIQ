import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { motion, useScroll, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import CountUp from 'react-countup';
import { 
  Code, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ArrowDown
} from "lucide-react";

export default function Landing() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState(0);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  const handleLogout = async () => {
    await logout();
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8 } }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15
      }
    }
  };

  const slideUp = {
    hidden: { y: 40, opacity: 0 },
    visible: { 
      y: 0,
      opacity: 1,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    }
  };

  useEffect(() => {
    // Course rotation
    const interval = setInterval(() => {
      setActiveCourse(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const courses = [
    {
      title: "Web Development Fundamentals",
      description: "HTML, CSS, JavaScript essentials for building responsive websites.",
      image: "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
      tag: "Beginner"
    },
    {
      title: "Full-Stack React & Node",
      description: "Build modern web applications with React, Node.js and MongoDB.",
      image: "bg-gradient-to-br from-green-500/10 to-blue-500/10",
      tag: "Intermediate"
    },
    {
      title: "Advanced Python Programming",
      description: "Mastering Python for data science, automation and backend development.",
      image: "bg-gradient-to-br from-yellow-500/10 to-red-500/10",
      tag: "Advanced"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Ultra-minimal header like Pentagram */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/30">
        <div className="container max-w-screen-xl mx-auto px-6 md:px-8 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Code className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <span className="font-medium tracking-tight text-base">CodeLearn</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            <a href="#work" className="text-sm tracking-wide hover:text-primary transition-colors">
              Courses
            </a>
            <a href="#services" className="text-sm tracking-wide hover:text-primary transition-colors">
              Method
            </a>
            <a href="#about" className="text-sm tracking-wide hover:text-primary transition-colors">
              About
            </a>
            <ThemeToggle />
            
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 font-normal">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild className="rounded-none px-5 font-normal">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden focus:outline-none" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </div>
        
        {/* Mobile navigation - Pentagram style with full-screen overlay */}
        {menuOpen && (
          <motion.div 
            className="md:hidden fixed inset-0 top-[57px] bg-background z-40 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container mx-auto px-6 py-12 flex flex-col h-full">
              <div className="flex flex-col space-y-10 text-3xl font-light flex-grow">
                <a href="#work" className="hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                  Courses
                </a>
                <a href="#services" className="hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                  Method
                </a>
                <a href="#about" className="hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                  About
                </a>
              </div>
              
              <div className="py-8 mt-auto">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-6">
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
                  <div className="flex flex-col gap-6">
                    <Button asChild className="w-full rounded-none">
                      <Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full rounded-none">
                      <Link to="/register" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <main className="pt-16 overflow-hidden">
        {/* Hero section - Artistic Pentagram version */}
        <section className="min-h-[93vh] flex flex-col justify-center relative">
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block">
            <motion.div 
              animate={{ y: [0, 10, 0] }} 
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ArrowDown className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </motion.div>
          </div>
          
          <motion.div style={{ opacity }} className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[30%] right-[10%] h-40 w-40 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-[20%] left-[15%] h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
          </motion.div>
          
          <div className="container max-w-screen-xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-20 items-center">
              <motion.div 
                className="md:col-span-7 flex flex-col justify-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <Badge 
                  variant="outline" 
                  className="w-fit mb-10 bg-primary/5 border-primary/10 text-primary/90 font-normal rounded-none"
                >
                  Launching April 2025
                </Badge>
                
                <motion.h1 
                  className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] tracking-tight mb-10 md:mb-14"
                  variants={staggerChildren}
                >
                  <motion.span 
                    className="block"
                    variants={slideUp}
                  >
                    Learn to code
                  </motion.span>
                  <motion.span 
                    className="block text-primary"
                    variants={slideUp}
                  >
                    beautifully.
                  </motion.span>
                </motion.h1>
                
                <motion.p 
                  className="text-lg md:text-xl mb-12 text-muted-foreground max-w-lg"
                  variants={slideUp}
                >
                  A carefully crafted approach to coding education with real-world projects 
                  and AI-guided personalized learning.
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-5"
                  variants={slideUp}
                >
                  <Button 
                    size="lg" 
                    className="rounded-none px-10 py-6 text-base font-normal"
                    asChild
                  >
                    {isAuthenticated ? (
                      <Link to="/dashboard">
                        Go to dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    ) : (
                      <Link to="/register">
                        Start learning
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="rounded-none px-10 py-6 text-base font-normal"
                  >
                    View courses
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div 
                className="md:col-span-5 relative hidden md:block h-[500px]"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="absolute inset-0">
                  <div className="relative w-full h-full">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square border border-border/40"></div>
                    
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-video bg-background shadow-xl overflow-hidden border border-border">
                      <div className="h-6 bg-muted flex items-center px-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                      <div className="p-4 font-mono text-xs">
                        <div className="text-primary font-semibold mb-1">// Master coding through practice</div>
                        <div className="text-foreground/70">function <span className="text-primary">learnToCode</span>() {'{'}</div>
                        <div className="ml-4 text-foreground/70">const skills = [];</div>
                        <div className="ml-4 text-foreground/70">while(motivation) {'{'}</div>
                        <div className="ml-8 text-foreground/70">skills.push(newSkill);</div>
                        <div className="ml-8 text-foreground/70">practice++;</div>
                        <div className="ml-4 text-foreground/70">{'}'}</div>
                        <div className="ml-4 text-foreground/70">return <span className="text-primary">success</span>;</div>
                        <div className="text-foreground/70">{'}'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Featured Courses - Gallery style like Pentagram */}
        <section id="work" className="py-28 md:py-40">
          <div className="container max-w-screen-xl mx-auto px-6 md:px-8">
            <motion.div 
              className="mb-20 md:mb-32"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <p className="text-sm text-primary tracking-wider mb-3 uppercase font-medium">
                Our Curriculum
              </p>
              <h2 className="text-4xl md:text-6xl font-bold mb-8">Featured Courses</h2>
              <p className="text-muted-foreground max-w-2xl text-lg">
                Carefully structured learning paths to build your skills with intention and purpose.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-24">
              {/* Display courses in large Pentagram-style */}
              {courses.map((course, index) => (
                <motion.div 
                  key={index}
                  className="group relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.7, 
                    delay: index * 0.2,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  <div 
                    className={`aspect-[3/4] ${course.image} mb-6 relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-8xl font-light text-primary/10">{index + 1}</span>
                    </div>
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-500"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm rounded-none">
                        {course.tag}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="text-2xl font-medium mb-3">{course.title}</h3>
                  <p className="text-muted-foreground">{course.description}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              className="mt-20 md:mt-32 flex items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span className="mr-6 text-muted-foreground">Explore all courses</span>
              <Separator className="flex-grow" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-none ml-6 group"
              >
                View All
                <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Method section - Pentagram style with asymmetrical grid */}
        <section id="services" className="py-28 md:py-40 bg-muted/30">
          <div className="container max-w-screen-xl mx-auto px-6 md:px-8">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-12 gap-y-16 md:gap-x-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              <div className="md:col-span-5">
                <motion.p 
                  className="text-sm text-primary tracking-wider mb-3 uppercase font-medium"
                  variants={slideUp}
                >
                  Our Process
                </motion.p>
                <motion.h2 
                  className="text-4xl md:text-6xl font-bold leading-tight mb-6"
                  variants={slideUp}
                >
                  The Method
                </motion.h2>
                <motion.p 
                  className="text-lg text-muted-foreground mb-8"
                  variants={slideUp}
                >
                  Our methodology is built on expertise and intuition, combining established learning science 
                  with innovative approaches to make coding accessible to everyone.
                </motion.p>
                
                <motion.div variants={slideUp}>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="rounded-none group"
                  >
                    Learn about our method
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </div>
              
              <div className="md:col-span-7">
                <div className="grid grid-cols-1 gap-y-14 mt-8 md:mt-16">
                  <motion.div variants={slideUp}>
                    <div className="flex items-baseline gap-6 mb-5">
                      <span className="text-5xl font-extralight text-primary">01</span>
                      <h3 className="text-2xl font-medium">Interactive Learning</h3>
                    </div>
                    <p className="text-muted-foreground pl-[4.5rem]">
                      Hands-on coding exercises and projects with real-time feedback and execution.
                      Learning by doing is at the core of our teaching philosophy.
                    </p>
                  </motion.div>
                  
                  <motion.div variants={slideUp}>
                    <div className="flex items-baseline gap-6 mb-5">
                      <span className="text-5xl font-extralight text-primary">02</span>
                      <h3 className="text-2xl font-medium">AI-Powered Assistance</h3>
                    </div>
                    <p className="text-muted-foreground pl-[4.5rem]">
                      Personalized guidance, code suggestions, and customized learning paths tailored
                      to your specific needs and learning style.
                    </p>
                  </motion.div>
                  
                  <motion.div variants={slideUp}>
                    <div className="flex items-baseline gap-6 mb-5">
                      <span className="text-5xl font-extralight text-primary">03</span>
                      <h3 className="text-2xl font-medium">Project-Based Curriculum</h3>
                    </div>
                    <p className="text-muted-foreground pl-[4.5rem]">
                      Learn through building real applications with industry-standard tools and workflows
                      that prepare you for professional software development.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Course Highlight - Pentagram style selected feature */}
        <section className="py-28 md:py-40">
          <div className="container max-w-screen-xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
              <div className="md:col-span-7">
                <motion.div 
                  className="aspect-[4/3] bg-muted/50 relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  {courses.map((course, index) => (
                    <motion.div 
                      key={index}
                      className={`absolute inset-0 ${course.image} flex items-center justify-center`}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: activeCourse === index ? 1 : 0,
                        scale: activeCourse === index ? 1 : 1.05
                      }}
                      transition={{ duration: 0.7 }}
                    >
                      <div className="text-[12rem] font-thin text-primary/10">
                        {index + 1}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              <div className="md:col-span-5 flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <p className="text-sm text-primary tracking-wider mb-3 uppercase font-medium">
                    Highlighted Course
                  </p>
                  
                  {courses.map((course, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: activeCourse === index ? 1 : 0,
                        y: activeCourse === index ? 0 : 20
                      }}
                      transition={{ duration: 0.5 }}
                      className={`${activeCourse === index ? 'block' : 'hidden'}`}
                    >
                      <h2 className="text-4xl md:text-5xl font-bold mb-6">{course.title}</h2>
                      <p className="text-lg text-muted-foreground mb-8">
                        {course.description} Our curriculum focuses on practical skills
                        that employers are actively seeking.
                      </p>
                      <div className="flex gap-3 mb-10">
                        {[...Array(3)].map((_, i) => (
                          <button 
                            key={i}
                            className={`w-3 h-3 rounded-full ${i === activeCourse ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                            onClick={() => setActiveCourse(i)}
                          />
                        ))}
                      </div>
                      <Button 
                        className="rounded-none group"
                      >
                        Learn more
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial - Artistic Pentagram style */}
        <section className="py-28 md:py-40 bg-muted/30">
          <div className="container max-w-screen-xl mx-auto px-6 md:px-8">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              <div className="md:col-span-6 md:col-start-2">
                <motion.div variants={slideUp}>
                  <p className="text-sm text-primary tracking-wider mb-3 uppercase font-medium">
                    Success Stories
                  </p>
                  <blockquote className="text-2xl md:text-3xl font-light italic leading-relaxed mb-10">
                    "CodeLearn's project-based approach helped me transition from a non-technical role to a full-stack 
                    developer position in just 6 months."
                  </blockquote>
                  
                  <div>
                    <p className="font-medium">Jane Smith</p>
                    <p className="text-muted-foreground">Software Engineer at TechCorp</p>
                  </div>
                </motion.div>
              </div>
              
              <motion.div 
                className="md:col-span-4"
                variants={staggerChildren}
              >
                <div className="space-y-8">
                  {[
                    { number: '94%', text: 'job placement rate' },
                    { number: '127%', text: 'average salary increase' },
                    { number: '4.9/5', text: 'student satisfaction' }
                  ].map((stat, index) => (
                    <motion.div 
                      key={index}
                      variants={slideUp}
                      className="flex items-baseline gap-6"
                    >
                      <p className="text-3xl md:text-4xl font-medium text-primary">{stat.number}</p>
                      <p className="text-muted-foreground">{stat.text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA section - Simplified Pentagram style */}
        <section className="py-28 md:py-40 bg-primary text-primary-foreground">
          <div className="container max-w-screen-xl mx-auto px-6 md:px-8">
            <motion.div
              className="max-w-3xl"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              <motion.p 
                className="text-sm tracking-wider mb-3 uppercase font-medium text-primary-foreground/80"
                variants={slideUp}
              >
                Begin Your Journey
              </motion.p>
              
              <motion.h2 
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-12"
                variants={slideUp}
              >
                Start coding <br />
                beautifully today.
              </motion.h2>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-6"
                variants={slideUp}
              >
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="rounded-none px-10 py-7 text-base font-normal"
                  asChild
                >
                  {isAuthenticated ? (
                    <Link to="/dashboard">Go to dashboard</Link>
                  ) : (
                    <Link to="/register">Get started now</Link>
                  )}
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-none px-10 py-7 text-base font-normal border-primary-foreground/20 text-primary-foreground"
                >
                  View all courses
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer - Artistic minimal like Pentagram */}
      <footer className="py-20 border-t border-border/50">
        <div className="container max-w-screen-xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-12 gap-y-12">
            <div className="col-span-12 md:col-span-3">
              <div className="flex items-center gap-2.5 mb-6">
                <Code className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <span className="font-semibold">CodeLearn</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Modern coding education for the digital age, crafted with attention to detail.
              </p>
            </div>
            
            <div className="col-span-6 md:col-span-3 md:col-start-5">
              <h3 className="text-sm font-medium mb-5">Resources</h3>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div className="col-span-6 md:col-span-3">
              <h3 className="text-sm font-medium mb-5">Company</h3>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div className="col-span-12 md:col-span-3">
              <h3 className="text-sm font-medium mb-5">Subscribe</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign up for our newsletter to receive updates.
              </p>
              <div className="flex">
                <Button size="sm" className="rounded-none">Subscribe</Button>
              </div>
            </div>
          </div>
          
          <div className="mt-20 pt-6 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} CodeLearn. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Add these styles to match Pentagram's aesthetic */}
      <style jsx>{`
        .bg-grid-pattern {
          background-size: 20px 20px;
          background-image: 
            linear-gradient(to right, rgba(var(--primary), 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(var(--primary), 0.05) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
}