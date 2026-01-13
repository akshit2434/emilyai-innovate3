"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, X, Search, Image, FileText, Pencil, Database } from "lucide-react";

type ToolStatus = "processing" | "done" | "failed";

interface ToolStatusPillProps {
  toolName: string;
  status: ToolStatus;
}

// Map internal tool names to user-friendly names and icons
const toolDisplayConfig: Record<string, { label: string; icon: typeof Search; hidden?: boolean }> = {
  web_search: { label: "Searching the web", icon: Search },
  generate_marketing_image: { label: "Generating image", icon: Image },
  edit_image: { label: "Editing image", icon: Pencil },
  generate_linkedin_post: { label: "Creating LinkedIn post", icon: FileText },
  generate_twitter_thread: { label: "Creating Twitter thread", icon: FileText },
  // Hidden/sensitive tools
  update_brand_info: { label: "Updating brand info", icon: Database, hidden: true },
};

export function ToolStatusPill({ toolName, status }: ToolStatusPillProps) {
  const config = toolDisplayConfig[toolName];
  
  // Hide sensitive tools
  if (config?.hidden) {
    return null;
  }
  
  const label = config?.label || toolName.replace(/_/g, " ");
  const Icon = config?.icon || FileText;
  
  const statusConfig = {
    processing: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      StatusIcon: Loader2,
      iconClass: "animate-spin",
    },
    done: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      StatusIcon: Check,
      iconClass: "",
    },
    failed: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      StatusIcon: X,
      iconClass: "",
    },
  };
  
  const { bg, border, text, StatusIcon, iconClass } = statusConfig[status];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${bg} ${border} ${text} text-xs font-medium`}
    >
      <Icon size={12} className="opacity-70" />
      <span>{label}</span>
      <StatusIcon size={12} className={iconClass} />
    </motion.div>
  );
}

interface ToolStatusListProps {
  tools: Array<{ name: string; status: ToolStatus }>;
}

export function ToolStatusList({ tools }: ToolStatusListProps) {
  return (
    <div className="flex flex-wrap gap-2 my-2">
      <AnimatePresence mode="popLayout">
        {tools.map((tool) => (
          <ToolStatusPill
            key={tool.name}
            toolName={tool.name}
            status={tool.status}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
