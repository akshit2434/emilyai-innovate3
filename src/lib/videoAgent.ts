// Video Workflow LangGraph Agent
// Separate agent for video mode with conversational editing

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

// ============================================================================
// Types
// ============================================================================

export interface VideoClip {
  id: string;
  index: number;
  duration: 4 | 6 | 8;
  description: string;
  isContinuation: boolean;
}

export interface VideoStoryline {
  theme: string;
  hook: string;
  narrative: string;
  estimatedDuration: number;
  targetPlatform: "instagram" | "tiktok" | "youtube_shorts";
  aspectRatio: "9:16" | "16:9"; // Vertical for TikTok/Reels, Landscape for YouTube
}

export interface VideoStoryboard {
  clips: VideoClip[];
  totalDuration: number;
}

export interface GeneratedFrame {
  clipId: string;
  startFrameUrl: string | null;
  endFrameUrl: string | null;
  status: "pending" | "generating" | "done";
}

export interface GeneratedClipState {
  clipId: string;
  videoUrl: string | null;
  status: "pending" | "generating" | "done";
}

// Available image for reference during frame generation
export interface AvailableImage {
  id: string;          // Simple ID like "image1", "image2"
  url: string;         // Public URL
  description: string; // Brief description for AI context
  source: "generated" | "uploaded" | "product"; // Where the image came from
}

export interface VideoWorkflowState {
  id: string;
  stage: "storyline" | "storyboard" | "generating" | "complete" | "cancelled";
  generationPhase?: "frames" | "clips" | "stitching" | "done";
  productContext: any;
  userRequest: string;
  storyline: VideoStoryline | null;
  storyboard: VideoStoryboard | null;
  generatedFrames: GeneratedFrame[];
  generatedClips: GeneratedClipState[];
  videoUrl: string | null;
  error: string | null;
  // Messages within video mode (separate from main chat)
  messages: Array<{ role: string; content: string }>;
  // Available images for reference during frame generation
  availableImages: AvailableImage[];
  // Aspect ratio for the video (derived from storyline)
  aspectRatio?: "9:16" | "16:9";
  // Detailed prompts for frame and video generation
  framePrompts?: Record<string, {
    firstFramePrompt: string;
    lastFramePrompt: string;
    videoGenerationPrompt?: string;
    audioGenerationPrompt?: string;
    referenceImageIds?: string[];
    useComplexModel?: boolean;
  }>;
}

// ============================================================================
// LangGraph State
// ============================================================================

const VideoAgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  workflow: Annotation<VideoWorkflowState>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({
      id: "",
      stage: "storyline" as const,
      productContext: null,
      userRequest: "",
      storyline: null,
      storyboard: null,
      generatedFrames: [],
      generatedClips: [],
      videoUrl: null,
      error: null,
      messages: [],
      availableImages: [],
    }),
  }),
  product: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

// ============================================================================
// LLM
// ============================================================================

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
  temperature: 0.8,
  streaming: true,
  maxOutputTokens: 4096,
});

// ============================================================================
// Video-Specific Tools
// ============================================================================

const updateStorylineTool = tool(
  async ({ theme, hook, narrative, duration }) => {
    console.log("[VIDEO AGENT] update_storyline:", { theme, hook });
    return JSON.stringify({
      type: "workflow_update",
      action: "update_storyline",
      updates: { theme, hook, narrative, estimatedDuration: duration },
      message: "Storyline updated successfully.",
    });
  },
  {
    name: "update_storyline",
    description: "Update the video storyline (theme, hook, narrative, or duration). Use when user wants to change the concept.",
    schema: z.object({
      theme: z.string().optional().describe("New theme for the video"),
      hook: z.string().optional().describe("New hook (first 3 seconds)"),
      narrative: z.string().optional().describe("New narrative arc"),
      duration: z.number().optional().describe("New estimated duration in seconds"),
    }),
  }
);

