/**
 * Video Workflow Database Utilities
 * Handles persistence of video workflow state, frames, and clips to Supabase
 */

import { supabaseAdmin } from "./supabase";
import { uploadGeneratedImage, uploadGeneratedVideo } from "./mediaGeneration";
import type { VideoWorkflowState, GeneratedFrame, GeneratedClipState } from "./videoAgent";

// ============================================================================
// Types
// ============================================================================

interface DbVideoWorkflow {
    id: string;
    product_id: string;
    stage: string;
    generation_phase: string | null;
    user_request: string | null;
    storyline: any;
    storyboard: any;
    video_url: string | null;
    aspect_ratio: string;
    available_images: any[];
    messages: any[];
    error: string | null;
    created_at: string;
    updated_at: string;
}

interface DbVideoFrame {
    id: string;
    workflow_id: string;
    clip_id: string;
    frame_type: "start" | "end";
    url: string;
    storage_path: string | null;
    status: string;
}

interface DbVideoClip {
    id: string;
    workflow_id: string;
    clip_id: string;
    url: string;
    storage_path: string | null;
    duration: number;
    status: string;
}

// ============================================================================
// Save Functions
// ============================================================================

/**
 * Save or update a video workflow in the database
 */
export async function saveVideoWorkflow(
    workflow: VideoWorkflowState,
    productId: string
): Promise<void> {
    console.log("[VideoDb] Saving workflow:", workflow.id, workflow.stage);

    const { error } = await supabaseAdmin
        .from("video_workflows")
        .upsert({
            id: workflow.id,
            product_id: productId,
            stage: workflow.stage,
            generation_phase: workflow.generationPhase || null,
            user_request: workflow.userRequest,
            storyline: workflow.storyline,
            storyboard: workflow.storyboard,
            video_url: workflow.videoUrl,
            aspect_ratio: workflow.aspectRatio || workflow.storyline?.aspectRatio || "9:16",
            available_images: workflow.availableImages || [],
            messages: workflow.messages || [],
            error: workflow.error,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: "id",
        });

    if (error) {
        console.error("[VideoDb] Failed to save workflow:", error);
        throw new Error(`Failed to save workflow: ${error.message}`);
    }
}

/**
 * Save a generated frame to the database and optionally upload to storage
 */
export async function saveGeneratedFrame(
    workflowId: string,
    clipId: string,
    frameType: "start" | "end",
    url: string,
    productId?: string
): Promise<string> {
    console.log("[VideoDb] Saving frame:", clipId, frameType);

    let storagePath: string | null = null;

    // Upload to storage if productId is provided
    if (productId) {
        try {
            const uploaded = await uploadGeneratedImage(url, productId, `video_frame_${clipId}_${frameType}.png`);
            storagePath = uploaded.path;
        } catch (error) {
            console.warn("[VideoDb] Failed to upload frame to storage:", error);
        }
    }

    const { data, error } = await supabaseAdmin
        .from("video_frames")
        .upsert({
            workflow_id: workflowId,
            clip_id: clipId,
            frame_type: frameType,
            url,
            storage_path: storagePath,
            status: "done",
        }, {
            onConflict: "workflow_id,clip_id,frame_type",
            ignoreDuplicates: false,
        })
        .select("id")
        .single();

    if (error) {
        // If conflict, try update instead
        const { data: updateData, error: updateError } = await supabaseAdmin
            .from("video_frames")
            .update({
                url,
                storage_path: storagePath,
                status: "done",
            })
            .eq("workflow_id", workflowId)
            .eq("clip_id", clipId)
            .eq("frame_type", frameType)
            .select("id")
            .single();

        if (updateError) {
            console.error("[VideoDb] Failed to save frame:", updateError);
            throw new Error(`Failed to save frame: ${updateError.message}`);
        }
        return updateData.id;
    }

    return data.id;
}

/**
 * Save a generated video clip to the database and optionally upload to storage
 */
export async function saveGeneratedClip(
    workflowId: string,
    clipId: string,
    url: string,
    duration: number,
    productId?: string
): Promise<string> {
    console.log("[VideoDb] Saving clip:", clipId);

    let storagePath: string | null = null;

    // Upload to storage if productId is provided
    if (productId) {
        try {
            const uploaded = await uploadGeneratedVideo(url, productId, `video_clip_${clipId}.mp4`);
            storagePath = uploaded.path;
        } catch (error) {
            console.warn("[VideoDb] Failed to upload clip to storage:", error);
        }
    }

    const { data, error } = await supabaseAdmin
        .from("video_clips")
        .upsert({
            workflow_id: workflowId,
            clip_id: clipId,
            url,
            storage_path: storagePath,
            duration,
            status: "done",
        }, {
            onConflict: "workflow_id,clip_id",
            ignoreDuplicates: false,
        })
        .select("id")
        .single();

    if (error) {
        // If conflict, try update instead
        const { data: updateData, error: updateError } = await supabaseAdmin
            .from("video_clips")
            .update({
                url,
                storage_path: storagePath,
                duration,
                status: "done",
            })
            .eq("workflow_id", workflowId)
            .eq("clip_id", clipId)
            .select("id")
            .single();

        if (updateError) {
            console.error("[VideoDb] Failed to save clip:", updateError);
            throw new Error(`Failed to save clip: ${updateError.message}`);
        }
        return updateData.id;
    }

    return data.id;
}

