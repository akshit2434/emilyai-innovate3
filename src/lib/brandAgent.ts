import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { updateProduct } from "@/app/actions/brand";
import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

// Define State
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  product: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

// 1. Define the LLM
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
  temperature: 0.7,
});

// 2. Define the Tool
const updateBrandInfoTool = tool(
  async ({ productId, name, description, tagline, target_audience, value_proposition, industry }) => {
    console.log("Updating product info via tool:", { productId, name });
    
    const updates: any = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    
    const extractedInfo: any = {};
    if (tagline) extractedInfo.tagline = tagline;
    if (target_audience) extractedInfo.target_audience = target_audience;
    if (value_proposition) extractedInfo.value_proposition = value_proposition;
    if (industry) extractedInfo.industry = industry;
    
    if (Object.keys(extractedInfo).length > 0) {
      updates.extracted_info = extractedInfo;
    }

    await updateProduct(productId, updates);
    return JSON.stringify({ success: true, message: "Brand information updated successfully." });
  },
  {
    name: "update_brand_info",
    description: "Update the product's brand information. Use this when the user wants to change their name, description, audience, or any other brand field.",
    schema: z.object({
      productId: z.string().describe("The ID of the product to update"),
      name: z.string().optional().describe("The name of the company or product"),
      description: z.string().optional().describe("A concise summary of what the product does"),
      tagline: z.string().optional().describe("A catchy cinematic tagline"),
      target_audience: z.string().optional().describe("Who the product is for"),
      value_proposition: z.string().optional().describe("What unique value it provides"),
      industry: z.string().optional().describe("The industry sector"),
    }),
  }
);

const tools = [updateBrandInfoTool];

// Mock Asset Generation Tools
const generateLinkedInPostTool = tool(
  async ({ topic, tone }) => {
    const mockPost = `🚀 ${topic}

This is a generated LinkedIn post about ${topic}.
Tone: ${tone}

[AI-generated content placeholder]

#startup #innovation #growth`;
    return JSON.stringify({ 
      type: "linkedin",
      content: mockPost,
      status: "completed"
    });
  },
  {
    name: "generate_linkedin_post",
    description: "Generate a LinkedIn post for the brand.",
    schema: z.object({
      topic: z.string().describe("The topic of the post"),
      tone: z.enum(["professional", "casual", "inspiring", "educational"]).describe("Tone"),
    }),
  }
);

const generateTwitterThreadTool = tool(
  async ({ topic, tweet_count }) => {
    const mockThread = Array.from({ length: tweet_count }, (_, i) => 
      `${i + 1}/${tweet_count}: [Tweet about ${topic}]`
    ).join("\n\n");
    return JSON.stringify({ 
      type: "twitter",
      content: mockThread,
      status: "completed"
    });
  },
  {
    name: "generate_twitter_thread",
    description: "Generate a Twitter/X thread.",
    schema: z.object({
      topic: z.string().describe("Thread topic"),
      tweet_count: z.number().min(2).max(10).describe("Number of tweets"),
    }),
  }
);

const generateMarketingImageTool = tool(
  async ({ prompt, style }) => {
    return JSON.stringify({ 
      type: "image",
      content: `https://placehold.co/1200x630/f97316/white?text=${encodeURIComponent(prompt.slice(0, 20))}`,
      prompt,
      style,
      status: "completed"
    });
  },
  {
    name: "generate_marketing_image",
    description: "Generate a marketing image (returns placeholder).",
    schema: z.object({
      prompt: z.string().describe("Image description"),
      style: z.enum(["minimal", "bold", "corporate", "playful"]).describe("Visual style"),
    }),
  }
);

const allTools = [
  updateBrandInfoTool,
  generateLinkedInPostTool,
  generateTwitterThreadTool,
  generateMarketingImageTool,
];
const toolNode = new ToolNode(allTools);

// 3. Define the Flow
const callModel = async (state: typeof AgentState.State) => {
  const { messages, product } = state;
  const systemPrompt = new SystemMessage(`
    You are Emily, an elite cinematic AI brand strategist and creative partner. You are here to help the user grow and evolve their product: "${product?.name}".
    
    CURRENT BRAND PROFILE:
    - Description: ${product?.description || "Not set"}
    - Target Audience: ${product?.extracted_info?.target_audience || "Not set"}
    - Value Prop: ${product?.extracted_info?.value_proposition || "Not set"}
    - Tagline: ${product?.extracted_info?.tagline || "Not set"}
    
    YOUR DUAL ROLE:
    1. RESEARCHER: Provide deep, intelligent insights on market trends, competitors, or audience research.
    2. BRAND PARTNER: Help the user refine and update their brand vision. Use the 'update_brand_info' tool when changes are agreed upon.
    
    DIRECTIVES:
    - BE CONCISE. Deliver high-impact thoughts with zero fluff.
    - BE COLLABORATIVE. If a user's idea is early, use your expertise to extrapolate and suggest a more sophisticated, premium version.
    - MAINTAIN STANDARDS. Be discerning—if a change weakens the brand, explain why and propose a superior alternative.
    - CONFIRM EDITS. Always summarize the proposed changes and get a "Yes" before using the update tool.
    
    TONE: Sophisticated, sharp, cinematic, and deeply helpful.
  `);
  
  const modelWithTools = llm.bindTools(allTools);
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

export const brandAgent = workflow.compile();
