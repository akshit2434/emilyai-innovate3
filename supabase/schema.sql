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
