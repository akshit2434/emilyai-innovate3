export type Product = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  extracted_info?: {
    tagline?: string;
    target_audience?: string;
    value_proposition?: string;
    industry?: string;
  };
  logo_url?: string;
  created_at: string;
  updated_at: string;
};

export type ResearchSession = {
  id: string;
  product_id: string;
  query: string;
  findings: string;
  created_at: string;
};

export type Asset = {
  id: string;
  product_id: string;
  type: "linkedin" | "twitter" | "image" | "video";
  format: "text" | "9:16" | "16:9" | "image";
  content: string; // MD for text, URL for media
  status: "pending" | "completed" | "failed";
  created_at: string;
};
