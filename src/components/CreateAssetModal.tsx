"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Linkedin, Twitter, Image as ImageIcon, Video, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

const assetTypes = [
  {
    id: "linkedin",
    name: "LinkedIn Post",
    description: "Professional thought leadership",
    icon: Linkedin,
    prompt: (name: string) => `I want to create a LinkedIn post for ${name}`,
    gradient: "from-blue-500/10 to-blue-600/10",
    iconColor: "text-blue-600",
    borderHover: "hover:border-blue-400/50",
  },
  {
    id: "twitter",
    name: "Twitter Post",
    description: "Viral micro-content",
    icon: Twitter,
    prompt: (name: string) => `I want to create a Twitter/X post for ${name}`,
    gradient: "from-slate-500/10 to-slate-600/10",
    iconColor: "text-slate-700",
    borderHover: "hover:border-slate-400/50",
  },
  {
    id: "image",
    name: "Marketing Image",
    description: "Eye-catching visuals",
    icon: ImageIcon,
    prompt: (name: string) => `I want to create a marketing image for ${name}`,
    gradient: "from-orange-500/10 to-pink-500/10",
    iconColor: "text-orange-500",
    borderHover: "hover:border-orange-400/50",
  },
  {
    id: "video-916",
    name: "Short Video (9:16)",
    description: "Reels, TikTok & Stories",
    icon: Video,
    prompt: (name: string) => `I want to create a 9:16 vertical short video for ${name} (suitable for Instagram Reels, TikTok, or Stories)`,
    gradient: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-500",
    borderHover: "hover:border-purple-400/50",
  },
  {
    id: "video-169",
    name: "Short Video (16:9)",
    description: "YouTube Shorts & Ads",
    icon: Video,
    prompt: (name: string) => `I want to create a 16:9 horizontal short video ad for ${name} (suitable for YouTube or short ads)`,
    gradient: "from-red-500/10 to-orange-500/10",
    iconColor: "text-red-500",
    borderHover: "hover:border-red-400/50",
  },
];

export function CreateAssetModal({ isOpen, onClose, productId, productName }: CreateAssetModalProps) {
  const router = useRouter();

  const handleSelectAsset = (assetType: typeof assetTypes[0]) => {
    const prompt = encodeURIComponent(assetType.prompt(productName));
    router.push(`/dashboard/${productId}/chat?prompt=${prompt}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-black/[0.04] overflow-hidden"
          >
            {/* Decorative gradient orbs */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-pink-200 to-orange-200 rounded-full blur-3xl opacity-30 pointer-events-none" />

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-[var(--font-playfair)] font-medium">Create Asset</h3>
                    <p className="text-xs text-[#1a1a1a]/40">Choose what to create for {productName}</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-black/5 transition-colors"
                >
                  <X size={20} className="text-[#1a1a1a]/40" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {assetTypes.map((asset, i) => (
                  <motion.button
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelectAsset(asset)}
                    className={cn(
                      "group p-4 rounded-2xl border border-black/[0.06] bg-gradient-to-br transition-all duration-200",
                      "hover:shadow-lg hover:shadow-black/[0.03] hover:scale-[1.01]",
                      asset.gradient,
                      asset.borderHover
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm",
                        "group-hover:scale-105 transition-transform"
                      )}>
                        <asset.icon size={22} className={asset.iconColor} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-[#1a1a1a] group-hover:text-[#1a1a1a] transition-colors">
                          {asset.name}
                        </p>
                        <p className="text-xs text-[#1a1a1a]/40 group-hover:text-[#1a1a1a]/60 transition-colors">
                          {asset.description}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[#1a1a1a]/40">→</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <p className="text-center text-[10px] text-[#1a1a1a]/30 mt-6 font-[var(--font-jetbrains)]">
                Emily will help you create the perfect asset
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
