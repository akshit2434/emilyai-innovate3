/**
 * Video Generation Pipeline
 * Uses FAL AI for real frame and clip generation
 * Stitching remains mocked (requires FFmpeg for production)
 */

import { generateImage, generateVideo, uploadGeneratedImage, uploadGeneratedVideo } from "./mediaGeneration";
import { ImageReference } from "./frameGeneration";

// ============================================================================
// Types
// ============================================================================

export interface GeneratedFrame {
  id: string;
  url: string;
  clipId: string;
  frameType: "start" | "end";
}

export interface GeneratedClip {
  id: string;
  url: string;
  clipId: string;
  duration: number;
}

export interface StitchedVideo {
  id: string;
  url: string;
  totalDuration: number;
  clipUrls: string[]; // Individual clip URLs for viewing
}

export interface ClipFramePrompts {
  firstFramePrompt: string;
  lastFramePrompt: string;
  referenceImageIds?: string[];
  useComplexModel?: boolean;
}

export interface GenerationProgress {
  phase: "frames" | "clips" | "stitching" | "complete";
  clipIndex?: number;
  totalClips?: number;
  frameType?: "start" | "end";
  message: string;
  frames?: Array<{ clipId: string; startUrl: string | null; endUrl: string | null; status: string }>;
  clips?: GeneratedClip[];
  finalVideo?: StitchedVideo;
}

// ============================================================================
// Frame Generation (Real FAL AI)
// ============================================================================

/**
 * Generate a frame image using FAL AI
 */
export async function generateRealFrame(
  clipId: string,
  clipDescription: string,
  frameType: "start" | "end",
  options?: {
    prompt?: string;
    complex?: boolean;
    referenceImages?: ImageReference[];
    aspectRatio?: string;
  }
): Promise<GeneratedFrame> {
  console.log(`[VideoGen] Generating ${frameType} frame for clip ${clipId}...`);

  const frameContext = frameType === "start"
    ? "opening scene establishing shot"
    : "closing scene final shot";

  // Build prompt - use custom prompt if provided, otherwise generate from description
  const basePrompt = options?.prompt || clipDescription;
  const enhancedPrompt = `[Frame Type]: ${frameContext}
[Scene Description]: ${basePrompt}

[Requirements]:
- Cinematic quality, professional advertising aesthetic
- 16:9 aspect ratio for video frame
- Clear, sharp imagery suitable for video keyframe
- Consistent lighting and color grading`;

  // Get reference image URLs in order
  const imageRefs = options?.referenceImages?.map(ref => ref.url);

  try {
    const result = await generateImage({
      prompt: enhancedPrompt,
      complex: options?.complex ?? false,
      imageRefs: imageRefs && imageRefs.length > 0 ? imageRefs : undefined,
      aspectRatio: options?.aspectRatio || "16:9",
      resolution: "2K",
      numImages: 1,
    });

    console.log(`[VideoGen] Frame generated: ${frameType} for ${clipId}`);

    return {
      id: `frame_${Date.now()}_${frameType}`,
      url: result.url,
      clipId,
      frameType,
    };
  } catch (error: any) {
    console.error(`[VideoGen] Frame generation failed for ${clipId}:`, error);
    throw new Error(`Frame generation failed: ${error.message}`);
  }
}

/**
 * Generate a video clip from start and end frames using FAL AI VEO 3.1
 */
export async function generateRealClip(
  clipId: string,
  clipDescription: string,
  startFrameUrl: string,
  endFrameUrl: string,
  durationSeconds: number,
  aspectRatio: "9:16" | "16:9" = "9:16"
): Promise<GeneratedClip> {
  console.log(`[VideoGen] Generating video clip ${clipId} (${durationSeconds}s, ${aspectRatio})...`);

  // Map duration to VEO 3.1 supported durations
  const veoDuration = mapToVeoDuration(durationSeconds);

  try {
    const result = await generateVideo({
      prompt: clipDescription,
      firstFrameUrl: startFrameUrl,
      lastFrameUrl: endFrameUrl,
      duration: veoDuration,
      aspectRatio: aspectRatio,
      resolution: "720p",
      generateAudio: true,
    });

    console.log(`[VideoGen] Clip generated: ${clipId}`);

    return {
      id: `clip_video_${Date.now()}`,
      url: result.url,
      clipId,
      duration: durationSeconds,
    };
  } catch (error: any) {
    console.error(`[VideoGen] Clip generation failed for ${clipId}:`, error);
    throw new Error(`Clip generation failed: ${error.message}`);
  }
}

/**
 * Map storyboard duration to VEO 3.1 supported durations
 * VEO 3.1 only accepts 4s, 6s, or 8s
 */
function mapToVeoDuration(seconds: number): "4s" | "6s" | "8s" {
  if (seconds <= 4) return "4s";
  if (seconds <= 6) return "6s";
  return "8s";
}

/**
 * Stitch multiple video clips into a final video
 * MOCKED - Returns the clips as-is since FFmpeg isn't available on Vercel
 * Users can view individual clips while final stitching is mocked
 */
