"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { createProduct } from "@/app/actions/products";
import { cn } from "@/lib/utils";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Tell me about your product",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [productData, setProductData] = useState<{ name?: string; description?: string }>({});
  const [step, setStep] = useState<"ideation" | "confirm" | "done">("ideation");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend() {
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsThinking(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (step === "ideation" && !productData.name) {
      // First message: extract a suggested name
      const words = userMessage.split(" ").filter(w => w.length > 2);
      const suggestedName = words.slice(0, 2).join(" ") || "My Product";
      setProductData({ ...productData, name: suggestedName, description: userMessage });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I'm thinking we call it "${suggestedName}". Does that work for you?`,
        },
      ]);
    } else if (step === "ideation" && productData.name) {
      // Second message: confirm or update name
      const isConfirmation =
        userMessage.toLowerCase().includes("yes") ||
        userMessage.toLowerCase().includes("perfect") ||
        userMessage.toLowerCase().includes("good") ||
        userMessage.toLowerCase().includes("sure") ||
        userMessage.toLowerCase().includes("ok") ||
        userMessage.toLowerCase().includes("great");

      const confirmedName = isConfirmation ? productData.name : userMessage;
      setProductData({ ...productData, name: confirmedName });
      setStep("done");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `"${confirmedName}" is locked. Setting up your workspace...`,
        },
      ]);

      try {
        const newProduct = await createProduct(confirmedName || "New Product", productData.description || "");
        await new Promise((resolve) => setTimeout(resolve, 800));
        // Navigate to the new product's dashboard
        router.push(`/dashboard/${newProduct?.id || ""}`);
      } catch (error) {
        console.error(error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Something went wrong. Let's try again." },
        ]);
        setStep("ideation");
      }
    }

    setIsThinking(false);
  }

  return (
    <div className="h-screen bg-[#faf9f7] text-[#1a1a1a] flex flex-col font-[var(--font-inter)] overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="blur-orb-orange top-[-200px] right-[-50px] opacity-40" />
      <div className="blur-orb-pink bottom-[5%] left-[-100px] opacity-30" />

      {/* Minimal Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[10px] font-medium text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors uppercase tracking-widest"
        >
          <ArrowLeft size={12} />
          Cancel
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold font-[var(--font-playfair)]">
            E
          </div>
          <span className="text-xs font-medium">New Product</span>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Chat Messages */}
          <div className="mb-8 space-y-8">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className={msg.role === "user" ? "flex justify-end" : ""}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-start gap-4">
                      <div className="assistant-avatar mt-1">
                        <span className="assistant-avatar-initial">E</span>
                      </div>
                      <div className="flex-1">
                        {i === 0 ? (
                          <p className="text-3xl md:text-4xl leading-snug">
                            <span className="font-[var(--font-cormorant)] italic text-[#1a1a1a]/90">Tell me about </span>
                            <span className="font-[var(--font-playfair)] font-medium bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">your product</span>
                            <span className="font-[var(--font-cormorant)] italic text-[#1a1a1a]/90">.</span>
                          </p>
                        ) : (
                          <p className="text-xl md:text-2xl font-[var(--font-cormorant)] font-medium leading-relaxed text-[#1a1a1a]/80">
                            {msg.content}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {msg.role === "user" && (
                    <div className="inline-block max-w-md">
                      <p className="text-base font-medium text-[#1a1a1a]/70 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-black/[0.04] shadow-sm">
                        {msg.content}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
              >
                <div className="assistant-avatar">
                  <Loader2 size={14} className="text-white animate-spin" />
                </div>
                <span className="text-[#1a1a1a]/30 text-xs font-[var(--font-jetbrains)]">thinking...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input */}
          {step !== "done" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="floating-input flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="What are you building?"
                  disabled={isThinking}
                  className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-sm font-medium placeholder:text-[#1a1a1a]/30"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={isThinking || !input.trim()}
                  className={cn("send-button", input.trim() && "has-content")}
                >
                  <Send size={18} />
                </motion.button>
              </div>
              <p className="text-center text-[9px] text-[#1a1a1a]/20 font-[var(--font-jetbrains)] mt-4">
                Emily will help you set up your product workspace
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
