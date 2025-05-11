import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  X,
  Loader2,
  Search,
  FileText,
  Upload,
  Download,
  Star,
  Eye,
  File,
  FileType,
  FileText as FileDocx,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

interface Document {
  id: number;
  name: string;
  type: "resume" | "cover_letter";
  user_id: number;
  created_at: string;
  updated_at: string;
  content_type: string;
  is_default?: boolean;
}

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "resume" | "cover_letter"
  >("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [uploadForm, setUploadForm] = useState({
    name: "",
    doc_type: "resume" as "resume" | "cover_letter",
    file: null as File | null,
  });

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
    fetchDocuments();
  }, [typeFilter]);

  const fetchDocuments = async () => {
    try {
      const params = typeFilter !== "all" ? { doc_type: typeFilter } : {};
      const response = await api.get("/documents/", { params });
      setDocuments(response.data);
    } catch (error) {
      toast.error("Failed to fetch documents");
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({
        ...uploadForm,
        file: e.target.files[0],
      });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.file) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("name", uploadForm.name);
      formData.append("doc_type", uploadForm.doc_type);

      // Use a different axios instance for file upload
      const uploadApi = axios.create({
        baseURL: "http://localhost:8000/api/v1",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const response = await uploadApi.post("/documents/upload", formData);
      setDocuments([...documents, response.data]);
      setIsUploadModalOpen(false);
      resetUploadForm();
      toast.success("Document uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload document");
      console.error("Error uploading document:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDocument) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", uploadForm.name);
      formData.append("doc_type", uploadForm.doc_type);

      if (uploadForm.file) {
        formData.append("file", uploadForm.file);
      }

      // Use a different axios instance for file upload
      const uploadApi = axios.create({
        baseURL: "http://localhost:8000/api/v1",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const response = await uploadApi.put(
        `/documents/${selectedDocument.id}`,
        formData
      );
      setDocuments(
        documents.map((doc) =>
          doc.id === selectedDocument.id ? response.data : doc
        )
      );
      setIsEditModalOpen(false);
      resetUploadForm();
      setSelectedDocument(null);
      toast.success("Document updated successfully");
    } catch (error) {
      toast.error("Failed to update document");
      console.error("Error updating document:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    try {
      await api.delete(`/documents/${documentId}`);
      setDocuments(documents.filter((doc) => doc.id !== documentId));
      toast.success("Document deleted successfully");
    } catch (error) {
      toast.error("Failed to delete document");
      console.error("Error deleting document:", error);
    }
  };

  const handleDownload = async (documentId: number) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: "blob",
      });

      // Get the document details to use its name for the download
      const documentToDownload = documents.find((doc) => doc.id === documentId);
      if (!documentToDownload) return;

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Determine file extension based on content type
      let extension = "";
      if (documentToDownload.content_type === "application/pdf") {
        extension = ".pdf";
      } else if (
        documentToDownload.content_type.includes("word") ||
        documentToDownload.content_type.includes("docx")
      ) {
        extension = ".docx";
      }

      link.setAttribute("download", `${documentToDownload.name}${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download document");
      console.error("Error downloading document:", error);
    }
  };

  const handleSetDefault = async (documentId: number, docType: string) => {
    try {
      // This is a mock endpoint - would need to be implemented on backend
      await api.put(`/documents/${documentId}/set-default`);

      // Update local state to reflect the change
      const updatedDocuments = documents.map((doc) => ({
        ...doc,
        is_default:
          doc.type === docType ? doc.id === documentId : doc.is_default,
      }));

      setDocuments(updatedDocuments);
      toast.success(
        `Set as default ${docType === "resume" ? "resume" : "cover letter"}`
      );
    } catch (error) {
      toast.error("Failed to set document as default");
      console.error("Error setting document as default:", error);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      name: "",
      doc_type: "resume",
      file: null,
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getDocumentIcon = (contentType: string) => {
    if (contentType === "application/pdf") {
      return <FileType className="w-8 h-8 text-primary" />;
    } else if (contentType.includes("word") || contentType.includes("docx")) {
      return <FileDocx className="w-8 h-8 text-primary" />;
    } else {
      return <File className="w-8 h-8 text-primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resumeCount = documents.filter((doc) => doc.type === "resume").length;
  const coverLetterCount = documents.filter(
    (doc) => doc.type === "cover_letter"
  ).length;

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
            <h1 className="text-4xl font-display mb-2">My Documents</h1>
            <p className="text-white/70">
              Manage your resumes and cover letters
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-12 pr-4 py-2 rounded-full bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsUploadModalOpen(true)}
              className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Document
            </motion.button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex mb-8 border-b border-white/10">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              typeFilter === "all"
                ? "text-primary"
                : "text-white/60 hover:text-white"
            }`}
          >
            All Documents
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/10">
              {documents.length}
            </span>
            {typeFilter === "all" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>

          <button
            onClick={() => setTypeFilter("resume")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              typeFilter === "resume"
                ? "text-primary"
                : "text-white/60 hover:text-white"
            }`}
          >
            Resumes
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/10">
              {resumeCount}
            </span>
            {typeFilter === "resume" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>

          <button
            onClick={() => setTypeFilter("cover_letter")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              typeFilter === "cover_letter"
                ? "text-primary"
                : "text-white/60 hover:text-white"
            }`}
          >
            Cover Letters
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/10">
              {coverLetterCount}
            </span>
            {typeFilter === "cover_letter" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredDocuments.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="glass-card overflow-hidden group hover-glow"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            {getDocumentIcon(doc.content_type)}
                            <div>
                              <h3 className="text-lg font-medium line-clamp-1 group-hover:text-primary transition-colors">
                                {doc.name}
                              </h3>
                              <p className="text-sm text-white/50">
                                {doc.type === "resume"
                                  ? "Resume"
                                  : "Cover Letter"}
                                {doc.is_default && (
                                  <span className="ml-2 inline-flex items-center text-primary">
                                    <Star
                                      className="w-3 h-3 mr-1"
                                      fill="currentColor"
                                    />
                                    Default
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setSelectedDocument(doc);
                                setUploadForm({
                                  name: doc.name,
                                  doc_type: doc.type,
                                  file: null,
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                              aria-label="Edit document"
                            >
                              <Edit3 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(doc.id)}
                              className="p-1.5 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                              aria-label="Delete document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm text-white/50 mt-4 pt-4 border-t border-white/10">
                          <span>Updated {formatDate(doc.updated_at)}</span>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDownload(doc.id)}
                              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                              aria-label="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </motion.button>
                            {!doc.is_default && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleSetDefault(doc.id, doc.type)
                                }
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                aria-label="Set as default"
                              >
                                <Star className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-display mb-2">No Documents Yet</h3>
                <p className="text-white/70 mb-6">
                  Upload your resumes and cover letters to get started
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload First Document
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Document Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display">Upload Document</h2>
                    <button
                      onClick={() => {
                        setIsUploadModalOpen(false);
                        resetUploadForm();
                      }}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUpload} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Document Name
                      </label>
                      <input
                        type="text"
                        value={uploadForm.name}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, name: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Document Type
                      </label>
                      <select
                        value={uploadForm.doc_type}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            doc_type: e.target.value as
                              | "resume"
                              | "cover_letter",
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                        required
                      >
                        <option value="resume">Resume</option>
                        <option value="cover_letter">Cover Letter</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Upload File
                      </label>
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-primary transition-colors">
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          id="file-upload"
                          required
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="w-8 h-8 text-primary" />
                          <span className="text-sm text-white/70">
                            {uploadForm.file
                              ? uploadForm.file.name
                              : "Click to select a file (PDF, DOC, DOCX)"}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUploadModalOpen(false);
                          resetUploadForm();
                        }}
                        className="px-6 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-full bg-primary text-background font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Document Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display">Edit Document</h2>
                    <button
                      onClick={() => {
                        setIsEditModalOpen(false);
                        resetUploadForm();
                      }}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Document Name
                      </label>
                      <input
                        type="text"
                        value={uploadForm.name}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, name: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Document Type
                      </label>
                      <select
                        value={uploadForm.doc_type}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            doc_type: e.target.value as
                              | "resume"
                              | "cover_letter",
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                        required
                      >
                        <option value="resume">Resume</option>
                        <option value="cover_letter">Cover Letter</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Replace File (Optional)
                      </label>
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-primary transition-colors">
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          id="file-replace"
                        />
                        <label
                          htmlFor="file-replace"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="w-8 h-8 text-primary" />
                          <span className="text-sm text-white/70">
                            {uploadForm.file
                              ? uploadForm.file.name
                              : "Click to select a new file (PDF, DOC, DOCX)"}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditModalOpen(false);
                          resetUploadForm();
                        }}
                        className="px-6 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-full bg-primary text-background font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-4 h-4" />
                            Update
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
