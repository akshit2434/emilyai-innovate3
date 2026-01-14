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
  const systemPrompt = new SystemMessage(`You are Emily, an elite brand strategist. Your ONLY job is to understand what the user is building and lock it in so they can move to the dashboard.

CRITICAL: This is NOT a brainstorming session. Get clarity, present a summary, and save it. Do NOT keep talking.

YOUR GOAL:
Take whatever the user tells you and immediately form a complete Brand Summary. Use your expertise to fill in any gaps—don't ask endless questions.

FLOW (complete in 1-2 exchanges max):
1. User describes their product/idea (even vaguely)
2. You IMMEDIATELY present a Brand Summary using your knowledge to fill gaps:

   **Brand Summary**
   - Name: [use what they said, or propose one]
   - Industry: [infer from context]
   - Description: [concise, high-impact summary]
   - Target Audience: [specific segment based on the product]
   - Value Prop: [the unique edge—infer if not stated]

3. End with: "Does this capture it? Say 'yes' to lock it in."

WHEN TO SAVE:
- Any positive response = IMMEDIATELY call save_product_info
- "yes", "looks good", "perfect", "that works", thumbs up, confirmation of any kind = SAVE
- Do NOT ask follow-up questions after they confirm. Just save.

RULES:
- Be CONCISE. One message with the summary, that's it.
- Do NOT propose "refinements" or keep iterating unless they explicitly ask to change something
- Do NOT offer to "explore further" or "dive deeper"
- If they give enough info (even minimal), present the summary. Don't ask for more.
- Fill gaps with smart defaults rather than asking questions`);

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
