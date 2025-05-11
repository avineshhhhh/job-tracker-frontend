import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Job } from "../services/jobs";
import { JobCard } from "./JobCard";
import { ClipboardList, PhoneCall, Users, Award, XCircle } from "lucide-react";

interface JobColumnProps {
  status: string;
  jobs: Job[];
  onEditJob: (job: Job) => void;
  onDeleteJob: (id: number) => void;
}

const statusIcons = {
  Applied: <ClipboardList className="w-5 h-5 text-primary" />,
  "Phone Screen": <PhoneCall className="w-5 h-5 text-primary" />,
  Interview: <Users className="w-5 h-5 text-primary" />,
  Offer: <Award className="w-5 h-5 text-primary" />,
  Rejected: <XCircle className="w-5 h-5 text-primary" />,
};

export function JobColumn({
  status,
  jobs,
  onEditJob,
  onDeleteJob,
}: JobColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-8rem)] w-[400px] flex-shrink-0 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl"
    >
      <div className="flex items-center gap-3 mb-6 sticky top-0 p-4 bg-background/80 backdrop-blur-xl rounded-t-xl border-b border-white/10">
        {statusIcons[status as keyof typeof statusIcons]}
        <h2 className="text-xl font-display">
          {status}
        </h2>
        <span className="ml-auto px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white/90">
          {jobs.length}
        </span>
      </div>

      <div ref={setNodeRef} className="space-y-4 p-4">
        <SortableContext
          items={jobs.map((job) => job.id)}
          strategy={verticalListSortingStrategy}
        >
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={onEditJob}
              onDelete={onDeleteJob}
            />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <div className="h-32 flex items-center justify-center border-2 border-dashed rounded-xl border-white/10 text-white/40">
            <p className="text-sm">Drop jobs here</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}