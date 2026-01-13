import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { createProduct } from "@/app/actions/products";
import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

// Define State
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// 1. Define the LLM
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
  temperature: 0.7,
});

// 2. Define the Tool
const saveProductInfoTool = tool(
  async ({ name, description, tagline, target_audience, value_proposition, industry }) => {
    console.log("Saving product info via tool:", { name, description });
    try {
      const product = await createProduct(name, description, {
        tagline,
        target_audience,
        value_proposition,
        industry,
      });
      return JSON.stringify({ success: true, productId: product?.id, message: "Product created successfully." });
    } catch (error: any) {
      console.error("Tool error:", error.message);
      return JSON.stringify({ success: false, error: error.message });
    }
  },
  {
    name: "save_product_info",
    description: "Call this tool once you have extracted enough information about the project/product (name, description, target audience, industry, etc.) to store it in the database.",
    schema: z.object({
      name: z.string().describe("The name of the company or product"),
      description: z.string().describe("A concise summary of what the product does"),
      tagline: z.string().optional().describe("A catchy cinematic tagline for the brand"),
      target_audience: z.string().optional().describe("Who the product is for (e.g. startup founders, ecommerce brands)"),
      value_proposition: z.string().optional().describe("What unique value it provides"),
      industry: z.string().optional().describe("The industry sector (e.g. CleanTech, MarTech, SaaS)"),
    }),
  }
);

const tools = [saveProductInfoTool];
const toolNode = new ToolNode(tools);

// 3. Define the Flow
const callModel = async (state: typeof AgentState.State) => {
  const { messages } = state;
  const systemPrompt = new SystemMessage(`You are Emily, a sharp brand strategist. No fluff.

RULES:
- Be direct and concise. Short sentences. No filler.
- Critique weak or vague ideas. Push for clarity.
- State assumptions explicitly.
- NEVER call save_product_info until user confirms.

FLOW:
1. Acknowledge the idea briefly.
2. Ask targeted questions to extract: Name, Description, Target Audience, Industry, Value Prop.
3. When ready, present a SUMMARY in this format:
   
   **Brand Summary**
   - Name: [name]
   - Description: [description]
   - Target Audience: [audience]
   - Industry: [industry]
   - Tagline: [tagline]
   - Value Prop: [value]
   
   Then ask: "Ready to lock this in?"
4. Only call save_product_info AFTER user says yes/confirms.

If user says no or wants changes, update and re-present.`);
  
  const modelWithTools = llm.bindTools(tools);
  const response = await modelWithTools.invoke([systemPrompt, ...messages]);
  return { messages: [response] };
};

const shouldContinue = (state: typeof AgentState.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return END;
};

// Define Graph
const workflow = new StateGraph(AgentState)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

export const agent = workflow.compile();
