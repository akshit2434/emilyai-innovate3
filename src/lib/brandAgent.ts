import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { updateProduct } from "@/app/actions/brand";
import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { generateAndStoreImage } from "@/lib/mediaGeneration";

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

const generateMarketingImageTool = tool(
  async ({ productId, prompt, style, platform, complex, subject, action, shot_type, lighting, text_headline, text_location }) => {
    console.log("[IMAGE TOOL] generate_marketing_image called:", { productId, prompt: prompt.slice(0, 50), complex });

    try {
      // Determine aspect ratio based on platform
      const aspectRatios: Record<string, string> = {
        instagram_post: "1:1",
        instagram_story: "9:16",
        facebook_ad: "16:9",
        linkedin: "1.91:1",
      };
      const aspectRatio = aspectRatios[platform || "instagram_post"] || "1:1";

      // Professional photography prompt structure
      const styleSettings: Record<string, { lighting: string; palette: string; vibe: string }> = {
        minimal: {
          lighting: "Soft diffused studio lighting with clean shadows",
          palette: "Matte pastels, neutral tones, lots of white space",
          vibe: "Minimalist & Clean",
        },
        bold: {
          lighting: "High-contrast dramatic lighting with bold shadows",
          palette: "Vibrant saturated colors, high contrast, dynamic composition",
          vibe: "Bold & Energetic",
        },
        cinematic: {
          lighting: "Golden hour sunlight with warm orange to pink gradients",
          palette: "Warm cinematic tones, premium aesthetic, soft bokeh",
          vibe: "Cinematic & Premium",
        },
        corporate: {
          lighting: "Professional studio lighting, clean and even",
          palette: "Professional blues and grays, trustworthy appearance",
          vibe: "Professional & Corporate",
        },
      };

      const settings = styleSettings[style] || styleSettings.cinematic;

      // Build professional photography prompt
      const role = complex ? "Expert Graphic Designer and Creative Director" : "Expert Creative Director and Photographer";
      const task = complex ? "Generate a high-conversion advertising design with complex layout and typography" : "Generate a high-conversion advertising image";

      let enhancedPrompt = `[Role]: ${role}.
[Task]: ${task}.

[Subject & Action]:
${subject ? `Show ${subject} in the center of the frame.` : prompt}
${action ? `The subject is ${action}.` : ""}
The product looks premium, high-quality, and desirable.

[Composition & Camera]:
- Shot type: ${shot_type || "Product hero shot, eye-level, dynamic angle"}
- Focus: Sharp focus on the subject, creamy bokeh background (f/1.8 aperture).
- Lighting: ${lighting || settings.lighting}
- Palette: ${settings.palette}`;

      // Add Designer Layout for nanobanana (supports text, diagrams, etc.)
      if (complex) {
        enhancedPrompt += `

[Designer Layout]:
${text_headline ? `- Typography: Render the text "${text_headline}" in a bold, modern typeface.` : "- Layout: Create a clean, sophisticated design layout."}
${text_location ? `- Location: ${text_location}` : "- Integration: Integrate elements naturally into a magazine-style or premium ad layout."}
- Sophistication: Use professional graphic design principles: hierarchy, balance, and intentional whitespace.
- Capability: You can handle complex diagrams, detailed infographics, or rich text-heavy layouts if required by the prompt.`;
      } else if (text_headline) {
        // Basic text for seedream/simple mode
        enhancedPrompt += `

[Text]:
- Feature the text "${text_headline}" clearly in the scene.`;
      }

      enhancedPrompt += `

[Quality & Style]:
Professional advertising quality, 8K resolution, ${settings.vibe} aesthetic.

[Negative Prompt]:
(blurry, low quality, distorted text, bad spelling, watermark, extra limbs, ugly, messy composition, dull colors, amateur, stock photo look)`;

      console.log("[IMAGE TOOL] Enhanced prompt:", enhancedPrompt.slice(0, 300));

      // Generate and store the image using FAL AI
      const result = await generateAndStoreImage(productId, {
        prompt: enhancedPrompt,
        complex: complex || false,
        aspectRatio,
        resolution: "2K",
        title: `Marketing image - ${platform || "general"}`,
      });

      return JSON.stringify({
        type: "generated_image",
        // Internal fields (for UI rendering, not for AI context)
        _internal: {
          image_id: result.imageId,
          url: result.publicUrl,
          storage_path: result.storagePath,
        },
        // Fields visible to AI (no URLs or raw IDs)
        prompt,
        style,
        platform: platform || "instagram_post",
        status: "completed",
        editable: true,
        message: "Image generated successfully. The user can see it in the chat and edit it if needed.",
      });
    } catch (error: any) {
      console.error("[IMAGE TOOL] Generation failed:", error);
      return JSON.stringify({
        type: "error",
        message: `Image generation failed: ${error.message}`,
        status: "failed",
      });
    }
  },
  {
    name: "generate_marketing_image",
    description: "Generate a professional marketing/advertising image using AI. Creates high-quality product photography and ads. Returns an image that can be viewed and edited by the user.",
    schema: z.object({
      productId: z.string().describe("The product ID to associate this image with"),
      prompt: z.string().describe("Main description of the image to generate - what should be shown"),
      subject: z.string().optional().describe("What/who is the main subject (e.g., 'the product bottle', 'a person using the app')"),
      action: z.string().optional().describe("What is the subject doing (e.g., 'splashing into water', 'glowing on a dark table', 'being held by a smiling model')"),
      shot_type: z.string().optional().describe("Camera shot type (e.g., 'Macro product shot', 'Eye-level lifestyle shot', '45-degree flat lay', 'Close-up detail shot')"),
      lighting: z.string().optional().describe("Lighting style (e.g., 'Soft studio lighting', 'Golden hour sunlight', 'Neon cyberpunk lighting', 'Dramatic rim lighting')"),
      style: z.enum(["minimal", "bold", "cinematic", "corporate"]).describe("Visual style preset"),
      platform: z.enum(["instagram_post", "instagram_story", "facebook_ad", "linkedin"]).optional().describe("Target platform for aspect ratio"),
      complex: z.boolean().optional().describe("If true, uses nanobanana pro (higher quality, supports text rendering). Default false uses seedream (faster)."),
      text_headline: z.string().optional().describe("Text to render on the image (only works with complex=true). E.g., 'New Release', 'Limited Edition'"),
      text_location: z.string().optional().describe("Where to place the text. E.g., 'Floating above product', 'Neon sign in background', 'On elegant label'"),
    }),
  }
);

