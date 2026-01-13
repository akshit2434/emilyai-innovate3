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
  async ({ prompt, style, platform }) => {
    // Mock: return static stock image
    const imageId = `img_${Date.now()}`;
    const stockImageUrl = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80";
    
    return JSON.stringify({
      type: "generated_image",
      image_id: imageId,
      url: stockImageUrl,
      prompt,
      style,
      platform: platform || "instagram_post",
      status: "completed",
      editable: true,
    });
  },
  {
    name: "generate_marketing_image",
    description: "Generate a marketing image for the brand. Returns an image that can be viewed and edited.",
    schema: z.object({
      prompt: z.string().describe("Detailed description of the image to generate"),
      style: z.enum(["minimal", "bold", "cinematic", "corporate"]).describe("Visual style"),
      platform: z.enum(["instagram_post", "instagram_story", "facebook_ad", "linkedin"]).optional().describe("Target platform"),
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
You are Emily, an elite AI strategist and creative partner for "${product?.name}".

**BRAND CONTEXT:**
- Name: ${product?.name}
- Description: ${product?.description || "Not set"}
- Target Audience: ${product?.extracted_info?.target_audience || "Not set"}
- Value Prop: ${product?.extracted_info?.value_proposition || "Not set"}
- Industry: ${product?.extracted_info?.industry || "Not set"}
- Tagline: ${product?.extracted_info?.tagline || "Not set"}

**YOUR CAPABILITIES:**
You seamlessly blend research, strategy, and content creation. Use any combination as needed—there are no fixed modes.

1. **Research & Analysis**: Market research, competitor analysis, trend identification. Use web_search when you need real-time data. Think from clear business principles—diagnose issues by understanding the FULL context first, ask clarifying questions, don't make baseless claims.

2. **Brand Strategy**: Help refine positioning, messaging, and identity. When users share business problems, ask smart clarifying questions to understand root causes before prescribing solutions. Think like a consultant—frameworks, data, actionable insights.

3. **Asset Creation**: Marketing images, social posts, ad copy. When asked to create:
   - Ask 2-3 quick context questions (platform? goal? tone?) to minimize assumptions
   - If user seems eager or says "just make something", get creative using brand context
   - Always generate detailed prompts aligned with the brand aesthetic

**ASSET GUIDELINES (when creating visuals):**
- Warm color palette: orange (#f97316) to pink (#ec4899) gradients
- Modern, premium, cinematic aesthetic
- Bold typography with clean layouts
- After generating an image, the user can view it and request edits

**BUSINESS DIAGNOSIS APPROACH:**
When user asks about business issues (conversions, growth, positioning, etc.):
1. Don't jump to generic advice—ask what they've already tried
2. Understand their metrics, audience, and current approach
3. Identify root causes before suggesting fixes
4. Be specific and actionable, not vague

**STYLE:** Concise, sharp, helpful. You're a collaborator, not a generic assistant. No fluff.
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
