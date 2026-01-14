"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Download,
    Play,
    Pause,
    Maximize2,
    Volume2,
    VolumeX,
    ChevronLeft,
    ChevronRight,
    Film
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoViewerProps {
    /** Main video URL (or first clip URL for stitched videos) */
    videoUrl: string;
    /** All individual clip URLs for navigation */
    clipUrls?: string[];
    /** Total duration in seconds */
    totalDuration?: number;
    /** Whether to show as modal or inline */
    mode?: "modal" | "inline";
    /** Callback when modal is closed */
    onClose?: () => void;
    /** Aspect ratio for sizing (e.g., "16:9" or "9:16") */
    aspectRatio?: string;
}

/**
 * VideoViewer Component
 * A proper video player with controls, download functionality, and clip navigation.
 */
export function VideoViewer({
    videoUrl,
    clipUrls = [],
    totalDuration,
    mode = "inline",
    onClose,
    aspectRatio = "9:16",
}: VideoViewerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentClipIndex, setCurrentClipIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Determine current video source
    const allClips = clipUrls.length > 0 ? clipUrls : [videoUrl];
    const currentVideoUrl = allClips[currentClipIndex];

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(prog);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = percent * videoRef.current.duration;
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (!document.fullscreenElement) {
                videoRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(currentVideoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `video_clip_${currentClipIndex + 1}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            // Fallback: open in new tab
            window.open(currentVideoUrl, "_blank");
        }
    };

    const handleDownloadAll = async () => {
        // Download each clip sequentially
        for (let i = 0; i < allClips.length; i++) {
            try {
                const response = await fetch(allClips[i]);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `video_clip_${i + 1}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error(`Failed to download clip ${i + 1}:`, error);
            }
        }
    };

    const nextClip = () => {
        if (currentClipIndex < allClips.length - 1) {
            setCurrentClipIndex(currentClipIndex + 1);
            setIsPlaying(false);
            setProgress(0);
        }
    };

    const prevClip = () => {
        if (currentClipIndex > 0) {
            setCurrentClipIndex(currentClipIndex - 1);
            setIsPlaying(false);
            setProgress(0);
        }
    };

    // Parse aspect ratio for sizing
    const [arW, arH] = aspectRatio.split(":").map(Number);
    const isVertical = arH > arW;

    const videoContent = (
        <div className={cn(
            "relative bg-black rounded-2xl overflow-hidden shadow-2xl",
            isVertical ? "max-w-[320px]" : "max-w-[560px]",
            mode === "modal" && "mx-auto"
        )}>
            {/* Video Element */}
            <div
                className="relative"
                style={{ aspectRatio: `${arW}/${arH}` }}
            >
                <video
                    ref={videoRef}
                    src={currentVideoUrl}
                    className="w-full h-full object-cover"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    playsInline
                />

                {/* Play/Pause Overlay */}
                <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                >
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        {isPlaying ? (
                            <Pause size={28} className="text-gray-800" />
                        ) : (
                            <Play size={28} className="text-gray-800 ml-1" />
                        )}
                    </div>
                </button>

                {/* Top Controls */}
                {mode === "modal" && onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress Bar */}
                <div
                    className="h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
                    onClick={handleSeek}
                >
                    <motion.div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={togglePlay}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                        </button>

                        <button
                            onClick={toggleMute}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>

                        {totalDuration && (
                            <span className="text-xs text-white/70 font-medium ml-2">
                                {Math.round(totalDuration)}s
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                            title="Download current clip"
                        >
                            <Download size={16} />
                        </button>

                        <button
                            onClick={toggleFullscreen}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        >
                            <Maximize2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Clip Navigation (if multiple clips) */}
            {allClips.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 pointer-events-none">
                    <button
                        onClick={prevClip}
                        disabled={currentClipIndex === 0}
                        className={cn(
                            "w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white pointer-events-auto transition-all",
                            currentClipIndex === 0 ? "opacity-30" : "hover:bg-black/70"
                        )}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={nextClip}
                        disabled={currentClipIndex === allClips.length - 1}
                        className={cn(
                            "w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white pointer-events-auto transition-all",
                            currentClipIndex === allClips.length - 1 ? "opacity-30" : "hover:bg-black/70"
                        )}
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}

            {/* Clip Indicator */}
            {allClips.length > 1 && (
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/50 text-white text-xs font-medium flex items-center gap-1.5">
                    <Film size={12} />
                    <span>Clip {currentClipIndex + 1}/{allClips.length}</span>
                </div>
            )}
        </div>
    );

    // Render as modal or inline
    if (mode === "modal") {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && onClose) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {videoContent}

                        {/* Download All Button (for multiple clips) */}
                        {allClips.length > 1 && (
                            <button
                                onClick={handleDownloadAll}
                                className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <Download size={18} />
                                Download All Clips
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return videoContent;
}

export default VideoViewer;