export async function stitchMockVideo(
  clips: GeneratedClip[]
): Promise<StitchedVideo> {
  console.log(`[VideoGen] Stitching ${clips.length} clips (mocked - displaying clips separately)...`);

  // Simulate a brief processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
  const clipUrls = clips.map(c => c.url);

  // For now, use the first clip as the "final" video
  // In production, this would be FFmpeg-stitched
  const mockFinalUrl = clips.length > 0
    ? clips[0].url
    : "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  console.log(`[VideoGen] Stitching complete (mocked): ${totalDuration}s total, ${clips.length} clips available`);

  return {
    id: `video_final_${Date.now()}`,
    url: mockFinalUrl,
    totalDuration,
    clipUrls, // Individual clips are viewable
  };
}

// ============================================================================
// Video Generation Pipeline
// ============================================================================

export interface PipelineOptions {
  productId?: string;
  framePrompts?: Map<string, ClipFramePrompts>;
  availableImages?: Map<string, ImageReference>;
  /** Aspect ratio for video generation (default: "9:16" for vertical) */
  aspectRatio?: "9:16" | "16:9";
}

/**
 * Run the complete video generation pipeline for a storyboard
 * Uses real FAL AI for frame and clip generation
 * Streams progress updates via async generator
 */
export async function* runVideoGenerationPipeline(
  storyboardClips: Array<{ id: string; description: string; duration: number }>,
  options?: PipelineOptions
): AsyncGenerator<GenerationProgress> {
  const totalClips = storyboardClips.length;
  const generatedFrames: Array<{ clipId: string; startUrl: string | null; endUrl: string | null; status: string }> =
    storyboardClips.map(c => ({ clipId: c.id, startUrl: null, endUrl: null, status: "pending" }));
  const generatedClips: GeneratedClip[] = [];

  // Phase 1: Generate all frames using FAL AI
  for (let i = 0; i < totalClips; i++) {
    const clip = storyboardClips[i];
    generatedFrames[i].status = "generating";

    // Get custom prompts if available
    const customPrompts = options?.framePrompts?.get(clip.id);

    // Resolve reference images if specified
    let referenceImages: ImageReference[] | undefined;
    if (customPrompts?.referenceImageIds && options?.availableImages) {
      referenceImages = customPrompts.referenceImageIds
        .map(id => options.availableImages!.get(id))
        .filter((img): img is ImageReference => img !== undefined);
    }

    // Generate start frame
    yield {
      phase: "frames",
      clipIndex: i,
      totalClips,
      frameType: "start",
      message: `Generating start frame for clip ${i + 1}/${totalClips}...`,
      frames: [...generatedFrames],
    };

    const startFrame = await generateRealFrame(clip.id, clip.description, "start", {
      prompt: customPrompts?.firstFramePrompt,
      complex: customPrompts?.useComplexModel,
      referenceImages,
      aspectRatio: options?.aspectRatio || "9:16",
    });
    generatedFrames[i].startUrl = startFrame.url;

    // Generate end frame
    yield {
      phase: "frames",
      clipIndex: i,
      totalClips,
      frameType: "end",
      message: `Generating end frame for clip ${i + 1}/${totalClips}...`,
      frames: [...generatedFrames],
    };

    const endFrame = await generateRealFrame(clip.id, clip.description, "end", {
      prompt: customPrompts?.lastFramePrompt,
      complex: customPrompts?.useComplexModel,
      referenceImages,
      aspectRatio: options?.aspectRatio || "9:16",
    });
    generatedFrames[i].endUrl = endFrame.url;
    generatedFrames[i].status = "done";

    yield {
      phase: "frames",
      clipIndex: i,
      totalClips,
      message: `Completed frames for clip ${i + 1}/${totalClips}`,
      frames: [...generatedFrames],
    };
  }

  // Phase 2: Generate video clips from frames using VEO 3.1
  for (let i = 0; i < totalClips; i++) {
    const clip = storyboardClips[i];
    const frame = generatedFrames[i];

    yield {
      phase: "clips",
      clipIndex: i,
      totalClips,
      message: `Generating video clip ${i + 1}/${totalClips}...`,
      frames: generatedFrames,
      clips: [...generatedClips],
    };

    const generatedClip = await generateRealClip(
      clip.id,
      clip.description,
      frame.startUrl!,
      frame.endUrl!,
      clip.duration,
      options?.aspectRatio || "9:16"
    );
    generatedClips.push(generatedClip);

    yield {
      phase: "clips",
      clipIndex: i,
      totalClips,
      message: `Completed video clip ${i + 1}/${totalClips}`,
      frames: generatedFrames,
      clips: [...generatedClips],
    };
  }

  // Phase 3: Stitch all clips (mocked)
  yield {
    phase: "stitching",
    message: "Preparing final video (clips available for preview)...",
    frames: generatedFrames,
    clips: generatedClips,
  };

  const finalVideo = await stitchMockVideo(generatedClips);

  yield {
    phase: "complete",
    message: "Video generation complete! Individual clips are ready to view.",
    frames: generatedFrames,
    clips: generatedClips,
    finalVideo,
  };
}
