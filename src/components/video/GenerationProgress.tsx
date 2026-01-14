"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, Film, Image, Scissors, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationProgressProps {
  phase: "frames" | "clips" | "stitching" | "done" | undefined;
  generatedFrames: Array<{
    clipId: string;
    startFrameUrl: string | null;
    endFrameUrl: string | null;
    status: string;
  }>;
  generatedClips?: Array<{
    clipId: string;
    videoUrl: string | null;
    status: string;
  }>;
  videoUrl?: string | null;
}

export function GenerationProgress({
  phase,
  generatedFrames,
  generatedClips = [],
  videoUrl,
}: GenerationProgressProps) {
  const completedFrames = generatedFrames.filter(f => f.status === "done").length;
  const totalFrames = generatedFrames.length;
  const generatingFrame = generatedFrames.find(f => f.status === "generating");
  
  const completedClips = generatedClips.filter(c => c.status === "done").length;
  const totalClips = generatedClips.length;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white">
          <Film size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">Video Generation</h4>
          <p className="text-xs text-gray-500">
            {phase === "frames" && "Creating keyframes..."}
            {phase === "clips" && "Animating video clips..."}
            {phase === "stitching" && "Stitching final video..."}
            {phase === "done" && "Video ready!"}
            {!phase && "Preparing..."}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3">
        {/* Step 1: Frames */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
            phase === "frames" 
              ? "bg-orange-500 text-white" 
              : completedFrames === totalFrames 
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-400"
          )}>
            {phase === "frames" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : completedFrames === totalFrames ? (
              <Check size={16} />
            ) : (
              <Image size={16} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Keyframes</span>
              <span className="text-xs text-gray-400">{completedFrames}/{totalFrames}</span>
            </div>
            {phase === "frames" && (
              <div className="mt-1.5 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedFrames / totalFrames) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Clips */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
            phase === "clips" 
              ? "bg-orange-500 text-white" 
              : completedClips === totalClips && totalClips > 0
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-400"
          )}>
            {phase === "clips" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : completedClips === totalClips && totalClips > 0 ? (
              <Check size={16} />
            ) : (
              <Film size={16} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Video Clips</span>
              <span className="text-xs text-gray-400">{completedClips}/{totalClips || totalFrames}</span>
            </div>
            {phase === "clips" && (
              <div className="mt-1.5 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedClips / (totalClips || 1)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Stitching */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
            phase === "stitching" 
              ? "bg-orange-500 text-white" 
              : phase === "done"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-400"
          )}>
            {phase === "stitching" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : phase === "done" ? (
              <Check size={16} />
            ) : (
              <Scissors size={16} />
            )}
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">Final Video</span>
          </div>
        </div>
      </div>

      {/* Frame Previews (when available) */}
      {completedFrames > 0 && phase === "frames" && (
        <div className="pt-3 border-t border-orange-100">
          <p className="text-xs text-gray-400 mb-2">Latest frames:</p>
          <div className="flex gap-2 overflow-x-auto">
            {generatedFrames
              .filter(f => f.startFrameUrl)
              .slice(-3)
              .map((frame, i) => (
                <img
                  key={frame.clipId}
                  src={frame.startFrameUrl!}
                  alt={`Frame ${i + 1}`}
                  className="w-20 h-12 object-cover rounded-lg border border-orange-200"
                />
              ))}
          </div>
        </div>
      )}

      {/* Final Video Preview */}
      {phase === "done" && videoUrl && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-3 border-t border-orange-100"
        >
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl text-white hover:opacity-90 transition-opacity"
          >
            <Play size={20} />
            <span className="font-medium">Watch Your Video</span>
          </a>
        </motion.div>
      )}
    </div>
  );
}
