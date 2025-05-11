import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  salary: {
    minimum: number;
    maximum: number;
    currency: string;
    display: string;
  };
  created_at: string;
  source: string;
}

export interface Category {
  [key: string]: string;
}

export interface Country {
  [key: string]: string;
}

export interface SearchResponse {
  results: JobListing[];
  total_pages: number;
}

export const jobListingsApi = {
  getCountries: async (): Promise<Country[]> => {
    const response = await api.get("/job-listings/countries");
    return response.data;
  },

  getCategories: async (country: string = "sg"): Promise<Category[]> => {
    const response = await api.get("/job-listings/categories", {
      params: { country },
    });
    return response.data;
  },

  searchJobs: async (params: {
    what?: string | null;
    where?: string | null;
    category?: string | null;
    page: number;
    results_per_page: number;
    country?: string;
  }): Promise<SearchResponse> => {
    const response = await api.get("/job-listings/search", {
      params,
    });
    return response.data;
  },

  saveJob: async (jobId: string): Promise<void> => {
    await api.post("/job-listings/save", null, {
      params: { job_id: jobId },
    });
  },
};
