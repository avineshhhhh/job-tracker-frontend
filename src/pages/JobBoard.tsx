import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  Briefcase,
  Plus,
  LogOut,
  Loader2,
  Building2,
  MapPin,
  Mail,
  Phone,
  Link as LinkIcon,
  Calendar,
  Search,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jobsApi, Job, CreateJobDto } from "../services/jobs";
import { JobColumn } from "../components/JobColumn";
import { JobCard } from "../components/JobCard";
import { JobModal } from "../components/JobModal";
import toast from "react-hot-toast";

const JOB_STATUSES = [
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
];

export function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await jobsApi.getJobs();
      setJobs(data);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeJob = jobs.find((job) => job.id === Number(active.id));
    const overStatus = over.id as string;

    if (activeJob && activeJob.status !== overStatus) {
      try {
        await jobsApi.updateJob(activeJob.id, { status: overStatus });
        setJobs(
          jobs.map((job) =>
            job.id === activeJob.id ? { ...job, status: overStatus } : job
          )
        );
        toast.success(`Moved job to ${overStatus}`);
      } catch (error) {
        toast.error("Failed to update job status");
      }
    }

    setActiveId(null);
  };

  const handleCreateJob = async (jobData: CreateJobDto) => {
    try {
      const newJob = await jobsApi.createJob(jobData);
      setJobs([...jobs, newJob]);
      setIsJobModalOpen(false);
      toast.success("Job created successfully");
    } catch (error) {
      toast.error("Failed to create job");
    }
  };

  const handleUpdateJob = async (
    jobId: number,
    jobData: Partial<CreateJobDto>
  ) => {
    try {
      const updatedJob = await jobsApi.updateJob(jobId, jobData);
      setJobs(jobs.map((job) => (job.id === jobId ? updatedJob : job)));
      setEditingJob(null);
      toast.success("Job updated successfully");
    } catch (error) {
      toast.error("Failed to update job");
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    try {
      await jobsApi.deleteJob(jobId);
      setJobs(jobs.filter((job) => job.id !== jobId));
      toast.success("Job deleted successfully");
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-primary" />
              <span className="text-2xl font-display">Trackr</span>
            </div>
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/dashboard")}
                className="px-6 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors"
              >
                Dashboard
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsJobModalOpen(true)}
                className="px-6 py-2 rounded-full bg-primary text-background font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Job
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-6 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 overflow-x-auto">
        <div className="container mx-auto px-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 min-w-max pb-6">
              {JOB_STATUSES.map((status) => (
                <JobColumn
                  key={status}
                  status={status}
                  jobs={filteredJobs.filter((job) => job.status === status)}
                  onEditJob={setEditingJob}
                  onDeleteJob={handleDeleteJob}
                />
              ))}
            </div>

            <DragOverlay>
              {activeId ? (
                <JobCard
                  job={jobs.find((job) => job.id === activeId)!}
                  onEdit={setEditingJob}
                  onDelete={handleDeleteJob}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <JobModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onSubmit={handleCreateJob}
      />

      <JobModal
        isOpen={!!editingJob}
        onClose={() => setEditingJob(null)}
        onSubmit={(data) => editingJob && handleUpdateJob(editingJob.id, data)}
        initialData={editingJob}
      />
    </div>
  );
}