const updateClipTool = tool(
  async ({ clipIndex, description, duration, isContinuation }) => {
    console.log("[VIDEO AGENT] update_clip:", { clipIndex, description, duration });
    return JSON.stringify({
      type: "workflow_update",
      action: "update_clip",
      clipIndex,
      updates: { description, duration, isContinuation },
      message: `Clip ${clipIndex} updated.`,
    });
  },
  {
    name: "update_clip",
    description: "Update a specific clip in the storyboard. User may reference by number like 'clip 3' or 'the first clip'.",
    schema: z.object({
      clipIndex: z.number().describe("The clip number (1-based index)"),
      description: z.string().optional().describe("New description for the clip"),
      duration: z.enum(["4", "6", "8"]).optional().describe("New duration in seconds"),
      isContinuation: z.boolean().optional().describe("Whether this continues from previous clip"),
    }),
  }
);

const addClipTool = tool(
  async ({ afterClipIndex, description, duration }) => {
    console.log("[VIDEO AGENT] add_clip:", { afterClipIndex, description, duration });
    return JSON.stringify({
      type: "workflow_update",
      action: "add_clip",
      afterClipIndex,
      newClip: { description, duration: parseInt(duration) },
      message: `New clip added after clip ${afterClipIndex}.`,
    });
  },
  {
    name: "add_clip",
    description: "Add a new clip to the storyboard after a specified position.",
    schema: z.object({
      afterClipIndex: z.number().describe("Insert after this clip number (0 to add at beginning)"),
      description: z.string().describe("Description of the new clip"),
      duration: z.enum(["4", "6", "8"]).describe("Duration in seconds"),
    }),
  }
);

const removeClipTool = tool(
  async ({ clipIndex }) => {
    console.log("[VIDEO AGENT] remove_clip:", { clipIndex });
    return JSON.stringify({
      type: "workflow_update",
      action: "remove_clip",
      clipIndex,
      message: `Clip ${clipIndex} removed.`,
    });
  },
  {
    name: "remove_clip",
    description: "Remove a clip from the storyboard.",
    schema: z.object({
      clipIndex: z.number().describe("The clip number to remove (1-based index)"),
    }),
  }
);

const proceedToNextStageTool = tool(
  async ({ }) => {
    console.log("[VIDEO AGENT] proceed_to_next_stage");
    return JSON.stringify({
      type: "workflow_update",
      action: "proceed",
      message: "Moving to next stage.",
    });
  },
  {
    name: "proceed_to_next_stage",
    description: "Move forward to the next stage of video creation. Use when user approves current stage or says 'continue', 'next', 'looks good', etc.",
    schema: z.object({}),
  }
);

const goBackStageTool = tool(
  async ({ }) => {
    console.log("[VIDEO AGENT] go_back_stage");
    return JSON.stringify({
      type: "workflow_update",
      action: "go_back",
      message: "Going back to previous stage.",
    });
  },
  {
    name: "go_back_stage",
    description: "Go back to the previous stage. Use when user says 'go back', 'redo', 'start over', etc.",
    schema: z.object({}),
  }
);

const cancelWorkflowTool = tool(
  async ({ }) => {
    console.log("[VIDEO AGENT] cancel_workflow");
    return JSON.stringify({
      type: "workflow_update",
      action: "cancel",
      message: "Video workflow cancelled.",
    });
  },
  {
    name: "cancel_workflow",
    description: "Cancel the video workflow and return to normal chat. Use when user says 'cancel', 'nevermind', 'stop', 'exit', etc.",
    schema: z.object({}),
  }
);

// Tool to set the complete storyline (replaces headless createInitialStoryline)
const setStorylineTool = tool(
  async ({ theme, hook, narrative, estimatedDuration, targetPlatform, aspectRatio }) => {
    console.log("[VIDEO AGENT] set_storyline:", { theme, hook, estimatedDuration });
    return JSON.stringify({
      type: "workflow_update",
      action: "set_storyline",
      storyline: { theme, hook, narrative, estimatedDuration, targetPlatform, aspectRatio },
      message: "Storyline set successfully.",
    });
  },
  {
    name: "set_storyline",
    description: "Set the complete storyline for the video. Call this FIRST when starting a new video workflow to define the concept.",
    schema: z.object({
      theme: z.string().describe("One-line theme of the video"),
      hook: z.string().describe("Attention-grabbing first 3 seconds"),
      narrative: z.string().describe("2-3 sentence narrative arc"),
      estimatedDuration: z.number().describe("Estimated total duration in seconds"),
      targetPlatform: z.enum(["instagram", "tiktok", "youtube_shorts"]).describe("Target platform"),
      aspectRatio: z.enum(["9:16", "16:9"]).describe("Aspect ratio - 9:16 for vertical (TikTok/Reels), 16:9 for landscape"),
    }),
  }
);

