import React from "react";
import { motion } from "framer-motion";
import { Filter } from "lucide-react";

interface SearchFiltersProps {
  isOpen: boolean;
  onToggle: () => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: Record<string, { name: string; label: string; tag: string }>;
  jobType: string;
  onJobTypeChange: (value: string) => void;
  isRemote: boolean | null;
  onRemoteChange: (value: boolean | null) => void;
}

export function SearchFilters({
  isOpen,
  onToggle,
  category,
  onCategoryChange,
  categories,
  jobType,
  onJobTypeChange,
  isRemote,
  onRemoteChange,
}: SearchFiltersProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className="px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors flex items-center gap-2 text-sm"
    >
      <Filter className="w-4 h-4" />
      More Filters
    </motion.button>
  );
}
