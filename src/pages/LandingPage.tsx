import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useSpring, useInView } from "framer-motion";
import {
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target,
  TrendingUp,
  MessageSquareQuote,
  Mail,
} from "lucide-react";
import { AuthModal } from "../components/AuthModal";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// Post-processing imports for neon bloom effect
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

export function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const targetRef = useRef(null);
  const threeRef = useRef(null);
  const isInView = useInView(targetRef, { once: true });
  const { scrollYProgress } = useScroll();
  const springScroll = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Three.js setup – Modernized Torus Knot Animation
  useEffect(() => {
    if (!threeRef.current) return;

    const container = threeRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Create scene, camera, and renderer with tone mapping for a cinematic look
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerWidth / containerHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Set up post-processing composer for neon bloom effect
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(containerWidth, containerHeight),
      1.0,
      0.5,
      0.85
    );
    // Adjust bloom parameters as needed
    bloomPass.threshold = 0;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.4;
    composer.addPass(bloomPass);

    // Lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 1);
    scene.add(directionalLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Enhanced torus knot geometry and material for a refined look
    const geometry = new THREE.TorusKnotGeometry(10, 3, 200, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x00dc82, // primary color from your theme
      emissive: 0x072534,
      metalness: 0.7,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const torusKnot = new THREE.Mesh(geometry, material);
    scene.add(torusKnot);

    // Optionally, add OrbitControls (disabled zoom/pan) to let the user see the 3D effect
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    // Animate with smooth rotation and a subtle pulsation effect
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      // Smooth rotation update
      torusKnot.rotation.x += delta * 0.5;
      torusKnot.rotation.y += delta * 0.5;

      // Subtle pulsation effect: scale oscillates gently
      const scale = 1 + 0.05 * Math.sin(t * 2);
      torusKnot.scale.set(scale, scale, scale);

      controls.update();
      composer.render(delta);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Smart Job Tracking",
      description:
        "Organize and monitor your applications with our intuitive kanban board",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Progress Analytics",
      description:
        "Visualize your job search journey with detailed insights and metrics",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI Recommendations",
      description:
        "Get personalized job suggestions based on your profile and preferences",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "0",
      features: [
        "5 active applications",
        "Basic analytics",
        "Email notifications",
      ],
    },
    {
      name: "Pro",
      price: "12",
      features: [
        "Unlimited applications",
        "Advanced analytics",
        "AI recommendations",
        "Priority support",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "49",
      features: [
        "Custom workflows",
        "Team collaboration",
        "API access",
        "Dedicated support",
      ],
    },
  ];

  const testimonials = [
    {
      quote:
        "Trackr transformed my job search. The interface is beautiful and the features are incredibly helpful.",
      author: "Sarah Chen",
      role: "Software Engineer",
    },
    {
      quote:
        "The best job tracking tool I've ever used. It's both powerful and a joy to use.",
      author: "Marcus Johnson",
      role: "Product Manager",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,220,130,0.1),_transparent_70%)]" />
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[40vh] w-[40vh] rounded-full bg-primary/5 blur-3xl"
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-primary" />
              <span className="text-2xl font-display">Trackr</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-white/70 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-white/70 hover:text-white transition-colors"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-white/70 hover:text-white transition-colors"
              >
                Testimonials
              </a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-2 rounded-full bg-primary text-background font-medium hover:bg-primary-dark transition-colors"
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-display leading-tight mb-6">
                Track Your Career Journey with{" "}
                <span className="text-primary block">Style</span>
              </h1>
              <p className="text-xl text-white/70 mb-8 max-w-lg">
                Transform your job search into a beautiful, organized
                experience. Track applications, visualize progress, and land
                your dream role faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAuthOpen(true)}
                  className="px-8 py-4 rounded-full bg-primary text-background font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                >
                  Start Tracking <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-full border border-white/20 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  Watch Demo
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* Three.js Animation Container */}
              <div
                ref={threeRef}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden glass-card p-1"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            ref={targetRef}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display mb-6">
              Powerful Features for Your{" "}
              <span className="text-primary"> Job Search</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Everything you need to organize, track, and succeed in your job
              search journey.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="glass-card p-8 hover-glow"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                  <div className="text-primary">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-display mb-4">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display mb-6">
              Choose Your <span className="text-primary"> Perfect Plan</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Flexible pricing options to support your job search journey.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`glass-card p-8 hover-glow relative ${
                  plan.popular ? "border-primary" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-background px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-display mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-display">${plan.price}</span>
                  <span className="text-white/70">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAuthOpen(true)}
                  className={`w-full py-3 rounded-full ${
                    plan.popular
                      ? "bg-primary text-background hover:bg-primary-dark"
                      : "border border-white/20 hover:border-primary hover:text-primary"
                  } transition-colors`}
                >
                  Get Started
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display mb-6">
              Loved by <span className="text-primary"> Job Seekers</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              See what others are saying about their experience with Trackr.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="glass-card p-8 hover-glow"
              >
                <MessageSquareQuote className="w-8 h-8 text-primary mb-6" />
                <p className="text-lg mb-6">{testimonial.quote}</p>
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-white/70">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto glass-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display mb-4">Get in Touch</h2>
              <p className="text-white/70">
                Have questions? We're here to help!
              </p>
            </div>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors h-32"
                  placeholder="Your message"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 rounded-full bg-primary text-background font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                Send Message <Mail className="w-5 h-5" />
              </motion.button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              <span className="font-display">Trackr</span>
            </div>
            <div className="flex gap-8 text-white/70">
              <a
                href="#features"
                className="hover:text-white transition-colors"
              >
                Features
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <a
                href="#testimonials"
                className="hover:text-white transition-colors"
              >
                Testimonials
              </a>
              <a href="#contact" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <p className="text-white/50">© 2024 Trackr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
