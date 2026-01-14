"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Clock, CheckCircle, Loader2 } from "lucide-react";
import type { VideoWorkflowState } from "@/lib/videoAgent";
import { cn } from "@/lib/utils";

interface VideoWorkflowCardProps {
  workflow: VideoWorkflowState;
  onExpand: () => void;
}

const stageConfig = {
  storyline: { label: "Storyline", step: 1, color: "orange" },
  storyboard: { label: "Storyboard", step: 2, color: "orange" },
  generating: { label: "Generating", step: 3, color: "orange" },
  complete: { label: "Complete", step: 4, color: "green" },
  cancelled: { label: "Cancelled", step: 0, color: "gray" },
};

export function VideoWorkflowCard({ workflow, onExpand }: VideoWorkflowCardProps) {
  const config = stageConfig[workflow.stage] || stageConfig.storyline;
  const isComplete = workflow.stage === "complete";
  const isCancelled = workflow.stage === "cancelled";
  const isInProgress = !isComplete && !isCancelled;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-2xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg",
        isComplete
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300"
          : isCancelled
          ? "bg-gray-50 border-gray-200"
          : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300"
      )}
      onClick={onExpand}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isComplete
                ? "bg-green-500"
                : isCancelled
                ? "bg-gray-400"
                : "bg-gradient-to-br from-orange-500 to-orange-600"
            )}
          >
            {isComplete ? (
              <CheckCircle size={20} className="text-white" />
            ) : isInProgress ? (
              <Play size={20} className="text-white fill-white" />
            ) : (
              <Clock size={16} className="text-white" />
            )}
          </div>

          {/* Title & Status */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Video Ad</h4>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  isComplete
                    ? "text-green-600"
                    : isCancelled
                    ? "text-gray-500"
                    : "text-orange-600"
                )}
              >
                {config.label}
              </span>
              {isInProgress && (
                <Loader2 size={10} className="animate-spin text-orange-500" />
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                "w-6 h-1.5 rounded-full transition-colors",
                step <= config.step
                  ? isComplete
                    ? "bg-green-500"
                    : isCancelled
                    ? "bg-gray-300"
                    : "bg-orange-500"
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content Preview */}
      <div className="px-4 pb-3">
        {workflow.storyline && (
          <p className="text-xs text-gray-600 line-clamp-2">
            <span className="font-medium">{workflow.storyline.theme}</span>
            {" — "}
            {workflow.storyline.hook}
          </p>
        )}

        {/* Clips count if in storyboard+ */}
        {workflow.storyboard && workflow.stage !== "storyline" && (
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{workflow.storyboard.clips.length} clips</span>
            <span>·</span>
            <span>{workflow.storyboard.totalDuration}s</span>
          </div>
        )}
      </div>

      {/* Footer - Click hint */}
      <div
        className={cn(
          "px-4 py-2 text-xs font-medium text-center",
          isComplete
            ? "bg-green-100 text-green-700"
            : isCancelled
            ? "bg-gray-100 text-gray-500"
            : "bg-orange-100 text-orange-700"
        )}
      >
        {isComplete
          ? "View Video →"
          : isCancelled
          ? "Cancelled"
          : "Continue Editing →"}
      </div>
    </motion.div>
  );
}
