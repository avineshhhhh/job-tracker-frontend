export interface PlatformCredentialCreate {
  platform: string;
  username: string;
  password: string;
  additional_fields?: Record<string, any>;
}

export interface PlatformCredentialResponse {
  id: number;
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface ApplyToJobsRequest {
  job_ids: number[];
}

export interface JobApplicationStatus {
  job_id: number;
  status: string;
  message: string;
}

export interface ApplicationAttemptResponse {
  id: number;
  job_id: number;
  status: string;
  attempt_number: number;
  result?: string;
  started_at: string;
  completed_at?: string;
}