// Tool to set the complete storyboard (replaces headless createInitialStoryboard)
const setStoryboardTool = tool(
  async ({ clips }) => {
    console.log("[VIDEO AGENT] set_storyboard:", { clipCount: clips.length });
    const formattedClips = clips.map((c: any, i: number) => ({
      id: `clip_${i + 1}`,
      index: i + 1,
      duration: c.duration as 4 | 6 | 8,
      description: c.description,
      isContinuation: c.isContinuation || false,
    }));
    const totalDuration = formattedClips.reduce((sum: number, c: any) => sum + c.duration, 0);

    return JSON.stringify({
      type: "workflow_update",
      action: "set_storyboard",
      storyboard: {
        clips: formattedClips,
        totalDuration,
      },
      message: `Storyboard set with ${clips.length} clips (${totalDuration}s total).`,
    });
  },
  {
    name: "set_storyboard",
    description: `Set the complete storyboard with all clips. Call this when transitioning from storyline to storyboard stage.

IMPORTANT: Respect the user's original request for clip count! If user asked for "2 clips", create exactly 2 clips.
Each clip can be 4, 6, or 8 seconds.`,
    schema: z.object({
      clips: z.array(z.object({
        duration: z.number().describe("Duration in seconds (must be 4, 6, or 8)"),
        description: z.string().describe("Detailed description of what happens in this clip"),
        isContinuation: z.boolean().optional().describe("Whether this continues from previous clip's scene"),
      })).describe("Array of clips in order"),
    }),
  }
);

// Tool for setting frame prompts with image references
const setClipFramePromptsTool = tool(
  async ({ clipIndex, firstFramePrompt, lastFramePrompt, videoGenerationPrompt, audioGenerationPrompt, referenceImageIds, useComplexModel }) => {
    console.log("[VIDEO AGENT] set_clip_frame_prompts:", { clipIndex, firstFramePrompt: firstFramePrompt?.slice(0, 40), referenceImageIds });
    return JSON.stringify({
      type: "workflow_update",
      action: "set_frame_prompts",
      clipIndex,
      framePrompts: {
        firstFramePrompt,
        lastFramePrompt,
        videoGenerationPrompt,
        audioGenerationPrompt,
        referenceImageIds: referenceImageIds || [],
        useComplexModel: useComplexModel || false,
      },
      message: `Frame and video prompts set for clip ${clipIndex}. References: ${referenceImageIds?.join(", ") || "none"}.`,
    });
  },
  {
    name: "set_clip_frame_prompts",
    description: `Set the detailed prompts for generating the clip's frames and the video motion/audio.
    
IMPORTANT: The order of referenceImageIds matters! When you mention @image1 in the prompt, it refers to the first image in the referenceImageIds array.
Example usage:
- Prompt: "Show the person from @image1 drinking the product from @image2"
- referenceImageIds: ["image1", "image2"]`,
    schema: z.object({
      clipIndex: z.number().describe("The clip number (1-based index)"),
      firstFramePrompt: z.string().describe("Detailed visual prompt for the OPENING frame. Describe composition, lighting, subject, mood."),
      lastFramePrompt: z.string().describe("Detailed visual prompt for the CLOSING frame. Show progression from start frame."),
      videoGenerationPrompt: z.string().optional().describe("Instructions for Visual Motion: Camera movement (pan, zoom), subject action, lighting shifts."),
      audioGenerationPrompt: z.string().optional().describe("Instructions for Audio & SFX: Ambience, specific sound effects, music mood."),
      referenceImageIds: z.array(z.string()).optional().describe("Array of image IDs to use as references, IN ORDER. E.g., ['image1', 'image2']."),
      useComplexModel: z.boolean().optional().describe("Use nanobanana pro (complex=true) for detailed scenes, or seedream (complex=false, default) for simple scenes."),
    }),
  }
);

