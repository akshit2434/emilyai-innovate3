"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { agent } from "@/lib/agent";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

export async function createProduct(name: string, description: string, extractedInfo?: any) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name,
        description,
        user_id: userId,
        extracted_info: extractedInfo,
      },
    ])
    .select();

  if (error) {
    console.error("Error creating product:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  return data?.[0] || null;
}

export async function getProducts() {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data || [];
}

export async function getProductById(productId: string) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Real products only
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  return data;
}

import { createStreamableValue } from "@ai-sdk/rsc";

export async function chatWithOnboardingAgent(messages: { role: string; content: string }[]) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const stream = createStreamableValue();

  // Run the agent flow in the background
  (async () => {
    try {
      const langChainMessages = messages.map((m) => {
        if (m.role === "assistant") return new AIMessage(m.content);
        if (m.role === "system") return new SystemMessage(m.content);
        return new HumanMessage(m.content);
      });

      const resultStream = await agent.stream({
        messages: langChainMessages,
      });

      let finalContent = "";
      let toolResult = null;

      for await (const chunk of resultStream) {
        if (chunk.agent?.messages) {
          const lastMsg = chunk.agent.messages[chunk.agent.messages.length - 1] as AIMessage;
          if (lastMsg.content) {
            finalContent = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);
            stream.update({ content: finalContent });
          }
          
          if (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) {
            // Tool call detected
          }
        }
        
        if (chunk.tools?.messages) {
          const toolMsg = chunk.tools.messages[chunk.tools.messages.length - 1];
          if (toolMsg.content) {
            try {
              toolResult = JSON.parse(toolMsg.content as string);
              stream.update({ toolResult });
            } catch (e) {}
          }
        }
      }

      stream.done();
    } catch (error) {
      console.error("Agent streaming error:", error);
      stream.error(error);
    }
  })();

  return stream.value;
}
