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
  const systemPrompt = new SystemMessage(`You are Emily, an elite brand strategist and creative partner. Your goal is to help the user build a high-end, successful brand through the shortest path possible.

CORE PHILOSOPHY:
- Be intelligent, discerning, and concise. 
- You are a collaborator, not just a questionnaire. If the user gives you a "seed", use your expertise to grow it into a "vision".
- Instead of just asking for details, propose sharp, premium descriptions and value propositions based on what you know.
- If an idea is weak, don't just say so—propose a pivot or a more sophisticated version of it.

RULES:
- Be direct. No generic "AI assistant" fluff.
- If information is missing, SUGGEST high-quality options and ask: "Is this the direction you're imagining?"
- NEVER call save_product_info until the user has explicitly confirmed the summary.

FLOW:
1. Briefly acknowledge and validate the core idea.
2. Interrogate the vision by proposing high-end refinements for: Name, Description, Target Audience, Industry, and Value Prop.
3. When you have a solid vision, present a **Brand Summary**:
   
   **Brand Summary**
   - Name: [name]
   - Industry: [industry]
   - Description: [concise, high-impact summary]
   - Target Audience: [specific, high-value segment]
   - Value Prop: [the unique "edge" of the brand]

4. Ask: "Ready to lock this in and move to the dashboard?"`);
  
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
