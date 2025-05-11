import React from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

interface SiteSelectorProps {
  sites: Record<string, { label: string }>;
  selectedSites: string[];
  onChange: (sites: string[]) => void;
}

export function SiteSelector({
  sites,
  selectedSites,
  onChange,
}: SiteSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(sites).map(([site, { label }]) => (
        <motion.button
          key={site}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (selectedSites.includes(site)) {
              onChange(selectedSites.filter((s) => s !== site));
            } else {
              onChange([...selectedSites, site]);
            }
          }}
          className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200 text-sm ${
            selectedSites.includes(site)
              ? "bg-primary text-background hover:bg-primary-dark"
              : "bg-white/5 hover:bg-white/10 border border-white/10"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{label}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              selectedSites.includes(site) ? "bg-background" : "bg-white/20"
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
}
