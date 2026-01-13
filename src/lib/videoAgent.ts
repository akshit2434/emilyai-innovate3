// Video Ad Generation Agent - Multi-step workflow

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

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

export interface FramePrompt {
  clipId: string;
  clipIndex: number;
  startFrame: string | null; // null if continuation
  endFrame: string;
}

export interface GeneratedFrame {
  clipId: string;
  startFrameUrl: string | null;
  endFrameUrl: string | null;
  status: "pending" | "generating" | "done";
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

export interface VideoWorkflowState {
  id: string;
  stage: "storyline" | "storyboard" | "frame_prompts" | "generating" | "complete";
  productContext: any;
  userRequest: string;
  storyline: VideoStoryline | null;
  storyboard: VideoStoryboard | null;
  framePrompts: FramePrompt[];
  generatedFrames: GeneratedFrame[];
  videoUrl: string | null;
  error: string | null;
}

// ============================================================================
// LLM Configuration
// ============================================================================

const videoLlm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
  temperature: 0.8,
  maxOutputTokens: 4096,
});

// ============================================================================
// Workflow Functions
// ============================================================================

/**
 * Step 1: Create the storyline/theme based on brand context
 */
export async function createStoryline(
  productContext: any,
  userRequest: string
): Promise<VideoStoryline> {
  const systemPrompt = `You are an elite video ad creative director specializing in short-form content for Instagram Reels, TikTok, and YouTube Shorts.

Your task is to create a compelling storyline/theme for a video ad.

BRAND CONTEXT:
- Name: ${productContext?.name || "Unknown"}
- Description: ${productContext?.description || "Not provided"}
- Target Audience: ${productContext?.extracted_info?.target_audience || "General"}
- Value Proposition: ${productContext?.extracted_info?.value_proposition || "Not specified"}
- Industry: ${productContext?.extracted_info?.industry || "Not specified"}

USER REQUEST: ${userRequest}

Create a video ad concept. Your response MUST be valid JSON with this exact structure:
{
  "theme": "One-line theme description",
  "hook": "The attention-grabbing first 3 seconds hook",
  "narrative": "2-3 sentence narrative arc description",
  "estimatedDuration": 40,
  "targetPlatform": "instagram"
}

GUIDELINES:
- Duration should be 30-50 seconds (optimal for engagement)
- Hook must grab attention in first 3 seconds
- Theme should align with brand values
- Narrative should have clear beginning, middle, end
- Target platform should match the content style

Respond ONLY with the JSON, no markdown or explanation.`;

  const response = await videoLlm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage("Create the video ad storyline now."),
  ]);

  try {
    const content = typeof response.content === "string" ? response.content : "";
    // Clean up potential markdown code blocks
    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanedContent);
  } catch (e) {
    console.error("Failed to parse storyline response:", e);
    // Return default
    return {
      theme: "Brand showcase",
      hook: "Discover something amazing",
      narrative: "A journey through the brand experience",
      estimatedDuration: 40,
      targetPlatform: "instagram",
    };
  }
}

/**
 * Step 2: Create the storyboard with clip breakdown
 */
export async function createStoryboard(
  productContext: any,
  storyline: VideoStoryline
): Promise<VideoStoryboard> {
  const systemPrompt = `You are a video storyboard artist. Break down this video ad concept into individual clips.

BRAND: ${productContext?.name}
THEME: ${storyline.theme}
HOOK: ${storyline.hook}
NARRATIVE: ${storyline.narrative}
TARGET DURATION: ${storyline.estimatedDuration} seconds

Create a clip breakdown. Each clip can be 4, 6, or 8 seconds.
Mark clips that are visual continuations of the previous clip (same scene, camera keeps rolling).

Your response MUST be valid JSON with this exact structure:
{
  "clips": [
    {
      "id": "clip_1",
      "index": 1,
      "duration": 4,
      "description": "What happens in this clip",
      "isContinuation": false
    }
  ],
  "totalDuration": 40
}

GUIDELINES:
- First clip should be the hook (4s recommended for impact)
- Use continuation for smooth flowing scenes
- Total duration should match target ± 4 seconds
- 5-8 clips is optimal for short-form content
- Mix durations for rhythm (not all same length)

Respond ONLY with the JSON, no markdown or explanation.`;

  const response = await videoLlm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage("Create the storyboard breakdown now."),
  ]);

  try {
    const content = typeof response.content === "string" ? response.content : "";
    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanedContent);
  } catch (e) {
    console.error("Failed to parse storyboard response:", e);
    // Return default 40s storyboard
    return {
      clips: [
        { id: "clip_1", index: 1, duration: 4, description: "Hook - attention grabber", isContinuation: false },
        { id: "clip_2", index: 2, duration: 6, description: "Problem introduction", isContinuation: false },
        { id: "clip_3", index: 3, duration: 8, description: "Solution reveal", isContinuation: false },
        { id: "clip_4", index: 4, duration: 6, description: "Benefits showcase", isContinuation: true },
        { id: "clip_5", index: 5, duration: 8, description: "Social proof", isContinuation: false },
        { id: "clip_6", index: 6, duration: 4, description: "Call to action", isContinuation: false },
        { id: "clip_7", index: 7, duration: 4, description: "Brand logo", isContinuation: true },
      ],
      totalDuration: 40,
    };
  }
}

