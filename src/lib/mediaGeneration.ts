/**
 * Media Generation Utility
 * Centralized image/video generation using FAL AI
 * 
 * Image Models:
 * - complex=true  → fal-ai/nano-banana-pro (high quality)
 * - complex=false → fal-ai/bytedance/seedream/v4.5 (fast, efficient)
 * 
 * When reference images are provided, uses /edit variants for coherence.
 */

import { fal } from "@fal-ai/client";
import { supabaseAdmin } from "./supabase";

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
});

// ============================================================================
// Types
// ============================================================================

export interface GenerateImageOptions {
  prompt: string;
  complex?: boolean; // true = nanobanana pro, false = seedream
  imageRefs?: string[]; // reference image URLs for coherence
  aspectRatio?: string; // e.g., "1:1", "16:9", "9:16", "auto"
  resolution?: "1K" | "2K" | "4K";
  numImages?: number;
}

export interface GeneratedImage {
  url: string;
  requestId: string;
  contentType?: string;
}

export interface UploadedImage {
  path: string;
  publicUrl: string;
  assetId?: string;
}

// ============================================================================
// Image Generation
// ============================================================================

/**
 * Generate an image using FAL AI
 * 
 * @param options.prompt - Description of the image to generate
 * @param options.complex - If true, uses nanobanana pro (higher quality), else seedream
 * @param options.imageRefs - Optional reference images for coherence/consistency
 * @param options.aspectRatio - Aspect ratio (default: "1:1")
 * @param options.resolution - Resolution (default: "1K")
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  const {
    prompt,
    complex = false,
    imageRefs,
    aspectRatio = "1:1",
    resolution = "1K",
    numImages = 1,
  } = options;

  console.log("[MediaGen] Generating image:", { prompt: prompt.slice(0, 50), complex, hasRefs: !!imageRefs?.length });

  // Determine which model to use based on complexity and reference images
  let modelId: string;
  let input: Record<string, unknown>;

  if (imageRefs && imageRefs.length > 0) {
    // Reference-based generation (edit mode)
    if (complex) {
      // Nanobanana Pro Edit
      modelId = "fal-ai/nano-banana-pro/edit";
      input = {
        prompt,
        num_images: numImages,
        aspect_ratio: aspectRatio === "auto" ? "auto" : aspectRatio,
        output_format: "png",
        image_urls: imageRefs,
        resolution,
      };
    } else {
      // Seedream Edit
      modelId = "fal-ai/bytedance/seedream/v4.5/edit";
      input = {
        prompt,
        image_size: `auto_${resolution === "4K" ? "4K" : resolution === "2K" ? "2K" : "2K"}`,
        num_images: numImages,
        max_images: 1,
        enable_safety_checker: true,
        image_urls: imageRefs,
      };
    }
  } else {
    // Standard text-to-image generation
    if (complex) {
      // Nanobanana Pro
      modelId = "fal-ai/nano-banana-pro";
      input = {
        prompt,
        num_images: numImages,
        aspect_ratio: aspectRatio === "auto" ? "1:1" : aspectRatio,
        output_format: "png",
        resolution,
      };
    } else {
      // Seedream text-to-image
      modelId = "fal-ai/bytedance/seedream/v4.5/text-to-image";
      input = {
        prompt,
        image_size: `auto_${resolution === "4K" ? "4K" : "2K"}`,
        num_images: numImages,
        max_images: 1,
        enable_safety_checker: true,
      };
    }
  }

  console.log("[MediaGen] Using model:", modelId);

  try {
    const result = await fal.subscribe(modelId, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach((msg) => {
            console.log("[MediaGen] Progress:", msg);
          });
        }
      },
    });

    console.log("[MediaGen] Generation complete:", result.requestId);

    // Extract image URL from result
    // FAL returns images in result.data.images array
    const images = (result.data as any)?.images;
    if (!images || images.length === 0) {
      throw new Error("No images returned from generation");
    }

    return {
      url: images[0].url,
      requestId: result.requestId,
      contentType: images[0].content_type || "image/png",
    };
  } catch (error: any) {
    console.error("[MediaGen] Generation failed:", error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Upload a generated image to Supabase Storage
 * Downloads from FAL URL and uploads to storage bucket
 */
export async function uploadGeneratedImage(
  imageUrl: string,
  productId: string,
  filename?: string
): Promise<UploadedImage> {
  console.log("[MediaGen] Uploading to Supabase:", { productId, imageUrl: imageUrl.slice(0, 50) });

  try {
    // Download the image from FAL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    // Generate filename if not provided
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const name = filename || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `generated/${productId}/${name}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("assets")
      .upload(path, buffer, {
        contentType: blob.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("assets")
      .getPublicUrl(path);

    console.log("[MediaGen] Upload complete:", urlData.publicUrl);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error("[MediaGen] Upload failed:", error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

/**
 * Save image metadata to the assets table
 */
export async function saveImageAsset(
  productId: string,
  title: string,
  imageUrl: string,
  storagePath: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("assets")
    .insert([{
      product_id: productId,
      type: "image",
      title,
      content: imageUrl,
      status: "completed",
      metadata: {
        storage_path: storagePath,
        ...metadata,
      },
    }])
    .select("id")
    .single();

  if (error) {
    console.error("[MediaGen] Failed to save asset:", error);
    throw new Error(`Failed to save image asset: ${error.message}`);
  }

  return data.id;
}

/**
 * Get stored image URL from path
 */
export function getStoredImageUrl(path: string): string {
  const { data } = supabaseAdmin.storage
    .from("assets")
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Full pipeline: Generate → Upload → Save
 * Returns everything needed to display and reference the image
 */
export async function generateAndStoreImage(
  productId: string,
  options: GenerateImageOptions & { title?: string }
): Promise<{
  imageId: string;
  publicUrl: string;
  storagePath: string;
  falUrl: string;
}> {
  // 1. Generate the image
  const generated = await generateImage(options);
  
  // 2. Upload to Supabase
  const uploaded = await uploadGeneratedImage(generated.url, productId);
  
  // 3. Save to assets table
  const title = options.title || `Generated: ${options.prompt.slice(0, 50)}...`;
  const assetId = await saveImageAsset(
    productId,
    title,
    uploaded.publicUrl,
    uploaded.path,
    {
      prompt: options.prompt,
      complex: options.complex || false,
      hasRefs: !!options.imageRefs?.length,
      requestId: generated.requestId,
    }
  );

  return {
    imageId: assetId,
    publicUrl: uploaded.publicUrl,
    storagePath: uploaded.path,
    falUrl: generated.url,
  };
}

