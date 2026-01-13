"use client";

import React, { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { 
  Plus, 
  LayoutDashboard, 
  Search, 
  MessageSquare, 
  Zap, 
  Settings, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Video,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("overview");

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "research", label: "Research Agent", icon: Search },
    { id: "assets", label: "Asset Lab", icon: Zap },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0d0d0d] flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
            E
          </div>
          <span className="font-bold text-lg tracking-tight">EmilyAI</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                activeTab === item.id 
                  ? "bg-white/5 text-white" 
                  : "text-white/40 hover:text-white hover:bg-white/[0.02]"
              )}
            >
              <item.icon size={18} className={cn(
                "transition-colors",
                activeTab === item.id ? "text-indigo-400" : "group-hover:text-white/60"
              )} />
              {item.label}
              {activeTab === item.id && (
                <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <UserButton afterSignOutUrl="/" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold truncate">{user?.fullName || "Active User"}</span>
              <span className="text-[10px] text-white/40 truncate">Free Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md z-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">
            {sidebarItems.find(i => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
             <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 font-bold text-xs hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/10">
                <Plus size={14} /> Create Product
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="max-w-6xl mx-auto space-y-8"
             >
                {activeTab === "overview" && (
                   <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <StatCard label="Total Research" value="12" icon={Search} color="indigo" />
                      <StatCard label="Assets Generated" value="48" icon={Zap} color="violet" />
                      <StatCard label="Success Rate" value="98.2%" icon={TrendingUp} color="emerald" />
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-xl font-bold">Your Products</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Placeholder Product Card */}
                          <div className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                             <div className="absolute top-4 right-4 text-white/20 group-hover:text-indigo-400 transition-colors">
                                <ChevronRight size={20} />
                             </div>
                             <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                                <div className="text-indigo-400 font-bold">E1</div>
                             </div>
                             <h4 className="text-lg font-bold mb-1">EcoInnovate</h4>
                             <p className="text-sm text-white/40 mb-4 line-clamp-2">Sustainble tech brand research and marketing assets.</p>
                             <div className="flex items-center gap-4 text-xs font-medium text-white/30">
                                <span className="flex items-center gap-1.5"><FileText size={12}/> 8 Posts</span>
                                <span className="flex items-center gap-1.5"><Video size={12}/> 2 Videos</span>
                             </div>
                          </div>
                          
                          <button className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.01] transition-all">
                             <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Plus size={24} className="text-white/20 group-hover:text-indigo-400" />
                             </div>
                             <span className="text-sm font-semibold text-white/20 group-hover:text-white/60 transition-colors">Create New Product</span>
                          </button>
                       </div>
                    </div>
                   </>
                )}

                {activeTab === "research" && (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                      <MessageSquare size={32} className="text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Research Agent Ready</h3>
                    <p className="text-white/40 max-w-sm">Select a product to start a research session with Emily.</p>
                  </div>
                )}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    indigo: "from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/10",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/10",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/10"
  };

  return (
    <div className={cn("p-6 rounded-2xl bg-gradient-to-br border shadow-sm", colors[color])}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</span>
        <Icon size={18} />
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
