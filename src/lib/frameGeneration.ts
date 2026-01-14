/**
 * Frame Generation Module
 * Specialized for generating first/last frames for video clips
 * Supports reference images for coherence and consistency
 * 
 * Image references use simple IDs (@image1, @image2) that map to actual URLs.
 * The order of URLs matters for FAL models - they are position-sensitive.
 */

import { generateImage, generateAndStoreImage, GenerateImageOptions } from "./mediaGeneration";

// ============================================================================
// Types
// ============================================================================

export interface ImageReference {
    id: string;        // Simple ID like "image1", "image2" (without @)
    url: string;       // Actual public URL
    description?: string; // Optional description for context
}

export interface FrameGenerationOptions {
    prompt: string;
    clipDescription: string;
    frameType: "first" | "last";
    complex?: boolean;          // true = nanobanana pro, false = seedream
    referenceImages?: ImageReference[]; // Order matters!
    aspectRatio?: string;
    resolution?: "1K" | "2K" | "4K";
}

export interface GeneratedFrame {
    url: string;
    requestId: string;
    frameType: "first" | "last";
    clipId?: string;
}

export interface StoredFrame extends GeneratedFrame {
    imageId: string;
    publicUrl: string;
    storagePath: string;
}

// ============================================================================
// Reference Image Utilities
// ============================================================================

/**
 * Parse image references from a prompt
 * Extracts @image1, @image2, etc. and returns them in order
 */
export function parseImageReferences(prompt: string): string[] {
    const regex = /@image(\d+)/gi;
    const matches = prompt.matchAll(regex);
    const refs: string[] = [];

    for (const match of matches) {
        const id = `image${match[1]}`;
        if (!refs.includes(id)) {
            refs.push(id);
        }
    }

    return refs;
}

/**
 * Resolve image IDs to URLs using available images context
 * Maintains the order specified in referencedIds
 * 
 * @param referencedIds - Array of image IDs in order (e.g., ["image1", "image2"])
 * @param availableImages - Map of all available images
 * @returns Ordered array of ImageReference objects
 */
export function resolveImageReferences(
    referencedIds: string[],
    availableImages: Map<string, ImageReference>
): ImageReference[] {
    const resolved: ImageReference[] = [];

    for (const id of referencedIds) {
        const image = availableImages.get(id);
        if (image) {
            resolved.push(image);
        } else {
            console.warn(`[FrameGen] Image reference ${id} not found in available images`);
        }
    }

    return resolved;
}

/**
 * Enhance a frame prompt with context about reference images
 * This helps the AI model understand which image is which
 */
export function enhancePromptWithReferences(
    basePrompt: string,
    references: ImageReference[]
): string {
    if (references.length === 0) {
        return basePrompt;
    }

    // Build context about what each reference image contains
    let enhanced = basePrompt;

    // Replace @imageN with descriptive text if we have descriptions
    for (const ref of references) {
        const pattern = new RegExp(`@${ref.id}`, 'gi');
        if (ref.description) {
            enhanced = enhanced.replace(pattern, `the ${ref.description}`);
        }
    }

    return enhanced;
}

// ============================================================================
// Frame Generation
// ============================================================================

/**
 * Generate a single frame (first or last) for a video clip
 * Uses reference images for coherence when provided
 */
export async function generateFrame(
    options: FrameGenerationOptions
): Promise<GeneratedFrame> {
    const {
        prompt,
        clipDescription,
        frameType,
        complex = false,
        referenceImages = [],
        aspectRatio = "16:9",
        resolution = "2K",
    } = options;

    console.log("[FrameGen] Generating frame:", {
        frameType,
        complex,
        refCount: referenceImages.length,
        prompt: prompt.slice(0, 50)
    });

    // Build the frame-specific prompt
    const frameContext = frameType === "first"
        ? "opening scene establishing shot"
        : "closing scene final shot";

    const enhancedPrompt = `[Frame Type]: ${frameContext}
[Clip Context]: ${clipDescription}

[Scene Description]:
${prompt}

[Technical Requirements]:
- Cinematic quality, 8K resolution
- Professional advertising aesthetic
- Perfect for video ad keyframe
- Consistent lighting and color grading`;

    // Convert references to URL array (order matters!)
    const imageRefs = referenceImages.map(ref => ref.url);

    // Generate using mediaGeneration utility
    const result = await generateImage({
        prompt: enhancedPrompt,
        complex,
        imageRefs: imageRefs.length > 0 ? imageRefs : undefined,
        aspectRatio,
        resolution,
        numImages: 1,
    });

    return {
        url: result.url,
        requestId: result.requestId,
        frameType,
    };
}

/**
 * Generate and store a frame with full pipeline
 */
export async function generateAndStoreFrame(
    productId: string,
    clipId: string,
    options: FrameGenerationOptions
): Promise<StoredFrame> {
    const { prompt, clipDescription, frameType, complex, referenceImages, aspectRatio, resolution } = options;

    console.log("[FrameGen] Generate and store frame:", { productId, clipId, frameType });

    // Build the frame-specific prompt
    const frameContext = frameType === "first"
        ? "opening scene establishing shot"
        : "closing scene final shot";

    const enhancedPrompt = `[Frame Type]: ${frameContext}
[Clip Context]: ${clipDescription}

[Scene Description]:
${prompt}

[Technical Requirements]:
- Cinematic quality, 8K resolution
- Professional advertising aesthetic
- Perfect for video ad keyframe`;

    // Convert references to URL array
    const imageRefs = referenceImages?.map(ref => ref.url);

    // Use the full pipeline
    const result = await generateAndStoreImage(productId, {
        prompt: enhancedPrompt,
        complex: complex ?? false,
        imageRefs: imageRefs && imageRefs.length > 0 ? imageRefs : undefined,
        aspectRatio: aspectRatio ?? "16:9",
        resolution: resolution ?? "2K",
        title: `${frameType} frame - ${clipDescription.slice(0, 30)}`,
    });

    return {
        url: result.falUrl,
        requestId: "",
        frameType,
        clipId,
        imageId: result.imageId,
        publicUrl: result.publicUrl,
        storagePath: result.storagePath,
    };
}

/**
 * Generate both first and last frames for a clip
 */
export async function generateClipFrames(
    productId: string,
    clipId: string,
    clipDescription: string,
    options: {
        firstFramePrompt: string;
        lastFramePrompt: string;
        complex?: boolean;
        referenceImages?: ImageReference[];
        aspectRatio?: string;
    }
): Promise<{ firstFrame: StoredFrame; lastFrame: StoredFrame }> {
    const { firstFramePrompt, lastFramePrompt, complex, referenceImages, aspectRatio } = options;

    console.log("[FrameGen] Generating clip frames:", { clipId, hasRefs: !!referenceImages?.length });

    // Generate both frames (could be parallelized, but doing sequentially for rate limits)
    const firstFrame = await generateAndStoreFrame(productId, clipId, {
        prompt: firstFramePrompt,
        clipDescription,
        frameType: "first",
        complex,
        referenceImages,
        aspectRatio,
    });

    const lastFrame = await generateAndStoreFrame(productId, clipId, {
        prompt: lastFramePrompt,
        clipDescription,
        frameType: "last",
        complex,
        referenceImages,
        aspectRatio,
    });

    return { firstFrame, lastFrame };
}
