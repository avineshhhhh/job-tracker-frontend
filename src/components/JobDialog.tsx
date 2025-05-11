import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Globe,
  Briefcase,
  ArrowRight,
  Bookmark,
  Clock,
  Target,
  Users,
  Laptop,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { JobListing } from "../pages/JobListings";

interface JobDialogProps {
  job: JobListing | null;
  onClose: () => void;
  onSave: (job: JobListing) => void;
  formatJobDescription: (description: string) => string;
  formatDate: (date: string) => string;
}

export function JobDialog({
  job,
  onClose,
  onSave,
  formatJobDescription,
  formatDate,
}: JobDialogProps) {
  if (!job) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-white/10">
              <div className="p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-display text-primary mb-2">
                    {job.title}
                  </h2>
                  <div className="flex items-center gap-3 text-white/70">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{job.company.display_name}</span>
                    </div>
                    <span className="text-white/30">•</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location.display_name}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Stats */}
              <div className="px-6 pb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Posted</p>
                    <p className="font-medium">{formatDate(job.created_at)}</p>
                  </div>
                </div>

                {job.salary && (
                  <div className="glass-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-white/50">Salary</p>
                      <p className="font-medium">{job.salary.display}</p>
                    </div>
                  </div>
                )}

                <div className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Source</p>
                    <p className="font-medium">{job.source}</p>
                  </div>
                </div>

                <div className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Job Type</p>
                    <p className="font-medium">Full Time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-15rem)]">
              {/* Key Requirements */}
              {/* <div className="mb-8">
                <h3 className="text-lg font-display mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Key Requirements
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Team Collaboration</p>
                      <p className="text-sm text-white/50">
                        Work effectively in teams
                      </p>
                    </div>
                  </div>
                  <div className="glass-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Laptop className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Technical Skills</p>
                      <p className="text-sm text-white/50">
                        Strong technical background
                      </p>
                    </div>
                  </div>
                  <div className="glass-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Education</p>
                      <p className="text-sm text-white/50">
                        Bachelor's degree or equivalent
                      </p>
                    </div>
                  </div>
                  <div className="glass-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Experience</p>
                      <p className="text-sm text-white/50">
                        3+ years relevant experience
                      </p>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Job Description */}
              <div>
                <h3 className="text-lg font-display mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Job Description
                </h3>
                <div
                  className="prose prose-invert prose-primary max-w-none
                    prose-headings:text-primary prose-headings:font-display
                    prose-p:text-white/70 prose-p:leading-relaxed
                    prose-strong:text-white prose-strong:font-semibold
                    prose-ul:list-disc prose-ul:text-white/70
                    prose-ol:list-decimal prose-ol:text-white/70
                    prose-li:my-1
                    prose-hr:border-white/10"
                  dangerouslySetInnerHTML={{
                    __html: formatJobDescription(job.description),
                  }}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-white/10 bg-background/95 backdrop-blur-md p-6 flex justify-between items-center">
              <div className="flex items-center gap-2 text-white/50">
                <Globe className="w-4 h-4" />
                <span>Posted on {job.source}</span>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSave(job)}
                  className="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  Save for Later
                </motion.button>

                <motion.a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Apply Now
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
