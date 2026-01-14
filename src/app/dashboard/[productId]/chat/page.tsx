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
  generateFramesForWorkflow,
  loadActiveVideoWorkflow
} from "@/app/actions/brand";
import { readStreamableValue } from "@ai-sdk/rsc";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { CinematicMessage } from "@/components/chat/CinematicMessage";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { ToolStatusPill } from "@/components/chat/ToolStatusPill";
import { VideoWorkflowCard } from "@/components/chat/VideoWorkflowCard";
import { VideoSubgraphView } from "@/components/video/VideoSubgraphView";
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
  const isGeneratingRef = useRef(false);
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

        // Load active video workflow from database (for persistence across refresh)
        try {
          const activeWorkflow = await loadActiveVideoWorkflow(productId);
          if (activeWorkflow) {
            debugLog("Restored active workflow from DB:", activeWorkflow.id, activeWorkflow.stage);
            setActiveVideoWorkflow(activeWorkflow);
            setVideoModeMessages(activeWorkflow.messages || []);
          }
        } catch (e) {
          console.warn("Failed to load active workflow:", e);
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
        // Restore video mode messages from workflow if available
        const workflowMessages = (loadedVideoWorkflow as VideoWorkflowState).messages || [];
        setVideoModeMessages(workflowMessages);
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
              
              // Pre-populate with the user's goal as the first message
              // This gives the video agent context to create the storyline
              const initialMessage = chunk.toolResult.goal;
              setVideoModeMessages([{ role: "user", content: initialMessage }]);

              setMessages((prev) => {
                const next = [...prev];
                const last = next.find((m) => m.id === assistantMessageId);
                if (last) {
                  last.videoWorkflow = videoState;
                }
                return next;
              });

              // Immediately trigger the video agent to process the request
              // This will cause it to create the storyline
              debugLog("Auto-triggering video agent with goal:", initialMessage.slice(0, 50));
              
              // Use setTimeout to ensure state is updated before calling
              setTimeout(async () => {
                setIsVideoModeLoading(true);
                setVideoStreamingText("");
                
                try {
                  const stream = await chatWithVideoAgent(
                    productId,
                    [{ role: "user", content: initialMessage }],
                    videoState,
                    product
                  );

                  let fullText = "";
                  let updatedWorkflow = videoState;

                  for await (const streamChunk of readStreamableValue(stream)) {
                    if (streamChunk?.text) {
                      fullText += streamChunk.text;
                      setVideoStreamingText(fullText);
                    }
                    if (streamChunk?.workflow) {
                      updatedWorkflow = streamChunk.workflow;
                      setActiveVideoWorkflow(streamChunk.workflow);
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.videoWorkflow?.id === streamChunk.workflow.id
                            ? { ...m, videoWorkflow: streamChunk.workflow }
                            : m
                        )
                      );
                    }
                  }

                  // Add assistant response
                  if (fullText) {
                    setVideoModeMessages([
                      { role: "user", content: initialMessage },
                      { role: "assistant", content: fullText }
                    ]);
                    
                    // Sync messages to workflow
                    const workflowWithMessages = {
                      ...updatedWorkflow,
                      messages: [
                        { role: "user", content: initialMessage },
                        { role: "assistant", content: fullText }
                      ],
                    };
                    setActiveVideoWorkflow(workflowWithMessages);
                  }
                } catch (err) {
                  console.error("Auto-trigger video agent error:", err);
                }
                
                setIsVideoModeLoading(false);
                setVideoStreamingText("");
              }, 100);
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

  // Trigger frame generation for video workflow
  async function triggerFrameGeneration(workflow: VideoWorkflowState) {
    debugLog("Triggering frame generation for workflow:", workflow.id);

    try {
      // Pass productId for DB persistence
      const stream = await generateFramesForWorkflow(workflow, productId, workflow.framePrompts);

      for await (const chunk of readStreamableValue(stream)) {
        debugLog("Frame generation chunk:", chunk);

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
        }

        if (chunk?.complete) {
          debugLog("Frame generation complete!");
          setVideoModeMessages((prev) => [
            ...prev,
            { role: "assistant", content: "All frames have been generated! Your video is ready." }
          ]);
        }
      }
    } catch (error) {
      console.error("Frame generation error:", error);
      setVideoModeMessages((prev) => [
        ...prev,
        { role: "assistant", content: "There was an error generating frames. Please try again." }
      ]);
    }
  }

  // Handle messages when in video workflow mode
  async function handleVideoModeMessage(message: string) {
    if (!activeVideoWorkflow || !product) return;

    setIsVideoModeLoading(true);
    setVideoStreamingText("");

    const newMessages = [...videoModeMessages, { role: "user", content: message }];
    setVideoModeMessages(newMessages);

    try {
      // Use current workflow - storyboard generation happens via proceed_to_next_stage tool
      // DO NOT auto-generate storyboard here - let the AI agent handle stage transitions
      const stream = await chatWithVideoAgent(
        productId,
        newMessages,
        activeVideoWorkflow,
        product
      );

      let fullText = "";
      let lastKnownStage = activeVideoWorkflow.stage;
      let updatedWorkflow = activeVideoWorkflow;

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
          const prevStage = lastKnownStage;
          const newStage = chunk.workflow.stage;
          lastKnownStage = newStage; // Update for next iteration
          updatedWorkflow = chunk.workflow;

          debugLog("Stage transition:", prevStage, "->", newStage);

          setActiveVideoWorkflow(chunk.workflow);
          // Also update the message's workflow state
          setMessages((prev) =>
            prev.map((m) =>
              m.videoWorkflow?.id === chunk.workflow.id
                ? { ...m, videoWorkflow: chunk.workflow }
                : m
            )
          );

          // Exit video mode if cancelled
          if (newStage === "cancelled") {
            setActiveVideoWorkflow(null);
          }

          // Trigger video generation when entering generating stage
          // We use a ref to prevent double-triggering
          if (newStage === "generating" && !isGeneratingRef.current) {
            debugLog("🎬 Triggering video generation pipeline (State detected)");
            isGeneratingRef.current = true;
            // Small delay to let state update
            setTimeout(() => {
              triggerFrameGeneration(chunk.workflow);
            }, 100);
          }
        }
      }

      debugLog("Video stream complete, fullText:", fullText?.slice(0, 100));

      // Add assistant message to video mode messages
      if (fullText) {
        const finalMessages = [...newMessages, { role: "assistant", content: fullText }];
        setVideoModeMessages(finalMessages);

        // Sync messages to workflow state for persistence
        if (updatedWorkflow) {
          const workflowWithMessages = {
            ...updatedWorkflow,
            messages: finalMessages,
          };
          setActiveVideoWorkflow(workflowWithMessages);
          // Update in main messages too for persistence
          setMessages((prev) =>
            prev.map((m) =>
              m.videoWorkflow?.id === workflowWithMessages.id
                ? { ...m, videoWorkflow: workflowWithMessages }
                : m
            )
          );
        }
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
      className="h-screen flex font-[var(--font-inter)] overflow-hidden transition-all duration-500 bg-[#faf9f7] text-[#1a1a1a]"
    >
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none bg-grid opacity-30" />

      {/* Video Subgraph View - Full screen overlay when active */}
      <AnimatePresence>
        {isVideoMode && activeVideoWorkflow && (
          <VideoSubgraphView
            workflow={activeVideoWorkflow}
            messages={videoModeMessages}
            streamingText={videoStreamingText}
            isLoading={isVideoModeLoading}
            onClose={() => {
              debugLog("Closing video subgraph view");
              setActiveVideoWorkflow(null);
            }}
            onSendMessage={(message) => {
              debugLog("Sending video mode message:", message);
              handleVideoModeMessage(message);
            }}
          />
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
      <main className="flex-1 flex flex-col relative">
        <div className="blur-orb-orange top-[-150px] right-[5%] opacity-30" />
        <div className="blur-orb-pink bottom-[10%] left-[10%] opacity-20" />



        <div className="flex-1 overflow-y-auto px-8 py-12 pb-48 relative z-10 scrollbar-thin">
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
                          <VideoWorkflowCard
                            workflow={msg.videoWorkflow}
                            onExpand={() => {
                              debugLog("Expanding video workflow:", msg.videoWorkflow?.id);
                              setActiveVideoWorkflow(msg.videoWorkflow!);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <CinematicMessage content={msg.content} isAssistant={false} isLoaded={msg.id.startsWith("loaded-")} isVideoMode={isVideoMode} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isThinking && (
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
                      thinking...
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
