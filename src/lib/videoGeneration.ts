// Mock Video Generation Functions
// These simulate real video generation APIs with configurable delays

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
}

// Configuration for mock delays (in ms)
const MOCK_DELAYS = {
  frameGeneration: { min: 800, max: 1500 },
  clipGeneration: { min: 1500, max: 2500 },
  videoStitching: { min: 2000, max: 3500 },
};

function randomDelay(config: { min: number; max: number }): number {
  return config.min + Math.random() * (config.max - config.min);
}

/**
 * Generate a mock frame image (first or last keyframe for a clip)
 * In production, this would call an image generation API like Flux or DALL-E
 */
export async function generateMockFrame(
  clipId: string,
  clipDescription: string,
  frameType: "start" | "end"
): Promise<GeneratedFrame> {
  console.log(`[MOCK] Generating ${frameType} frame for clip ${clipId}...`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, randomDelay(MOCK_DELAYS.frameGeneration)));
  
  // Generate a mock URL using picsum with a deterministic seed
  const seed = `${clipId}-${frameType}-${Date.now()}`;
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1280/720`;
  
  console.log(`[MOCK] Frame generated: ${frameType} for ${clipId}`);
  
  return {
    id: `frame_${Date.now()}_${frameType}`,
    url,
    clipId,
    frameType,
  };
}

/**
 * Generate a mock video clip from start and end frames
 * In production, this would call a video generation API like Runway, Kling, etc.
 */
export async function generateMockClip(
  clipId: string,
  startFrameUrl: string,
  endFrameUrl: string,
  durationSeconds: number
): Promise<GeneratedClip> {
  console.log(`[MOCK] Generating video clip ${clipId} (${durationSeconds}s)...`);
  
  // Simulate API delay (longer for video generation)
  await new Promise(resolve => setTimeout(resolve, randomDelay(MOCK_DELAYS.clipGeneration)));
  
  // Mock video URL - in production this would be a real video file
  // Using a placeholder video service
  const mockVideoUrl = `https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`;
  
  console.log(`[MOCK] Clip generated: ${clipId}`);
  
  return {
    id: `clip_video_${Date.now()}`,
    url: mockVideoUrl,
    clipId,
    duration: durationSeconds,
  };
}

/**
 * Stitch multiple video clips into a final video
 * In production, this would use FFmpeg or a video processing API
 */
export async function stitchMockVideo(
  clips: GeneratedClip[]
): Promise<StitchedVideo> {
  console.log(`[MOCK] Stitching ${clips.length} clips into final video...`);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, randomDelay(MOCK_DELAYS.videoStitching)));
  
  const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
  
  // Mock final video URL
  const mockFinalUrl = `https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`;
  
  console.log(`[MOCK] Final video stitched: ${totalDuration}s total`);
  
  return {
    id: `video_final_${Date.now()}`,
    url: mockFinalUrl,
    totalDuration,
  };
}

/**
 * Run the complete video generation pipeline for a storyboard
 * Streams progress updates via callback
 */
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

export async function* runVideoGenerationPipeline(
  storyboardClips: Array<{ id: string; description: string; duration: number }>
): AsyncGenerator<GenerationProgress> {
  const totalClips = storyboardClips.length;
  const generatedFrames: Array<{ clipId: string; startUrl: string | null; endUrl: string | null; status: string }> = 
    storyboardClips.map(c => ({ clipId: c.id, startUrl: null, endUrl: null, status: "pending" }));
  const generatedClips: GeneratedClip[] = [];

  // Phase 1: Generate all frames
  for (let i = 0; i < totalClips; i++) {
    const clip = storyboardClips[i];
    generatedFrames[i].status = "generating";
    
    // Generate start frame
    yield {
      phase: "frames",
      clipIndex: i,
      totalClips,
      frameType: "start",
      message: `Generating start frame for clip ${i + 1}/${totalClips}...`,
      frames: [...generatedFrames],
    };
    
    const startFrame = await generateMockFrame(clip.id, clip.description, "start");
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
    
    const endFrame = await generateMockFrame(clip.id, clip.description, "end");
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

  // Phase 2: Generate video clips from frames
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
    
    const generatedClip = await generateMockClip(
      clip.id,
      frame.startUrl!,
      frame.endUrl!,
      clip.duration
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

  // Phase 3: Stitch all clips
  yield {
    phase: "stitching",
    message: "Stitching all clips into final video...",
    frames: generatedFrames,
    clips: generatedClips,
  };
  
  const finalVideo = await stitchMockVideo(generatedClips);
  
  yield {
    phase: "complete",
    message: "Video generation complete!",
    frames: generatedFrames,
    clips: generatedClips,
    finalVideo,
  };
}
