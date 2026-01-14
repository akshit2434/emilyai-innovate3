"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Send, ChevronLeft, ChevronRight } from "lucide-react";
import type { VideoWorkflowState } from "@/lib/videoAgent";
import { cn } from "@/lib/utils";
import { CinematicMessage } from "@/components/chat/CinematicMessage";
import { GenerationProgress } from "@/components/video/GenerationProgress";

interface VideoModeMessage {
  role: string;
  content: string;
}

interface VideoSubgraphViewProps {
  workflow: VideoWorkflowState;
  messages: VideoModeMessage[];
  streamingText: string;
  isLoading: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

const getStageInfo = (stage: string, generationPhase?: string) => {
  const stageMap: Record<string, { title: string; step: number; description: string }> = {
    storyline: {
      title: "Storyline",
      step: 1,
      description: "Review and refine the video concept",
    },
    storyboard: {
      title: "Storyboard",
      step: 2,
      description: "Edit the clip sequence",
    },
    generating: {
      title: "Generating",
      step: 3,
      description: generationPhase === "frames"
        ? "Creating keyframes..."
        : generationPhase === "clips"
          ? "Animating video clips..."
          : generationPhase === "stitching"
            ? "Stitching final video..."
            : "Creating video...",
    },
    complete: {
      title: "Complete",
      step: 4,
      description: "Your video is ready",
    },
    cancelled: {
      title: "Cancelled",
      step: 0,
      description: "Workflow cancelled",
    },
  };
  return stageMap[stage] || stageMap.storyline;
};

export function VideoSubgraphView({
  workflow,
  messages,
  streamingText,
  isLoading,
  onClose,
  onSendMessage,
}: VideoSubgraphViewProps) {
  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const stage = getStageInfo(workflow.stage, workflow.generationPhase);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-orange-50"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-video-mode-orange-grid opacity-100 pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm border border-orange-200 text-gray-700 hover:bg-white transition-colors shadow-sm"
          >
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">Back to Chat</span>
          </button>

          {/* Stage Indicator */}
          <div className="flex items-center gap-4 px-5 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-orange-200">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 animate-pulse" />
            <span className="text-sm font-semibold text-orange-600 tracking-wide uppercase">
              Video Ad
            </span>
            <div className="w-px h-4 bg-orange-200" />
            <span className="text-sm text-gray-600 font-medium">
              {stage.title}
            </span>
            <div className="flex items-center gap-1 ml-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-8 h-1.5 rounded-full transition-all duration-300",
                    step <= stage.step
                      ? "bg-gradient-to-r from-orange-500 to-orange-600"
                      : "bg-orange-100"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Placeholder for symmetry */}
          <div className="w-32" />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="h-full pt-20 pb-40 overflow-hidden">
        <div className="h-full max-w-3xl mx-auto px-6 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin">
            {/* Stage Content Panel - Shown as first message */}
            {workflow.stage === "storyline" && workflow.storyline && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  E
                </div>
                <div className="flex-1">
                  <StorylineDisplay storyline={workflow.storyline} />
                </div>
              </motion.div>
            )}
            {(workflow.stage === "storyboard" || workflow.stage === "generating" || workflow.stage === "complete") &&
              workflow.storyboard && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    E
                  </div>
                  <div className="flex-1">
                    <StoryboardDisplay
                      storyboard={workflow.storyboard}
                      generatedFrames={workflow.generatedFrames}
                      isGenerating={workflow.stage === "generating"}
                    />
                  </div>
                </motion.div>
              )}

            {/* User/AI Chat Messages */}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="flex items-start gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      E
                    </div>
                    <div className="flex-1">
                      <CinematicMessage
                        content={msg.content}
                        isAssistant={true}
                        isLoaded={true}
                        isVideoMode={true}
                      />
                    </div>
                  </div>
                ) : (
                  <CinematicMessage
                    content={msg.content}
                    isAssistant={false}
                    isLoaded={true}
                    isVideoMode={true}
                  />
                )}
              </motion.div>
            ))}

            {/* Streaming/Loading */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Loader2 size={14} className="text-white animate-spin" />
                </div>
                <div className="flex-1">
                  <CinematicMessage
                    content={streamingText || "Thinking..."}
                    isAssistant={true}
                    isLoaded={false}
                    isVideoMode={true}
                  />
                </div>
              </motion.div>
            )}

            {/* Generation Progress - shown inline in chat when generating/complete */}
            {(workflow.stage === "generating" || workflow.stage === "complete") && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  E
                </div>
                <div className="flex-1">
                  <GenerationProgress
                    phase={workflow.generationPhase}
                    generatedFrames={workflow.generatedFrames || []}
                    generatedClips={workflow.generatedClips || []}
                    videoUrl={workflow.videoUrl}
                    aspectRatio={workflow.aspectRatio || workflow.storyline?.aspectRatio || "9:16"}
                  />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-white rounded-2xl border-2 border-orange-200 shadow-lg p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                workflow.stage === "storyline"
                  ? "Give feedback or say 'continue' to proceed..."
                  : workflow.stage === "storyboard"
                    ? "Edit clips or say 'looks good' to generate..."
                    : workflow.stage === "generating"
                      ? "Generating frames... You can still chat!"
                      : "Your video is ready!"
              }
              disabled={isLoading}
              rows={1}
              className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-sm resize-none max-h-32 placeholder:text-gray-400"
              style={{ height: "44px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "44px";
                target.style.height = Math.min(target.scrollHeight, 128) + "px";
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
                input.trim() && !isLoading
                  ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              <Send size={18} />
            </motion.button>
          </div>
          <p className="text-center text-[10px] text-orange-400 mt-2">
            <span className="opacity-70">⏎ send</span>
            <span className="mx-2">·</span>
            <span className="opacity-70">⇧⏎ new line</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Stage Display Components
// ============================================================================

interface StorylineDisplayProps {
  storyline: {
    theme: string;
    hook: string;
    narrative: string;
    estimatedDuration: number;
    targetPlatform: string;
  };
}

function StorylineDisplay({ storyline }: StorylineDisplayProps) {
  return (
    <div className="rounded-2xl p-5 bg-white border-2 border-orange-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        <span className="text-xs font-bold text-orange-600 tracking-wider uppercase">
          Storyline
        </span>
      </div>
      <h4 className="font-semibold text-gray-900 text-lg mb-2">
        {storyline.theme}
      </h4>
      <p className="text-gray-600 text-sm italic mb-3 leading-relaxed">
        "{storyline.hook}"
      </p>
      <p className="text-gray-500 text-sm leading-relaxed">
        {storyline.narrative}
      </p>
      <div className="flex gap-4 mt-4 pt-3 border-t border-orange-100">
        <span className="text-xs text-gray-400 font-medium">
          ~{storyline.estimatedDuration}s duration
        </span>
        <span className="text-xs text-gray-400 font-medium capitalize">
          {storyline.targetPlatform}
        </span>
      </div>
    </div>
  );
}

interface StoryboardDisplayProps {
  storyboard: {
    clips: Array<{
      id: string;
      index: number;
      duration: number;
      description: string;
    }>;
    totalDuration: number;
  };
  generatedFrames: Array<{
    clipId: string;
    startFrameUrl: string | null;
    endFrameUrl: string | null;
    status: string;
  }>;
  isGenerating: boolean;
}

function StoryboardDisplay({ storyboard, generatedFrames, isGenerating }: StoryboardDisplayProps) {
  return (
    <div className="rounded-2xl p-5 bg-white border-2 border-orange-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span className="text-xs font-bold text-orange-600 tracking-wider uppercase">
            Storyboard
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {storyboard.clips.length} clips · {storyboard.totalDuration}s total
        </span>
      </div>

      <div className="space-y-2">
        {storyboard.clips.map((clip) => {
          const frameData = generatedFrames.find((f) => f.clipId === clip.id);
          const isClipGenerating = isGenerating && frameData?.status === "generating";
          const isClipDone = frameData?.status === "done";

          return (
            <div
              key={clip.id}
              className={cn(
                "flex gap-3 p-3 rounded-xl border transition-colors",
                isClipDone
                  ? "bg-green-50/50 border-green-200"
                  : isClipGenerating
                    ? "bg-orange-50/50 border-orange-200"
                    : "bg-orange-50/30 border-orange-100"
              )}
            >
              {/* Clip Number */}
              <div
                className={cn(
                  "w-8 h-8 rounded-lg text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm",
                  isClipDone
                    ? "bg-green-500"
                    : "bg-gradient-to-br from-orange-500 to-orange-600"
                )}
              >
                {isClipGenerating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  clip.index
                )}
              </div>

              {/* Clip Info */}
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {clip.description}
                </p>
                <span className="text-xs text-orange-500 font-medium">
                  {clip.duration}s
                </span>
              </div>

              {/* Frame Preview (if generated) */}
              {frameData?.startFrameUrl && (
                <div className="flex gap-1">
                  <img
                    src={frameData.startFrameUrl}
                    alt="Start frame"
                    className="w-12 h-8 object-cover rounded"
                  />
                  {frameData.endFrameUrl && (
                    <img
                      src={frameData.endFrameUrl}
                      alt="End frame"
                      className="w-12 h-8 object-cover rounded"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