// ============================================================================
// Load Functions
// ============================================================================

/**
 * Load a video workflow by ID with all its frames and clips
 */
export async function loadVideoWorkflow(
    workflowId: string
): Promise<VideoWorkflowState | null> {
    console.log("[VideoDb] Loading workflow:", workflowId);

    // Load workflow
    const { data: workflow, error: workflowError } = await supabaseAdmin
        .from("video_workflows")
        .select("*")
        .eq("id", workflowId)
        .single();

    if (workflowError || !workflow) {
        console.log("[VideoDb] Workflow not found:", workflowId);
        return null;
    }

    // Load frames
    const { data: frames, error: framesError } = await supabaseAdmin
        .from("video_frames")
        .select("*")
        .eq("workflow_id", workflowId);

    if (framesError) {
        console.warn("[VideoDb] Failed to load frames:", framesError);
    }

    // Load clips
    const { data: clips, error: clipsError } = await supabaseAdmin
        .from("video_clips")
        .select("*")
        .eq("workflow_id", workflowId);

    if (clipsError) {
        console.warn("[VideoDb] Failed to load clips:", clipsError);
    }

    // Convert DB records to workflow state
    return convertDbToWorkflowState(workflow, frames || [], clips || []);
}

/**
 * Load the most recent active video workflow for a product
 */
export async function loadActiveVideoWorkflowByProduct(
    productId: string
): Promise<VideoWorkflowState | null> {
    console.log("[VideoDb] Loading active workflow for product:", productId);

    // Find most recent non-complete/cancelled workflow
    const { data: workflow, error } = await supabaseAdmin
        .from("video_workflows")
        .select("*")
        .eq("product_id", productId)
        .not("stage", "in", "(complete,cancelled)")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

    if (error || !workflow) {
        console.log("[VideoDb] No active workflow found for product");
        return null;
    }

    return loadVideoWorkflow(workflow.id);
}

/**
 * Load all video workflows for a product (including completed)
 */
export async function loadVideoWorkflowsByProduct(
    productId: string
): Promise<VideoWorkflowState[]> {
    console.log("[VideoDb] Loading all workflows for product:", productId);

    const { data: workflows, error } = await supabaseAdmin
        .from("video_workflows")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

    if (error || !workflows) {
        console.log("[VideoDb] No workflows found for product");
        return [];
    }

    // Load each workflow with frames and clips
    const fullWorkflows = await Promise.all(
        workflows.map(async (w) => {
            const full = await loadVideoWorkflow(w.id);
            return full;
        })
    );

    return fullWorkflows.filter((w): w is VideoWorkflowState => w !== null);
}

// ============================================================================
// Helper Functions
// ============================================================================

function convertDbToWorkflowState(
    dbWorkflow: DbVideoWorkflow,
    dbFrames: DbVideoFrame[],
    dbClips: DbVideoClip[]
): VideoWorkflowState {
    // Group frames by clip ID
    const generatedFrames: GeneratedFrame[] = [];
    const clipIds = new Set(dbFrames.map((f) => f.clip_id));

    clipIds.forEach((clipId) => {
        const startFrame = dbFrames.find((f) => f.clip_id === clipId && f.frame_type === "start");
        const endFrame = dbFrames.find((f) => f.clip_id === clipId && f.frame_type === "end");

        generatedFrames.push({
            clipId,
            startFrameUrl: startFrame?.url || null,
            endFrameUrl: endFrame?.url || null,
            status: (startFrame?.status === "done" && endFrame?.status === "done") ? "done" : "pending",
        });
    });

    // Convert clips
    const generatedClips: GeneratedClipState[] = dbClips.map((c) => ({
        clipId: c.clip_id,
        videoUrl: c.url,
        status: c.status as "pending" | "generating" | "done",
    }));

    return {
        id: dbWorkflow.id,
        stage: dbWorkflow.stage as VideoWorkflowState["stage"],
        generationPhase: dbWorkflow.generation_phase as VideoWorkflowState["generationPhase"],
        productContext: null, // Will be filled in by the caller
        userRequest: dbWorkflow.user_request || "",
        storyline: dbWorkflow.storyline,
        storyboard: dbWorkflow.storyboard,
        generatedFrames,
        generatedClips,
        videoUrl: dbWorkflow.video_url,
        error: dbWorkflow.error,
        messages: dbWorkflow.messages || [],
        availableImages: dbWorkflow.available_images || [],
        aspectRatio: dbWorkflow.aspect_ratio as "9:16" | "16:9",
    };
}

/**
 * Delete a video workflow and all its associated frames and clips
 */
export async function deleteVideoWorkflow(workflowId: string): Promise<void> {
    console.log("[VideoDb] Deleting workflow:", workflowId);

    const { error } = await supabaseAdmin
        .from("video_workflows")
        .delete()
        .eq("id", workflowId);

    if (error) {
        console.error("[VideoDb] Failed to delete workflow:", error);
        throw new Error(`Failed to delete workflow: ${error.message}`);
    }
}
