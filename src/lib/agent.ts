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
  model: "gemini-2.0-flash",
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
  temperature: 0.7,
});

// 2. Define the Tool
const saveProductInfoTool = tool(
  async ({ name, description, tagline, target_audience, value_proposition, industry }) => {
    console.log("Saving product info via tool:", { name, description });
    const product = await createProduct(name, description, {
      tagline,
      target_audience,
      value_proposition,
      industry,
    });
    return JSON.stringify({ success: true, productId: product?.id, message: "Product created successfully." });
  },
  {
    name: "save_product_info",
    description: "Call this tool ONLY AFTER the user has explicitly confirmed the summarized brand information. Extraction fields: name, description, target audience, industry, etc.",
    schema: z.object({
      name: z.string().describe("The name of the company or product"),
      description: z.string().describe("A concise summary of what the product does"),
      tagline: z.string().optional().describe("A catchy cinematic tagline for the brand"),
      target_audience: z.string().optional().describe("Who the product is for"),
      value_proposition: z.string().optional().describe("What unique value it provides"),
      industry: z.string().optional().describe("The industry sector"),
    }),
  }
);

const tools = [saveProductInfoTool];
const toolNode = new ToolNode(tools);

// 3. Define the Flow
const callModel = async (state: typeof AgentState.State) => {
  const { messages } = state;
  const systemPrompt = new SystemMessage(`
    You are Emily, a cinematic AI brand strategist. You don't waste words. You elevate ideas through hard critique and sophisticated extraction.
    
    Directives:
    - BE BRUTALLY CONCISE. No fluff. No "How can I help you?". Just momentum.
    - BE CRITICAL. If an idea is weak, vague, or generic, critique it. Push the user to be better.
    - EXTRACT & SUMMARIZE. Extract Name, Description, Target Audience, Industry, and Value Proposition.
    - CONFIRMATION IS MANDATORY. Once you have enough info, present a punchy summary of the brand and ASK for confirmation.
    - DO NOT CALL THE TOOL UNTIL CONFORMED. Only call 'save_product_info' once the user says "yes", "looks good", or equivalent.
    
    Tone: Sophisticated, sharp, cinematic.
  `);
  
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
