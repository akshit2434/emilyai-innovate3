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
  iterationCount: Annotation<number>({
    reducer: (x, y) => (y !== undefined ? y : x) + 1,
    default: () => 0,
  }),
});

// 1. Define the LLM
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
  temperature: 0.7,
  streaming: true,
  maxOutputTokens: 2048,
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

// Web Search Tool (Tavily)
const webSearchTool = tool(
  async ({ query, max_results = 5 }) => {
    try {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return JSON.stringify({
          error: "Tavily API key not configured",
          results: [],
        });
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results,
          search_depth: "advanced",
          include_answer: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.stringify({
        answer: data.answer,
        results: data.results?.map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 300),
        })) || [],
      });
    } catch (error: any) {
      console.error("Web search error:", error);
      return JSON.stringify({
        error: error.message,
        results: [],
      });
    }
  },
  {
    name: "web_search",
    description: "Search the web for real-time information about markets, competitors, trends, or current events. Use this for research tasks.",
    schema: z.object({
      query: z.string().describe("The search query"),
      max_results: z.number().optional().describe("Max results to return (default 5)"),
    }),
  }
);

const tools = [updateBrandInfoTool, webSearchTool];

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
    // Note: image_id and url are for internal use only - not exposed to AI
    const imageId = `img_${Date.now()}`;
    const stockImageUrl = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80";
    
    return JSON.stringify({
      type: "generated_image",
      // Internal fields (for UI rendering, not for AI context)
      _internal: {
        image_id: imageId,
        url: stockImageUrl,
      },
      // Fields visible to AI (no URLs or raw IDs)
      prompt,
      style,
      platform: platform || "instagram_post",
      status: "completed",
      editable: true,
      message: "Image generated successfully. The user can see it in the chat and edit it if needed.",
    });
  },
  {
    name: "generate_marketing_image",
    description: "Generate a marketing image for the brand. Returns an image that can be viewed and edited by the user. Do NOT mention any image IDs or URLs to the user - they will see the image automatically in the chat interface.",
    schema: z.object({
      prompt: z.string().describe("Detailed description of the image to generate"),
      style: z.enum(["minimal", "bold", "cinematic", "corporate"]).describe("Visual style"),
      platform: z.enum(["instagram_post", "instagram_story", "facebook_ad", "linkedin"]).optional().describe("Target platform"),
    }),
  }
);

const editImageTool = tool(
  async ({ image_reference, edit_prompt }) => {
    // Mock: return stock image with updated metadata
    // Note: image_id and url are for internal use only - not exposed to AI
    const stockImageUrl = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80";
    const newImageId = `img_${Date.now()}`;
    
    return JSON.stringify({
      type: "generated_image",
      // Internal fields (for UI rendering, not for AI context)
      _internal: {
        image_id: newImageId,
        url: stockImageUrl,
        original_reference: image_reference,
      },
      // Fields visible to AI (no URLs or raw IDs)
      prompt: edit_prompt,
      status: "completed",
      editable: true,
      is_edit: true,
      message: "Image edited successfully. The user can see the updated image in the chat.",
    });
  },
  {
    name: "edit_image",
    description: "REQUIRED: You MUST call this tool when the user mentions @image1, @image2, or any @imageN reference and wants to edit, modify, change, or update an image. This tool ACTUALLY performs the edit - do not pretend to edit without calling this tool.",
    schema: z.object({
      image_reference: z.string().describe("The image reference from the user's message (e.g., @image1, @image2). Copy this exactly as the user wrote it."),
      edit_prompt: z.string().describe("Detailed description of all the changes the user wants to make to the image"),
    }),
  }
);

// Video Ad Generation Tool
const generateVideoAdTool = tool(
  async ({ prompt, platform }) => {
    console.log("[VIDEO TOOL] generate_video_ad called:", { prompt, platform });
    // This tool signals that a video workflow should start
    return JSON.stringify({
      type: "video_workflow_request",
      goal: prompt,
      platform: platform || "instagram",
      message: "Video ad workflow initiated. The user will see the storyline for approval.",
    });
  },
  {
    name: "generate_video_ad",
    description: "Generate a short-form video ad (30-50 seconds). Use when user asks for: video, video ad, reel, TikTok, short, or any video content. This starts an interactive workflow.",
    schema: z.object({
      prompt: z.string().describe("Description of the video ad to create, including goal and style"),
      platform: z.enum(["instagram", "tiktok", "youtube_shorts"]).optional().describe("Target platform"),
    }),
  }
);

const allTools = [
  updateBrandInfoTool,
  webSearchTool,
  generateLinkedInPostTool,
  generateTwitterThreadTool,
  generateMarketingImageTool,
  editImageTool,
  generateVideoAdTool,
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

**CRITICAL - IMAGE HANDLING:**
- NEVER mention image IDs, URLs, or internal references to the user
- When you generate images, the user sees them automatically in the chat
- Users reference images as @image1, @image2, etc. when requesting edits
- **IMPORTANT**: When a user mentions @image1, @image2, etc. and asks to edit/modify/change it, you MUST call the edit_image tool. Do NOT just say you edited it - actually call the tool!
- Simply acknowledge that you've created/edited the image—don't share technical details

**CRITICAL - VIDEO HANDLING:**
- When users ask for video ads, reels, shorts, TikToks, or any video content, you MUST call the generate_video_ad tool IMMEDIATELY
- Do NOT respond with text first - call the tool right away
- Do NOT just describe what a video would look like - call the generate_video_ad tool!
- The tool starts an interactive process where the user approves each step (storyline → storyboard → generation)
- After calling the tool, briefly acknowledge that you're starting the video workflow

**BUSINESS DIAGNOSIS APPROACH:**
When user asks about business issues (conversions, growth, positioning, etc.):
1. Don't jump to generic advice—ask what they've already tried
2. Understand their metrics, audience, and current approach
3. Identify root causes before suggesting fixes
4. Be specific and actionable, not vague

**STYLE:** Concise, sharp, helpful. You're a collaborator, not a generic assistant. No fluff.
  `);
  
  // Debug: log available tools
  console.log("[brandAgent] Available tools:", allTools.map(t => t.name));
  
  const modelWithTools = llm.bindTools(allTools);
  const response = await modelWithTools.invoke([systemPrompt, ...messages]);
  
  // Debug: log response details
  console.log("[brandAgent] Response tool_calls:", response.tool_calls);
  console.log("[brandAgent] Response content preview:", typeof response.content === 'string' ? response.content.slice(0, 100) : '[non-string]');
  
  return { messages: [response] };
};

const shouldContinue = (state: typeof AgentState.State) => {
  const { messages, iterationCount } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  
  // Prevent infinite loops - max 5 tool call rounds
  const MAX_ITERATIONS = 5;
  if (iterationCount >= MAX_ITERATIONS) {
    console.warn(`[brandAgent] Max iterations (${MAX_ITERATIONS}) reached, stopping`);
    return END;
  }
  
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    console.log(`[brandAgent] Iteration ${iterationCount}: Calling ${lastMessage.tool_calls.length} tools`);
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
