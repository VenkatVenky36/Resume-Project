import { Brain, GitBranch, Globe, TrendingUp, CheckCircle, Zap, Shield, Target } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="fixed w-full bg-slate-900/80 backdrop-blur-md z-50 border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-bold text-white"> SRI WITH AI </span>
            </div>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Advanced Resume Screening
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Screen candidates with external profile vetting, multi-lingual processing, and predictive attrition risk scoring. Transform your hiring process with cutting-edge AI technology.
            </p>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-lg font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-2xl shadow-blue-500/50"
            >
              Start Screening Now
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 hover:border-blue-500/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
                <GitBranch className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">External Profile Vetting</h3>
              <p className="text-slate-300 leading-relaxed">
                Connect resume data with GitHub, LinkedIn, and other professional profiles to get a complete picture of candidate talent and expertise.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">GitHub Integration</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">LinkedIn Sync</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8 hover:border-cyan-500/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Multi-Lingual Processing</h3>
              <p className="text-slate-300 leading-relaxed">
                Process resumes in any language using advanced AI models. Screen international candidates with ease and expand your global talent pool.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">100+ Languages</span>
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Auto-Detect</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-2xl p-8 hover:border-teal-500/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Attrition Risk Scoring</h3>
              <p className="text-slate-300 leading-relaxed">
                Identify candidates likely to stay long-term with predictive AI analysis. Make smarter hiring decisions and reduce turnover costs.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">AI Predictions</span>
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Risk Analysis</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 backdrop-blur-sm border border-blue-500/30 rounded-3xl p-12 mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Why Choose TalentAI?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Comprehensive Screening</h3>
                  <p className="text-slate-300">AI-powered analysis of skills, experience, and cultural fit in seconds.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
                  <p className="text-slate-300">Screen hundreds of candidates in minutes, not days or weeks.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Data Security</h3>
                  <p className="text-slate-300">Enterprise-grade security with encrypted data storage and processing.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Higher Accuracy</h3>
                  <p className="text-slate-300">Reduce mis-hires with AI-driven insights and external validation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to revolutionize your hiring?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join leading companies using AI-powered recruitment
            </p>
            <button
              onClick={onGetStarted}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-lg font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-2xl shadow-blue-500/50"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>

      <footer className="bg-slate-900/80 backdrop-blur-md border-t border-blue-500/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-400">
            <p>© 2026 SRI WITH AI. Advanced Resume Screening & Shortlisting Platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
