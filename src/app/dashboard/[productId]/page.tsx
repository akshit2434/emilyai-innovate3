"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { CreateAssetModal } from "@/components/CreateAssetModal";
import {
  ArrowLeft,
  MessageSquare,
  Zap,
  FileText,
  Video,
  Image as ImageIcon,
  Twitter,
  Linkedin,
  Plus,
  Settings,
  BarChart3,
  Target,
  Users,
  Sparkles,
} from "lucide-react";
import { getProductById } from "@/app/actions/products";
import { getChatSessions, getAssets } from "@/app/actions/brand";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

export default function ProductDashboardPage() {
  const params = useParams();
  const productId = params.productId as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (productId) {
        const [productData, sessionsData, assetsData] = await Promise.all([
          getProductById(productId),
          getChatSessions(productId),
          getAssets(productId),
        ]);
        setProduct(productData);
        setChatSessions(sessionsData);
        setAssets(assetsData);
        setIsLoading(false);
      }
    }
    loadData();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center">
        <p className="text-[#1a1a1a]/40 mb-4">Product not found</p>
        <Link href="/dashboard" className="text-orange-500 font-medium text-sm hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Research Sessions", value: chatSessions.length.toString(), icon: MessageSquare, color: "orange" },
    { label: "Assets Generated", value: assets.length.toString(), icon: Zap, color: "pink" },
    { label: "Brand Score", value: product?.extracted_info ? "Complete" : "Setup", icon: BarChart3, color: "green" },
  ];

  const assetIcons: Record<string, React.ElementType> = {
    linkedin: Linkedin,
    twitter: Twitter,
    video: Video,
    image: ImageIcon,
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1a1a1a] font-[var(--font-inter)]">
      {/* Background */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="blur-orb-orange top-[-150px] right-[10%] opacity-30" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#faf9f7]/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-[10px] font-medium text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors uppercase tracking-widest"
            >
              <ArrowLeft size={12} />
              Products
            </Link>
            <span className="text-[#1a1a1a]/20">/</span>
            <span className="text-xs font-medium truncate max-w-[200px]">{product.name}</span>
          </div>
          <button className="p-2 rounded-lg hover:bg-black/[0.02] transition-colors">
            <Settings size={16} className="text-[#1a1a1a]/40" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        {/* Product Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 border border-orange-200/50 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-[var(--font-playfair)] font-bold text-orange-600">
                {product.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-[var(--font-playfair)] font-medium mb-2">{product.name}</h1>
              <p className="text-sm text-[#1a1a1a]/50 leading-relaxed max-w-xl mb-4">
                {product.description || "No description yet."}
              </p>
              {product.extracted_info?.tagline && (
                <p className="text-xs font-[var(--font-cormorant)] italic text-[#1a1a1a]/60">
                  "{product.extracted_info.tagline}"
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-10"
        >
          <Link
            href={`/dashboard/${productId}/chat`}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            <MessageSquare size={16} />
            Start Research
          </Link>
          <button
            onClick={() => setIsAssetModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all"
          >
            <Sparkles size={16} />
            Create Asset
          </button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className={cn(
                "p-5 rounded-xl bg-gradient-to-br border",
                stat.color === "orange" && "from-orange-50 to-orange-100/50 border-orange-200/50",
                stat.color === "pink" && "from-pink-50 to-pink-100/50 border-pink-200/50",
                stat.color === "green" && "from-emerald-50 to-emerald-100/50 border-emerald-200/50"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-[var(--font-jetbrains)] uppercase tracking-widest text-[#1a1a1a]/40">
                  {stat.label}
                </span>
                <stat.icon size={16} className={cn(
                  stat.color === "orange" && "text-orange-500",
                  stat.color === "pink" && "text-pink-500",
                  stat.color === "green" && "text-emerald-500"
                )} />
              </div>
              <p className="text-2xl font-[var(--font-playfair)] font-medium">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Extracted Info */}
        {product.extracted_info && Object.keys(product.extracted_info).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10 p-6 rounded-2xl bg-white border border-black/[0.04]"
          >
            <h3 className="text-xs font-[var(--font-jetbrains)] uppercase tracking-widest text-[#1a1a1a]/40 mb-4">
              Extracted Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.extracted_info.target_audience && (
                <div className="flex items-start gap-3">
                  <Users size={16} className="text-orange-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-[var(--font-jetbrains)] uppercase text-[#1a1a1a]/30 mb-1">Target Audience</p>
                    <p className="text-sm text-[#1a1a1a]/70">{product.extracted_info.target_audience}</p>
                  </div>
                </div>
              )}
              {product.extracted_info.value_proposition && (
                <div className="flex items-start gap-3">
                  <Target size={16} className="text-pink-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-[var(--font-jetbrains)] uppercase text-[#1a1a1a]/30 mb-1">Value Proposition</p>
                    <p className="text-sm text-[#1a1a1a]/70">{product.extracted_info.value_proposition}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Assets Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-[var(--font-playfair)] font-medium">Generated Assets</h3>
            <span className="text-[10px] font-[var(--font-jetbrains)] text-[#1a1a1a]/30">{assets.length} assets</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {assets.map((asset, i) => {
              const Icon = assetIcons[asset.type] || FileText;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white border border-black/[0.04] hover:shadow-lg hover:shadow-black/[0.02] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-100/50 flex items-center justify-center">
                      <Icon size={14} className="text-orange-500" />
                    </div>
                    <span className={cn(
                      "text-[9px] font-[var(--font-jetbrains)] uppercase px-2 py-0.5 rounded-full",
                      asset.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {asset.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#1a1a1a]/70 group-hover:text-[#1a1a1a] transition-colors">{asset.title}</p>
                </div>
              );
            })}
            {/* Add New Asset */}
            <button 
              onClick={() => setIsAssetModalOpen(true)}
              className="p-4 rounded-xl border-2 border-dashed border-black/[0.06] hover:border-orange-300 hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center min-h-[100px] group"
            >
              <Plus size={20} className="text-[#1a1a1a]/20 group-hover:text-orange-500 transition-colors mb-2" />
              <span className="text-xs text-[#1a1a1a]/30 group-hover:text-[#1a1a1a]/60 transition-colors">Create Asset</span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Asset Creation Modal */}
      <CreateAssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        productId={productId}
        productName={product?.name || ""}
      />
    </div>
  );
}
