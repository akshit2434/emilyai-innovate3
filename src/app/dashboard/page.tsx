"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Plus,
  LayoutDashboard,
  Search,
  MessageSquare,
  Zap,
  Settings,
  ChevronRight,
  TrendingUp,
  Video,
  FileText,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { getProducts } from "@/app/actions/products";
import { Product } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  React.useEffect(() => {
    async function loadProducts() {
      if (isLoaded && user) {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        setIsInitialLoad(false);
      }
    }
    loadProducts();
  }, [isLoaded, user]);

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "research", label: "Research Agent", icon: Search },
    { id: "assets", label: "Asset Lab", icon: Zap },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#faf9f7] text-[#1a1a1a] overflow-hidden font-[var(--font-inter)] fluid-container">
      {/* Enhanced Background with Mesh Gradient */}
      <div className="fixed inset-0 mesh-gradient-enhanced pointer-events-none" />
      <div className="fixed inset-0 bg-dots-gradient pointer-events-none opacity-30" />
      <div className="fixed inset-0 bg-lines pointer-events-none opacity-20" />
      
      {/* Floating Blur Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="blur-orb-orange top-[-200px] right-[5%]"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="blur-orb-pink bottom-[10%] left-[-150px]"
          animate={{
            x: [0, 40, -30, 0],
            y: [0, 30, -40, 0],
            scale: [1, 1.15, 0.85, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="blur-orb-amber top-[40%] right-[-100px]"
          animate={{
            x: [0, -30, 40, 0],
            y: [0, 50, -30, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-black/[0.04] glass-morphism flex flex-col relative z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-violet-500 opacity-60" />
            <div className="relative rounded-2xl bg-transparent p-1.5">
              <img
                src="/logo-v2.webp"
                alt="EmilyAI"
                className="w-8 h-8 object-contain drop-shadow-[0_6px_14px_rgba(236,72,153,0.18)]"
              />
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-[15px] tracking-tight">EmilyAI</span>
            <span className="text-[10px] text-[#1a1a1a]/45 font-[var(--font-jetbrains)] tracking-widest uppercase">
              Dashboard
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group",
                activeTab === item.id
                  ? "bg-white text-[#1a1a1a] shadow-sm border border-black/[0.04]"
                  : "text-[#1a1a1a]/40 hover:text-[#1a1a1a] hover:bg-white/50"
              )}
            >
              <item.icon
                size={18}
                className={cn(
                  "transition-colors duration-300",
                  activeTab === item.id ? "text-orange-500" : "group-hover:text-[#1a1a1a]/60"
                )}
              />
              {item.label}
              {activeTab === item.id && (
                <motion.div
                  layoutId="active-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 mt-auto border-t border-black/[0.04]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-black/[0.04] shadow-sm">
            <UserButton afterSignOutUrl="/" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-medium truncate">{user?.fullName || "Active User"}</span>
              <span className="text-[10px] text-[#1a1a1a]/40 truncate font-[var(--font-jetbrains)] text-balance">
                {user?.primaryEmailAddress?.emailAddress || "Free Plan"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-black/[0.04] flex items-center justify-between px-8 glass-morphism z-10">
          <h2 className="text-xs font-[var(--font-jetbrains)] font-medium uppercase tracking-widest text-[#1a1a1a]/40">
            {sidebarItems.find((i) => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/dashboard/new")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-xs shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all duration-300"
            >
              <Plus size={14} /> Create Product
            </motion.button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative bg-noise">

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-5xl mx-auto space-y-8"
            >
              {activeTab === "overview" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Research" value="12" icon={Search} color="orange" />
                    <StatCard label="Assets Generated" value="48" icon={Zap} color="pink" />
                    <StatCard label="Success Rate" value="98.2%" icon={TrendingUp} color="green" />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-[var(--font-playfair)] font-medium">Your Products</h3>
                      <span className="text-xs text-[#1a1a1a]/30 font-[var(--font-jetbrains)]">
                        {products.length} {products.length === 1 ? 'product' : 'products'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {isInitialLoad ? (
                         [1, 2].map((i) => (
                          <div key={i} className="h-48 rounded-2xl bg-black/[0.02] border border-black/[0.04] animate-pulse" />
                         ))
                      ) : (
                        <>
                          {products.map((product) => (
                            <motion.div
                              key={product.id}
                              whileHover={{ y: -4 }}
                              onClick={() => router.push(`/dashboard/${product.id}`)}
                              className="group relative p-6 rounded-2xl bg-white border border-black/[0.04] hover:shadow-xl hover:shadow-black/[0.03] transition-all duration-500 cursor-pointer"
                            >
                              <div className="absolute top-5 right-5 text-[#1a1a1a]/10 group-hover:text-orange-400 transition-colors duration-300">
                                <ChevronRight size={18} />
                              </div>
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mb-6 border border-orange-200/50">
                                <span className="text-orange-600 font-semibold text-sm">
                                  {product.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <h4 className="text-base font-semibold mb-1 truncate">{product.name}</h4>
                              <p className="text-sm text-[#1a1a1a]/40 mb-5 line-clamp-2">
                                {product.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs font-[var(--font-jetbrains)] text-[#1a1a1a]/30">
                                <span className="flex items-center gap-1.5">
                                  <FileText size={12} /> 0 Posts
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Video size={12} /> 0 Videos
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </>
                      )}

                      {/* Create New Card */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        onClick={() => router.push("/dashboard/new")}
                        className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-black/[0.06] hover:border-orange-300 hover:bg-orange-50/30 transition-all duration-500 min-h-[12rem]"
                      >
                        <div className="w-12 h-12 rounded-full border border-black/[0.06] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-orange-300 transition-all duration-500">
                          <Plus size={20} className="text-[#1a1a1a]/20 group-hover:text-orange-500 transition-colors duration-300" />
                        </div>
                        <span className="text-sm font-medium text-[#1a1a1a]/30 group-hover:text-[#1a1a1a]/60 transition-colors duration-300">
                          Create New Product
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "research" && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 border border-orange-200/50 flex items-center justify-center mb-8"
                  >
                    <MessageSquare size={32} className="text-orange-500" />
                  </motion.div>
                  <h3 className="text-2xl font-[var(--font-playfair)] font-medium mb-3">Research Agent Ready</h3>
                  <p className="text-[#1a1a1a]/40 max-w-sm mb-8">
                    Select a product to start a research session with Emily.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-full bg-[#1a1a1a] text-white font-medium text-sm flex items-center gap-2"
                  >
                    <Sparkles size={14} /> Start New Research
                  </motion.button>
                </div>
              )}

              {activeTab === "assets" && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 border border-pink-200/50 flex items-center justify-center mb-8"
                  >
                    <Zap size={32} className="text-pink-500" />
                  </motion.div>
                  <h3 className="text-2xl font-[var(--font-playfair)] font-medium mb-3">Asset Lab</h3>
                  <p className="text-[#1a1a1a]/40 max-w-sm">
                    Create LinkedIn posts, tweets, and short-form videos for your products.
                  </p>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="p-8 rounded-2xl bg-white border border-black/[0.04]">
                  <h3 className="text-xl font-[var(--font-playfair)] font-medium mb-6">Settings</h3>
                  <p className="text-[#1a1a1a]/40 text-sm">Account settings and preferences coming soon.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  const colors: Record<string, string> = {
    orange: "from-orange-50 to-orange-100/50 text-orange-600 border-orange-200/50",
    pink: "from-pink-50 to-pink-100/50 text-pink-600 border-pink-200/50",
    green: "from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-200/50",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn("p-6 rounded-2xl bg-gradient-to-br border transition-all duration-300", colors[color])}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-[var(--font-jetbrains)] uppercase tracking-wider opacity-60">{label}</span>
        <Icon size={18} />
      </div>
      <div className="text-3xl font-[var(--font-playfair)] font-medium text-[#1a1a1a]">{value}</div>
    </motion.div>
  );
}
