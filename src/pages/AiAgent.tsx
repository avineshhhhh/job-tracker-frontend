import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  LogOut,
  Bot,
  Shield,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlatformCredentialCreate,
  PlatformCredentialResponse,
  JobApplicationStatus,
  ApplicationAttemptResponse,
} from "../types/aiAgent";

export function AIAgent() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"credentials" | "applications">(
    "credentials"
  );

  // Credential management state
  const [platforms, setPlatforms] = useState<PlatformCredentialResponse[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isAddingCredential, setIsAddingCredential] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("linkedin");
  const [newCredential, setNewCredential] = useState<PlatformCredentialCreate>({
    platform: "linkedin", // Initialize with the platform field
    username: "",
    password: "",
    additional_fields: {},
  });
  const [isLoading, setIsLoading] = useState(false);

  // Job application state
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [applications, setApplications] = useState<
    Record<number, JobApplicationStatus>
  >({});
  const [isApplying, setIsApplying] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);

  const api = axios.create({
    baseURL: "http://localhost:8000/api/v1",
    headers: { "Content-Type": "application/json" },
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
    fetchPlatforms();
    fetchAvailableJobs();
  }, []);

  // Update newCredential when selectedPlatform changes
  useEffect(() => {
    setNewCredential((prev) => ({
      ...prev,
      platform: selectedPlatform,
    }));
  }, [selectedPlatform]);

  const fetchPlatforms = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/job-application/credentials");
      setPlatforms(response.data);
    } catch (error) {
      toast.error("Failed to fetch platforms");
      console.error("Error fetching platforms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableJobs = async () => {
    try {
      // Fetch saved jobs that don't have "Applied" status
      const response = await api.get("/jobs", {
        params: { status: "Saved" },
      });
      setAvailableJobs(response.data);
    } catch (error) {
      console.error("Error fetching available jobs:", error);
      toast.error("Failed to fetch available jobs");
    }
  };

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post(`/job-application/credentials/${selectedPlatform}`, {
        platform: selectedPlatform, // Include the platform field in the request body
        username: newCredential.username,
        password: newCredential.password,
        additional_fields: newCredential.additional_fields,
      });

      toast.success(
        `${
          selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)
        } credentials saved`
      );
      fetchPlatforms();
      resetCredentialForm();
      setIsAddingCredential(false);
    } catch (error) {
      toast.error("Failed to save credentials");
      console.error("Error saving credentials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredential = async (platform: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/job-application/credentials/${platform}`);
      setPlatforms(platforms.filter((p) => p.platform !== platform));
      toast.success(
        `${
          platform.charAt(0).toUpperCase() + platform.slice(1)
        } credentials deleted`
      );
    } catch (error) {
      toast.error("Failed to delete credentials");
      console.error("Error deleting credentials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetCredentialForm = () => {
    setNewCredential({
      platform: selectedPlatform, // Include the platform in the reset
      username: "",
      password: "",
      additional_fields: {},
    });
  };

  const handleToggleJobSelection = (jobId: number) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleApplyToJobs = async () => {
    if (selectedJobs.length === 0) {
      toast.error("Please select at least one job to apply");
      return;
    }

    if (platforms.length === 0) {
      toast.error("Please add platform credentials before applying");
      setActiveTab("credentials");
      return;
    }

    setIsApplying(true);
    try {
      const response = await api.post("/job-application/apply", {
        job_ids: selectedJobs,
      });

      // Initialize application status
      const initialStatus: Record<number, JobApplicationStatus> = {};
      response.data.forEach((result: JobApplicationStatus) => {
        initialStatus[result.job_id] = result;
      });

      setApplications(initialStatus);

      // Start polling for each job
      selectedJobs.forEach((jobId) => startPolling(jobId));

      toast.success("Job applications initiated");
    } catch (error) {
      console.error("Error applying to jobs:", error);
      toast.error("Failed to start job applications");
      setIsApplying(false);
    }
  };

  const startPolling = (jobId: number) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await api.get<ApplicationAttemptResponse[]>(
          `/job-application/status/${jobId}`
        );
        if (response.data && response.data.length > 0) {
          const latestAttempt = response.data[0];

          setApplications((prev) => ({
            ...prev,
            [jobId]: {
              job_id: jobId,
              status: latestAttempt.status,
              message: latestAttempt.result || prev[jobId]?.message || "",
            },
          }));

          // Stop polling when complete
          if (
            latestAttempt.status === "completed" ||
            latestAttempt.status === "failed"
          ) {
            clearInterval(intervalId);

            // Check if all applications are complete
            const allComplete = Object.values(applications).every(
              (app) => app.status === "completed" || app.status === "failed"
            );

            if (allComplete) {
              setIsApplying(false);

              // Refresh available jobs to update statuses
              fetchAvailableJobs();
            }
          }
        }
      } catch (error) {
        console.error(`Error polling job ${jobId} status:`, error);
        clearInterval(intervalId);
      }
    }, 5000);

    // Safety timeout after 10 minutes
    setTimeout(() => {
      clearInterval(intervalId);
      setIsApplying(false);
    }, 10 * 60 * 1000);
  };

  const getJobNameById = (jobId: number) => {
    const job = availableJobs.find((job) => job.id === jobId);
    return job ? `${job.title} at ${job.company}` : `Job #${jobId}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "in_progress":
      case "processing":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "failed":
      case "error":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in_progress":
      case "processing":
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "failed":
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-primary" />
              <span className="text-2xl font-display">AI Agent</span>
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display mb-2">
            Job Application AI Agent
          </h1>
          <p className="text-white/70">
            Automate your job applications on platforms like LinkedIn and Indeed
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab("credentials")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "credentials"
                ? "text-primary"
                : "text-white/60 hover:text-white"
            }`}
          >
            Platform Credentials
            {activeTab === "credentials" && (
              <motion.div
                layoutId="activeAgentTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("applications")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "applications"
                ? "text-primary"
                : "text-white/60 hover:text-white"
            }`}
          >
            Application Manager
            {activeTab === "applications" && (
              <motion.div
                layoutId="activeAgentTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "credentials" ? (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Credentials Management */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-display mb-1">
                      Platform Credentials
                    </h2>
                    <p className="text-white/60 text-sm">
                      Securely store your login credentials for job platforms
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAddingCredential(true)}
                    disabled={isAddingCredential}
                    className="px-4 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add Credential
                  </motion.button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : isAddingCredential ? (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-display">
                        Add New Credential
                      </h3>
                      <button
                        onClick={() => {
                          setIsAddingCredential(false);
                          resetCredentialForm();
                        }}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveCredential} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Platform
                        </label>
                        <select
                          value={selectedPlatform}
                          onChange={(e) => setSelectedPlatform(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                        >
                          <option value="linkedin">LinkedIn</option>
                          <option value="indeed">Indeed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email/Username
                        </label>
                        <input
                          type="text"
                          value={newCredential.username}
                          onChange={(e) =>
                            setNewCredential({
                              ...newCredential,
                              username: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newCredential.password}
                            onChange={(e) =>
                              setNewCredential({
                                ...newCredential,
                                password: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 pr-10 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 text-white/60" />
                            ) : (
                              <Eye className="w-4 h-4 text-white/60" />
                            )}
                          </button>
                        </div>
                      </div>

                      {selectedPlatform === "linkedin" && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Resume Path (Optional)
                          </label>
                          <input
                            type="text"
                            value={
                              (newCredential.additional_fields
                                ?.resume_path as string) || ""
                            }
                            onChange={(e) =>
                              setNewCredential({
                                ...newCredential,
                                additional_fields: {
                                  ...newCredential.additional_fields,
                                  resume_path: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                            placeholder="/path/to/resume.pdf"
                          />
                          <p className="text-white/50 text-sm mt-1">
                            Full path to resume file for auto-upload during
                            application
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCredential(false);
                            resetCredentialForm();
                          }}
                          className="px-6 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-6 py-2 rounded-full bg-primary text-background font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Credential"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : platforms.length > 0 ? (
                  <div className="space-y-4">
                    {platforms.map((platform) => (
                      <div
                        key={platform.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium capitalize">
                              {platform.platform}
                            </h3>
                            <p className="text-sm text-white/50">
                              Last updated: {formatDate(platform.updated_at)}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleDeleteCredential(platform.platform)
                          }
                          className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                    <Shield className="w-12 h-12 text-primary mx-auto mb-4 opacity-70" />
                    <h3 className="text-xl font-display mb-2">
                      No Credentials Yet
                    </h3>
                    <p className="text-white/70 max-w-md mx-auto mb-6">
                      To use the AI Application Agent, you need to add your
                      credentials for platforms like LinkedIn or Indeed.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAddingCredential(true)}
                      className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Credential
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Security Info */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4 text-white/80">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display">Credential Security</h3>
                </div>
                <div className="text-white/60 space-y-2 text-sm">
                  <p>
                    • Your credentials are securely encrypted before being
                    stored in the database.
                  </p>
                  <p>
                    • Credentials are only used for the automated job
                    application process.
                  </p>
                  <p>• We never share or sell your data to third parties.</p>
                  <p>• You can delete your credentials at any time.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="applications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Application Manager */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-display mb-1">
                      Job Applications
                    </h2>
                    <p className="text-white/60 text-sm">
                      Select jobs and let AI automatically apply for you
                    </p>
                  </div>
                </div>

                {platforms.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                    <Shield className="w-12 h-12 text-primary mx-auto mb-4 opacity-70" />
                    <h3 className="text-xl font-display mb-2">
                      Platform Credentials Required
                    </h3>
                    <p className="text-white/70 max-w-md mx-auto mb-6">
                      To use the AI Application Agent, you need to add your
                      credentials for platforms like LinkedIn or Indeed.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab("credentials")}
                      className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Credentials
                    </motion.button>
                  </div>
                ) : availableJobs.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                    <Briefcase className="w-12 h-12 text-primary mx-auto mb-4 opacity-70" />
                    <h3 className="text-xl font-display mb-2">No Saved Jobs</h3>
                    <p className="text-white/70 max-w-md mx-auto mb-6">
                      You don't have any saved jobs to apply to. Add jobs to
                      your Saved column first.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/job-listings")}
                      className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
                    >
                      <Briefcase className="w-4 h-4" />
                      Browse Job Listings
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        Select Jobs to Apply
                      </h3>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {availableJobs.map((job) => (
                          <div
                            key={job.id}
                            className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                              selectedJobs.includes(job.id)
                                ? "bg-primary/10 border-primary/30"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <input
                              type="checkbox"
                              id={`job-${job.id}`}
                              checked={selectedJobs.includes(job.id)}
                              onChange={() => handleToggleJobSelection(job.id)}
                              className="w-5 h-5 rounded text-primary focus:ring-primary focus:ring-offset-background"
                            />
                            <label
                              htmlFor={`job-${job.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <h4 className="font-medium">{job.title}</h4>
                              <div className="flex items-center gap-3 text-sm text-white/60">
                                <span>{job.company}</span>
                                {job.location && (
                                  <>
                                    <span className="text-white/30">•</span>
                                    <span>{job.location}</span>
                                  </>
                                )}
                              </div>
                            </label>
                            {applications[job.id] && (
                              <div
                                className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 border ${getStatusBadgeClass(
                                  applications[job.id].status
                                )}`}
                              >
                                {getStatusIcon(applications[job.id].status)}
                                <span className="capitalize">
                                  {applications[job.id].status}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleApplyToJobs}
                        disabled={isApplying || selectedJobs.length === 0}
                        className="px-6 py-2 rounded-full bg-primary text-background font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <Bot className="w-4 h-4" />
                            Apply to {selectedJobs.length} Selected{" "}
                            {selectedJobs.length === 1 ? "Job" : "Jobs"}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </>
                )}
              </div>

              {/* Application Status */}
              {Object.keys(applications).length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-display mb-4">
                    Application Status
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(applications).map(([jobId, status]) => (
                      <div
                        key={jobId}
                        className="p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {getJobNameById(Number(jobId))}
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 border ${getStatusBadgeClass(
                              status.status
                            )}`}
                          >
                            {getStatusIcon(status.status)}
                            <span className="capitalize">{status.status}</span>
                          </div>
                        </div>
                        {status.message && (
                          <div className="text-sm text-white/60 bg-white/5 p-3 rounded border border-white/10">
                            {status.message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* How It Works */}
              <div className="glass-card p-6 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bot className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display">
                    How the AI Agent Works
                  </h3>
                </div>
                <div className="space-y-4 text-white/70">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      1
                    </div>
                    <p>
                      The AI agent uses your stored credentials to securely log
                      in to job platforms.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      2
                    </div>
                    <p>
                      It automatically fills application forms using your resume
                      information and profile data.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      3
                    </div>
                    <p>
                      The agent navigates complex application flows, including
                      multi-page forms and screening questions.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      4
                    </div>
                    <p>
                      Once the application is submitted, your job status is
                      automatically updated in Trackr.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
