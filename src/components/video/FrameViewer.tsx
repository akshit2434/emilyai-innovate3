"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Download,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    ZoomIn
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FrameData {
    url: string;
    clipId: string;
    frameType: "start" | "end";
    clipIndex?: number;
}

interface FrameViewerProps {
    /** All frames to display */
    frames: FrameData[];
    /** Initially selected frame index */
    initialIndex?: number;
    /** Callback when viewer is closed */
    onClose: () => void;
    /** Aspect ratio for sizing */
    aspectRatio?: string;
}

/**
 * FrameViewer Component
 * A lightbox for viewing generated frames with download functionality.
 */
export function FrameViewer({
    frames,
    initialIndex = 0,
    onClose,
    aspectRatio = "9:16",
}: FrameViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const currentFrame = frames[currentIndex];

    const handleDownload = async () => {
        if (!currentFrame) return;

        try {
            const response = await fetch(currentFrame.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `frame_clip${currentFrame.clipIndex || currentIndex + 1}_${currentFrame.frameType}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            // Fallback: open in new tab
            window.open(currentFrame.url, "_blank");
        }
    };

    const handleDownloadAll = async () => {
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            try {
                const response = await fetch(frame.url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `frame_clip${frame.clipIndex || i + 1}_${frame.frameType}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error(`Failed to download frame ${i + 1}:`, error);
            }
        }
    };

    const nextFrame = () => {
        if (currentIndex < frames.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const prevFrame = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Handle keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") nextFrame();
            if (e.key === "ArrowLeft") prevFrame();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex, frames.length]);

    // Parse aspect ratio
    const [arW, arH] = aspectRatio.split(":").map(Number);
    const isVertical = arH > arW;

    if (!currentFrame) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative max-w-4xl w-full flex flex-col items-center"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Frame Info Badge */}
                    <div className="absolute -top-12 left-0 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium flex items-center gap-2">
                        <ImageIcon size={14} />
                        <span>
                            Clip {currentFrame.clipIndex || Math.ceil((currentIndex + 1) / 2)} • {currentFrame.frameType === "start" ? "Start" : "End"} Frame
                        </span>
                    </div>

                    {/* Main Image Container */}
                    <div
                        className={cn(
                            "relative rounded-2xl overflow-hidden bg-gray-900 shadow-2xl",
                            isVertical ? "max-h-[70vh]" : "max-w-full"
                        )}
                        style={{ aspectRatio: `${arW}/${arH}` }}
                    >
                        <img
                            src={currentFrame.url}
                            alt={`Clip ${currentFrame.clipIndex || currentIndex + 1} ${currentFrame.frameType} frame`}
                            className="w-full h-full object-cover"
                        />

                        {/* Navigation Arrows */}
                        {frames.length > 1 && (
                            <>
                                <button
                                    onClick={prevFrame}
                                    disabled={currentIndex === 0}
                                    className={cn(
                                        "absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white transition-all",
                                        currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-black/70"
                                    )}
                                >
                                    <ChevronLeft size={28} />
                                </button>
                                <button
                                    onClick={nextFrame}
                                    disabled={currentIndex === frames.length - 1}
                                    className={cn(
                                        "absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white transition-all",
                                        currentIndex === frames.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-black/70"
                                    )}
                                >
                                    <ChevronRight size={28} />
                                </button>
                            </>
                        )}

                        {/* Frame Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm font-medium">
                            {currentIndex + 1} / {frames.length}
                        </div>
                    </div>

                    {/* Thumbnail Strip */}
                    {frames.length > 1 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto max-w-full pb-2">
                            {frames.map((frame, index) => (
                                <button
                                    key={`${frame.clipId}-${frame.frameType}`}
                                    onClick={() => setCurrentIndex(index)}
                                    className={cn(
                                        "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                                        index === currentIndex
                                            ? "border-orange-500 scale-110"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <img
                                        src={frame.url}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleDownload}
                            className="px-5 py-2.5 rounded-xl bg-white text-gray-900 font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors"
                        >
                            <Download size={18} />
                            Download Frame
                        </button>

                        {frames.length > 1 && (
                            <button
                                onClick={handleDownloadAll}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <Download size={18} />
                                Download All ({frames.length})
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * FrameThumbnail Component
 * A small clickable thumbnail that opens the FrameViewer
 */
interface FrameThumbnailProps {
    url: string;
    clipId: string;
    frameType: "start" | "end";
    clipIndex?: number;
    aspectRatio?: string;
    allFrames?: FrameData[];
    onClick?: () => void;
}

export function FrameThumbnail({
    url,
    clipId,
    frameType,
    clipIndex,
    aspectRatio = "9:16",
    allFrames,
    onClick,
}: FrameThumbnailProps) {
    const [showViewer, setShowViewer] = useState(false);

    // Parse aspect ratio for thumbnail
    const [arW, arH] = aspectRatio.split(":").map(Number);
    const isVertical = arH > arW;

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            setShowViewer(true);
        }
    };

    const frames = allFrames || [{ url, clipId, frameType, clipIndex }];
    const currentFrameIndex = frames.findIndex(
        (f) => f.url === url && f.clipId === clipId && f.frameType === frameType
    );

    return (
        <>
            <button
                onClick={handleClick}
                className={cn(
                    "relative group rounded-lg overflow-hidden border border-orange-200 hover:border-orange-400 transition-all hover:scale-105",
                    isVertical ? "w-12 h-20" : "w-20 h-12"
                )}
            >
                <img
                    src={url}
                    alt={`${frameType} frame`}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn
                        size={16}
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </div>
                <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/50 text-white px-1 rounded">
                    {frameType === "start" ? "S" : "E"}
                </span>
            </button>

            {showViewer && (
                <FrameViewer
                    frames={frames}
                    initialIndex={currentFrameIndex >= 0 ? currentFrameIndex : 0}
                    onClose={() => setShowViewer(false)}
                    aspectRatio={aspectRatio}
                />
            )}
        </>
    );
}

export default FrameViewer;
