import { useState, useEffect } from 'react';
import { Brain, Briefcase, Users, Plus, LogOut, TrendingUp, GitBranch, Globe, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  status: string;
  created_at: string;
}

interface Application {
  id: string;
  job_id: string;
  status: string;
  overall_score: number;
  created_at: string;
  resume_text: string;
  profiles: {
    full_name: string;
    email: string;
  };
  jobs: {
    title: string;
  };
  resume_analysis?: {
    skills_extracted: string[];
    experience_years: number;
    match_score: number;
    languages_detected: string[];
  };
  external_profiles?: {
    github_username: string;
    github_repos_count: number;
    github_stars: number;
    social_score: number;
    verification_status: string;
  };
  attrition_risk?: {
    risk_score: number;
    retention_prediction: string;
    risk_factors: string[];
  };
}

export default function RecruiterDashboard() {
  const { profile, signOut } = useAuth();
  const [view, setView] = useState<'jobs' | 'applications' | 'create'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const [jobForm, setJobForm] = useState({
    title: '',
    company: profile?.company_name || '',
    location: '',
    job_type: 'full-time',
    experience_required: '',
    description: '',
    requirements: '',
    salary_range: '',
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
          profiles(full_name, email),
          jobs(title),
          resume_analysis(*),
          external_profiles(*),
          attrition_risk(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('jobs').insert({
        ...jobForm,
        recruiter_id: profile?.id,
        requirements: jobForm.requirements.split('\n').filter(r => r.trim()),
      });

      if (error) throw error;

      setJobForm({
        title: '',
        company: profile?.company_name || '',
        location: '',
        job_type: 'full-time',
        experience_required: '',
        description: '',
        requirements: '',
        salary_range: '',
      });

      loadJobs();
      setView('jobs');
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;
      loadApplications();
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400';
    if (score < 60) return 'text-yellow-400';
    return 'text-red-400';
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
              <span className="ml-4 text-sm text-slate-400">Recruiter Dashboard</span>
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
            onClick={() => setView('jobs')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              view === 'jobs'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            My Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setView('applications')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              view === 'applications'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-5 h-5" />
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setView('create')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              view === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Plus className="w-5 h-5" />
            Post Job
          </button>
        </div>

        {view === 'jobs' && (
          <div className="grid gap-6">
            {jobs.length === 0 ? (
              <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-12 text-center">
                <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No jobs posted yet</p>
                <button
                  onClick={() => setView('create')}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Post Your First Job
                </button>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                      <p className="text-slate-300 mb-4">{job.company} • {job.location}</p>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                          {job.job_type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          job.status === 'open' ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-300'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-slate-400">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'applications' && (
          <div className="grid gap-6">
            {applications.length === 0 ? (
              <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-12 text-center">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No applications yet</p>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition-all cursor-pointer"
                  onClick={() => setSelectedApplication(app)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{app.profiles.full_name}</h3>
                      <p className="text-slate-300 text-sm">{app.profiles.email}</p>
                      <p className="text-slate-400 text-sm mt-1">Applied to: {app.jobs.title}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-slate-400">Match Score</span>
                      </div>
                      <p className="text-xl font-bold text-blue-400">
                        {app.resume_analysis?.match_score || 0}%
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <GitBranch className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-slate-400">Social Score</span>
                      </div>
                      <p className="text-xl font-bold text-cyan-400">
                        {app.external_profiles?.social_score || 0}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-teal-400" />
                        <span className="text-xs text-slate-400">Languages</span>
                      </div>
                      <p className="text-xl font-bold text-teal-400">
                        {app.resume_analysis?.languages_detected?.length || 1}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-slate-400">Risk Score</span>
                      </div>
                      <p className={`text-xl font-bold ${getRiskColor(app.attrition_risk?.risk_score || 0)}`}>
                        {app.attrition_risk?.risk_score || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'create' && (
          <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Post a New Job</h2>
            <form onSubmit={createJob} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Job Title</label>
                  <input
                    type="text"
                    required
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                  <input
                    type="text"
                    required
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                  <input
                    type="text"
                    required
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Job Type</label>
                  <select
                    value={jobForm.job_type}
                    onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Experience Required</label>
                  <input
                    type="text"
                    required
                    value={jobForm.experience_required}
                    onChange={(e) => setJobForm({ ...jobForm, experience_required: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="3-5 years"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Salary Range</label>
                  <input
                    type="text"
                    value={jobForm.salary_range}
                    onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="$100k - $150k"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Job Description</label>
                <textarea
                  required
                  rows={4}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Describe the role..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Requirements (one per line)</label>
                <textarea
                  rows={4}
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Bachelor's degree in Computer Science&#10;5+ years of experience with React&#10;Strong problem-solving skills"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all"
              >
                Post Job
              </button>
            </form>
          </div>
        )}
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-blue-500/20">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Application Details</h2>
              <button
                onClick={() => setSelectedApplication(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="text-slate-400 text-2xl">×</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Candidate Information</h3>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-white font-medium">{selectedApplication.profiles.full_name}</p>
                  <p className="text-slate-300">{selectedApplication.profiles.email}</p>
                  <p className="text-slate-400 text-sm mt-2">Applied to: {selectedApplication.jobs.title}</p>
                </div>
              </div>

              {selectedApplication.resume_analysis && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                    Resume Analysis
                  </h3>
                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-slate-400">Skills Extracted</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedApplication.resume_analysis.skills_extracted.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Experience</p>
                        <p className="text-white font-medium">{selectedApplication.resume_analysis.experience_years} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Match Score</p>
                        <p className="text-blue-400 font-bold">{selectedApplication.resume_analysis.match_score}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Languages</p>
                        <p className="text-white font-medium">
                          {selectedApplication.resume_analysis.languages_detected.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedApplication.external_profiles && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-cyan-400" />
                    External Profile Vetting
                  </h3>
                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">GitHub Username</p>
                        <p className="text-white font-medium">{selectedApplication.external_profiles.github_username || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Verification Status</p>
                        <span className={`px-2 py-1 rounded text-sm ${
                          selectedApplication.external_profiles.verification_status === 'verified'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {selectedApplication.external_profiles.verification_status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">GitHub Repos</p>
                        <p className="text-white font-medium">{selectedApplication.external_profiles.github_repos_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">GitHub Stars</p>
                        <p className="text-white font-medium">{selectedApplication.external_profiles.github_stars}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Social Score</p>
                        <p className="text-cyan-400 font-bold">{selectedApplication.external_profiles.social_score}/100</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedApplication.attrition_risk && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Attrition Risk Analysis
                  </h3>
                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Risk Score</p>
                        <p className={`text-2xl font-bold ${getRiskColor(selectedApplication.attrition_risk.risk_score)}`}>
                          {selectedApplication.attrition_risk.risk_score}/100
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Retention Prediction</p>
                        <p className="text-white font-medium capitalize">{selectedApplication.attrition_risk.retention_prediction}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Career Progression</p>
                        <p className="text-white font-medium capitalize">{selectedApplication.attrition_risk.career_progression_rate}</p>
                      </div>
                    </div>
                    {selectedApplication.attrition_risk.risk_factors.length > 0 && (
                      <div>
                        <p className="text-sm text-slate-400 mb-2">Risk Factors</p>
                        <ul className="space-y-1">
                          {selectedApplication.attrition_risk.risk_factors.map((factor, i) => (
                            <li key={i} className="text-slate-300 text-sm">• {factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Update Status</h3>
                <div className="flex gap-2 flex-wrap">
                  {['submitted', 'screening', 'shortlisted', 'interviewed', 'rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, status);
                        setSelectedApplication({ ...selectedApplication, status });
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedApplication.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
