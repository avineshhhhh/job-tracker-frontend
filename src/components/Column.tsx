import React from 'react';
import { motion } from 'framer-motion';

interface ColumnProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function Column({ title, icon, children }: ColumnProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="kanban-column"
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-handwritten text-xl text-gray-800">{title}</h2>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </motion.div>
  );
}