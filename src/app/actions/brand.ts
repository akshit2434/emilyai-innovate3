"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { brandAgent } from "@/lib/brandAgent";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { createStreamableValue } from "@ai-sdk/rsc";
import { 
  startVideoWorkflow, 
  continueVideoWorkflow as continueVideoWorkflowLib,
  VideoWorkflowState 
} from "@/lib/videoAgent";

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

// Start a new video workflow
export async function initiateVideoWorkflow(
  productId: string,
  productContext: any,
  userRequest: string
): Promise<VideoWorkflowState> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const state = await startVideoWorkflow(productContext, userRequest);
  return state;
}

// Continue video workflow with user action
export async function continueVideoWorkflow(
  workflowState: VideoWorkflowState,
  action: "approve" | "regenerate"
): Promise<VideoWorkflowState> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const newState = await continueVideoWorkflowLib(workflowState, action);
  return newState;
}
