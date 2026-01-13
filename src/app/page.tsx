"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search, Zap, BarChart3, ShieldCheck } from "lucide-react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-lg">
              E
            </div>
            <span className="text-xl font-bold tracking-tight">EmilyAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all flex items-center gap-2"
              >
                Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium hover:text-indigo-400 transition-colors">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-5 py-2.5 rounded-full bg-indigo-600 font-semibold text-sm hover:bg-indigo-500 transition-all">
                    Get Started
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Next-Gen Research & Marketing
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-[1.1]">
              Scale Your Brand with <br className="hidden md:block" />
              Agentic Intelligence
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/50 mb-10 leading-relaxed">
              EmilyAI is your 24/7 research and marketing department. Automate market analysis, 
              instantly generate multi-format ads, and grow faster with data-driven assets.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-indigo-600 font-bold text-lg hover:bg-indigo-500 hover:scale-105 transition-all shadow-xl shadow-indigo-500/20">
                  Start Building Free
                </button>
              </SignUpButton>
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <div className="mt-20 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full -z-10"></div>
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-3xl overflow-hidden shadow-2xl"
            >
              <div className="rounded-xl overflow-hidden aspect-video border border-white/5 bg-black/40">
                 {/* Mock UI placeholder */}
                 <div className="flex h-full">
                    <div className="w-64 border-r border-white/5 bg-white/[0.01] p-4 text-left">
                       <div className="h-4 w-32 bg-white/10 rounded mb-4"></div>
                       <div className="space-y-2">
                          {[1,2,3,4].map(i => <div key={i} className="h-2 w-full bg-white/5 rounded"></div>)}
                       </div>
                    </div>
                    <div className="flex-1 p-8 text-left">
                       <div className="h-8 w-48 bg-white/10 rounded mb-8"></div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="h-32 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-center">
                             <Zap className="text-indigo-500/40" size={32} />
                          </div>
                          <div className="h-32 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-center">
                             <BarChart3 className="text-indigo-500/40" size={32} />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to dominate</h2>
            <p className="text-white/40">Powered by Gemini 2.5 Flash and LangGraph orchestration.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="text-indigo-400" />,
                title: "Deep Market Research",
                desc: "Autonomous agents crawl the web, analyze competitors, and find gaps in the market."
              },
              {
                icon: <Zap className="text-violet-400" />,
                title: "Instant Assets",
                desc: "Generate LinkedIn posts, Twitter threads, and short-form videos (9:16) in minutes."
              },
              {
                icon: <ShieldCheck className="text-emerald-400" />,
                title: "Brand Guardrails",
                desc: "Custom AI tools ensure every asset stays perfectly aligned with your brand voice."
              }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-white/40 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center font-bold text-xs">E</div>
            <span className="font-semibold tracking-tight">EmilyAI</span>
          </div>
          <p className="text-white/20 text-sm">© 2026 EmilyAI. Built at Innovate Hackathon.</p>
          <div className="flex gap-6 text-white/40 text-sm">
             <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
             <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