const videoTools = [
  setStorylineTool,        // NEW: Set complete storyline
  setStoryboardTool,       // NEW: Set complete storyboard with clips
  updateStorylineTool,
  updateClipTool,
  addClipTool,
  removeClipTool,
  setClipFramePromptsTool,
  proceedToNextStageTool,
  goBackStageTool,
  cancelWorkflowTool,
];

const videoToolNode = new ToolNode(videoTools);

// ============================================================================
// Agent Logic
// ============================================================================

const callVideoModel = async (state: typeof VideoAgentState.State) => {
  const { messages, workflow, product } = state;

  // Build context about current workflow state
  const workflowContext = buildWorkflowContext(workflow);

  const systemPrompt = new SystemMessage(`
You are an expert AI advertising creative director specializing in short-form video content for social media platforms (Instagram Reels, TikTok, YouTube Shorts). Your role is to conceptualize, plan, and execute compelling ad campaigns by breaking them down into individual video clips.

**BRAND CONTEXT:**
- Product: ${product?.name}
- Description: ${product?.description || "Not set"}
- Target Audience: ${product?.extracted_info?.target_audience || "Not set"}
- Value Proposition: ${product?.extracted_info?.value_proposition || "Not set"}
- Industry: ${product?.extracted_info?.industry || "Not set"}
- Tagline: ${product?.extracted_info?.tagline || "Not set"}

**CURRENT WORKFLOW STATE:**
${workflowContext}

**YOUR WORKFLOW:**

### Step 1: Storyline Development
Create a cohesive narrative arc that hooks viewers, builds interest, and ends with a strong CTA.
- Use 'set_storyline' to define the concept.
- Wait for user approval.

### Step 2: Storyboard & Clip Specifications
Once storyline is approved, use 'set_storyboard' to define the clips.
IMPORTANT: You MUST call 'set_storyboard' to define the clips before you can set prompts or proceed.
Respect user's requested clip count (e.g. "2 clips"). Each clip must be 4, 6, or 8 seconds.

### Step 3: Detailed Prompts (CRITICAL)
After setting the storyboard (and only AFTER), you MUST use 'set_clip_frame_prompts' for EACH clip to define:
1. **Start Frame Prompt**: Detailed image prompt for the opening frame. Include composition, lighting, colors, subject, expressions, mood.
2. **End Frame Prompt**: Detailed image prompt for the final frame. Show progression.
3. **Video Generation Prompt**: Instructions for Visual Motion (pan, zoom, action) and Audi/SFX (ambience, sound effects).

**EXAMPLE PROMPTS:**
- Start Frame: "Close-up shot of a woman's face, eyes closed, serene expression, soft golden hour lighting from left, warm peach tones, text overlay 'WAKE UP REFRESHED' in thin sans-serif white font top-center, minimalist aesthetic."
- End Frame: "Same woman, eyes now open with excited expression, brighter lighting, text changed to 'FEEL THE DIFFERENCE', product visible bottom-right."
- Video Motion: "Smooth transition as woman opens eyes. Camera slow zoom in."
- Audio/SFX: "Gentle morning birds chirping fade in, soft ambient synthesizer swell, crisp 'whoosh' sound effect as text changes."

**YOUR TOOLS:**
- set_storyline: Set the complete storyline
- set_storyboard: Set ALL clips (triggers transition to Storyboard stage)
- update_storyline: Modify theme/hook/narrative
- update_clip: Edit a specific clip's description/duration
- add_clip / remove_clip: Modify clip count
- set_clip_frame_prompts: Set detailed visual and motion prompts for a clip (Use this for EVERY clip!)
- proceed_to_next_stage: Move forward (ONLY when user explicitly approves)
- go_back_stage: Return to previous stage

**STAGE BEHAVIOR:**
- STORYLINE: Call set_storyline -> User Approve -> Call set_storyboard.
- STORYBOARD: **Call set_clip_frame_prompts for EACH clip** to enrich details. User Approve -> Call proceed_to_next_stage.
- GENERATING: Wait.
- COMPLETE: Done.

**IMPORTANT:** 
- set_storyboard auto-transitions to STORYBOARD stage.
- In STORYBOARD stage, iterate on 'set_clip_frame_prompts' to ensure high quality before proceeding.
- Only call proceed_to_next_stage to start generation when user says "looks good" or "start".

**IMAGE REFERENCES:**
- Use @image1, @image2 in prompts to reference available images.
- Pass ["image1", "image2"] in referenceImageIds to link them.

**STYLE:**
- Be creative, vivid, and specific.
- Think like a cinematographer and sound designer.
- Optimize for mobile viewing.
`);

  const modelWithTools = llm.bindTools(videoTools);
  const response = await modelWithTools.invoke([systemPrompt, ...messages]);
  return { messages: [response] };
};

