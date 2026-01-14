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

// Note: finalize_video removed - generation is triggered via proceed_to_next_stage when in storyboard stage

// Tool for setting frame prompts with image references
const setClipFramePromptsTool = tool(
  async ({ clipIndex, firstFramePrompt, lastFramePrompt, referenceImageIds, useComplexModel }) => {
    console.log("[VIDEO AGENT] set_clip_frame_prompts:", { clipIndex, firstFramePrompt: firstFramePrompt?.slice(0, 40), referenceImageIds });
    return JSON.stringify({
      type: "workflow_update",
      action: "set_frame_prompts",
      clipIndex,
      framePrompts: {
        firstFramePrompt,
        lastFramePrompt,
        referenceImageIds: referenceImageIds || [],
        useComplexModel: useComplexModel || false,
      },
      message: `Frame prompts set for clip ${clipIndex}. References: ${referenceImageIds?.join(", ") || "none"}.`,
    });
  },
  {
    name: "set_clip_frame_prompts",
    description: `Set the first and last frame generation prompts for a clip. You can reference available images using @image1, @image2, etc. 
    
IMPORTANT: The order of referenceImageIds matters! When you mention @image1 in the prompt, it refers to the first image in the referenceImageIds array.

Example usage:
- Prompt: "Show the person from @image1 drinking the product from @image2"
- referenceImageIds: ["image1", "image2"]

This ensures coherence by using existing images as references for frame generation.`,
    schema: z.object({
      clipIndex: z.number().describe("The clip number (1-based index)"),
      firstFramePrompt: z.string().describe("Detailed prompt for the first/opening frame of the clip. Use @image1, @image2, etc. to reference available images."),
      lastFramePrompt: z.string().describe("Detailed prompt for the last/closing frame of the clip. Should show natural progression from first frame."),
      referenceImageIds: z.array(z.string()).optional().describe("Array of image IDs to use as references, IN ORDER. E.g., ['image1', 'image2']. The order matches how you reference them in prompts."),
      useComplexModel: z.boolean().optional().describe("Use nanobanana pro (complex=true) for detailed scenes, or seedream (complex=false, default) for simple scenes."),
    }),
  }
);

const videoTools = [
  updateStorylineTool,
  updateClipTool,
  addClipTool,
  removeClipTool,
  setClipFramePromptsTool,
  proceedToNextStageTool,
  goBackStageTool,
  cancelWorkflowTool,
  // finalize_video removed - proceed_to_next_stage handles storyboard -> generating transition
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
You are a video ad creative director helping create a short-form video ad for "${product?.name}".

**CURRENT WORKFLOW STATE:**
${workflowContext}

**YOUR TOOLS:**
- update_storyline: Modify theme/hook/narrative
- update_clip: Edit a specific clip's description or duration
- add_clip: Add a new clip to the storyboard
- remove_clip: Delete a clip
- set_clip_frame_prompts: Set detailed first/last frame prompts with optional image references
- proceed_to_next_stage: Move forward ONLY when user explicitly approves
- go_back_stage: Return to previous stage
- cancel_workflow: Exit video mode

**IMAGE REFERENCES FOR FRAME GENERATION:**
When setting frame prompts, you can reference available images using @image1, @image2, etc.
- The referenceImageIds array ORDER matters - it determines which image is @image1, @image2, etc.
- Example prompt: "Show the person from @image1 drinking the product from @image2"
- Example referenceImageIds: ["image1", "image2"]
- This ensures visual consistency and coherence across frames

**CRITICAL - STAGE TRANSITIONS:**
- ONLY call proceed_to_next_stage when user EXPLICITLY says to proceed/continue/next/looks good/approve
- If user gives feedback or suggestions, APPLY the changes first, then ASK if they want to proceed
- Do NOT automatically proceed after making changes - always confirm with user first

**STAGE BEHAVIOR:**
- STORYLINE stage: Present the storyline. Wait for user to explicitly approve before moving to storyboard.
- STORYBOARD stage: Present clips. You MAY set frame prompts for clips if user wants specific visuals. Wait for user approval to start generation.
- GENERATING stage: Video is being generated automatically. Tell user to wait and watch the progress.
- COMPLETE: Video is ready to view.

**STYLE:** Creative, collaborative, concise. Always ask for explicit approval before major transitions.
  `);

  const modelWithTools = llm.bindTools(videoTools);
  const response = await modelWithTools.invoke([systemPrompt, ...messages]);
  return { messages: [response] };
};

function buildWorkflowContext(workflow: VideoWorkflowState): string {
  let context = `Stage: ${workflow.stage.toUpperCase()}\n`;

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

export async function createInitialStoryline(
  productContext: any,
  userRequest: string
): Promise<VideoStoryline> {
  const storyLlm = new ChatGoogleGenerativeAI({
    model: "gemini-3-flash-preview",
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
    temperature: 0.8,
  });

  const systemPrompt = `Create a video ad concept for "${productContext?.name}".
User request: ${userRequest}

Return JSON only:
{
  "theme": "one-line theme",
  "hook": "attention-grabbing first 3 seconds",
  "narrative": "2-3 sentence arc",
  "estimatedDuration": 40,
  "targetPlatform": "tiktok"
}`;

  const response = await storyLlm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage("Create the concept now."),
  ]);

  try {
    const content = typeof response.content === "string" ? response.content : "";
    return JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    return {
      theme: "Brand showcase",
      hook: "Discover something amazing",
      narrative: "A journey through the brand experience",
      estimatedDuration: 40,
      targetPlatform: "tiktok",
    };
  }
}

export async function createInitialStoryboard(
  productContext: any,
  storyline: VideoStoryline
): Promise<VideoStoryboard> {
  const storyLlm = new ChatGoogleGenerativeAI({
    model: "gemini-3-flash-preview",
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
    temperature: 0.8,
  });

  const systemPrompt = `Break down this video concept into clips (4s, 6s, or 8s each).
Brand: ${productContext?.name}
Theme: ${storyline.theme}
Duration: ~${storyline.estimatedDuration}s

Return JSON only:
{
  "clips": [{"id": "clip_1", "index": 1, "duration": 4, "description": "...", "isContinuation": false}],
  "totalDuration": 40
}`;

  const response = await storyLlm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage("Create the storyboard now."),
  ]);

  try {
    const content = typeof response.content === "string" ? response.content : "";
    return JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    return {
      clips: [
        { id: "clip_1", index: 1, duration: 4, description: "Hook - attention grab", isContinuation: false },
        { id: "clip_2", index: 2, duration: 6, description: "Problem/need", isContinuation: false },
        { id: "clip_3", index: 3, duration: 8, description: "Solution reveal", isContinuation: false },
        { id: "clip_4", index: 4, duration: 6, description: "Benefits", isContinuation: true },
        { id: "clip_5", index: 5, duration: 8, description: "Social proof", isContinuation: false },
        { id: "clip_6", index: 6, duration: 4, description: "CTA", isContinuation: false },
      ],
      totalDuration: 36,
    };
  }
}

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
