"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { brandAgent } from "@/lib/brandAgent";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { createStreamableValue } from "@ai-sdk/rsc";

export async function updateProduct(productId: string, updates: any) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .eq("user_id", userId)
    .select();

  if (error) {
    console.error("Error updating product:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/${productId}`);
  revalidatePath("/dashboard");
  return data?.[0] || null;
}

export async function chatWithBrandAgent(productId: string, messages: { role: string; content: string }[], productContext: any) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const stream = createStreamableValue();
  const DEBUG = true; // Set to false to disable debug logs

  (async () => {
    const startTime = Date.now();
    let chunkCount = 0;
    
    try {
      if (DEBUG) {
        console.log("\n=== BRAND AGENT DEBUG ===");
        console.log(`[${new Date().toISOString()}] Starting chat with ${messages.length} messages`);
        console.log("Messages:", messages.map(m => ({ role: m.role, content: m.content?.slice(0, 50) })));
        console.log("Product context:", productContext?.name);
      }

      // Filter out empty messages that would cause Gemini errors
      const validMessages = messages.filter(m => m.content && m.content.trim().length > 0);
      
      if (DEBUG) console.log(`Valid messages after filter: ${validMessages.length}`);
      
      if (validMessages.length === 0) {
        stream.update({ content: "I didn't receive a message. How can I help you?" });
        stream.done();
        return;
      }

      const langChainMessages = validMessages.map((m) => {
        if (m.role === "assistant") return new AIMessage(m.content);
        if (m.role === "system") return new SystemMessage(m.content);
        return new HumanMessage(m.content);
      });

      if (DEBUG) console.log(`[${Date.now() - startTime}ms] Calling brandAgent.stream()...`);
      
      // Emit early update to prevent "slow to update" warning
      stream.update({ status: "thinking" });
      
      const resultStream = await brandAgent.stream({
        messages: langChainMessages,
        product: productContext,
      });

      if (DEBUG) console.log(`[${Date.now() - startTime}ms] Got stream, iterating chunks...`);

      for await (const chunk of resultStream) {
        chunkCount++;
        
        if (DEBUG) {
          console.log(`\n[Chunk ${chunkCount}] at ${Date.now() - startTime}ms`);
          console.log("  Keys:", Object.keys(chunk));
        }
        
        if (chunk.agent?.messages) {
          const lastMsg = chunk.agent.messages[chunk.agent.messages.length - 1] as AIMessage;
          
          if (DEBUG) {
            console.log("  Agent message type:", lastMsg.constructor.name);
            console.log("  Has tool_calls:", lastMsg.tool_calls?.length || 0);
            console.log("  Content preview:", typeof lastMsg.content === 'string' ? lastMsg.content.slice(0, 80) + "..." : "[non-string]");
          }
          
          // Emit tool call when AI invokes tools
          if (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) {
            for (const toolCall of lastMsg.tool_calls) {
              if (DEBUG) console.log(`  Tool call: ${toolCall.name}`);
              stream.update({ 
                toolCall: { 
                  name: toolCall.name, 
                  status: "processing" 
                } 
              });
            }
          }
          
          if (lastMsg.content && (!lastMsg.tool_calls || lastMsg.tool_calls.length === 0)) {
            const content = typeof lastMsg.content === 'string' ? lastMsg.content : "";
            if (content) {
              stream.update({ content });
            }
          }
        }
        
        if (chunk.tools?.messages) {
          const toolMsg = chunk.tools.messages[chunk.tools.messages.length - 1];
          if (DEBUG) {
            console.log("  Tool result for:", toolMsg.name);
            console.log("  Result preview:", String(toolMsg.content).slice(0, 100) + "...");
          }
          if (toolMsg.content) {
            try {
              const result = JSON.parse(toolMsg.content as string);
              
              // Extract internal fields for UI rendering (URLs, IDs)
              // These should NOT be sent back to the AI model
              const uiResult = { ...result };
              if (result._internal) {
                // Merge internal fields into the UI result for rendering
                uiResult.image_id = result._internal.image_id;
                uiResult.url = result._internal.url;
                // Remove _internal from what we store/show
                delete uiResult._internal;
              }
              
              // Emit tool result with tool name for status update
              stream.update({ 
                toolResult: uiResult,
                toolCall: { 
                  name: toolMsg.name || "unknown", 
                  status: result.error ? "failed" : "done" 
                }
              });
            } catch (e) {
              if (DEBUG) console.log("  Failed to parse tool result:", e);
            }
          }
        }
      }

      if (DEBUG) {
        console.log(`\n=== STREAM COMPLETE ===`);
        console.log(`Total time: ${Date.now() - startTime}ms`);
        console.log(`Total chunks: ${chunkCount}`);
      }

      stream.done();
    } catch (error: any) {
      console.error("Brand agent streaming error:", error);
      if (DEBUG) {
        console.log(`Error after ${chunkCount} chunks, ${Date.now() - startTime}ms`);
        console.log("Error details:", error.status, error.statusText);
      }
      stream.error(error);
    }
  })();

  return stream.value;
}

