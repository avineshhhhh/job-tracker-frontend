import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  LogOut,
  Search,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Globe,
  Mail,
  Phone,
  Trash2,
  ArrowUpRight,
  Loader2,
  BookmarkX,
  Filter,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

interface SavedJob {
  id: number;
  title: string;
  company: string;
  status: string;
  notes: string;
  salary_range: string;
  location: string;
  contact_email: string;
  contact_phone: string;
  job_posting_url: string;
  created_at: string;
  last_status_change: string;
}

export function SavedJobs() {
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: "http://localhost:8000/",
    headers: {
      "Content-Type": "application/json",
    },
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Your session has expired. Please sign in again.");
        logout();
        navigate("/");
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const response = await api.get("/api/job-listings/saved");
      setJobs(response.data);
    } catch (error) {
      toast.error("Failed to fetch saved jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    try {
      await api.delete(`/api/job-listings/saved/${jobId}`);
      setJobs(jobs.filter((job) => job.id !== jobId));
      toast.success("Job removed from saved list");
    } catch (error) {
      toast.error("Failed to remove job");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/job-listings")}
                className="px-6 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors"
              >
                Find Jobs
              </motion.button>
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
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="px-6 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 pt-32 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-display mb-2">My Saved Jobs</h1>
            <p className="text-white/70">Keep track of saved opportunities</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search saved jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-12 pr-4 py-2 rounded-full bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            {/* <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="all">All Status</option>
              <option value="Applied">Applied</option>
              <option value="Saved">Saved</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Rejected">Rejected</option>
            </select> */}
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-6">
            <AnimatePresence>
              {filteredJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group glass-card p-6 hover:border-primary transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-display group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <span className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                              {job.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-white/70">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {job.company}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </div>
                            {job.salary_range && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                {job.salary_range}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Saved {formatDate(job.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {job.contact_email && (
                            <motion.a
                              href={`mailto:${job.contact_email}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                              title="Email Contact"
                            >
                              <Mail className="w-4 h-4" />
                            </motion.a>
                          )}
                          {job.contact_phone && (
                            <motion.a
                              href={`tel:${job.contact_phone}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                              title="Call Contact"
                            >
                              <Phone className="w-4 h-4" />
                            </motion.a>
                          )}
                          <motion.a
                            href={job.job_posting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                            title="View Job Post"
                          >
                            <Globe className="w-4 h-4" />
                          </motion.a>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-2 rounded-full bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title="Remove from Saved"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                      {job.notes && (
                        <div className="text-white/60 text-sm bg-white/5 rounded-lg p-4 border border-white/10">
                          {job.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <BookmarkX className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-display mb-2">No Saved Jobs</h3>
            <p className="text-white/70 mb-6">
              You haven't saved any jobs yet.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/job-listings")}
              className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
            >
              Find Jobs
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