function buildWorkflowContext(workflow: VideoWorkflowState): string {
  let context = `Stage: ${workflow.stage.toUpperCase()}\n`;

  // Show the user's original request - CRITICAL for respecting clip count, duration, etc.
  if (workflow.userRequest) {
    context += `\nUSER'S ORIGINAL REQUEST:\n"${workflow.userRequest}"\n`;
    context += `(IMPORTANT: Respect any specific requirements like clip count or duration mentioned here!)\n`;
  }

  // Show available images for reference
  if (workflow.availableImages && workflow.availableImages.length > 0) {
    context += `\nAVAILABLE IMAGES FOR REFERENCE:\n`;
    workflow.availableImages.forEach((img) => {
      context += `- @${img.id}: ${img.description} (${img.source})\n`;
    });
    context += `Use these in set_clip_frame_prompts to ensure visual consistency.\n`;
  }

  if (workflow.storyline) {
    context += `\nSTORYLINE:\n`;
    context += `- Theme: ${workflow.storyline.theme}\n`;
    context += `- Hook: "${workflow.storyline.hook}"\n`;
    context += `- Narrative: ${workflow.storyline.narrative}\n`;
    context += `- Duration: ~${workflow.storyline.estimatedDuration}s\n`;
    context += `- Platform: ${workflow.storyline.targetPlatform}\n`;
  }

  if (workflow.storyboard) {
    context += `\nSTORYBOARD (${workflow.storyboard.clips.length} clips, ${workflow.storyboard.totalDuration}s total):\n`;
    workflow.storyboard.clips.forEach((clip) => {
      context += `${clip.index}. [${clip.duration}s${clip.isContinuation ? ", continues" : ""}] ${clip.description}\n`;
    });
  }

  return context;
}

const shouldContinue = (state: typeof VideoAgentState.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    console.log(`[videoAgent] Calling ${lastMessage.tool_calls.length} tools`);
    return "tools";
  }
  return END;
};

// ============================================================================
// Compile Graph
// ============================================================================

const videoWorkflow = new StateGraph(VideoAgentState)
  .addNode("agent", callVideoModel)
  .addNode("tools", videoToolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

export const videoAgent = videoWorkflow.compile();

// ============================================================================
// Helper Functions
// ============================================================================

// Note: createInitialStoryline and createInitialStoryboard have been removed.
// The videoAgent now uses set_storyline and set_storyboard tools directly,
// maintaining full conversation context about user's requirements (e.g., clip count).

export function createNewVideoWorkflow(
  productContext: any,
  userRequest: string
): VideoWorkflowState {
  return {
    id: `video_${Date.now()}`,
    stage: "storyline",
    productContext,
    userRequest,
    storyline: null,
    storyboard: null,
    generatedFrames: [],
    generatedClips: [],
    videoUrl: null,
    error: null,
    messages: [],
    availableImages: [],
  };
}
