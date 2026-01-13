"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { createProduct } from "@/app/actions/products";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProductModal({ isOpen, onClose }: CreateProductModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !description) return;

    setIsLoading(true);
    try {
      await createProduct(name, description);
      onClose();
      setName("");
      setDescription("");
    } catch (error) {
      console.error(error);
      alert("Failed to create product");
    } finally {
      setIsLoading(false);
    }
  }

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
            className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-black/[0.04] overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-[var(--font-playfair)] font-medium">Create Product</h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <X size={20} className="text-[#1a1a1a]/40" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-[var(--font-jetbrains)] font-medium uppercase tracking-widest text-[#1a1a1a]/40 mb-2">
                  Product Name
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. EcoInnovate"
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.06] bg-black/[0.02] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-[var(--font-jetbrains)] font-medium uppercase tracking-widest text-[#1a1a1a]/40 mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this product about?"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.06] bg-black/[0.02] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all font-medium resize-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                type="submit"
                className="w-full py-4 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 hover:shadow-xl transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Create Product"}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
