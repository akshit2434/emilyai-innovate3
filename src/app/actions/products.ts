"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createProduct(name: string, description: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name,
        description,
        user_id: userId,
      },
    ])
    .select();

  if (error) {
    console.error("Error creating product:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  return data?.[0] || null;
}

export async function getProducts() {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    // Return mock data for UI testing
    return getMockProducts();
  }

  // If no real data, return mock for testing
  if (!data || data.length === 0) {
    return getMockProducts();
  }

  return data;
}

function getMockProducts() {
  return [
    {
      id: "mock-eco-innovate",
      user_id: "mock",
      name: "EcoInnovate",
      description: "Sustainable technology solutions for eco-conscious businesses. We help companies reduce their carbon footprint through smart automation.",
      extracted_info: {
        tagline: "Technology for a greener tomorrow",
        target_audience: "SMBs looking to go green",
        value_proposition: "Reduce emissions by 40% with AI-powered optimization",
        industry: "CleanTech",
      },
      logo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mock-pulse-analytics",
      user_id: "mock",
      name: "Pulse Analytics",
      description: "Real-time social media analytics and sentiment tracking for brands. Understand your audience like never before.",
      extracted_info: {
        tagline: "Feel the pulse of your audience",
        target_audience: "Marketing teams at D2C brands",
        value_proposition: "10x faster insights than traditional tools",
        industry: "MarTech",
      },
      logo_url: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

export async function getProductById(productId: string) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Handle mock product IDs
  if (productId.startsWith("mock-")) {
    const mockProducts = getMockProducts();
    return mockProducts.find(p => p.id === productId) || null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  return data;
}
