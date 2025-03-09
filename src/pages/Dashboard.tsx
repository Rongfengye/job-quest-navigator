
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Clock, FileText, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface JobCard {
  id: string;
  job_title: string;
  company_name: string | null;
  created_at: string;
  status: string;
}

const Dashboard = () => {
  const { user } = useAuthContext();
  
  // Fetch user's storyline jobs
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['storylineJobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('storyline_jobs')
        .select('id, job_title, company_name, created_at, status')
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

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-interview-primary">Job Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your interview preparations</p>
        </div>
        <Link to="/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Job Prep
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="opacity-60 animate-pulse">
              <CardHeader className="h-24 bg-gray-100"></CardHeader>
              <CardContent className="h-20 mt-4 bg-gray-100 rounded"></CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Error loading jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              There was an error loading your job preparations. Please try again later.
            </p>
          </CardContent>
        </Card>
      ) : jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
            <Link to={`/questions?id=${job.id}`} key={job.id}>
              <Card className="h-full transition-all hover:shadow-md feature-card-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{job.job_title}</CardTitle>
                      {job.company_name && (
                        <CardDescription>{job.company_name}</CardDescription>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-muted-foreground text-sm mb-4">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Created on {formatDate(job.created_at)}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="ghost" className="w-full" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Questions
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg bg-gray-50">
          <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-1">No job preparations yet</h3>
          <p className="text-gray-500 text-center mb-6">
            Create your first job preparation to get personalized interview questions
          </p>
          <Link to="/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Job Prep
            </Button>
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
