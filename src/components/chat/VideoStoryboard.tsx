"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Check, 
  RefreshCw, 
  Clock, 
  Film, 
  Sparkles,
  ChevronRight,
  Loader2,
  Video
} from "lucide-react";
import type { VideoWorkflowState, VideoClip, FramePrompt, GeneratedFrame } from "@/lib/videoAgent";

interface VideoStoryboardProps {
  workflow: VideoWorkflowState;
  onApprove: () => void;
  onRegenerate: () => void;
  isLoading?: boolean;
}

export function VideoStoryboard({ 
  workflow, 
  onApprove, 
  onRegenerate,
  isLoading = false 
}: VideoStoryboardProps) {
  const [frameLoadingStates, setFrameLoadingStates] = useState<Record<string, boolean>>({});

  // Mock loading effect for frames
  useEffect(() => {
    if (workflow.stage === "frame_prompts" || workflow.stage === "generating") {
      const clipIds = workflow.storyboard?.clips.map(c => c.id) || [];
      
      // Simulate staggered loading
      clipIds.forEach((clipId, index) => {
        setTimeout(() => {
          setFrameLoadingStates(prev => ({ ...prev, [clipId]: true }));
        }, (index + 1) * (Math.random() * 2000 + 1500)); // 1.5-3.5s per frame
      });
    }
  }, [workflow.stage, workflow.storyboard]);

  const stageProgress = {
    storyline: 1,
    storyboard: 2,
    frame_prompts: 3,
    generating: 4,
    complete: 5,
  };

  const currentProgress = stageProgress[workflow.stage] || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl border border-orange-200/50 overflow-hidden max-w-lg"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3 flex items-center gap-2">
        <Video size={16} className="text-white" />
        <span className="text-white text-sm font-medium">Video Ad Workflow</span>
        <div className="ml-auto flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-colors ${
                step <= currentProgress ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content based on stage */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Storyline Stage */}
          {workflow.stage === "storyline" && workflow.storyline && (
            <motion.div
              key="storyline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs text-orange-600 font-medium">
                <Sparkles size={12} />
                STORYLINE CONCEPT
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Theme</p>
                  <p className="text-sm font-medium text-gray-800">{workflow.storyline.theme}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Hook (First 3s)</p>
                  <p className="text-sm text-gray-600 italic">"{workflow.storyline.hook}"</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Narrative</p>
                  <p className="text-sm text-gray-600">{workflow.storyline.narrative}</p>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{workflow.storyline.estimatedDuration}s</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Film size={12} />
                    <span className="capitalize">{workflow.storyline.targetPlatform}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onApprove}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Approve & Continue
                </button>
                <button
                  onClick={onRegenerate}
                  disabled={isLoading}
                  className="px-4 py-2.5 border border-orange-200 text-orange-600 text-sm font-medium rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Storyboard Stage */}
          {workflow.stage === "storyboard" && workflow.storyboard && (
            <motion.div
              key="storyboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs text-orange-600 font-medium">
                <Film size={12} />
                CLIP BREAKDOWN
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                {workflow.storyboard.clips.map((clip, index) => (
                  <motion.div
                    key={clip.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-2 rounded-lg bg-white/60 border border-orange-100"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">{clip.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
                          {clip.duration}s
                        </span>
                        {clip.isContinuation && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <ChevronRight size={10} />
                            continuation
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-orange-100">
                <span className="text-xs text-gray-500">
                  Total: {workflow.storyboard.totalDuration}s • {workflow.storyboard.clips.length} clips
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onApprove}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Approve & Generate
                </button>
                <button
                  onClick={onRegenerate}
                  disabled={isLoading}
                  className="px-4 py-2.5 border border-orange-200 text-orange-600 text-sm font-medium rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Generating Stage */}
          {(workflow.stage === "frame_prompts" || workflow.stage === "generating") && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs text-orange-600 font-medium">
                <Sparkles size={12} className="animate-pulse" />
                GENERATING FRAMES
              </div>

              {/* Frame Grid */}
              <div className="grid grid-cols-4 gap-2">
                {workflow.storyboard?.clips.map((clip, index) => (
                  <motion.div
                    key={clip.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="aspect-[9/16] rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative"
                  >
                    {frameLoadingStates[clip.id] ? (
                      <img
                        src={workflow.generatedFrames?.[index]?.endFrameUrl || `https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&q=60`}
                        alt={`Clip ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 size={16} className="text-gray-400 animate-spin" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/50 rounded text-[8px] text-white font-medium">
                      {clip.duration}s
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center text-xs text-gray-500">
                Generating frames... This may take a moment
              </div>
            </motion.div>
          )}

          {/* Complete Stage */}
          {workflow.stage === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                <Check size={12} />
                VIDEO READY
              </div>

              {/* Mock Video Preview */}
              <div className="aspect-[9/16] rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden relative max-w-[200px] mx-auto">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                    <Play size={28} className="text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-white rounded-full" />
                  </div>
                  <p className="text-[10px] text-white/60 mt-1 text-center">
                    {workflow.storyboard?.totalDuration || 40}s • {workflow.storyboard?.clips.length || 7} clips
                  </p>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                Your video ad is ready! 🎬
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
