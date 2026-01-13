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
              stream.update({ toolResult: result });
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
