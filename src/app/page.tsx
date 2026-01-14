"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Play,
  Star,
  Rocket,
  Telescope,
  Wand2,
  LineChart,
  Compass,
  Gem,
  Feather,
  FlaskConical,
  Orbit,
  Crown,
  Radar,
  Menu,
  X,
} from "lucide-react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import ValueInfusionPortal from "@/components/ValueInfusionPortal";
import StickyStackingCards from "@/components/StickyStackingCards";

// Register GSAP plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

// Stacking cards data
const stackingCardsData = [
  {
    id: 1,
    title: "Deep Market Research",
    subtitle: "Know Everything",
    description: "Emily scours the web 24/7, analyzing competitors, tracking trends, and surfacing insights you'd never find manually. From social listening to patent filings—she covers it all.",
    icon: <Telescope size={32} />,
    gradient: "bg-gradient-to-br from-[var(--solar-orange)] to-[var(--warm-amber)]",
    bgColor: "bg-gradient-to-br from-[var(--peach-mist)] to-white",
  },
  {
    id: 2,
    title: "Instant Content Creation",
    subtitle: "Create Anything",
    description: "From viral LinkedIn posts to compelling ad copy, video scripts to email sequences—Emily generates on-brand content in seconds. Just describe what you need.",
    icon: <Wand2 size={32} />,
    gradient: "bg-gradient-to-br from-[var(--luminous-pink)] to-[var(--electric-rose)]",
    bgColor: "bg-gradient-to-br from-[var(--rose-tint)] to-white",
  },
  {
    id: 3,
    title: "Real-Time Analytics",
    subtitle: "Measure Impact",
    description: "Track engagement, monitor brand mentions, and get AI-powered recommendations to optimize your marketing strategy. Data meets intuition.",
    icon: <LineChart size={32} />,
    gradient: "bg-gradient-to-br from-[var(--deep-violet)] to-purple-500",
    bgColor: "bg-gradient-to-br from-[var(--dream-lavender)]/40 to-white",
  },
  {
    id: 4,
    title: "Multi-Channel Distribution",
    subtitle: "Scale Everywhere",
    description: "One click to publish across all your channels. Emily formats, optimizes, and schedules your content for maximum reach on every platform.",
    icon: <Orbit size={32} />,
    gradient: "bg-gradient-to-br from-[var(--solar-orange)] to-[var(--luminous-pink)]",
    bgColor: "bg-gradient-to-br from-[var(--cream-paper)] to-white",
  },
];

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position for navbar transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setMobileMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const portalRef = useRef<HTMLDivElement>(null);

  // Portal explode effect
  useEffect(() => {
    if (!portalRef.current) return;

    gsap.fromTo(
      portalRef.current,
      { scale: 0.9, opacity: 0.8 },
      {
        scale: 1,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: portalRef.current,
          start: "top 80%",
          end: "top 20%",
          scrub: 1,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--cream-paper)] text-[var(--charcoal-plum)] overflow-x-hidden font-[var(--font-inter)] fluid-container">
      {/* Enhanced Mesh Gradient Background */}
      <div className="fixed inset-0 mesh-gradient-enhanced pointer-events-none" />
      
      {/* Subtle Background Patterns */}
      <div className="fixed inset-0 bg-dots-gradient pointer-events-none opacity-25" />
      <div className="fixed inset-0 bg-lines pointer-events-none opacity-15" />
      
      {/* Grain overlay */}
      <div className="grain-overlay bg-noise" />

      {/* Floating background orbs with enhanced motion */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="blur-orb-peach top-[-250px] right-[-150px]"
          animate={{ 
            x: [0, 30, -20, 0], 
            y: [0, -40, 20, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="blur-orb-blush bottom-[20%] left-[-250px]"
          animate={{ 
            x: [0, 40, -30, 0], 
            y: [0, 30, -40, 0],
            scale: [1, 1.2, 0.85, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="blur-orb-lavender top-[35%] right-[-200px]"
          animate={{ 
            x: [0, -30, 40, 0], 
            y: [0, 50, -30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="blur-orb-amber top-[60%] left-[10%]"
          animate={{ 
            x: [0, 25, -35, 0], 
            y: [0, -25, 35, 0],
            scale: [1, 1.25, 0.8, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="blur-orb-rose bottom-[30%] right-[15%]"
          animate={{ 
            x: [0, -25, 30, 0], 
            y: [0, 40, -20, 0],
            scale: [1, 1.18, 0.88, 1],
          }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating Navigation - Always centered, only inner properties animate */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed z-50 top-0 left-0 right-0 w-full flex justify-center"
      >
        <div
          className={`backdrop-blur-2xl border flex items-center justify-between transition-all duration-1000 ease-out ${scrolled
            ? 'mt-3 mx-4 sm:mx-6 w-[90%] max-w-4xl px-5 sm:px-8 h-14 bg-white/95 rounded-[32px] border-[var(--charcoal-plum)]/[0.08] shadow-xl shadow-black/[0.05]'
            : 'mt-0 mx-0 w-full max-w-none px-4 sm:px-8 h-16 bg-white/70 rounded-none border-transparent shadow-none'
            }`}
        >
          {/* Brand mark */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group select-none">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
            >
              {/* Gradient ring */}
              <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-[var(--solar-orange)] via-[var(--luminous-pink)] to-[var(--deep-violet)] opacity-70 blur-[0.5px]" />
              {/* Transparent inner (no tile) */}
              <div className="relative rounded-2xl bg-transparent p-1.5">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--solar-orange)] to-[var(--luminous-pink)] blur-lg -z-10"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.32, 0.18] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <Image
                  src="/logo-v2.webp"
                  alt="EmilyAI Logo"
                  width={40}
                  height={40}
                  priority
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_6px_14px_rgba(236,72,153,0.18)]"
                />
              </div>
            </motion.div>

            <motion.span
              className="text-[15px] sm:text-[17px] font-semibold tracking-tight font-[var(--font-playfair)] text-[var(--charcoal-plum)] group-hover:text-[var(--solar-orange)] transition-colors duration-300"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              EmilyAI
            </motion.span>
          </Link>

          {/* Desktop Navigation with enhanced animations */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {[
              { href: "#features", label: "Features" },
              { href: "#how", label: "How it Works" },
              { href: "#agents", label: "Our Team" },
              { href: "#testimonials", label: "Stories" },
            ].map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 200 }}
              >
                <Link
                  href={link.href}
                  className="relative px-3 py-2 text-[13px] font-medium text-[var(--mauve-gray)] hover:text-[var(--charcoal-plum)] transition-all duration-300 group rounded-lg hover:bg-white/50"
                >
                  <span className="relative z-10">{link.label}</span>
                  {/* Animated underline */}
                  <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-gradient-to-r from-[var(--solar-orange)] to-[var(--luminous-pink)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Desktop auth buttons */}
            <div className="hidden sm:flex items-center gap-3">
              {isSignedIn ? (
                <Link href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="px-5 py-2.5 rounded-full bg-[var(--charcoal-plum)] text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-[var(--charcoal-plum)]/20 hover:shadow-xl"
                  >
                    Dashboard <ArrowRight size={14} />
                  </motion.button>
                </Link>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      className="text-sm font-medium text-[var(--mauve-gray)] hover:text-[var(--charcoal-plum)] transition-colors duration-300 px-3 py-2"
                    >
                      Sign In
                    </motion.button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="btn-gradient px-5 py-2.5 rounded-full font-medium text-sm shadow-lg hover:shadow-xl"
                    >
                      Get Started
                    </motion.button>
                  </SignUpButton>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/50 border border-[var(--charcoal-plum)]/5 text-[var(--charcoal-plum)]"
            >
              <motion.div
                animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu Drawer - Rounded to match navbar */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: mobileMenuOpen ? "auto" : 0,
            opacity: mobileMenuOpen ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden mt-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-[var(--charcoal-plum)]/5 shadow-lg"
        >
          <div className="px-4 py-4 space-y-1">
            {[
              { href: "#features", label: "Features" },
              { href: "#how", label: "How it Works" },
              { href: "#agents", label: "Our Team" },
              { href: "#testimonials", label: "Stories" },
            ].map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: mobileMenuOpen ? 0 : -20, opacity: mobileMenuOpen ? 1 : 0 }}
                transition={{ delay: mobileMenuOpen ? i * 0.1 : 0 }}
              >
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-[var(--mauve-gray)] hover:text-[var(--charcoal-plum)] hover:bg-white/50 transition-all duration-200 font-medium"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}

            {/* Mobile auth buttons */}
            <div className="pt-4 mt-2 border-t border-[var(--charcoal-plum)]/5 space-y-2">
              {isSignedIn ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--charcoal-plum)] text-white font-medium text-sm flex items-center justify-center gap-2"
                  >
                    Dashboard <ArrowRight size={14} />
                  </motion.button>
                </Link>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="w-full px-4 py-3 rounded-xl text-[var(--mauve-gray)] hover:text-[var(--charcoal-plum)] hover:bg-white/50 font-medium text-sm transition-all">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="w-full btn-gradient px-4 py-3 rounded-xl font-medium text-sm">
                      Get Started
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* ============================================
          HERO SECTION - AI Value Infusion Portal
          ============================================ */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="min-h-screen pt-32 pb-20 px-6 relative flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-left relative z-10"
            >
              {/* Badge */}
              <motion.div
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--peach-mist)] to-[var(--rose-tint)] border border-[var(--soft-peach)]/40 text-[var(--charcoal-plum)]/70 text-xs font-semibold mb-10 shadow-sm"
              >
                <Rocket size={14} className="text-[var(--solar-orange)]" />
                AI-Powered Marketing · 24/7
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-5xl md:text-6xl lg:text-[4.2rem] font-[var(--font-playfair)] font-medium tracking-tight mb-8 leading-[1.1]"
              >
                You Build the Future.{" "}
                <span className="gradient-text-hero">We'll Break the Internet.</span>
              </motion.h1>

              {/* Subtext */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="max-w-xl text-lg md:text-xl text-[var(--mauve-gray)] mb-12 leading-relaxed"
              >
                Your product is genius—don't let it die in 'new'.{" "}
                <span className="text-[var(--charcoal-plum)] font-medium">Our AI ensures your hard work gets the massive audience it actually deserves.</span>
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row items-start gap-5"
              >
                <SignUpButton mode="modal">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-gradient px-10 py-5 rounded-full font-semibold text-base flex items-center gap-3 shadow-xl"
                  >
                    Start for free
                    <ArrowRight size={18} />
                  </motion.button>
                </SignUpButton>
                <motion.button
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-secondary px-10 py-5 rounded-full font-semibold text-base flex items-center gap-3"
                >
                  <Play size={18} className="text-[var(--solar-orange)]" />
                  Watch demo
                </motion.button>
              </motion.div>

              {/* Social proof */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="mt-14 flex items-center gap-5"
              >
                <div className="flex -space-x-3">
                  {[
                    "from-[var(--soft-peach)] to-[var(--pale-blush)]",
                    "from-[var(--pale-blush)] to-[var(--dream-lavender)]",
                    "from-[var(--dream-lavender)] to-[var(--soft-peach)]",
                    "from-[var(--solar-orange)] to-[var(--luminous-pink)]",
                  ].map((gradient, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, x: -20 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} border-3 border-white shadow-md`}
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--mauve-gray)]">
                  <span className="text-[var(--charcoal-plum)] font-bold">500+</span> brands scaling with Emily
                </p>
              </motion.div>
            </motion.div>

            {/* Right - Video/Post Preview Placeholder */}
            <motion.div
              ref={portalRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative h-[400px] lg:h-[500px] flex items-center justify-center"
            >
              {/* Video/Preview Container */}
              <div className="relative w-full max-w-lg mx-auto">
                {/* Glow behind */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--solar-orange)]/20 via-[var(--luminous-pink)]/20 to-[var(--deep-violet)]/20 rounded-3xl blur-3xl scale-110" />

                {/* Main Video Container */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-white rounded-3xl shadow-2xl shadow-[var(--charcoal-plum)]/[0.12] border border-[var(--charcoal-plum)]/[0.08] overflow-hidden aspect-[4/3]"
                >
                  {/* Video Placeholder Content */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--cream-paper)] to-white flex flex-col items-center justify-center p-8">
                    {/* Play Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--solar-orange)] to-[var(--luminous-pink)] flex items-center justify-center shadow-xl shadow-[var(--solar-orange)]/30 mb-6"
                    >
                      <Play size={32} className="text-white ml-1" fill="white" />
                    </motion.button>

                    <p className="text-[var(--charcoal-plum)] font-semibold text-lg mb-2">See Emily in Action</p>
                    <p className="text-[var(--mauve-gray)] text-sm">Watch how we help creators go viral</p>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--electric-rose)]" />
                    <div className="w-3 h-3 rounded-full bg-[var(--warm-amber)]" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>

                  {/* Progress bar placeholder */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--charcoal-plum)]/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[var(--solar-orange)] to-[var(--luminous-pink)]"
                      initial={{ width: "0%" }}
                      animate={{ width: "35%" }}
                      transition={{ delay: 1, duration: 2 }}
                    />
                  </div>
                </motion.div>

                {/* Floating badges around video */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute -left-4 lg:-left-8 top-1/4 bg-white rounded-2xl shadow-xl p-3 border border-[var(--charcoal-plum)]/[0.06]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <Rocket size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--charcoal-plum)]">10x Reach</p>
                      <p className="text-[10px] text-[var(--mauve-gray)]">In 30 days</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute -right-4 lg:-right-8 bottom-1/4 bg-white rounded-2xl shadow-xl p-3 border border-[var(--charcoal-plum)]/[0.06]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--solar-orange)] to-[var(--luminous-pink)] flex items-center justify-center">
                      <Star size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--charcoal-plum)]">AI-Powered</p>
                      <p className="text-[10px] text-[var(--mauve-gray)]">24/7 Marketing</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <span className="text-xs text-[var(--mauve-gray)] font-medium">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-[var(--mauve-gray)]/30 flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 rounded-full bg-gradient-to-b from-[var(--solar-orange)] to-[var(--luminous-pink)]" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ============================================
          STICKY STACKING CARDS - FEATURES
          ============================================ */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <StickyStackingCards
            cards={stackingCardsData}
            sectionTitle="Why brands choose Emily"
            sectionSubtitle="Powerful Features"
          />
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS - Timeline with GSAP
          ============================================ */}
      <section id="how" className="py-32 px-6 relative overflow-hidden bg-gradient-to-b from-white via-[var(--cream-paper)] to-white">
        {/* Animated background orbs - bright colors */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-[var(--soft-peach)]/40 blur-3xl top-0 left-1/4"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-[var(--dream-lavender)]/40 blur-3xl bottom-0 right-1/4"
          animate={{ x: [0, -80, 0], y: [0, -40, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.p
              className="text-sm font-[var(--font-jetbrains)] text-[var(--solar-orange)] uppercase tracking-[0.3em] mb-4"
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              whileInView={{ opacity: 1, letterSpacing: "0.3em" }}
              transition={{ duration: 1 }}
            >
              How It Works
            </motion.p>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-[var(--font-playfair)] font-bold text-[var(--charcoal-plum)] mb-6">
              Four Steps to <span className="gradient-text-hero">Viral</span>
            </h2>
          </motion.div>

          {/* Horizontal Steps */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Connect",
                desc: "Link your brand. Emily learns your voice in seconds.",
                icon: <Compass size={32} className="text-white" />,
                color: "from-[var(--solar-orange)] to-[var(--warm-amber)]",
                bgColor: "bg-[var(--peach-mist)]",
              },
              {
                step: "02",
                title: "Request",
                desc: "Describe what you need. She understands context.",
                icon: <FlaskConical size={32} className="text-white" />,
                color: "from-[var(--luminous-pink)] to-[var(--electric-rose)]",
                bgColor: "bg-[var(--rose-tint)]",
              },
              {
                step: "03",
                title: "Create",
                desc: "Watch AI agents craft your marketing in real-time.",
                icon: <Orbit size={32} className="text-white" />,
                color: "from-[var(--deep-violet)] to-purple-500",
                bgColor: "bg-[var(--dream-lavender)]/50",
              },
              {
                step: "04",
                title: "Launch",
                desc: "Publish with one click. Track. Scale. Dominate.",
                icon: <Crown size={32} className="text-white" />,
                color: "from-emerald-500 to-teal-400",
                bgColor: "bg-emerald-50",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60, rotateX: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                whileHover={{
                  y: -20,
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
                className="group cursor-pointer"
              >
                {/* Card - Bright theme */}
                <div className={`relative h-full ${item.bgColor} backdrop-blur-sm border border-white/80 rounded-3xl p-8 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500`}>
                  {/* Glow on hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  />

                  {/* Big Step Number */}
                  <motion.div
                    className={`text-[100px] md:text-[120px] font-black text-[var(--charcoal-plum)]/[0.04] absolute -top-6 -right-4 leading-none select-none group-hover:text-[var(--charcoal-plum)]/[0.08] transition-colors duration-500`}
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {item.step}
                  </motion.div>

                  {/* Icon with animated background */}
                  <motion.div
                    className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-xl`}
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {item.icon}
                    {/* Pulse ring */}
                    <motion.div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color}`}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl md:text-3xl font-bold text-[var(--charcoal-plum)] mb-3 group-hover:gradient-text-hero transition-all">
                    {item.title}
                  </h3>
                  <p className="text-[var(--mauve-gray)] text-sm leading-relaxed">
                    {item.desc}
                  </p>

                  {/* Arrow indicator */}
                  <motion.div
                    className="mt-6 flex items-center gap-2 text-[var(--mauve-gray)] group-hover:text-[var(--solar-orange)] transition-colors"
                    initial={{ x: 0 }}
                    whileHover={{ x: 10 }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider">Start here</span>
                    <ArrowRight size={14} />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="text-center mt-16"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.98 }}
              className="btn-gradient px-10 py-5 rounded-full font-semibold text-lg shadow-2xl shadow-[var(--solar-orange)]/20"
            >
              Get Started Free <Rocket className="inline ml-2" size={20} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          TEAM SHOWCASE - Some Work Done by Our Team
          ============================================ */}
      <section id="agents" className="py-32 px-6 relative overflow-hidden">
        <motion.div
          className="blur-orb-lavender top-0 right-[-250px]"
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <motion.p
              className="text-xs font-[var(--font-jetbrains)] text-[var(--solar-orange)] uppercase tracking-[0.25em] mb-5"
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              whileInView={{ opacity: 1, letterSpacing: "0.25em" }}
              transition={{ duration: 0.8 }}
            >
              Our Team
            </motion.p>
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-[var(--font-playfair)] font-medium mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Some Work Done by Our Team
            </motion.h2>

            {/* Decorative line under heading */}
            <motion.div
              className="mx-auto w-32 h-1 rounded-full bg-gradient-to-r from-[var(--solar-orange)] via-[var(--luminous-pink)] to-[var(--deep-violet)]"
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />

            <motion.p
              className="text-[var(--mauve-gray)] max-w-lg mx-auto text-lg mt-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Meet the brilliant minds behind EmilyAI.
            </motion.p>
          </motion.div>

          {/* Team Grid - 5 Members */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
            {[
              {
                name: "Akshit Singh",
                role: "Lead Developer",
                desc: "Full-stack architect building the AI core.",
                icon: <Radar size={28} className="text-[var(--solar-orange)]" />,
                gradient: "from-[var(--solar-orange)] to-[var(--warm-amber)]",
                bgColor: "bg-[var(--peach-mist)]",
                delay: 0,
              },
              {
                name: "Mokshi Mittal",
                role: "AI Engineer",
                desc: "Designing intelligent marketing algorithms.",
                icon: <Gem size={28} className="text-[var(--luminous-pink)]" />,
                gradient: "from-[var(--luminous-pink)] to-[var(--electric-rose)]",
                bgColor: "bg-[var(--rose-tint)]",
                delay: 0.1,
              },
              {
                name: "Rashi Johari",
                role: "Product Designer",
                desc: "Creating intuitive user experiences.",
                icon: <Feather size={28} className="text-[var(--deep-violet)]" />,
                gradient: "from-[var(--deep-violet)] to-purple-500",
                bgColor: "bg-[var(--dream-lavender)]/40",
                delay: 0.2,
              },
              {
                name: "Nitya",
                role: "Data Analyst",
                desc: "Transforming data into actionable insights.",
                icon: <LineChart size={28} className="text-[var(--solar-orange)]" />,
                gradient: "from-[var(--warm-amber)] to-[var(--solar-orange)]",
                bgColor: "bg-[var(--peach-mist)]",
                delay: 0.3,
              },
              {
                name: "Himani Sirohi",
                role: "Marketing Lead",
                desc: "Crafting compelling brand strategies.",
                icon: <Crown size={28} className="text-[var(--luminous-pink)]" />,
                gradient: "from-[var(--electric-rose)] to-[var(--luminous-pink)]",
                bgColor: "bg-[var(--rose-tint)]",
                delay: 0.4,
              },
            ].map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: member.delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="group relative"
              >
                {/* Glow effect on hover */}
                <motion.div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                  style={{
                    background: `linear-gradient(135deg, var(--solar-orange), var(--luminous-pink))`,
                    transform: "scale(0.9) translateY(10px)",
                  }}
                />

                <motion.div
                  whileHover={{ y: -10, scale: 1.03 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="glass-card-strong rounded-3xl p-6 md:p-7 relative overflow-hidden h-full"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{
                      backgroundPosition: ["200% 0", "-200% 0"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  {/* Avatar/Icon */}
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${member.bgColor} flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl transition-shadow`}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {member.icon}
                    </motion.div>
                  </motion.div>

                  <h3 className="text-lg md:text-xl font-semibold mb-1 font-[var(--font-playfair)] text-[var(--charcoal-plum)]">
                    {member.name}
                  </h3>
                  <p className="text-xs text-[var(--mauve-gray)] font-[var(--font-jetbrains)] mb-3 tracking-wide uppercase">
                    {member.role}
                  </p>
                  <p className="text-[var(--mauve-gray)] text-sm leading-relaxed">{member.desc}</p>

                  {/* Corner accent */}
                  <motion.div
                    className="absolute top-0 right-0 w-16 h-16 opacity-20 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 100% 0%, var(--solar-orange) 0%, transparent 70%)`,
                    }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.15, 0.3, 0.15],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS
          ============================================ */}
      <section id="testimonials" className="py-32 px-6 relative overflow-hidden">
        <motion.div
          className="blur-orb-blush bottom-0 left-1/2 -translate-x-1/2"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <p className="text-xs font-[var(--font-jetbrains)] text-[var(--solar-orange)] uppercase tracking-[0.25em] mb-5">
              Success Stories
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-[var(--font-playfair)] font-medium mb-6">
              Loved by brands
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "Emily helped us 10x our content output for our luxury perfume line. The research insights alone paid for a year of subscriptions.",
                author: "Sophie Laurent",
                role: "Founder, Maison Bleu",
                avatar: "S",
                gradient: "from-[var(--soft-peach)] to-[var(--pale-blush)]",
              },
              {
                quote:
                  "We launched our artisan chocolate brand with Emily. She created our entire launch campaign—social, email, ads—in 48 hours.",
                author: "Marcus Chen",
                role: "CMO, Artisan Delights",
                avatar: "M",
                gradient: "from-[var(--pale-blush)] to-[var(--dream-lavender)]",
              },
              {
                quote:
                  "Finally, AI that understands beauty marketing. Our cosmetics engagement increased 340% in just 3 months.",
                author: "Isabella Romano",
                role: "Creative Director, LuxeGlow",
                avatar: "I",
                gradient: "from-[var(--dream-lavender)] to-[var(--soft-peach)]",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -8, rotate: i === 1 ? 0 : (i === 0 ? 2 : -2) }}
                className="postcard p-9"
              >
                <div className="flex gap-1.5 mb-7">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className="fill-[var(--solar-orange)] text-[var(--solar-orange)]"
                    />
                  ))}
                </div>

                <p className="text-[var(--charcoal-plum)]/80 mb-9 leading-relaxed font-[var(--font-cormorant)] text-xl italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-base shadow-md`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--charcoal-plum)]">{testimonial.author}</p>
                    <p className="text-sm text-[var(--mauve-gray)]">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="py-32 px-6 relative overflow-hidden">
        <motion.div
          className="blur-orb-peach top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-[var(--font-playfair)] font-medium mb-8">
            Ready to transform your{" "}
            <span className="gradient-text-hero">marketing</span>?
          </h2>
          <p className="text-[var(--mauve-gray)] text-lg md:text-xl mb-12 max-w-xl mx-auto">
            Join 500+ brands already scaling with EmilyAI. Start for free—no credit card required.
          </p>

          <SignUpButton mode="modal">
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="btn-gradient px-12 py-6 rounded-full font-bold text-lg inline-flex items-center gap-4 shadow-2xl"
            >
              Get started — it&apos;s free
              <ArrowRight size={20} />
            </motion.button>
          </SignUpButton>
        </motion.div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="py-20 border-t border-[var(--charcoal-plum)]/[0.04] px-6 bg-white/40">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-5 group">
                <div className="relative">
                  <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-[var(--solar-orange)] via-[var(--luminous-pink)] to-[var(--deep-violet)] opacity-60" />
                  <div className="relative rounded-2xl bg-white/80 backdrop-blur-xl border border-black/[0.04] shadow-sm p-1.5 shimmer group-hover:shadow-md transition-shadow">
                    <Image
                      src="/logo-v2.webp"
                      alt="EmilyAI Logo"
                      width={40}
                      height={40}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                </div>
                <span className="font-semibold text-xl tracking-tight font-[var(--font-playfair)]">
                  EmilyAI
                </span>
              </Link>
              <p className="text-[var(--mauve-gray)] text-sm max-w-xs leading-relaxed">
                Your 24/7 AI marketing partner. Made for modern brands.
              </p>
            </div>

            <div className="flex gap-16">
              <div>
                <p className="text-xs font-bold text-[var(--charcoal-plum)] uppercase tracking-widest mb-5">
                  Product
                </p>
                <div className="flex flex-col gap-4 text-sm text-[var(--mauve-gray)]">
                  {["Features", "How it Works", "Changelog"].map((link) => (
                    <Link key={link} href="#" className="hover:text-[var(--charcoal-plum)] transition-colors">
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--charcoal-plum)] uppercase tracking-widest mb-5">
                  Connect
                </p>
                <div className="flex flex-col gap-4 text-sm text-[var(--mauve-gray)]">
                  {["Twitter", "LinkedIn", "GitHub"].map((link) => (
                    <Link key={link} href="#" className="hover:text-[var(--charcoal-plum)] transition-colors">
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-[var(--charcoal-plum)]/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[var(--mauve-gray)]/60 text-xs font-[var(--font-jetbrains)]">
              © 2026 EmilyAI · Built at Innovate Hackathon
            </p>
            <div className="flex gap-8 text-[var(--mauve-gray)]/60 text-xs">
              {["Privacy", "Terms"].map((link) => (
                <Link key={link} href="#" className="hover:text-[var(--charcoal-plum)] transition-colors">
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
