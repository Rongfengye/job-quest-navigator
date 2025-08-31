
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Clock, FileText, Plus, ChevronRight, Info, Target, CheckCircle, Eye, Upload, HelpCircle, Globe, Sparkles, Bot, Shield, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FileUpload from '@/components/FileUpload';

interface JobCard {
  id: string;
  job_title: string;
  company_name: string | null;
  created_at: string;
  status: string;
  behavioral_id: string | null;
}

const Dashboard = () => {
  const { user } = useAuthContext();
  const [showExampleVault, setShowExampleVault] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [resumeText, setResumeText] = useState('');
  
  // Fetch user's storyline jobs
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['storylineJobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('storyline_jobs')
        .select('id, job_title, company_name, created_at, status, behavioral_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as JobCard[];
    },
    enabled: !!user?.id
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800"
  };
  
  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.default;
  };

  const isLoading = jobsLoading;
  const hasError = jobsError;
  const hasData = (jobs && jobs.length > 0);

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6">
        <div className="w-full max-w-6xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded w-1/3 mb-8 animate-pulse"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                </div>
              ))}
            </div>
          ) : hasData ? (
            <>
              {/* Header for users with data */}
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
                <div>
                  <h1 className="text-5xl font-bold text-interview-primary leading-tight">
                    Your Personalized
                    <br />
                    Question Vault
                  </h1>
                  <p className="text-muted-foreground mt-2">Practice targeted questions generated from your resume, job postings, and interview history.</p>
                </div>
                <Button 
                  size="lg"
                  onClick={() => window.location.href = '/create'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Question Vault
                </Button>
              </div>

              <div className="space-y-8">
                {jobs && jobs.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <Briefcase className="h-6 w-6" />
                      Your Question Vault
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jobs.map(job => (
                        <Link to={`/questions?id=${job.id}&type=2`} key={job.id}>
                          <Card className="transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg font-semibold truncate">{job.job_title}</CardTitle>
                                  {job.company_name && (
                                    <CardDescription className="text-sm text-gray-600 mt-1">{job.company_name}</CardDescription>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-3 flex-shrink-0">
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                                    {job.status}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mb-3">
                                {job.behavioral_id ? (
                                  <div className="flex items-center text-sm text-blue-700 mb-2">
                                    <Info className="h-3 w-3 mr-1" />
                                    <span>From Behavioral Interview</span>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-600 mb-2">
                                    Questions generated from your profile
                                  </div>
                                )}
                                
                                <div className="flex items-center text-muted-foreground text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>Created {formatDate(job.created_at)}</span>
                                </div>
                              </div>

                              <Button variant="outline" className="w-full justify-between text-sm h-8" size="sm">
                                <span className="flex items-center">
                                  <FileText className="h-3 w-3 mr-2" />
                                  View Questions
                                </span>
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : hasError ? (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Error loading data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">
                  There was an error loading your interview preparations. Please try again later.
                </p>
              </CardContent>
            </Card>
          ) : (
            // Zero State Wizard
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
                <div>
                  <h1 className="text-5xl font-bold text-interview-primary leading-tight">
                    Your Personalized
                    <br />
                    Question Vault
                  </h1>
                  <p className="text-muted-foreground mt-2">Practice targeted questions generated from your resume, job postings, and interview history.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      🎯 Let's build your first Question Vault
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Upload your resume and job description to get personalized interview questions from real-world sources.
                    </p>
                  </div>

                  {/* Benefits List */}
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">Targeted behavioral questions</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">Real-world examples from Glassdoor and Blind</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">AI feedback coaching after practice</span>
                    </div>
                  </div>

                  {/* Example Vault Button */}
                  <div className="text-center mb-8">
                    <Button
                      variant="outline"
                      onClick={() => setShowExampleVault(!showExampleVault)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      📊 See Example Vault
                    </Button>
                  </div>

                  {/* Example Vault Preview */}
                  {showExampleVault && (
                    <div className="mb-8 max-h-96 overflow-y-auto border rounded-lg bg-white">
                      <div className="p-6 space-y-6">
                        {/* Header */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                          <h1 className="text-3xl font-bold text-interview-primary mb-2">Software Engineer</h1>
                          <p className="text-gray-600 mb-4">Google</p>
                          <p className="text-gray-700 font-medium">
                            These questions were carefully scraped from trusted sources like Glassdoor and Blind, 
                            tailored to your job description and resume. Practice answering them to reflect what 
                            real interviewers are likely to ask.
                          </p>
                        </div>

                        {/* Source Info Panel */}
                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Info className="w-5 h-5" />
                              Question Sources & Authenticity
                              <span className="text-sm text-blue-600">How are questions sourced?</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-green-600" />
                                  <span className="font-medium">4/5</span>
                                  <span className="text-gray-600">real interview questions found</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="font-medium">4/5</span>
                                  <span className="text-gray-600">average reliability</span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 pt-3 border-t">
                                <strong>Reliability Scale:</strong> 5/5 = Official/Verified sources, 4/5 = AI generated & Community verified, 3/5 = General forums
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Questions List */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 mr-2 text-interview-primary" />
                              <h2 className="text-xl font-semibold">Practice Interview Questions</h2>
                            </div>
                            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              5 Total Questions
                            </div>
                          </div>

                          {/* Real-World Questions Section */}
                          <div className="mb-8">
                            <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
                              <Globe className="w-5 h-5 mr-2 text-green-600" />
                              <h3 className="text-lg font-semibold text-gray-800">🧠 Real-World Interview Questions</h3>
                              <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                Scraped from Glassdoor, Blind
                              </span>
                            </div>

                            {/* Example Questions */}
                            {[
                              {
                                question: "Can you describe a time when you worked closely with a cross-functional team to achieve a project goal?",
                                source: "glassdoor",
                                explanation: "This question assesses teamwork and collaboration skills, which are critical at Google where engineers often work with diverse teams.",
                                reliability: 5
                              },
                              {
                                question: "Tell me about a time when you had to learn a new technology or skill quickly to complete a project.",
                                source: "blind", 
                                explanation: "Google values learning agility, especially for new graduates who must adapt to evolving technologies.",
                                reliability: 4
                              },
                              {
                                question: "Describe an instance where you took initiative to improve a process or system at work or school.",
                                source: "glassdoor",
                                explanation: "Initiative is important at Google to drive innovation and efficiency beyond assigned tasks.",
                                reliability: 5
                              },
                              {
                                question: "Can you share a challenging problem you solved and how you approached it?",
                                source: "glassdoor",
                                explanation: "Problem-solving skills are essential for software engineers at Google to overcome technical challenges effectively.",
                                reliability: 5
                              }
                            ].map((q, index) => (
                              <Card key={index} className="mb-4 bg-blue-50/50 opacity-75">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start gap-3">
                                    <span className="text-gray-500 font-mono font-medium">{String(index + 1).padStart(2, '0')}</span>
                                    <div className="flex-1">
                                      <CardTitle className="text-lg font-semibold text-gray-800">
                                        {q.question}
                                      </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Badge className={q.source === 'glassdoor' ? 'bg-teal-100 text-teal-800' : 'bg-blue-900/10 text-blue-900'}>
                                        <Briefcase className="w-3 h-3 mr-1" />
                                        {q.source === 'glassdoor' ? '✅ Glassdoor' : 'Blind'}
                                        {q.reliability >= 4 && <Star className="w-3 h-3 ml-1 fill-current" />}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <p className="text-gray-600 text-sm line-clamp-2">{q.explanation}</p>
                                  <div className="mt-2 text-xs text-gray-500">
                                    Source reliability: {q.reliability}/5 | Category: {q.source === 'glassdoor' ? 'interview_review' : 'professional_forum'}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {/* AI Questions Section */}
                          <div className="mb-8">
                            <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
                              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                              <h3 className="text-lg font-semibold text-gray-800">🪄 AI Practice Questions</h3>
                              <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                Generated from your resume and job description
                              </span>
                            </div>

                            <Card className="mb-4 bg-purple-50/50 opacity-75">
                              <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                  <span className="text-gray-500 font-mono font-medium">05</span>
                                  <div className="flex-1">
                                    <CardTitle className="text-lg font-semibold text-gray-800">
                                      Give an example of how you communicated complex technical information to a non-technical audience.
                                    </CardTitle>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge className="bg-slate-100 text-slate-700">
                                      <Bot className="w-3 h-3 mr-1" />
                                      🤖 AI Generated
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  Effective communication is vital at Google to ensure cross-team understanding and collaboration.
                                </p>
                                <div className="mt-2 text-xs text-gray-500">
                                  Source reliability: 4/5 | Category: ai_fallback
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Section */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Resume Upload */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Resume</label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">Upload your resume in PDF, DOC, or TXT format. We'll extract your experience to generate relevant questions.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FileUpload
                        id="resume"
                        label="Resume"
                        required
                        onFileChange={(file, text) => {
                          setResumeFile(file);
                          setResumeText(text);
                        }}
                        currentFile={resumeFile}
                      />
                    </div>

                    {/* Job Description Upload */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Job Description</label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">Copy and paste the job posting or upload as a file. This helps us find relevant questions for your target role.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <textarea
                        placeholder="Paste job description here..."
                        value={jobDescriptionText}
                        onChange={(e) => setJobDescriptionText(e.target.value)}
                        className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="text-center">
                    <Button
                      size="lg"
                      disabled={!resumeFile || !jobDescriptionText}
                      onClick={() => window.location.href = '/create'}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      🚀 Create Vault & Get My Questions
                    </Button>
                    {(!resumeFile || !jobDescriptionText) && (
                      <p className="text-sm text-gray-500 mt-2">
                        Upload both files to get started
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