// Get chat sessions for a product
export async function getChatSessions(productId: string) {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("product_id", productId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching chat sessions:", error);
    return [];
  }

  return data || [];
}

// Get a single chat session by ID
export async function getChatSessionById(sessionId: string) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    console.error("Error fetching chat session:", error);
    return null;
  }

  return data;
}

// Save a chat session
export async function saveChatSession(
  productId: string,
  title: string,
  messages: { role: string; content: string }[]
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert([{ product_id: productId, title, messages }])
    .select()
    .single();

  if (error) {
    console.error("Error saving chat session:", error);
    throw new Error(error.message);
  }

  return data;
}

// Update an existing chat session
export async function updateChatSession(
  sessionId: string,
  messages: { role: string; content: string }[]
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .update({ messages, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating chat session:", error);
    throw new Error(error.message);
  }

  return data;
}

// Get assets for a product
export async function getAssets(productId: string) {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching assets:", error);
    return [];
  }

  return data || [];
}

// Save an asset
export async function saveAsset(
  productId: string,
  type: string,
  title: string,
  content: string,
  status: string = "completed"
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("assets")
    .insert([{ product_id: productId, type, title, content, status }])
    .select()
    .single();

  if (error) {
    console.error("Error saving asset:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/${productId}`);
  return data;
}

// ============================================================================
// Video Workflow Actions
// ============================================================================

import { 
  videoAgent,
  createInitialStoryline,
  createInitialStoryboard,
  createNewVideoWorkflow,
  VideoWorkflowState 
} from "@/lib/videoAgent";

// Start a new video workflow - creates initial storyline
export async function initiateVideoWorkflow(
  productId: string,
  productContext: any,
  userRequest: string
): Promise<VideoWorkflowState> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Create workflow and generate initial storyline
  const workflow = createNewVideoWorkflow(productContext, userRequest);
  const storyline = await createInitialStoryline(productContext, userRequest);
  workflow.storyline = storyline;
  
  return workflow;
}

// Chat with video agent - for conversational editing
export async function chatWithVideoAgent(
  productId: string,
  messages: { role: string; content: string }[],
  workflow: VideoWorkflowState,
  productContext: any
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const stream = createStreamableValue<any>();
  const DEBUG = true;

  (async () => {
    try {
      if (DEBUG) {
        console.log("\n=== VIDEO AGENT DEBUG ===");
        console.log("Messages:", messages.map(m => ({ role: m.role, content: m.content?.slice(0, 40) })));
        console.log("Workflow stage:", workflow.stage);
      }

      const langchainMessages = messages.map((m) =>
        m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
      );

      const resultStream = await videoAgent.stream(
        {
          messages: langchainMessages,
          workflow,
          product: productContext,
        },
        { streamMode: "updates" }
      );

      let updatedWorkflow = { ...workflow };
      let accumulatedText = "";

      for await (const chunk of resultStream) {
        if (DEBUG) {
          console.log("\n[VIDEO CHUNK]", Object.keys(chunk));
        }

        // Stream agent messages
        if (chunk.agent?.messages) {
          const agentMsg = chunk.agent.messages[chunk.agent.messages.length - 1];
          
          if (DEBUG) {
            console.log("  Agent msg type:", agentMsg.constructor.name);
            console.log("  Has content:", !!agentMsg.content);
            console.log("  Content preview:", typeof agentMsg.content === 'string' ? agentMsg.content?.slice(0, 60) : '[non-string]');
            console.log("  Has tool_calls:", agentMsg.tool_calls?.length || 0);
          }

          // Stream text content
          if (agentMsg.content && typeof agentMsg.content === "string" && agentMsg.content.trim()) {
            accumulatedText += agentMsg.content;
            stream.update({ text: agentMsg.content, done: false });
          }
          
          // Also show tool call status
          if (agentMsg.tool_calls && agentMsg.tool_calls.length > 0) {
            for (const tc of agentMsg.tool_calls) {
              if (DEBUG) console.log("  Tool call:", tc.name);
              stream.update({ 
                toolCall: { name: tc.name, status: "processing" }
              });
            }
          }
        }

        // Handle tool results
        if (chunk.tools?.messages) {
          const toolMsg = chunk.tools.messages[chunk.tools.messages.length - 1];
          if (DEBUG) {
            console.log("  Tool result for:", toolMsg.name);
            console.log("  Result preview:", String(toolMsg.content).slice(0, 80));
          }
          if (toolMsg.content) {
            try {
              const result = JSON.parse(toolMsg.content as string);
              
              // Apply workflow updates based on tool result
              if (result.type === "workflow_update") {
                const prevStage = updatedWorkflow.stage;
                updatedWorkflow = applyWorkflowUpdate(updatedWorkflow, result);
                
                // Generate storyboard when transitioning from storyline to storyboard
                if (prevStage === "storyline" && updatedWorkflow.stage === "storyboard" && !updatedWorkflow.storyboard) {
                  console.log("[VIDEO AGENT] Generating storyboard on stage transition...");
                  const storyboard = await createInitialStoryboard(
                    updatedWorkflow.productContext,
                    updatedWorkflow.storyline!
                  );
                  updatedWorkflow.storyboard = storyboard;
                  console.log("[VIDEO AGENT] Storyboard generated with", storyboard.clips.length, "clips");
                }
                
                // Use the tool's message as AI response if no text was accumulated
                if (result.message && !accumulatedText) {
                  accumulatedText = result.message;
                  stream.update({ text: result.message, done: false });
                }
              }
              
              stream.update({ 
                toolResult: result,
                toolCall: { name: toolMsg.name || "unknown", status: "done" },
                workflow: updatedWorkflow,
              });
            } catch (e) {
              console.error("Failed to parse tool result:", e);
            }
          }
        }
      }

      if (DEBUG) {
        console.log("\n=== VIDEO STREAM COMPLETE ===");
        console.log("Final text:", accumulatedText?.slice(0, 100));
        console.log("Final stage:", updatedWorkflow.stage);
      }

      stream.update({ done: true, workflow: updatedWorkflow });
      stream.done();
    } catch (error: any) {
      console.error("Video agent error:", error);
      stream.error(error);
    }
  })();

  return stream.value;
}

// Apply workflow updates based on tool results
function applyWorkflowUpdate(
  workflow: VideoWorkflowState,
  toolResult: any
): VideoWorkflowState {
  const updated = { ...workflow };
  
  switch (toolResult.action) {
    case "update_storyline":
      if (updated.storyline) {
        updated.storyline = { ...updated.storyline, ...toolResult.updates };
      }
      break;
      
    case "update_clip":
      if (updated.storyboard) {
        const clipIdx = toolResult.clipIndex - 1;
        if (updated.storyboard.clips[clipIdx]) {
          updated.storyboard.clips[clipIdx] = {
            ...updated.storyboard.clips[clipIdx],
            ...toolResult.updates,
            duration: toolResult.updates.duration 
              ? parseInt(toolResult.updates.duration) 
              : updated.storyboard.clips[clipIdx].duration,
          };
          // Recalculate total duration
          updated.storyboard.totalDuration = updated.storyboard.clips.reduce(
            (sum, c) => sum + c.duration, 0
          );
        }
      }
      break;
      
    case "add_clip":
      if (updated.storyboard) {
        const newClip = {
          id: `clip_${Date.now()}`,
          index: toolResult.afterClipIndex + 1,
          duration: toolResult.newClip.duration as 4 | 6 | 8,
          description: toolResult.newClip.description,
          isContinuation: false,
        };
        updated.storyboard.clips.splice(toolResult.afterClipIndex, 0, newClip);
        // Reindex and recalculate
        updated.storyboard.clips.forEach((c, i) => c.index = i + 1);
        updated.storyboard.totalDuration = updated.storyboard.clips.reduce(
          (sum, c) => sum + c.duration, 0
        );
      }
      break;
      
    case "remove_clip":
      if (updated.storyboard) {
        updated.storyboard.clips = updated.storyboard.clips.filter(
          (_, i) => i !== toolResult.clipIndex - 1
        );
        updated.storyboard.clips.forEach((c, i) => c.index = i + 1);
        updated.storyboard.totalDuration = updated.storyboard.clips.reduce(
          (sum, c) => sum + c.duration, 0
        );
      }
      break;
      
    case "proceed":
      console.log("[WORKFLOW] Proceed from:", updated.stage);
      if (updated.stage === "storyline") {
        updated.stage = "storyboard";
      } else if (updated.stage === "storyboard") {
        updated.stage = "generating";
        // Initialize generated frames and clips for each clip
        if (updated.storyboard) {
          updated.generatedFrames = updated.storyboard.clips.map((clip) => ({
            clipId: clip.id,
            startFrameUrl: null,
            endFrameUrl: null,
            status: "pending" as const,
          }));
          updated.generatedClips = updated.storyboard.clips.map((clip) => ({
            clipId: clip.id,
            videoUrl: null,
            status: "pending" as const,
          }));
        }
      } else if (updated.stage === "generating") {
        // Complete the video when all frames are done
        updated.stage = "complete";
        updated.videoUrl = "https://example.com/mock-video.mp4";
      }
      console.log("[WORKFLOW] Proceed to:", updated.stage);
      break;
      
    case "go_back":
      if (updated.stage === "storyboard") {
        updated.stage = "storyline";
      } else if (updated.stage === "generating") {
        updated.stage = "storyboard";
      }
      break;
      
    case "cancel":
      updated.stage = "cancelled";
      break;
      
    // Note: "finalize" action removed - generation happens via triggerFrameGeneration
  }
  
  return updated;
}

// Generate storyboard for workflow
export async function generateStoryboardForWorkflow(
  workflow: VideoWorkflowState
): Promise<VideoWorkflowState> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!workflow.storyline) {
    throw new Error("No storyline to generate storyboard from");
  }

  const storyboard = await createInitialStoryboard(
    workflow.productContext,
    workflow.storyline
  );
  
  return {
    ...workflow,
    storyboard,
    stage: "storyboard",
  };
}

