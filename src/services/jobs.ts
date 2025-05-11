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

export interface Job {
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

export interface CreateJobDto {
  title: string;
  company: string;
  status: string;
  notes: string;
  salary_range: string;
  location: string;
  contact_email: string;
  contact_phone: string;
  job_posting_url: string;
}

export const jobsApi = {
  getJobs: async (status?: string) => {
    const response = await api.get("/jobs", {
      params: { status, skip: 0, limit: 100 },
    });
    return response.data as Job[];
  },

  getJob: async (id: number) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data as Job;
  },

  createJob: async (job: CreateJobDto) => {
    const response = await api.post("/jobs", job);
    return response.data as Job;
  },

  updateJob: async (id: number, job: Partial<CreateJobDto>) => {
    const response = await api.put(`/jobs/${id}`, job);
    return response.data as Job;
  },

  deleteJob: async (id: number) => {
    await api.delete(`/jobs/${id}`);
  },
};
