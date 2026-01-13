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
  updateChatSession,
  initiateVideoWorkflow,
  chatWithVideoAgent,
  generateStoryboardForWorkflow
} from "@/app/actions/brand";
import { readStreamableValue } from "@ai-sdk/rsc";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { CinematicMessage } from "@/components/chat/CinematicMessage";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { ToolStatusPill } from "@/components/chat/ToolStatusPill";
import type { VideoWorkflowState } from "@/lib/videoAgent";

const DEBUG = true;
function debugLog(...args: any[]) {
  if (DEBUG) console.log("[VIDEO MODE]", ...args);
}

type ToolStatus = "processing" | "done" | "failed";

interface GeneratedImage {
  image_id: string;
  url: string;
  prompt: string;
  style?: string;
  platform?: string;
  imageIndex?: number; // 1, 2, 3... for @image1, @image2, etc.
}

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  generatedImage?: GeneratedImage;
  videoWorkflow?: VideoWorkflowState;
}

// For persistence - includes generatedImage and videoWorkflow
interface StoredMessage {
  role: string;
  content: string;
  generatedImage?: GeneratedImage;
  videoWorkflow?: VideoWorkflowState;
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
  const sessionIdFromUrl = searchParams.get("session");

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
  const [activeTools, setActiveTools] = useState<Array<{ name: string; status: ToolStatus }>>([]);
  const [imageCounter, setImageCounter] = useState(0);
  // Video workflow mode state
  const [activeVideoWorkflow, setActiveVideoWorkflow] = useState<VideoWorkflowState | null>(null);
  const [videoModeMessages, setVideoModeMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [videoStreamingText, setVideoStreamingText] = useState("");
  const [isVideoModeLoading, setIsVideoModeLoading] = useState(false);
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

        // Load session from URL if provided
        if (sessionIdFromUrl) {
          const session = await getChatSessionById(sessionIdFromUrl);
          if (session && session.messages) {
            let maxImageIndex = 0;
            const loadedMessages: Message[] = session.messages.map((m: StoredMessage, i: number) => {
              // Track the highest image index for counter
              if (m.generatedImage?.imageIndex) {
                maxImageIndex = Math.max(maxImageIndex, m.generatedImage.imageIndex);
              }
              return {
                id: `loaded-${i}`,
                role: m.role as "user" | "assistant",
                content: m.content,
                generatedImage: m.generatedImage,
              };
            });
            setMessages(loadedMessages);
            setImageCounter(maxImageIndex);
            setSelectedChatId(sessionIdFromUrl);
            setCurrentSessionId(sessionIdFromUrl);
          }
        }
      }
    }
    loadData();
  }, [productId, sessionIdFromUrl]);

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

  // Load a chat session when selected
  async function loadChatSession(sessionId: string) {
    debugLog("Loading chat session:", sessionId);
    const session = await getChatSessionById(sessionId);
    if (session && session.messages) {
      let maxImageIndex = 0;
      let loadedVideoWorkflow: VideoWorkflowState | null = null;
      
      const loadedMessages: Message[] = session.messages.map((m: StoredMessage, i: number) => {
        // Track the highest image index for counter
        if (m.generatedImage?.imageIndex) {
          maxImageIndex = Math.max(maxImageIndex, m.generatedImage.imageIndex);
        }
        // Check for video workflow
        if (m.videoWorkflow && m.videoWorkflow.stage !== "complete" && m.videoWorkflow.stage !== "cancelled") {
          loadedVideoWorkflow = m.videoWorkflow;
        }
        return {
          id: `loaded-${i}`,
          role: m.role as "user" | "assistant",
          content: m.content,
          generatedImage: m.generatedImage,
          videoWorkflow: m.videoWorkflow,
        };
      });
      setMessages(loadedMessages);
      setImageCounter(maxImageIndex);
      setSelectedChatId(sessionId);
      setCurrentSessionId(sessionId);
      
      // Auto-activate video mode if there's an in-progress workflow
      if (loadedVideoWorkflow) {
        debugLog("Restoring video mode from saved workflow:", (loadedVideoWorkflow as VideoWorkflowState).stage);
        setActiveVideoWorkflow(loadedVideoWorkflow as VideoWorkflowState);
        setVideoModeMessages([]);
      }
    }
  }

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
    setActiveTools([]); // Reset tool states for new message

    try {
      // Filter out empty messages before sending to AI
      const messagesToSend = newMessages
        .filter((m) => m.content && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));
      
      const streamValue = await chatWithBrandAgent(
        productId,
        messagesToSend,
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

        // Handle tool call status updates
        if (chunk?.toolCall) {
          setActiveTools((prev) => {
            const existing = prev.find((t) => t.name === chunk.toolCall.name);
            if (existing) {
              // Update existing tool status
              return prev.map((t) =>
                t.name === chunk.toolCall.name
                  ? { ...t, status: chunk.toolCall.status }
                  : t
              );
            } else {
              // Add new tool
              return [...prev, { name: chunk.toolCall.name, status: chunk.toolCall.status }];
            }
          });
        }

        if (chunk?.toolResult) {
          // Handle generated image tool result
          if (chunk.toolResult.type === "generated_image") {
            // Assign the next image index
            const newImageIndex = imageCounter + 1;
            setImageCounter(newImageIndex);
            
            setMessages((prev) => {
              const next = [...prev];
              const last = next.find((m) => m.id === assistantMessageId);
              if (last) {
                last.generatedImage = {
                  image_id: chunk.toolResult.image_id,
                  url: chunk.toolResult.url,
                  prompt: chunk.toolResult.prompt,
                  style: chunk.toolResult.style,
                  platform: chunk.toolResult.platform,
                  imageIndex: newImageIndex,
                };
              }
              return next;
            });
          }
          
          // Handle video workflow request
          if (chunk.toolResult.type === "video_workflow_request" && product) {
            debugLog("Starting video workflow:", chunk.toolResult.goal);
            try {
              // Start the video workflow
              const videoState = await initiateVideoWorkflow(
                productId,
                product,
                chunk.toolResult.goal
              );
              debugLog("Workflow initiated:", videoState.stage);
              
              // Auto-activate video mode
              setActiveVideoWorkflow(videoState);
              setVideoModeMessages([]);
              
              setMessages((prev) => {
                const next = [...prev];
                const last = next.find((m) => m.id === assistantMessageId);
                if (last) {
                  last.videoWorkflow = videoState;
                }
                return next;
              });
            } catch (error) {
              console.error("Failed to start video workflow:", error);
            }
          }
          
          // Refresh product data if brand was updated
          if (chunk.toolResult.success) {
            const updatedProduct = await getProductById(productId);
            setProduct(updatedProduct);
          }
        }
      }
      // Save chat session after successful conversation
      const finalMessages = await new Promise<Message[]>((resolve) => {
        setMessages((prev) => {
          resolve(prev);
          return prev;
        });
      });
      
      // Only save if there's actual user content (not just the initial greeting)
      const userMessages = finalMessages.filter(m => m.role === "user");
      if (userMessages.length > 0) {
        const title = userMessages[0].content.slice(0, 50) + (userMessages[0].content.length > 50 ? "..." : "");
        try {
          // Include generatedImage and videoWorkflow in saved messages
          const messagesToSave = finalMessages.map(m => ({
            role: m.role,
            content: m.content,
            generatedImage: m.generatedImage,
            videoWorkflow: m.videoWorkflow,
          }));
          
          if (currentSessionId) {
            // Update existing session
            await updateChatSession(
              currentSessionId,
              messagesToSave
            );
          } else {
            // Create new session
            const savedSession = await saveChatSession(
              productId,
              title,
              messagesToSave
            );
            setCurrentSessionId(savedSession.id);
            setChatHistory(prev => [{ id: savedSession.id, title, created_at: new Date().toISOString() }, ...prev]);
          }
        } catch (err) {
          console.error("Failed to save chat session:", err);
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

  // Handle messages when in video workflow mode
  async function handleVideoModeMessage(message: string) {
    if (!activeVideoWorkflow || !product) return;
    
    setIsVideoModeLoading(true);
    setVideoStreamingText("");
    
    const newMessages = [...videoModeMessages, { role: "user", content: message }];
    setVideoModeMessages(newMessages);
    
    try {
      // Check if we need to generate storyboard first (when proceeding from storyline)
      let workflowForChat = activeVideoWorkflow;
      if (activeVideoWorkflow.stage === "storyline" && !activeVideoWorkflow.storyboard) {
        // Generate storyboard in background when needed
        workflowForChat = await generateStoryboardForWorkflow(activeVideoWorkflow);
        setActiveVideoWorkflow(workflowForChat);
      }
      
      const stream = await chatWithVideoAgent(
        productId,
        newMessages,
        workflowForChat,
        product
      );
      
      let fullText = "";
      for await (const chunk of readStreamableValue(stream)) {
        debugLog("Video chunk received:", {
          hasText: !!chunk?.text,
          hasWorkflow: !!chunk?.workflow,
          workflowStage: chunk?.workflow?.stage,
          textPreview: chunk?.text?.slice(0, 50),
        });
        
        if (chunk?.text) {
          fullText += chunk.text;
          setVideoStreamingText(fullText);
        }
        if (chunk?.workflow) {
          setActiveVideoWorkflow(chunk.workflow);
          // Also update the message's workflow state
          setMessages((prev) =>
            prev.map((m) =>
              m.videoWorkflow?.id === chunk.workflow.id
                ? { ...m, videoWorkflow: chunk.workflow }
                : m
            )
          );
          
          // Exit video mode if cancelled or complete
          if (chunk.workflow.stage === "cancelled") {
            setActiveVideoWorkflow(null);
          }
        }
      }
      
      debugLog("Video stream complete, fullText:", fullText?.slice(0, 100));
      
      if (fullText) {
        setVideoModeMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
      }
    } catch (error) {
      console.error("Video mode error:", error);
    }
    
    setIsVideoModeLoading(false);
    setVideoStreamingText("");
  }

  // Derived state for video mode
  const isVideoMode = !!activeVideoWorkflow;
  
  return (
    <div 
      className={cn(
        "h-screen flex font-[var(--font-inter)] overflow-hidden transition-all duration-500",
        isVideoMode 
          ? "bg-orange-50 text-[#1a1a1a]" 
          : "bg-[#faf9f7] text-[#1a1a1a]"
      )}
    >
      {/* Background Grid */}
      <div className={cn(
        "fixed inset-0 pointer-events-none transition-opacity duration-500",
        isVideoMode ? "bg-video-mode-orange-grid opacity-100" : "bg-grid opacity-30"
      )} />

      {/* Video Mode Header - Floats on top when active */}
      <AnimatePresence>
        {isVideoMode && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-orange-200"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 animate-pulse" />
            <span className="text-sm font-semibold text-orange-600 tracking-wide uppercase">
              Video Ad
            </span>
            <div className="w-px h-4 bg-orange-200" />
            <span className="text-sm text-gray-600 font-medium">
              {activeVideoWorkflow?.stage === "storyline" ? "Storyline" : 
               activeVideoWorkflow?.stage === "storyboard" ? "Storyboard" :
               activeVideoWorkflow?.stage === "generating" ? "Generating" : "Complete"}
            </span>
            <div className="flex items-center gap-1 ml-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-8 h-1.5 rounded-full transition-all duration-300",
                    step <= (activeVideoWorkflow?.stage === "storyline" ? 1 : 
                             activeVideoWorkflow?.stage === "storyboard" ? 2 : 
                             activeVideoWorkflow?.stage === "generating" ? 3 : 4)
                      ? "bg-gradient-to-r from-orange-500 to-orange-600"
                      : "bg-orange-100"
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => {
                debugLog("Exiting video mode");
                setActiveVideoWorkflow(null);
              }}
              className="ml-3 w-7 h-7 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-orange-600 hover:text-orange-700 text-sm transition-colors font-medium"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Collapses in video mode */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isVideoMode ? 0 : 256,
          opacity: isVideoMode ? 0 : 1 
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="border-r border-black/[0.04] bg-white/70 backdrop-blur-xl flex flex-col relative z-10 overflow-hidden"
      >
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
                  onClick={() => loadChatSession(chat.id)}
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
      </motion.aside>

      {/* Main Chat */}
      <main className={cn(
        "flex-1 flex flex-col relative",
        isVideoMode && "pt-16" // Add padding for floating header
      )}>
        {!isVideoMode && (
          <>
            <div className="blur-orb-orange top-[-150px] right-[5%] opacity-30" />
            <div className="blur-orb-pink bottom-[10%] left-[10%] opacity-20" />
          </>
        )}



        <div className={cn(
          "flex-1 overflow-y-auto px-8 py-12 relative z-10 scrollbar-thin",
          isVideoMode ? "py-4 pb-52" : "pb-48"
        )}>
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
                      <div className="flex flex-col gap-4">
                        <CinematicMessage content={msg.content} isAssistant={true} isLoaded={msg.id.startsWith("loaded-")} isVideoMode={isVideoMode} />
                        {msg.generatedImage && (
                          <ImageViewer
                            imageUrl={msg.generatedImage.url}
                            imageId={msg.generatedImage.image_id}
                            imageIndex={msg.generatedImage.imageIndex || 1}
                            prompt={msg.generatedImage.prompt}
                            onRequestEdit={(imageRef) => {
                              setInput((prev) => prev + `${imageRef} `);
                              inputRef.current?.focus();
                            }}
                          />
                        )}
                        {msg.videoWorkflow && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4 mt-2"
                          >
                            {/* Storyline Card */}
                            {msg.videoWorkflow.storyline && (
                              <div className="rounded-2xl p-5 bg-white border-2 border-orange-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                  <span className="text-xs font-bold text-orange-600 tracking-wider uppercase">Storyline</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 text-lg mb-2">{msg.videoWorkflow.storyline.theme}</h4>
                                <p className="text-gray-600 text-sm italic mb-3 leading-relaxed">"{msg.videoWorkflow.storyline.hook}"</p>
                                <p className="text-gray-500 text-sm leading-relaxed">{msg.videoWorkflow.storyline.narrative}</p>
                                <div className="flex gap-4 mt-4 pt-3 border-t border-orange-100">
                                  <span className="text-xs text-gray-400 font-medium">~{msg.videoWorkflow.storyline.estimatedDuration}s duration</span>
                                  <span className="text-xs text-gray-400 font-medium capitalize">{msg.videoWorkflow.storyline.targetPlatform}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Storyboard Clips - Vertical Layout */}
                            {msg.videoWorkflow.storyboard && msg.videoWorkflow.stage !== "storyline" && (
                              <div className="rounded-2xl p-5 bg-white border-2 border-orange-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    <span className="text-xs font-bold text-orange-600 tracking-wider uppercase">Storyboard</span>
                                  </div>
                                  <span className="text-xs text-gray-400 font-medium">
                                    {msg.videoWorkflow.storyboard.clips.length} clips · {msg.videoWorkflow.storyboard.totalDuration}s total
                                  </span>
                                </div>
                                <div className="space-y-3">
                                  {msg.videoWorkflow.storyboard.clips.map((clip) => (
                                    <div key={clip.id} className="flex gap-3 p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm">
                                        {clip.index}
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-gray-700 text-sm leading-relaxed">{clip.description}</p>
                                        <span className="text-xs text-orange-500 font-medium mt-1 inline-block">{clip.duration}s</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Status badge */}
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-xs px-3 py-1 rounded-full font-medium",
                                msg.videoWorkflow.stage === "complete" 
                                  ? "bg-green-100 text-green-600 border border-green-200" 
                                  : msg.videoWorkflow.stage === "cancelled"
                                  ? "bg-gray-100 text-gray-500 border border-gray-200"
                                  : "bg-orange-100 text-orange-600 border border-orange-200"
                              )}>
                                {msg.videoWorkflow.stage === "complete" ? "Complete" :
                                 msg.videoWorkflow.stage === "cancelled" ? "Cancelled" :
                                 `${msg.videoWorkflow.stage.charAt(0).toUpperCase() + msg.videoWorkflow.stage.slice(1)}`}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <CinematicMessage content={msg.content} isAssistant={false} isLoaded={msg.id.startsWith("loaded-")} isVideoMode={isVideoMode} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Video Mode Conversation Messages */}
            {isVideoMode && videoModeMessages.length > 0 && (
              <div className="space-y-4 mt-4">
                {videoModeMessages.map((msg, i) => (
                  <motion.div
                    key={`video-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={msg.role === "user" ? "flex justify-end" : "flex items-start gap-4"}
                  >
                    {msg.role === "assistant" ? (
                      <>
                        <div className="assistant-avatar mt-1">
                          <span className="assistant-avatar-initial">E</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-base text-gray-700 leading-relaxed">{msg.content}</p>
                        </div>
                      </>
                    ) : (
                      <div className="inline-block max-w-md">
                        <p className="text-base font-medium text-[#1a1a1a]/70 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-orange-200 shadow-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {(isThinking || isVideoModeLoading) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-start gap-4">
                  <div className="assistant-avatar">
                    <Loader2 size={14} className="text-white animate-spin" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-[var(--font-jetbrains)] text-[#1a1a1a]/30">
                      {isVideoModeLoading ? (videoStreamingText || "thinking...") : "thinking..."}
                      {isVideoModeLoading && videoStreamingText && <span className="animate-pulse ml-1">▊</span>}
                    </span>
                  </div>
                </div>
                {activeTools.length > 0 && (
                  <div className="pl-12 flex flex-wrap gap-2">
                    {activeTools.map((tool) => (
                      <ToolStatusPill key={tool.name} toolName={tool.name} status={tool.status} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Input */}
        <div className={cn(
          "floating-input-container transition-all duration-300",
          isVideoMode && "!bg-transparent"
        )}>
          <div className={cn(
            "floating-input flex items-start gap-2 transition-all duration-300",
            isVideoMode && "!border-orange-300 !bg-white shadow-lg"
          )}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  // Route to appropriate handler
                  if (isVideoMode) {
                    debugLog("Sending to video mode:", input);
                    handleVideoModeMessage(input);
                    setInput("");
                  } else {
                    handleSend();
                  }
                }
              }}
              placeholder={isVideoMode 
                ? "Edit clips, continue, or cancel..." 
                : "Ask about competitors, market trends, or update your brand..."}
              disabled={isThinking || isVideoModeLoading}
              rows={2}
              className={cn(
                "flex-1 px-4 py-3 bg-transparent focus:outline-none text-sm font-medium resize-none min-h-[60px] max-h-[160px] overflow-y-auto placeholder:text-[#1a1a1a]/30"
              )}
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
          <p className={cn(
            "text-center text-[9px] font-[var(--font-jetbrains)] mt-3",
            isVideoMode ? "text-orange-400" : "text-[#1a1a1a]/20"
          )}>
            <span className="opacity-60">⏎ send</span>
            <span className="mx-2">·</span>
            <span className="opacity-60">⇧⏎ new line</span>
          </p>
        </div>
      </main>
    </div>
  );
}
