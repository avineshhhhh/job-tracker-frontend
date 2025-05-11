import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Briefcase,
  LogOut,
  Plus,
  Pin,
  Trash2,
  Edit3,
  X,
  Loader2,
  StickyNote,
  Search,
  Palette,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import Masonry from "react-masonry-css";

interface Note {
  id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

const COLORS = [
  "#00DC82", // Primary green
  "#FF6B6B", // Coral
  "#4ECDC4", // Turquoise
  "#FFD93D", // Yellow
  "#95A5A6", // Gray
  "#8E44AD", // Purple
  "#3498DB", // Blue
  "#E67E22", // Orange
];

const BREAKPOINTS = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    color: COLORS[0],
    is_pinned: false,
  });
  const { logout } = useAuth();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLTextAreaElement>(null);

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
    fetchNotes();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = contentRef.current.scrollHeight + "px";
    }
  }, [editForm.content]);

  const fetchNotes = async () => {
    try {
      const response = await api.get("/notes/");
      setNotes(response.data);
    } catch (error) {
      toast.error("Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const response = await api.post("/notes/", editForm);
      setNotes([response.data, ...notes]);
      setIsCreating(false);
      setEditForm({
        title: "",
        content: "",
        color: COLORS[0],
        is_pinned: false,
      });
      toast.success("Note created successfully");
    } catch (error) {
      toast.error("Failed to create note");
    }
  };

  const handleUpdateNote = async (id: number) => {
    try {
      const response = await api.put(`/notes/${id}`, editForm);
      setNotes(notes.map((note) => (note.id === id ? response.data : note)));
      setIsEditing(null);
      toast.success("Note updated successfully");
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter((note) => note.id !== id));
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const response = await api.put(`/notes/${note.id}`, {
        ...note,
        is_pinned: !note.is_pinned,
      });
      setNotes(notes.map((n) => (n.id === note.id ? response.data : n)));
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const filteredNotes = notes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  const NoteCard = ({ note }: { note: Note }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="glass-card overflow-hidden group"
      style={{ backgroundColor: `${note.color}15` }}
    >
      {isEditing === note.id ? (
        <div className="p-4">
          <input
            type="text"
            value={editForm.title}
            onChange={(e) =>
              setEditForm({ ...editForm, title: e.target.value })
            }
            className="w-full bg-transparent border-none outline-none text-lg font-medium mb-2 focus:ring-0"
            placeholder="Note title"
            autoFocus
          />
          <textarea
            ref={contentRef}
            value={editForm.content}
            onChange={(e) =>
              setEditForm({ ...editForm, content: e.target.value })
            }
            className="w-full bg-transparent border-none outline-none resize-none focus:ring-0"
            placeholder="Write your note here..."
          />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setEditForm({ ...editForm, color })}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    editForm.color === color
                      ? "scale-125 ring-2 ring-white/50"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(null)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleUpdateNote(note.id)}
                className="px-4 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors font-medium shadow-lg"
              >
                <span className="font-bold">Save</span>
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4" style={{ borderLeft: `4px solid ${note.color}` }}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-medium line-clamp-2">{note.title}</h3>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTogglePin(note)}
                className={`p-1.5 rounded-full transition-colors ${
                  note.is_pinned
                    ? "bg-primary text-background"
                    : "hover:bg-white/10"
                }`}
              >
                <Pin className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsEditing(note.id);
                  setEditForm({
                    title: note.title,
                    content: note.content,
                    color: note.color,
                    is_pinned: note.is_pinned,
                  });
                }}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDeleteNote(note.id)}
                className="p-1.5 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
          <div className="prose prose-invert prose-sm max-w-none mb-4">
            <div className="line-clamp-6 whitespace-pre-wrap">
              {note.content}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-white/50">
            <span>{formatDate(note.updated_at)}</span>
            {note.is_pinned && <Pin className="w-4 h-4 text-primary" />}
          </div>
        </div>
      )}
    </motion.div>
  );

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
            <h1 className="text-4xl font-display mb-2">My Notes</h1>
            <p className="text-white/70">Capture your thoughts and ideas</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-12 pr-4 py-2 rounded-full bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsCreating(true);
                setEditForm({
                  title: "",
                  content: "",
                  color: COLORS[0],
                  is_pinned: false,
                });
              }}
              className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Note
            </motion.button>
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <LayoutGroup>
            <Masonry
              breakpointCols={BREAKPOINTS}
              className="flex -ml-6"
              columnClassName="pl-6 mb-6"
            >
              {/* New Note Form */}
              {isCreating && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="glass-card overflow-hidden mb-6"
                  style={{ backgroundColor: `${editForm.color}15` }}
                >
                  <div className="p-4">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="w-full bg-transparent border-none outline-none text-lg font-medium mb-2 focus:ring-0"
                      placeholder="Note title"
                      autoFocus
                    />
                    <textarea
                      ref={contentRef}
                      value={editForm.content}
                      onChange={(e) =>
                        setEditForm({ ...editForm, content: e.target.value })
                      }
                      className="w-full bg-transparent border-none outline-none resize-none focus:ring-0"
                      placeholder="Write your note here..."
                    />
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                      <div className="flex gap-2">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditForm({ ...editForm, color })}
                            className={`w-6 h-6 rounded-full transition-transform ${
                              editForm.color === color
                                ? "scale-125 ring-2 ring-white/50"
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsCreating(false)}
                          className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCreateNote}
                          className="px-4 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors"
                        >
                          Create
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notes */}
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </Masonry>
          </LayoutGroup>
        )}

        {/* Empty State */}
        {!loading && filteredNotes.length === 0 && !isCreating && (
          <div className="glass-card p-12 text-center">
            <StickyNote className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-display mb-2">No Notes Yet</h3>
            <p className="text-white/70 mb-6">
              Start capturing your thoughts and ideas
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreating(true)}
              className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Note
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
