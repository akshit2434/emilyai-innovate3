"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Loader2,
  Search,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { getProductById } from "@/app/actions/products";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
}

const mockChatHistory: ChatHistoryItem[] = [
  { id: "1", title: "Competitor Analysis", date: "Today" },
  { id: "2", title: "Market Trends Q1", date: "Yesterday" },
  { id: "3", title: "Target Audience Research", date: "Jan 10" },
];

export default function ProductChatPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "What would you like to research today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProduct() {
      if (productId) {
        const data = await getProductById(productId);
        setProduct(data);
      }
    }
    loadProduct();
  }, [productId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredHistory = mockChatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleSend() {
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsThinking(true);

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `I'll research "${userMessage}" for ${product?.name || "your product"}. This would connect to the LangGraph agent in production.`,
      },
    ]);

    setIsThinking(false);
  }

  return (
    <div className="h-screen bg-[#faf9f7] text-[#1a1a1a] flex font-[var(--font-inter)] overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-black/[0.04] bg-white/70 backdrop-blur-xl flex flex-col relative z-10">
        <div className="p-3 border-b border-black/[0.04]">
          <Link
            href={`/dashboard/${productId}`}
            className="flex items-center gap-2 text-[10px] font-medium text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors mb-3 uppercase tracking-wider"
          >
            <ArrowLeft size={12} />
            {product?.name || "Product"}
          </Link>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] text-white text-xs font-medium hover:bg-[#2a2a2a] transition-colors">
            <Plus size={12} />
            New Research
          </button>
        </div>

        <div className="px-2 py-2 border-b border-black/[0.04]">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1a1a1a]/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-7 pr-2 py-1.5 rounded-md border border-black/[0.04] bg-black/[0.01] text-[11px] focus:outline-none focus:ring-1 focus:ring-orange-500/30 placeholder:text-[#1a1a1a]/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1 px-1">
          {filteredHistory.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "relative group",
                selectedChatId === chat.id && "chat-item-selected"
              )}
            >
              <button
                onClick={() => setSelectedChatId(chat.id)}
                className="w-full flex items-start gap-2 pl-2 pr-6 py-2 rounded-lg text-left hover:bg-black/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-[11px] font-medium truncate",
                    selectedChatId === chat.id ? "text-[#1a1a1a]" : "text-[#1a1a1a]/60"
                  )}>
                    {chat.title}
                  </p>
                  <p className="text-[9px] text-[#1a1a1a]/30 font-[var(--font-jetbrains)] mt-0.5">{chat.date}</p>
                </div>
              </button>

              <div className="absolute right-1 top-1/2 -translate-y-1/2" ref={openDropdownId === chat.id ? dropdownRef : null}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === chat.id ? null : chat.id);
                  }}
                  className={cn(
                    "p-1 rounded-md transition-all",
                    openDropdownId === chat.id
                      ? "bg-black/[0.05] opacity-100"
                      : "opacity-0 group-hover:opacity-100 hover:bg-black/[0.05]"
                  )}
                >
                  <MoreHorizontal size={12} className="text-[#1a1a1a]/40" />
                </button>

                <AnimatePresence>
                  {openDropdownId === chat.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="dropdown-menu"
                    >
                      <button className="dropdown-item w-full">
                        <Pencil size={12} />
                        Rename
                      </button>
                      <button className="dropdown-item dropdown-item-danger w-full">
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-black/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold font-[var(--font-playfair)]">
              E
            </div>
            <span className="text-[11px] font-medium">Research Agent</span>
          </div>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col relative">
        <div className="blur-orb-orange top-[-150px] right-[5%] opacity-30" />
        <div className="blur-orb-pink bottom-[10%] left-[10%] opacity-20" />

        <div className="flex-1 overflow-y-auto px-8 py-12 pb-40 relative z-10">
          <div className="max-w-2xl mx-auto space-y-8">
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
                        <p className="text-xl md:text-2xl font-[var(--font-cormorant)] font-medium leading-relaxed text-[#1a1a1a]/80">
                          {msg.content}
                        </p>
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
                <span className="text-[#1a1a1a]/30 text-xs font-[var(--font-jetbrains)]">researching...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Input */}
        <div className="floating-input-container">
          <div className="floating-input flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about competitors, market trends, audience..."
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
          <p className="text-center text-[9px] text-[#1a1a1a]/20 font-[var(--font-jetbrains)] mt-3">
            Powered by Gemini 2.5 Flash
          </p>
        </div>
      </main>
    </div>
  );
}
