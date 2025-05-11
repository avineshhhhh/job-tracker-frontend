import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: Record<string, { name: string; label: string; tag: string }>;
  jobType: string;
  onJobTypeChange: (value: string) => void;
  isRemote: boolean | null;
  onRemoteChange: (value: boolean | null) => void;
}

export function FilterDialog({
  isOpen,
  onClose,
  category,
  onCategoryChange,
  categories,
  jobType,
  onJobTypeChange,
  isRemote,
  onRemoteChange,
}: FilterDialogProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display">Additional Filters</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">All Categories</option>
                  {Object.entries(categories).map(([value, categoryItem]) => (
                    <option key={value} value={value}>
                      {categoryItem?.name || value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => onJobTypeChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">All Types</option>
                  <option value="fulltime">Full Time</option>
                  <option value="parttime">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Remote Work
                </label>
                <select
                  value={isRemote === null ? "" : isRemote.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    onRemoteChange(value === "" ? null : value === "true");
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">All Locations</option>
                  <option value="true">Remote Only</option>
                  <option value="false">On-site Only</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors"
              >
                Apply Filters
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
