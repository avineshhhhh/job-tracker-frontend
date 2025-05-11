import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import DOMPurify from "dompurify";
import showdown from "showdown";
import useMeasure from "react-use-measure";
import {
  Search,
  MapPin,
  Building2,
  Loader2,
  Globe,
  Bookmark,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { JobDialog } from "../components/JobDialog";
import axios from "axios";
import toast from "react-hot-toast";
import { SiteSelector } from "../components/SiteSelector";
import { SearchFilters } from "../components/SearchFilters";
import { FilterDialog } from "../components/FilterDialog";

export interface JobListing {
  id: string;
  title: string;
  description: string;
  url: string;
  company: {
    display_name: string;
  };
  location: {
    area: string[];
    display_name: string;
  };
  salary?: {
    minimum: number;
    maximum: number;
    currency: string;
    display: string;
  };
  created_at: string;
  source: string;
}

interface CategoryItem {
  name: string;
  label: string;
  tag: string;
}

interface SiteItem {
  id: string;
  name: string;
}

interface KeywordItem {
  keyword: string;
  count: number;
}

interface LocationItem {
  location: string;
  count: number;
}

interface SearchSummary {
  total_jobs: number;
  job_types: { [key: string]: number };
  locations: { [key: string]: number };
  salary_ranges: { [key: string]: number };
  sources: { [key: string]: number };
}

const jobSearchTips = [
  {
    icon: <Search className="w-6 h-6 text-primary" />,
    title: "Tailor Your Search",
    description:
      "Use specific keywords from job descriptions you're interested in.",
  },
  {
    icon: <Search className="w-6 h-6 text-primary" />,
    title: "Industry Insights",
    description: "Tech jobs grew by 25% in the last year.",
  },
  {
    icon: <Search className="w-6 h-6 text-primary" />,
    title: "Pro Tip",
    description: "Remote work opportunities have increased by 140% since 2020.",
  },
  {
    icon: <Search className="w-6 h-6 text-primary" />,
    title: "Skill-Based Hiring",
    description:
      "Employers are prioritizing skills over degrees; upskill through certifications and online courses.",
  },
  {
    icon: <Search className="w-6 h-6 text-primary" />,
    title: "Hybrid Work Models",
    description:
      "Flexible work arrangements blending remote and in-office work are becoming standard.",
  },
  {
    icon: <Search className="w-6 h-6 text-primary" />,
    title: "AI Integration",
    description:
      "Familiarity with AI tools is increasingly valued across various job roles.",
  },
  {
    icon: <Search className="w-6 h-6 text-primary" />,
    title: "Resume Optimization",
    description:
      "Ensure your resume is ATS-friendly by incorporating relevant keywords.",
  },
  {
    icon: <Search className="w-6 h-6 text-primary" />,
    title: "Patience in Job Search",
    description:
      "Hiring processes may be extended; persistence and adaptability are key.",
  },
];

export function JobListings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("");
  const [isRemote, setIsRemote] = useState<boolean | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [categories, setCategories] = useState<Record<string, CategoryItem>>(
    {}
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [searchSummary, setSearchSummary] = useState<SearchSummary | null>(
    null
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [availableSites, setAvailableSites] = useState<
    Record<string, { label: string }>
  >({});
  const [trendingKeywords, setTrendingKeywords] = useState<
    Record<string, { label: string; count: number }>
  >({});
  const [popularLocations, setPopularLocations] = useState<
    Record<string, { label: string; count: number }>
  >({});
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const [ref, bounds] = useMeasure();
  const filterHeight = useSpring({
    height: isFilterOpen ? bounds.height || 0 : 0,
    config: { tension: 200, friction: 20 },
  });

  const { logout } = useAuth();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

  const formatJobDescription = (description: string) => {
    // Initialize a markdown converter
    const converter = new showdown.Converter({
      strikethrough: true,
      tables: true,
      tasklists: true,
      simpleLineBreaks: true,
    });

    // Clean the description - replace excessive newlines
    let cleanDescription = description.replace(/\n{3,}/g, "\n\n");

    // Replace or convert to HTML if needed
    if (!cleanDescription.includes("<")) {
      cleanDescription = converter.makeHtml(cleanDescription);
    }

    // Sanitize the HTML to prevent XSS
    return DOMPurify.sanitize(cleanDescription);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!hasSearched) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchJobs();
      fetchSearchSummary();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSearched, page]);

  // Rotate through job search tips during loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % jobSearchTips.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const fetchInitialData = async () => {
    try {
      setLoading(false);
      const [categoriesRes, sitesRes, keywordsRes, locationsRes] =
        await Promise.all([
          api.get<CategoryItem[]>("/api/job-listings/categories"),
          api.get<SiteItem[]>("/api/job-listings/sites"),
          api.get<KeywordItem[]>("/api/job-listings/trending-keywords"),
          api.get<LocationItem[]>("/api/job-listings/popular-locations"),
        ]);

      // Transform categories
      const categoriesObj: Record<string, CategoryItem> = {};
      categoriesRes.data.forEach((item: CategoryItem) => {
        categoriesObj[item.tag] = item;
      });
      setCategories(categoriesObj);

      // Transform sites
      const sitesObj: Record<string, { label: string }> = {};
      sitesRes.data.forEach((item: SiteItem) => {
        sitesObj[item.id] = { label: item.name };
      });
      setAvailableSites(sitesObj);

      // Transform keywords
      const keywordsObj: Record<string, { label: string; count: number }> = {};
      keywordsRes.data.forEach((item: KeywordItem) => {
        keywordsObj[item.keyword] = { label: item.keyword, count: item.count };
      });
      setTrendingKeywords(keywordsObj);

      // Transform locations
      const locationsObj: Record<string, { label: string; count: number }> = {};
      locationsRes.data.forEach((item: LocationItem) => {
        locationsObj[item.location] = {
          label: item.location,
          count: item.count,
        };
      });
      setPopularLocations(locationsObj);
    } catch (error) {
      toast.error("Failed to fetch initial data");
    }
  };

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    fetchJobs();
    fetchSearchSummary();
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/job-listings/search", {
        params: {
          what: searchQuery || undefined,
          where: locationQuery || undefined,
          category: category || undefined,
          job_type: jobType || undefined,
          is_remote: isRemote,
          page,
          results_per_page: 20,
          site_names: selectedSites.join(",") || undefined,
        },
      });
      setJobs(response.data.results);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchSummary = async () => {
    try {
      const response = await api.get("/api/job-listings/search-summary", {
        params: {
          what: searchQuery || undefined,
          where: locationQuery || undefined,
          site_names: selectedSites.join(",") || undefined,
        },
      });

      setSearchSummary({
        total_jobs: response.data.total_count,
        job_types: response.data.by_job_type,
        locations: {},
        salary_ranges: response.data.salary_stats || {},
        sources: response.data.by_site,
      });
    } catch (error) {
      console.error("Failed to fetch search summary");
    }
  };

  const handleSaveJob = async (job: JobListing) => {
    try {
      const params = new URLSearchParams();
      params.append("job_id", job.id);
      params.append("title", job.title);
      params.append("company", job.company.display_name);
      params.append("location", job.location.display_name);
      params.append("job_url", job.url);
      if (job.description) params.append("description", job.description);
      if (job.salary?.minimum)
        params.append("salary_min", job.salary.minimum.toString());
      if (job.salary?.maximum)
        params.append("salary_max", job.salary.maximum.toString());
      if (job.salary?.currency) params.append("currency", job.salary.currency);

      await api.post(`/api/job-listings/save?${params.toString()}`);
      toast.success("Job saved to your applications");
    } catch (error) {
      toast.error("Failed to save job");
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
                onClick={() => navigate("/jobs")}
                className="px-6 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors"
              >
                My Applications
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
        {/* Search Section */}
        {/* Search Section */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col gap-6">
            {/* Main search row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="City, state, or country"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                className="px-8 py-3 rounded-lg bg-primary text-background hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 min-w-[160px]"
              >
                <Search className="w-5 h-5" />
                Search Jobs
              </motion.button>
            </div>

            {/* Sites and filters row */}
            <div className="flex flex-col gap-2 -mt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/70">Search on</h3>
                <SearchFilters
                  isOpen={isFilterOpen}
                  onToggle={() => setIsFilterOpen(!isFilterOpen)}
                  category={category}
                  onCategoryChange={setCategory}
                  categories={categories}
                  jobType={jobType}
                  onJobTypeChange={setJobType}
                  isRemote={isRemote}
                  onRemoteChange={setIsRemote}
                />
              </div>
              <SiteSelector
                sites={availableSites}
                selectedSites={selectedSites}
                onChange={setSelectedSites}
              />
            </div>

            {/* Trending keywords */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-white/70">
                  Trending Roles
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(trendingKeywords)
                  .slice(0, 5)
                  .map(([keyword, data]) => (
                    <motion.button
                      key={keyword}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSearchQuery(keyword)}
                      className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
                    >
                      {typeof data.label === "string" ? data.label : keyword}
                    </motion.button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Dialog */}
        <FilterDialog
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          category={category}
          onCategoryChange={setCategory}
          categories={categories}
          jobType={jobType}
          onJobTypeChange={setJobType}
          isRemote={isRemote}
          onRemoteChange={setIsRemote}
        />

        {/* After search is triggered */}
        {hasSearched && (
          <>
            {loading ? (
              <div className="glass-card p-8">
                <div className="flex flex-col items-center justify-center gap-8">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTipIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-center max-w-lg"
                    >
                      <div className="flex justify-center mb-4">
                        {jobSearchTips[currentTipIndex].icon}
                      </div>
                      <h3 className="text-xl font-display mb-2">
                        {jobSearchTips[currentTipIndex].title}
                      </h3>
                      <p className="text-white/70">
                        {jobSearchTips[currentTipIndex].description}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex gap-2">
                    {jobSearchTips.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          index === currentTipIndex
                            ? "bg-primary"
                            : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {jobs.length > 0 ? (
                  <div className="grid gap-6">
                    <AnimatePresence>
                      {jobs.map((job) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="group glass-card p-6 hover:border-primary transition-all duration-300"
                          onClick={() => setSelectedJob(job)}
                        >
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                  <h3 className="text-xl font-display mb-2 group-hover:text-primary transition-colors">
                                    {job.title}
                                  </h3>
                                  <div className="flex flex-wrap gap-4 text-sm text-white/70">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="w-4 h-4" />
                                      {job.company.display_name}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4" />
                                      {job.location.display_name}
                                    </div>
                                    {job.salary && (
                                      <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        {job.salary.display}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      {formatDate(job.created_at)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Globe className="w-4 h-4" />
                                      {job.source}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <motion.a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
                                  >
                                    <Globe className="w-4 h-4" />
                                    Apply
                                  </motion.a>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveJob(job);
                                    }}
                                    className="px-4 py-2 rounded-full bg-primary text-background hover:bg-primary-dark transition-colors flex items-center gap-2"
                                  >
                                    <Bookmark className="w-4 h-4" />
                                    Save
                                  </motion.button>
                                </div>
                              </div>
                              <div className="relative overflow-hidden">
                                <div
                                  className="text-white/60 prose prose-invert prose-headings:text-primary 
                                             prose-strong:text-white prose-strong:font-semibold prose-hr:border-white/20
                                             prose-ul:list-disc prose-ol:list-decimal max-w-none line-clamp-3 mb-2"
                                  dangerouslySetInnerHTML={{
                                    __html: formatJobDescription(
                                      job.description
                                    ),
                                  }}
                                />
                                <div
                                  className="text-primary text-sm cursor-pointer hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedJob(job);
                                  }}
                                >
                                  Read more
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white/70">
                      No jobs found. Try adjusting your search criteria.
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {jobs.length > 0 && !loading && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-full border border-white/20 text-white/70 hover:text-white 
                                 hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </motion.button>

                    <span className="text-white/70">Page {page}</span>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const nextPage = page + 1;
                        setPage(nextPage);
                        setLoading(true);
                        api
                          .get("/api/job-listings/search", {
                            params: {
                              what: searchQuery || undefined,
                              where: locationQuery || undefined,
                              category: category || undefined,
                              job_type: jobType || undefined,
                              is_remote: isRemote,
                              page: nextPage,
                              results_per_page: 20,
                              site_names: selectedSites.join(",") || undefined,
                            },
                          })
                          .then((response) => {
                            setJobs(response.data.results);
                            // If API returns totalPages as 1 but there are results, assume more pages
                            setTotalPages(
                              Math.max(response.data.total_pages, nextPage)
                            );
                          })
                          .catch((error) => {
                            toast.error("Failed to fetch more jobs");
                            setPage(page); // revert back on error
                          })
                          .finally(() => {
                            setLoading(false);
                          });
                      }}
                      disabled={jobs.length === 0}
                      className="p-2 rounded-full border border-white/20 text-white/70 hover:text-white 
                                 hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Job Dialog */}
        <AnimatePresence>
          {selectedJob && (
            <JobDialog
              job={selectedJob}
              onClose={() => setSelectedJob(null)}
              onSave={handleSaveJob}
              formatJobDescription={formatJobDescription}
              formatDate={formatDate}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
