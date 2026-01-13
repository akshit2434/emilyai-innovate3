"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search, Zap, BarChart3, Sparkles, Play } from "lucide-react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1a1a1a] overflow-x-hidden font-[var(--font-inter)]">
      {/* Background patterns */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-60" />
      <div className="blur-orb-orange top-[-200px] right-[-100px]" />
      <div className="blur-orb-pink bottom-[20%] left-[-150px]" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#faf9f7]/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-orange-500/20">
              E
            </div>
            <span className="text-lg font-semibold tracking-tight">EmilyAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1a1a1a]/50">
            <Link href="#features" className="hover:text-[#1a1a1a] transition-colors duration-300">Features</Link>
            <Link href="#how" className="hover:text-[#1a1a1a] transition-colors duration-300">How it works</Link>
            <Link href="#pricing" className="hover:text-[#1a1a1a] transition-colors duration-300">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-full bg-[#1a1a1a] text-white font-medium text-sm hover:bg-[#2a2a2a] transition-all duration-300 flex items-center gap-2"
              >
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors duration-300">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300">
                    Get Started
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-24 px-6 relative">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/60 text-orange-600 text-xs font-medium mb-8 font-[var(--font-jetbrains)]">
              <Sparkles size={12} />
              AI-Powered Research & Marketing
            </div>
            
            <h1 className="text-5xl md:text-7xl font-[var(--font-playfair)] font-medium tracking-tight mb-8 leading-[1.1]">
              Scale your brand with
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                intelligent agents
              </span>
            </h1>
            
            <p className="max-w-xl mx-auto text-lg text-[#1a1a1a]/50 mb-12 leading-relaxed font-light">
              EmilyAI is your 24/7 research partner and creative director. 
              Automate market analysis and generate multi-format ads in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1a1a1a] text-white font-medium text-base hover:bg-[#2a2a2a] transition-all duration-300 shadow-xl shadow-black/10"
                >
                  Start for free
                </motion.button>
              </SignUpButton>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-black/10 bg-white/60 backdrop-blur-sm font-medium text-base hover:bg-white transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Play size={16} className="text-orange-500" /> Watch demo
              </motion.button>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 relative"
          >
            <div className="relative rounded-2xl border border-black/[0.06] bg-white/70 backdrop-blur-xl p-3 shadow-2xl shadow-black/[0.03]">
              <div className="rounded-xl overflow-hidden aspect-[16/9] border border-black/[0.04] bg-[#faf9f7]">
                {/* Mock Dashboard UI */}
                <div className="flex h-full">
                  <div className="w-56 border-r border-black/[0.04] bg-white/50 p-5 text-left">
                    <div className="h-3 w-20 bg-black/5 rounded mb-6"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-2.5 rounded ${i === 1 ? 'w-24 bg-orange-200' : 'w-full bg-black/[0.03]'}`}></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 p-8 text-left bg-dots">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-6 w-6 rounded bg-gradient-to-br from-orange-400 to-pink-400"></div>
                      <div className="h-3 w-32 bg-black/5 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-28 bg-white border border-black/[0.04] rounded-xl flex items-center justify-center shadow-sm">
                        <Search className="text-orange-400/60" size={28} />
                      </div>
                      <div className="h-28 bg-white border border-black/[0.04] rounded-xl flex items-center justify-center shadow-sm">
                        <Zap className="text-pink-400/60" size={28} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating badges */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute -left-4 top-1/3 px-4 py-2 rounded-xl bg-white border border-black/[0.06] shadow-lg text-xs font-medium flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              Agent active
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="absolute -right-4 bottom-1/4 px-4 py-2 rounded-xl bg-white border border-black/[0.06] shadow-lg text-xs font-[var(--font-jetbrains)]"
            >
              +48 assets generated
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-[var(--font-jetbrains)] text-orange-500 uppercase tracking-widest mb-4">Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-[var(--font-playfair)] font-medium mb-4">Everything you need to dominate</h2>
            <p className="text-[#1a1a1a]/40 max-w-md mx-auto">Powered by Gemini 2.5 Flash and intelligent agent orchestration.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search className="text-orange-500" size={22} />,
                title: "Deep Research",
                desc: "Autonomous agents crawl the web, analyze competitors, and surface actionable insights.",
              },
              {
                icon: <Zap className="text-pink-500" size={22} />,
                title: "Instant Assets",
                desc: "Generate LinkedIn posts, tweets, and short-form videos in your brand voice.",
              },
              {
                icon: <BarChart3 className="text-orange-500" size={22} />,
                title: "Market Intelligence",
                desc: "Real-time trend analysis and competitor tracking to stay ahead.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-black/[0.04] hover:bg-white hover:shadow-xl hover:shadow-black/[0.03] transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-100/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3">{f.title}</h3>
                <p className="text-[#1a1a1a]/40 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-black/[0.04] px-6 bg-white/40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">E</div>
            <span className="font-semibold tracking-tight">EmilyAI</span>
          </div>
          <p className="text-[#1a1a1a]/30 text-sm font-[var(--font-jetbrains)]">© 2026 EmilyAI · Built at Innovate Hackathon</p>
          <div className="flex gap-6 text-[#1a1a1a]/40 text-sm">
            <Link href="#" className="hover:text-[#1a1a1a] transition-colors duration-300">Twitter</Link>
            <Link href="#" className="hover:text-[#1a1a1a] transition-colors duration-300">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