// Generate frames for workflow (mock implementation)
export async function generateFramesForWorkflow(
  workflow: VideoWorkflowState
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  console.log("[VIDEO GEN] Starting video generation pipeline for workflow:", workflow.id);

  const stream = createStreamableValue<any>();

  (async () => {
    try {
      if (!workflow.storyboard) {
        throw new Error("No storyboard to generate from");
      }

      const { runVideoGenerationPipeline } = await import("@/lib/videoGeneration");
      
      const clips = workflow.storyboard.clips.map(c => ({
        id: c.id,
        description: c.description,
        duration: c.duration,
      }));

      console.log("[VIDEO GEN] Running pipeline with", clips.length, "clips");

      const updatedWorkflow = { ...workflow };
      updatedWorkflow.stage = "generating";
      updatedWorkflow.generatedFrames = clips.map(c => ({
        clipId: c.id,
        startFrameUrl: null,
        endFrameUrl: null,
        status: "pending" as const,
      }));
      updatedWorkflow.generatedClips = clips.map(c => ({
        clipId: c.id,
        videoUrl: null,
        status: "pending" as const,
      }));

      for await (const progress of runVideoGenerationPipeline(clips)) {
        console.log("[VIDEO GEN]", progress.phase, "-", progress.message);
        
        // Update workflow state based on progress
        updatedWorkflow.generationPhase = progress.phase === "complete" ? "done" : progress.phase;
        
        if (progress.frames) {
          updatedWorkflow.generatedFrames = progress.frames.map(f => ({
            clipId: f.clipId,
            startFrameUrl: f.startUrl,
            endFrameUrl: f.endUrl,
            status: f.status as "pending" | "generating" | "done",
          }));
        }
        
        if (progress.clips) {
          updatedWorkflow.generatedClips = progress.clips.map(c => ({
            clipId: c.clipId,
            videoUrl: c.url,
            status: "done" as const,
          }));
        }
        
        if (progress.finalVideo) {
          updatedWorkflow.stage = "complete";
          updatedWorkflow.generationPhase = "done";
          updatedWorkflow.videoUrl = progress.finalVideo.url;
        }

        stream.update({
          workflow: { ...updatedWorkflow },
          phase: progress.phase,
          message: progress.message,
          complete: progress.phase === "complete",
        });
      }

      stream.done();
    } catch (error: any) {
      console.error("[VIDEO GEN] Error:", error);
      stream.error(error);
    }
  })();

  return stream.value;
}

