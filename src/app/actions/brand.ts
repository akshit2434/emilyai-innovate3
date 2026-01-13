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

  (async () => {
    try {
      const langChainMessages = messages.map((m) => {
        if (m.role === "assistant") return new AIMessage(m.content);
        if (m.role === "system") return new SystemMessage(m.content);
        return new HumanMessage(m.content);
      });

      const resultStream = await brandAgent.stream({
        messages: langChainMessages,
        product: productContext,
      });

      for await (const chunk of resultStream) {
        if (chunk.agent?.messages) {
          const lastMsg = chunk.agent.messages[chunk.agent.messages.length - 1] as AIMessage;
          
          // Emit tool call when AI invokes tools
          if (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) {
            for (const toolCall of lastMsg.tool_calls) {
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
          if (toolMsg.content) {
            try {
              const result = JSON.parse(toolMsg.content as string);
              // Emit tool result with tool name for status update
              stream.update({ 
                toolResult: result,
                toolCall: { 
                  name: toolMsg.name || "unknown", 
                  status: result.error ? "failed" : "done" 
                }
              });
            } catch (e) {}
          }
        }
      }

      stream.done();
    } catch (error) {
      console.error("Brand agent streaming error:", error);
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
