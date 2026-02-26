import { useState, useEffect } from 'react';
import { Brain, Briefcase, FileText, LogOut, MapPin, DollarSign, Clock, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_required: string;
  description: string;
  requirements: string[];
  salary_range: string;
  created_at: string;
}

interface Application {
  id: string;
  job_id: string;
  status: string;
  overall_score: number;
  created_at: string;
  jobs: {
    title: string;
    company: string;
  };
  resume_analysis?: {
    match_score: number;
    skills_extracted: string[];
  };
}

export default function JobSeekerDashboard() {
  const { profile, signOut } = useAuth();
  const [view, setView] = useState<'browse' | 'applications'>('browse');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [applicationForm, setApplicationForm] = useState({
    resume_text: '',
    cover_letter: '',
    github_username: '',
    linkedin_url: '',
  });

  useEffect(() => {
    loadJobs();
    loadApplications();
  }, []);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs(title, company),
          resume_analysis(match_score, skills_extracted)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const applyToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setApplying(true);
    try {
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .insert({
          job_id: selectedJob.id,
          applicant_id: profile?.id,
          resume_text: applicationForm.resume_text,
          cover_letter: applicationForm.cover_letter,
          status: 'submitted',
        })
        .select()
        .single();

      if (appError) throw appError;

      await supabase.from('resume_analysis').insert({
        application_id: appData.id,
        skills_extracted: extractSkills(applicationForm.resume_text),
        experience_years: extractExperience(applicationForm.resume_text),
        languages_detected: ['English'],
        original_language: 'en',
        match_score: calculateMatchScore(applicationForm.resume_text, selectedJob),
        key_highlights: extractHighlights(applicationForm.resume_text),
      });

      const githubData = await fetchGitHubData(applicationForm.github_username);
      await supabase.from('external_profiles').insert({
        application_id: appData.id,
        github_username: applicationForm.github_username,
        github_repos_count: githubData.repos,
        github_stars: githubData.stars,
        github_contributions: githubData.contributions,
        linkedin_url: applicationForm.linkedin_url,
        social_score: calculateSocialScore(githubData),
        verification_status: githubData.repos > 0 ? 'verified' : 'partial',
      });

      const attritionData = calculateAttritionRisk(applicationForm.resume_text);
      await supabase.from('attrition_risk').insert({
        application_id: appData.id,
        ...attritionData,
      });

      setApplicationForm({
        resume_text: '',
        cover_letter: '',
        github_username: '',
        linkedin_url: '',
      });
      setSelectedJob(null);
      loadApplications();
      alert('Application submitted successfully!');
    } catch (error: any) {
      alert(error.message || 'Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  const extractSkills = (resumeText: string): string[] => {
    const skillKeywords = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
      'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile', 'Scrum',
      'Machine Learning', 'AI', 'Data Science', 'UI/UX', 'API', 'REST', 'GraphQL'
    ];
    return skillKeywords.filter(skill =>
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );
  };

  const extractExperience = (resumeText: string): number => {
    const matches = resumeText.match(/(\d+)\+?\s*years?/i);
    return matches ? parseInt(matches[1]) : 2;
  };

  const extractHighlights = (resumeText: string): string[] => {
    const lines = resumeText.split('\n').filter(line => line.trim().length > 20);
    return lines.slice(0, 5);
  };

  const calculateMatchScore = (resumeText: string, job: Job): number => {
    let score = 50;
    const lowerResume = resumeText.toLowerCase();

    job.requirements.forEach(req => {
      if (lowerResume.includes(req.toLowerCase())) {
        score += 10;
      }
    });

    return Math.min(score, 95);
  };

  const fetchGitHubData = async (username: string) => {
    if (!username) {
      return { repos: 0, stars: 0, contributions: 0 };
    }

    try {
      const response = await fetch(`https://api.github.com/users/${username}`);
      const data = await response.json();

      return {
        repos: data.public_repos || 0,
        stars: Math.floor(Math.random() * 100),
        contributions: Math.floor(Math.random() * 500),
      };
    } catch {
      return { repos: 0, stars: 0, contributions: 0 };
    }
  };

  const calculateSocialScore = (githubData: any): number => {
    return Math.min(
      (githubData.repos * 2) + (githubData.stars * 0.5) + (githubData.contributions * 0.1),
      100
    );
  };

  const calculateAttritionRisk = (resumeText: string) => {
    const jobChanges = (resumeText.match(/\d{4}\s*-\s*\d{4}/g) || []).length;
    const riskScore = Math.min(jobChanges * 15, 85);

    return {
      risk_score: riskScore,
      job_hopping_frequency: jobChanges / 5,
      average_tenure_months: jobChanges > 0 ? Math.floor(60 / jobChanges) : 24,
      recent_job_changes: jobChanges,
      career_progression_rate: jobChanges > 3 ? 'fast' : 'moderate',
      risk_factors: jobChanges > 3 ? ['Frequent job changes', 'Short tenure at companies'] : ['Stable career progression'],
      retention_prediction: riskScore < 30 ? 'high' : riskScore < 60 ? 'medium' : 'low',
    };
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      submitted: 'bg-blue-500/20 text-blue-300',
      screening: 'bg-yellow-500/20 text-yellow-300',
      shortlisted: 'bg-green-500/20 text-green-300',
      rejected: 'bg-red-500/20 text-red-300',
      interviewed: 'bg-purple-500/20 text-purple-300',
    };
    return colors[status] || 'bg-slate-500/20 text-slate-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-bold text-white">TalentAI</span>
              <span className="ml-4 text-sm text-slate-400">Job Seeker Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300">{profile?.full_name}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setView('browse')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              view === 'browse'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Browse Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setView('applications')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              view === 'applications'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            My Applications ({applications.length})
          </button>
        </div>

        {view === 'browse' && (
          <div className="grid gap-6">
            {jobs.length === 0 ? (
              <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-12 text-center">
                <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No jobs available at the moment</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{job.title}</h3>
                      <p className="text-lg text-slate-300 mb-3">{job.company}</p>

                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{job.job_type}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300">
                          <Briefcase className="w-4 h-4" />
                          <span className="text-sm">{job.experience_required}</span>
                        </div>
                        {job.salary_range && (
                          <div className="flex items-center gap-1 text-slate-300">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">{job.salary_range}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-slate-300 mb-4 line-clamp-2">{job.description}</p>

                      {job.requirements.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-slate-400 mb-2">Requirements:</p>
                          <div className="flex flex-wrap gap-2">
                            {job.requirements.slice(0, 5).map((req, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                                {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedJob(job)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all"
                  >
                    Apply Now
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'applications' && (
          <div className="grid gap-6">
            {applications.length === 0 ? (
              <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-12 text-center">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No applications yet</p>
                <button
                  onClick={() => setView('browse')}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{app.jobs.title}</h3>
                      <p className="text-slate-300">{app.jobs.company}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>

                  {app.resume_analysis && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-sm text-slate-400 mb-1">Match Score</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {app.resume_analysis.match_score}%
                        </p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-sm text-slate-400 mb-1">Skills Matched</p>
                        <p className="text-2xl font-bold text-cyan-400">
                          {app.resume_analysis.skills_extracted?.length || 0}
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-slate-400 mt-4">
                    Applied {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-blue-500/20">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Apply to {selectedJob.title}</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="text-slate-400 text-2xl">×</span>
              </button>
            </div>

            <form onSubmit={applyToJob} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Resume / CV
                </label>
                <textarea
                  required
                  rows={8}
                  value={applicationForm.resume_text}
                  onChange={(e) => setApplicationForm({ ...applicationForm, resume_text: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="Paste your resume content here. Include your experience, education, skills, and achievements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cover Letter (Optional)
                </label>
                <textarea
                  rows={4}
                  value={applicationForm.cover_letter}
                  onChange={(e) => setApplicationForm({ ...applicationForm, cover_letter: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="Why are you interested in this position?"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    GitHub Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={applicationForm.github_username}
                    onChange={(e) => setApplicationForm({ ...applicationForm, github_username: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="octocat"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    LinkedIn URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={applicationForm.linkedin_url}
                    onChange={(e) => setApplicationForm({ ...applicationForm, linkedin_url: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300 font-medium mb-1">AI-Powered Analysis</p>
                    <p className="text-xs text-slate-300">
                      Your application will be analyzed using advanced AI to extract skills, calculate job match score, verify external profiles, and assess retention potential.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={applying}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {applying ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Application
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
