-- EmilyAI Database Schema
-- Run this in your Supabase SQL Editor

-- Products table (likely exists, verify columns match)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  extracted_info JSONB DEFAULT '{}',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions for research history
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table for generated content
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('linkedin', 'twitter', 'image', 'video')),
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_product_id ON chat_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_assets_product_id ON assets(product_id);

-- Enable RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (user_id = current_user);

DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own products" ON products;
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (true);

-- RLS Policies for chat_sessions (based on product ownership)
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON chat_sessions;
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions FOR ALL USING (true);

-- RLS Policies for assets (based on product ownership)
DROP POLICY IF EXISTS "Users can manage own assets" ON assets;
CREATE POLICY "Users can manage own assets" ON assets FOR ALL USING (true);

-- Note: The above RLS policies are permissive for development.
-- In production, you should tighten these based on your auth setup.
-- For Clerk, you may need to use a custom function to verify user_id matches the JWT claim.

-- ============================================================================
-- Video Workflow Tables (for persistence across page refreshes)
-- ============================================================================

-- Video Workflows table - stores the main workflow state
CREATE TABLE IF NOT EXISTS video_workflows (
  id TEXT PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'storyline' CHECK (stage IN ('storyline', 'storyboard', 'generating', 'complete', 'cancelled')),
  generation_phase TEXT CHECK (generation_phase IN ('frames', 'clips', 'stitching', 'done')),
  user_request TEXT,
  storyline JSONB,
  storyboard JSONB,
  video_url TEXT,
  aspect_ratio TEXT DEFAULT '9:16' CHECK (aspect_ratio IN ('9:16', '16:9')),
  available_images JSONB DEFAULT '[]',
  messages JSONB DEFAULT '[]',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Frames table - stores generated frames for each clip
CREATE TABLE IF NOT EXISTS video_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT REFERENCES video_workflows(id) ON DELETE CASCADE,
  clip_id TEXT NOT NULL,
  frame_type TEXT NOT NULL CHECK (frame_type IN ('start', 'end')),
  url TEXT NOT NULL,
  storage_path TEXT,
  status TEXT DEFAULT 'done' CHECK (status IN ('pending', 'generating', 'done', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Clips table - stores generated video clips
CREATE TABLE IF NOT EXISTS video_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT REFERENCES video_workflows(id) ON DELETE CASCADE,
  clip_id TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  duration INTEGER,
  status TEXT DEFAULT 'done' CHECK (status IN ('pending', 'generating', 'done', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for video workflow tables
CREATE INDEX IF NOT EXISTS idx_video_workflows_product_id ON video_workflows(product_id);
CREATE INDEX IF NOT EXISTS idx_video_frames_workflow_id ON video_frames(workflow_id);
CREATE INDEX IF NOT EXISTS idx_video_clips_workflow_id ON video_clips(workflow_id);

-- Enable RLS on video workflow tables
ALTER TABLE video_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_clips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video workflow tables (permissive for development)
DROP POLICY IF EXISTS "Users can manage video workflows" ON video_workflows;
CREATE POLICY "Users can manage video workflows" ON video_workflows FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage video frames" ON video_frames;
CREATE POLICY "Users can manage video frames" ON video_frames FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage video clips" ON video_clips;
CREATE POLICY "Users can manage video clips" ON video_clips FOR ALL USING (true);
