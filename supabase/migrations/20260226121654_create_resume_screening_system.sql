/*
  # Advanced Resume Screening & Shortlisting Platform

  ## Overview
  Complete recruitment platform with resume screening, external profile vetting,
  multi-lingual processing, and attrition risk prediction.

  ## New Tables
  
  ### 1. profiles
  Extends auth.users with additional profile information
  - `id` (uuid, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `role` (text) - 'job_seeker' or 'recruiter'
  - `company_name` (text) - for recruiters
  - `avatar_url` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. jobs
  Job postings created by recruiters
  - `id` (uuid, primary key)
  - `recruiter_id` (uuid, references profiles)
  - `title` (text)
  - `company` (text)
  - `location` (text)
  - `job_type` (text) - 'full-time', 'part-time', 'contract', 'remote'
  - `experience_required` (text)
  - `description` (text)
  - `requirements` (text[])
  - `salary_range` (text)
  - `status` (text) - 'open', 'closed'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. applications
  Job applications with resume data
  - `id` (uuid, primary key)
  - `job_id` (uuid, references jobs)
  - `applicant_id` (uuid, references profiles)
  - `resume_text` (text)
  - `resume_url` (text)
  - `cover_letter` (text)
  - `status` (text) - 'submitted', 'screening', 'shortlisted', 'rejected', 'interviewed'
  - `overall_score` (numeric)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. resume_analysis
  AI-powered resume analysis results
  - `id` (uuid, primary key)
  - `application_id` (uuid, references applications)
  - `skills_extracted` (text[])
  - `experience_years` (numeric)
  - `education_level` (text)
  - `languages_detected` (text[])
  - `original_language` (text)
  - `match_score` (numeric) - job match percentage
  - `key_highlights` (text[])
  - `created_at` (timestamptz)

  ### 5. external_profiles
  Social and professional profile vetting
  - `id` (uuid, primary key)
  - `application_id` (uuid, references applications)
  - `github_username` (text)
  - `github_repos_count` (int)
  - `github_stars` (int)
  - `github_contributions` (int)
  - `linkedin_url` (text)
  - `linkedin_connections` (int)
  - `portfolio_url` (text)
  - `social_score` (numeric) - overall social presence score
  - `verification_status` (text) - 'verified', 'partial', 'not_found'
  - `created_at` (timestamptz)

  ### 6. attrition_risk
  Predictive attrition risk scoring
  - `id` (uuid, primary key)
  - `application_id` (uuid, references applications)
  - `risk_score` (numeric) - 0-100, higher = more likely to switch
  - `job_hopping_frequency` (numeric)
  - `average_tenure_months` (numeric)
  - `recent_job_changes` (int)
  - `career_progression_rate` (text) - 'fast', 'moderate', 'slow'
  - `risk_factors` (text[])
  - `retention_prediction` (text) - 'high', 'medium', 'low'
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Job seekers can only view their own applications
  - Recruiters can only view applications for their jobs
  - Public can view open job postings
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('job_seeker', 'recruiter')),
  company_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  job_type text NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'remote')),
  experience_required text NOT NULL,
  description text NOT NULL,
  requirements text[] DEFAULT '{}',
  salary_range text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open jobs"
  ON jobs FOR SELECT
  USING (status = 'open');

CREATE POLICY "Recruiters can view their own jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can update their own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can delete their own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (recruiter_id = auth.uid());

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resume_text text,
  resume_url text,
  cover_letter text,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'screening', 'shortlisted', 'rejected', 'interviewed')),
  overall_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY "Recruiters can view applications for their jobs"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Job seekers can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Applicants can update their own applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (applicant_id = auth.uid())
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Recruiters can update application status"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- Create resume_analysis table
CREATE TABLE IF NOT EXISTS resume_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  skills_extracted text[] DEFAULT '{}',
  experience_years numeric DEFAULT 0,
  education_level text,
  languages_detected text[] DEFAULT '{}',
  original_language text DEFAULT 'en',
  match_score numeric DEFAULT 0,
  key_highlights text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(application_id)
);

ALTER TABLE resume_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analysis for their applications"
  ON resume_analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = resume_analysis.application_id
      AND applications.applicant_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view analysis for their job applications"
  ON resume_analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON jobs.id = applications.job_id
      WHERE applications.id = resume_analysis.application_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "System can insert resume analysis"
  ON resume_analysis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create external_profiles table
CREATE TABLE IF NOT EXISTS external_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  github_username text,
  github_repos_count int DEFAULT 0,
  github_stars int DEFAULT 0,
  github_contributions int DEFAULT 0,
  linkedin_url text,
  linkedin_connections int DEFAULT 0,
  portfolio_url text,
  social_score numeric DEFAULT 0,
  verification_status text DEFAULT 'not_found' CHECK (verification_status IN ('verified', 'partial', 'not_found')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(application_id)
);

ALTER TABLE external_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view external profiles for their applications"
  ON external_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = external_profiles.application_id
      AND applications.applicant_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view external profiles for their job applications"
  ON external_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON jobs.id = applications.job_id
      WHERE applications.id = external_profiles.application_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "System can insert external profiles"
  ON external_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create attrition_risk table
CREATE TABLE IF NOT EXISTS attrition_risk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  risk_score numeric DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  job_hopping_frequency numeric DEFAULT 0,
  average_tenure_months numeric DEFAULT 0,
  recent_job_changes int DEFAULT 0,
  career_progression_rate text DEFAULT 'moderate' CHECK (career_progression_rate IN ('fast', 'moderate', 'slow')),
  risk_factors text[] DEFAULT '{}',
  retention_prediction text DEFAULT 'medium' CHECK (retention_prediction IN ('high', 'medium', 'low')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(application_id)
);

ALTER TABLE attrition_risk ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view attrition risk for their job applications"
  ON attrition_risk FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON jobs.id = applications.job_id
      WHERE applications.id = attrition_risk.application_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "System can insert attrition risk"
  ON attrition_risk FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_resume_analysis_application ON resume_analysis(application_id);
CREATE INDEX IF NOT EXISTS idx_external_profiles_application ON external_profiles(application_id);
CREATE INDEX IF NOT EXISTS idx_attrition_risk_application ON attrition_risk(application_id);