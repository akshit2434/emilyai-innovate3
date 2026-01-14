"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, Film, Image, Scissors, Play, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoViewer } from "./VideoViewer";
import { FrameThumbnail } from "./FrameViewer";

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
  /** All individual clip URLs for video player */
  clipUrls?: string[];
  /** Total duration of video */
  totalDuration?: number;
  /** Aspect ratio for proper sizing */
  aspectRatio?: string;
}

export function GenerationProgress({
  phase,
  generatedFrames,
  generatedClips = [],
  videoUrl,
  clipUrls = [],
  totalDuration,
  aspectRatio = "9:16",
}: GenerationProgressProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);

  const completedFrames = generatedFrames.filter(f => f.status === "done").length;
  const totalFrames = generatedFrames.length;

  const completedClips = generatedClips.filter(c => c.status === "done").length;
  const totalClipsCount = generatedClips.length;

  // Build frame data for viewer
  const allFrameData = generatedFrames
    .filter(f => f.startFrameUrl || f.endFrameUrl)
    .flatMap((f, idx) => {
      const frames = [];
      if (f.startFrameUrl) {
        frames.push({
          url: f.startFrameUrl,
          clipId: f.clipId,
          frameType: "start" as const,
          clipIndex: idx + 1,
        });
      }
      if (f.endFrameUrl) {
        frames.push({
          url: f.endFrameUrl,
          clipId: f.clipId,
          frameType: "end" as const,
          clipIndex: idx + 1,
        });
      }
      return frames;
    });

  // Get clip URLs for video viewer
  const allClipUrls = clipUrls.length > 0
    ? clipUrls
    : generatedClips.filter(c => c.videoUrl).map(c => c.videoUrl!);

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
              : completedFrames === totalFrames && totalFrames > 0
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-400"
          )}>
            {phase === "frames" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : completedFrames === totalFrames && totalFrames > 0 ? (
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
            {phase === "frames" && totalFrames > 0 && (
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
              : completedClips === totalClipsCount && totalClipsCount > 0
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-400"
          )}>
            {phase === "clips" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : completedClips === totalClipsCount && totalClipsCount > 0 ? (
              <Check size={16} />
            ) : (
              <Film size={16} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Video Clips</span>
              <span className="text-xs text-gray-400">{completedClips}/{totalClipsCount || totalFrames}</span>
            </div>
            {phase === "clips" && totalClipsCount > 0 && (
              <div className="mt-1.5 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedClips / totalClipsCount) * 100}%` }}
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

      {/* Frame Previews (when available) - Enhanced with FrameThumbnail */}
      {allFrameData.length > 0 && (phase === "frames" || phase === "clips") && (
        <div className="pt-3 border-t border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Generated frames:</p>
            <span className="text-xs text-orange-500 font-medium">Click to view</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allFrameData.slice(-6).map((frame, i) => (
              <FrameThumbnail
                key={`${frame.clipId}-${frame.frameType}`}
                url={frame.url}
                clipId={frame.clipId}
                frameType={frame.frameType}
                clipIndex={frame.clipIndex}
                aspectRatio={aspectRatio}
                allFrames={allFrameData}
              />
            ))}
          </div>
        </div>
      )}

      {/* Clip Previews During Clip Generation */}
      {phase === "clips" && generatedClips.filter(c => c.videoUrl).length > 0 && (
        <div className="pt-3 border-t border-orange-100">
          <p className="text-xs text-gray-400 mb-2">Generated clips:</p>
          <div className="flex gap-2 flex-wrap">
            {generatedClips.filter(c => c.videoUrl).map((clip, i) => (
              <button
                key={clip.clipId}
                onClick={async () => {
                  // Download clip
                  try {
                    const response = await fetch(clip.videoUrl!);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `clip_${i + 1}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } catch {
                    window.open(clip.videoUrl!, "_blank");
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1.5 hover:bg-green-200 transition-colors"
              >
                <Film size={12} />
                Clip {i + 1}
                <Download size={10} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Final Video Preview - Using VideoViewer */}
      {phase === "done" && (videoUrl || allClipUrls.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-3 border-t border-orange-100 space-y-3"
        >
          {/* Inline Video Player */}
          <VideoViewer
            videoUrl={videoUrl || allClipUrls[0]}
            clipUrls={allClipUrls}
            totalDuration={totalDuration}
            aspectRatio={aspectRatio}
            mode="inline"
          />

          {/* Expand to Modal Button */}
          <button
            onClick={() => setShowVideoModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-orange-200 rounded-xl text-orange-600 font-medium hover:bg-orange-50 transition-colors"
          >
            <Play size={16} />
            Open Full Viewer
          </button>
        </motion.div>
      )}

      {/* Video Modal */}
      {showVideoModal && (videoUrl || allClipUrls.length > 0) && (
        <VideoViewer
          videoUrl={videoUrl || allClipUrls[0]}
          clipUrls={allClipUrls}
          totalDuration={totalDuration}
          aspectRatio={aspectRatio}
          mode="modal"
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </div>
  );
}
