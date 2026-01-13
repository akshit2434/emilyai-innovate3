"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Loader2,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { getProductById } from "@/app/actions/products";
import { 
  chatWithBrandAgent, 
  getChatSessions, 
  saveChatSession, 
  getChatSessionById, 
  updateChatSession 
} from "@/app/actions/brand";
import { readStreamableValue } from "@ai-sdk/rsc";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { CinematicMessage } from "@/components/chat/CinematicMessage";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export default function ProductChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.productId as string;
  const initialPrompt = searchParams.get("prompt") || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content: "What would you like to research or update today?",
    },
  ]);
  const [input, setInput] = useState(initialPrompt);
  const [isThinking, setIsThinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      if (productId) {
        const [productData, sessionsData] = await Promise.all([
          getProductById(productId),
          getChatSessions(productId),
        ]);
        setProduct(productData);
        setChatHistory(sessionsData || []);

        // Load initial session if param exists
        const sessionId = searchParams.get("session");
        if (sessionId) {
          loadSession(sessionId);
        }
      }
    }
    loadData();
  }, [productId]);

  async function loadSession(sessionId: string) {
    setIsThinking(true);
    try {
      const session = await getChatSessionById(sessionId);
      if (session) {
        setMessages(session.messages.map((m: any, i: number) => ({
          id: `${sessionId}-${i}`,
          role: m.role,
          content: m.content
        })));
        setCurrentSessionId(sessionId);
        setSelectedChatId(sessionId);
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    } finally {
      setIsThinking(false);
    }
  }

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

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  async function handleSend() {
    if (!input.trim() || isThinking || !product) return;

    const userMessage = input.trim();
    setInput("");
    
    const userMessageId = `user-${Date.now()}`;
    const newMessages = [...messages, { id: userMessageId, role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      const streamValue = await chatWithBrandAgent(
        productId,
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        product
      );
      
      const assistantMessageId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

      for await (const chunk of readStreamableValue(streamValue)) {
        if (chunk?.content) {
          setMessages((prev) => {
            const next = [...prev];
            const last = next.find((m) => m.id === assistantMessageId);
            if (last) {
              last.content = chunk.content;
            }
            return next;
          });
        }

        if (chunk?.toolResult?.success) {
          // Refresh product data if brand was updated
          const updatedProduct = await getProductById(productId);
          setProduct(updatedProduct);
        }
      }
      // Save or update chat session after successful conversation
      const finalMessages = await new Promise<Message[]>((resolve) => {
        setMessages((prev) => {
          resolve(prev);
          return prev;
        });
      });
      
      const userMessages = finalMessages.filter(m => m.role === "user");
      if (userMessages.length > 0) {
        try {
          if (currentSessionId) {
            // Update existing session
            await updateChatSession(
              currentSessionId,
              finalMessages.map(m => ({ role: m.role, content: m.content }))
            );
          } else {
            // Create new session
            const title = userMessages[0].content.slice(0, 50) + (userMessages[0].content.length > 50 ? "..." : "");
            const savedSession = await saveChatSession(
              productId,
              title,
              finalMessages.map(m => ({ role: m.role, content: m.content }))
            );
            setCurrentSessionId(savedSession.id);
            setSelectedChatId(savedSession.id);
            setChatHistory(prev => [{ id: savedSession.id, title, created_at: new Date().toISOString() }, ...prev]);
          }
        } catch (err) {
          console.error("Failed to save/update chat session:", err);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    }

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
          <button 
            onClick={() => {
              setMessages([{ id: "initial", role: "assistant", content: "What would you like to research or update today?" }]);
              setSelectedChatId(null);
              setCurrentSessionId(null);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] text-white text-xs font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            <Plus size={12} />
            New Chat
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
          {filteredHistory.length === 0 ? (
            <p className="text-[10px] text-[#1a1a1a]/30 text-center py-4">No chat history yet</p>
          ) : (
            filteredHistory.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "relative group",
                  selectedChatId === chat.id && "chat-item-selected"
                )}
              >
                <button
                  onClick={() => loadSession(chat.id)}
                  className="w-full flex items-start gap-2 pl-2 pr-6 py-2 rounded-lg text-left hover:bg-black/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[11px] font-medium truncate",
                      selectedChatId === chat.id ? "text-[#1a1a1a]" : "text-[#1a1a1a]/60"
                    )}>
                      {chat.title}
                    </p>
                    <p className="text-[9px] text-[#1a1a1a]/30 font-[var(--font-jetbrains)] mt-0.5">
                      {formatDate(chat.created_at)}
                    </p>
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
            ))
          )}
        </div>

        <div className="p-2 border-t border-black/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold font-[var(--font-playfair)]">
              E
            </div>
            <span className="text-[11px] font-medium">Emily</span>
          </div>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col relative">
        <div className="blur-orb-orange top-[-150px] right-[5%] opacity-30" />
        <div className="blur-orb-pink bottom-[10%] left-[10%] opacity-20" />

        <div className="flex-1 overflow-y-auto px-8 py-12 pb-40 relative z-10 scrollbar-thin">
          <div className="max-w-2xl mx-auto space-y-8">
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
        </div>

        {/* Floating Input */}
        <div className="floating-input-container">
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
              placeholder="Ask about competitors, market trends, or update your brand..."
              disabled={isThinking}
              rows={2}
              className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-sm font-medium placeholder:text-[#1a1a1a]/30 resize-none min-h-[60px] max-h-[160px] overflow-y-auto"
              style={{ height: '60px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '60px';
                target.style.height = Math.max(60, Math.min(target.scrollHeight, 160)) + 'px';
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
        </div>
      </main>
    </div>
  );
}
