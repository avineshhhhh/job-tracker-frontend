import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, MessageSquare } from 'lucide-react';

interface TaskProps {
  task: {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    assignee?: string;
    comments?: number;
  };
  overlay?: boolean;
}

export function Task({ task, overlay }: TaskProps) {
  const priorityClasses = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`task-card ${overlay ? 'shadow-xl' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-handwritten text-lg text-gray-800">{task.title}</h3>
        <span className={`priority-tag ${priorityClasses[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-4">{task.description}</p>
      <div className="flex items-center gap-4 text-gray-500 text-sm">
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{task.dueDate}</span>
          </div>
        )}
        {task.assignee && (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{task.assignee}</span>
          </div>
        )}
        {task.comments !== undefined && (
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{task.comments}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}