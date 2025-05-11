import React from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Building2,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Mail,
  Phone,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Job } from "../services/jobs";

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (id: number) => void;
}

export function JobCard({ job, onEdit, onDelete }: JobCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDraggingSort,
  } = useSortable({
    id: job.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDraggingSort ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onEdit(job);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`group relative glass-card !bg-white/2 p-6 cursor-pointer hover-glow2 ${
        isDraggingSort ? "ring-2 ring-primary" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Drag Handle */}
      <div
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
      >
        <GripVertical className="w-5 h-5 text-white/40 hover:text-white/60" />
      </div>

      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4 text-white/60" />
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 py-2 bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(job);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-2 text-white/80 hover:text-white"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(job.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-2 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="pl-6">
        <h3 className="text-xl font-display mb-3 pr-8">
          {job.title}
        </h3>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-white/70">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="font-medium text-white/80">{job.company}</span>
          </div>
          {job.location && (
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{job.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-white/70">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{new Date(job.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {job.notes && (
          <p className="text-sm text-white/60 mb-4 line-clamp-2">{job.notes}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          {job.contact_email && (
            <a
              href={`mailto:${job.contact_email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </a>
          )}
          {job.contact_phone && (
            <a
              href={`tel:${job.contact_phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          )}
          {job.job_posting_url && (
            <a
              href={job.job_posting_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>View Post</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}