/**
 * Step 3: Generate frame prompts for each clip
 */
export async function generateFramePrompts(
  productContext: any,
  storyline: VideoStoryline,
  storyboard: VideoStoryboard
): Promise<FramePrompt[]> {
  const clipsDescription = storyboard.clips
    .map((c) => `Clip ${c.index} (${c.duration}s, ${c.isContinuation ? "continuation" : "new scene"}): ${c.description}`)
    .join("\n");

  const systemPrompt = `You are a visual prompt engineer for AI video generation.

BRAND: ${productContext?.name}
THEME: ${storyline.theme}
PLATFORM: ${storyline.targetPlatform}

STORYBOARD:
${clipsDescription}

For each clip, create detailed visual prompts for:
- START FRAME: First frame of the clip (skip if isContinuation is true)
- END FRAME: Last frame of the clip

Your response MUST be valid JSON array:
[
  {
    "clipId": "clip_1",
    "clipIndex": 1,
    "startFrame": "Detailed prompt for start frame...",
    "endFrame": "Detailed prompt for end frame..."
  }
]

For continuation clips, set startFrame to null.

PROMPT GUIDELINES:
- Be visually specific (lighting, angle, mood)
- Include brand colors/aesthetic where relevant
- Describe motion direction for transitions
- Keep prompts under 100 words each

Respond ONLY with the JSON array, no markdown or explanation.`;

  const response = await videoLlm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage("Generate the frame prompts now."),
  ]);

  try {
    const content = typeof response.content === "string" ? response.content : "";
    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanedContent);
  } catch (e) {
    console.error("Failed to parse frame prompts response:", e);
    // Return defaults
    return storyboard.clips.map((clip) => ({
      clipId: clip.id,
      clipIndex: clip.index,
      startFrame: clip.isContinuation ? null : `Opening frame for ${clip.description}`,
      endFrame: `Closing frame for ${clip.description}`,
    }));
  }
}

/**
 * Step 4: Mock frame generation (returns stock images)
 */
export async function mockGenerateFrames(
  framePrompts: FramePrompt[]
): Promise<GeneratedFrame[]> {
  const stockImages = [
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80",
    "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&q=80",
  ];

  return framePrompts.map((fp, i) => ({
    clipId: fp.clipId,
    startFrameUrl: fp.startFrame ? stockImages[i % stockImages.length] : null,
    endFrameUrl: stockImages[(i + 1) % stockImages.length],
    status: "done" as const,
  }));
}

/**
 * Create initial workflow state
 */
export function createVideoWorkflow(
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
    framePrompts: [],
    generatedFrames: [],
    videoUrl: null,
    error: null,
  };
}

/**
 * Continue workflow to next stage
 */
export async function continueVideoWorkflow(
  state: VideoWorkflowState,
  action: "approve" | "regenerate"
): Promise<VideoWorkflowState> {
  const newState = { ...state };

  try {
    switch (state.stage) {
      case "storyline":
        if (action === "approve" && state.storyline) {
          // Move to storyboard creation
          const storyboard = await createStoryboard(state.productContext, state.storyline);
          newState.storyboard = storyboard;
          newState.stage = "storyboard";
        } else if (action === "regenerate") {
          // Regenerate storyline
          const storyline = await createStoryline(state.productContext, state.userRequest);
          newState.storyline = storyline;
        }
        break;

      case "storyboard":
        if (action === "approve" && state.storyline && state.storyboard) {
          // Generate frame prompts
          const framePrompts = await generateFramePrompts(
            state.productContext,
            state.storyline,
            state.storyboard
          );
          newState.framePrompts = framePrompts;
          newState.stage = "generating";
          
          // Immediately generate frames and complete
          const generatedFrames = await mockGenerateFrames(framePrompts);
          newState.generatedFrames = generatedFrames;
          newState.videoUrl = "https://example.com/mock-video.mp4";
          newState.stage = "complete";
        } else if (action === "regenerate" && state.storyline) {
          // Regenerate storyboard
          const storyboard = await createStoryboard(state.productContext, state.storyline);
          newState.storyboard = storyboard;
        }
        break;

      case "frame_prompts":
        // Auto-proceed to generation (no approval needed for prompts)
        const generatedFrames = await mockGenerateFrames(state.framePrompts);
        newState.generatedFrames = generatedFrames;
        newState.stage = "generating";
        // Mock video URL
        newState.videoUrl = "https://example.com/mock-video.mp4";
        newState.stage = "complete";
        break;

      default:
        break;
    }
  } catch (error: any) {
    console.error("Video workflow error:", error);
    newState.error = error.message;
  }

  return newState;
}

/**
 * Start video workflow and return initial storyline
 */
export async function startVideoWorkflow(
  productContext: any,
  userRequest: string
): Promise<VideoWorkflowState> {
  const state = createVideoWorkflow(productContext, userRequest);
  
  // Generate initial storyline
  const storyline = await createStoryline(productContext, userRequest);
  state.storyline = storyline;
  
  return state;
}
