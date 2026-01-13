"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { chatWithOnboardingAgent } from "@/app/actions/products";
import { cn } from "@/lib/utils";
import { readStreamableValue } from "@ai-sdk/rsc";
import { CinematicMessage } from "@/components/chat/CinematicMessage";

interface Message {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-assistant",
      role: "assistant",
      content: "Tell me about your product",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [step, setStep] = useState<"ideation" | "confirm" | "done">("ideation");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    
    const userMessageId = `user-${Date.now()}`;
    const newMessages: Message[] = [...messages, { id: userMessageId, role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      const streamValue = await chatWithOnboardingAgent(newMessages);
      const assistantMessageId = `assistant-${Date.now()}`;
      
      // Add an empty assistant message to be filled
      setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

      for await (const chunk of readStreamableValue(streamValue)) {
        if (chunk?.content) {
          // Implementing a slight "cinematic delay" for chunk visibility
          // In a real high-throughput scenario, we'd queue these, 
          // but for onboarding, we can just update as they arrive or add a small throttle.
          setMessages((prev) => {
            const next = [...prev];
            const last = next.find(m => m.id === assistantMessageId);
            if (last) {
              last.content = chunk.content;
            }
            return next;
          });
          
          // Small delay to ensure "word-by-word" feel doesn't jitter from too many technical chunks
          await new Promise(r => setTimeout(r, 20));
        }

        if (chunk?.toolResult?.success && chunk.toolResult.productId) {
          setStep("done");
          setTimeout(() => {
            router.push(`/dashboard/${chunk.toolResult.productId}`);
          }, 1500);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: "I encountered a minor glitch in the matrix. Could you repeat that for me?" },
      ]);
    }

    setIsThinking(false);
  }

  return (
    <div className="h-screen bg-[#faf9f7] text-[#1a1a1a] flex flex-col font-[var(--font-inter)] overflow-hidden fixed inset-0">
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
      <main className="flex-1 flex flex-col items-center px-6 relative z-10 overflow-hidden">
        <div className="w-full max-w-2xl h-full flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-8 pt-8 pr-4 -mr-4 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={msg.role === "user" ? "flex justify-end" : ""}
                >
                  {msg.role === "assistant" ? (
                    <div className="flex items-start gap-4">
                      <div className="assistant-avatar mt-1">
                        <span className="assistant-avatar-initial">E</span>
                      </div>
                      <CinematicMessage content={msg.content} isAssistant={true} />
                    </div>
                  ) : (
                    <CinematicMessage content={msg.content} isAssistant={false} />
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
              <div className="floating-input flex items-start gap-2">
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
                  placeholder="What are you building?"
                  disabled={isThinking}
                  rows={1}
                  className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-sm font-medium placeholder:text-[#1a1a1a]/30 resize-none min-h-[44px] max-h-[120px] overflow-y-auto"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={isThinking || !input.trim()}
                  className={cn("send-button mt-1.5", input.trim() && "has-content")}
                >
                  <Send size={18} />
                </motion.button>
              </div>
              <p className="text-center text-[9px] text-[#1a1a1a]/20 font-[var(--font-jetbrains)] mt-3">
                <span className="opacity-60">⏎ send</span>
                <span className="mx-2">·</span>
                <span className="opacity-60">⇧⏎ new line</span>
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
