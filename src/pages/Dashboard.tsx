
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Clock, FileText, Plus, ChevronRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

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
            // Empty State View
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
              <div className="bg-gray-50 rounded-lg border border-dashed p-12 flex flex-col items-center justify-center text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">👋 No question vaults yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Get started by uploading your resume and job description — we'll generate practice questions tailored just for you.
                </p>
                <Button 
                  onClick={() => window.location.href = '/create'}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Question Vault
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
