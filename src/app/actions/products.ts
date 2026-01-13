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
  return data[0];
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
    return [];
  }

  return data;
}
