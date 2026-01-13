"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, Maximize2 } from "lucide-react";

interface ImageViewerProps {
  imageUrl: string;
  imageId: string;
  imageIndex: number; // 1, 2, 3... for @image1, @image2, etc.
  prompt: string;
  onRequestEdit?: (imageReference: string) => void; // Returns @image1, @image2, etc.
}

export function ImageViewer({ imageUrl, imageId, imageIndex, prompt, onRequestEdit }: ImageViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group rounded-xl overflow-hidden border border-black/[0.05] bg-white shadow-sm max-w-sm"
      >
        <img src={imageUrl} alt={prompt} className="w-full h-auto" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-xs truncate max-w-[60%]">{prompt}</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
              title="Expand"
            >
              <Maximize2 size={14} className="text-white" />
            </button>
            {onRequestEdit && (
              <button
                onClick={() => onRequestEdit(`@image${imageIndex}`)}
                className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                title="Edit image"
              >
                <Pencil size={14} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={imageUrl} alt={prompt} className="max-w-full max-h-[90vh] rounded-xl" />
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute -top-3 -right-3 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 max-w-[70%] truncate">
                  {prompt}
                </p>
                {onRequestEdit && (
                  <button
                    onClick={() => { onRequestEdit(`@image${imageIndex}`); setIsExpanded(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