const editImageTool = tool(
  async ({ productId, image_reference, original_image_url, edit_prompt, platform }) => {
    console.log("[IMAGE TOOL] edit_image called:", { productId, image_reference, hasOriginalUrl: !!original_image_url, edit_prompt: edit_prompt.slice(0, 50) });

    try {
      // Determine aspect ratio based on platform (inherit from original if not specified)
      const aspectRatios: Record<string, string> = {
        instagram_post: "1:1",
        instagram_story: "9:16",
        facebook_ad: "16:9",
        linkedin: "1.91:1",
      };
      const aspectRatio = platform ? aspectRatios[platform] : "auto";

      // Build professional edit prompt with reference image context
      const enhancedEditPrompt = `[Role]: Expert Creative Director and Photo Editor.
[Task]: Edit/modify the reference image based on these instructions.

[Reference Image]: Use the provided reference image as the base for coherence and consistency.

[Edit Instructions]:
${edit_prompt}

[Quality Requirements]:
- Maintain the original image's composition and style where appropriate
- Apply changes seamlessly and naturally
- Preserve image quality and resolution
- Ensure professional advertising quality result

[Negative Prompt]:
(blurry, low quality, distorted, artifacts, unnatural edits, poor blending, watermark)`;

      // Use reference-based generation with complex=true for higher quality edits
      // The original_image_url should be provided by the UI when user references an image
      const imageRefs = original_image_url ? [original_image_url] : [];

      console.log("[IMAGE TOOL] Edit with refs:", { refCount: imageRefs.length, aspectRatio });

      const result = await generateAndStoreImage(productId, {
        prompt: enhancedEditPrompt,
        complex: true, // Use nanobanana pro for edits (better coherence with reference)
        imageRefs,
        aspectRatio,
        resolution: "2K",
        title: `Edited image from ${image_reference}`,
      });

      return JSON.stringify({
        type: "generated_image",
        // Internal fields (for UI rendering, not for AI context)
        _internal: {
          image_id: result.imageId,
          url: result.publicUrl,
          storage_path: result.storagePath,
          original_reference: image_reference,
        },
        // Fields visible to AI (no URLs or raw IDs)
        prompt: edit_prompt,
        status: "completed",
        editable: true,
        is_edit: true,
        message: "Image edited successfully. The user can see the updated image in the chat.",
      });
    } catch (error: any) {
      console.error("[IMAGE TOOL] Edit failed:", error);
      return JSON.stringify({
        type: "error",
        message: `Image edit failed: ${error.message}`,
        status: "failed",
      });
    }
  },
  {
    name: "edit_image",
    description: "REQUIRED: You MUST call this tool when the user mentions @image1, @image2, or any @imageN reference and wants to edit, modify, change, or update an image. This tool uses the original image as a reference to generate a coherent edit. ALWAYS try to provide the original_image_url for best results.",
    schema: z.object({
      productId: z.string().describe("The product ID to associate this image with"),
      image_reference: z.string().describe("The image reference from the user's message (e.g., @image1, @image2). Copy this exactly as the user wrote it."),
      original_image_url: z.string().optional().describe("URL of the original image being edited. CRUCIAL for reference-based editing - this enables coherent edits that maintain the original style."),
      edit_prompt: z.string().describe("Detailed description of all the changes the user wants to make to the image"),
      platform: z.enum(["instagram_post", "instagram_story", "facebook_ad", "linkedin"]).optional().describe("Target platform for aspect ratio - if not specified, inherits from original"),
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
- Product ID: ${product?.id}
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

3. **Asset Creation**: Marketing images, video ads, social content. When asked to create:
   - Ask 1-2 quick context questions if needed (platform? goal?)
   - If user seems eager or says "just make something", get creative using brand context
   - Always generate detailed prompts aligned with the brand aesthetic

4. **Social Media Content**: You can write optimized posts DIRECTLY in your response for any platform:
   - **LinkedIn**: Hook in first 2 lines, use line breaks, 3-5 hashtags at end, professional tone, end with CTA
   - **Twitter/X**: Under 280 chars, strong hooks, punchy tone, 1-2 hashtags max
   - **Instagram**: Visual appeal, emojis, story-driven, end with CTA, hashtags at very end
   
   When users ask for social content, write it directly in your response—no tools needed. Format it nicely so they can copy-paste. Offer to adjust tone/style after.

**ASSET GUIDELINES (when creating visuals):**
- Warm color palette: orange (#f97316) to pink (#ec4899) gradients
- Modern, premium, cinematic aesthetic
- Bold typography with clean layouts
- After generating an image, the user can view it and request edits

**CRITICAL - IMAGE HANDLING:**
- NEVER mention image IDs, URLs, or internal references to the user
- When you generate images, the user sees them automatically in the chat
- Users reference images as @image1, @image2, etc. when requesting edits
- **MODEL SELECTION**: 
  - Use \`complex: true\` (Nanobanana Pro) when the request requires intricate layouts, detailed diagrams, infographics, or rich typography. It acts like a professional Graphic Designer.
  - Use \`complex: false\` (Seedream) for standard photography or simpler ads where speed is preferred.
- **IMPORTANT**: When calling generate_marketing_image or edit_image, ALWAYS pass the Product ID from the context above
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
