
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Calendar, FileText, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BehavioralInterview {
  id: string;
  job_title: string;
  company_name: string | null;
  created_at: string;
  feedback: any;
}

const Behavioral = () => {
  const navigate = useNavigate();

  const { data: interviews, isLoading } = useQuery({
    queryKey: ['behavioral-interviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storyline_behaviorals')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as BehavioralInterview[];
    }
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const hasData = (interviews && interviews.length > 0);
  const hasError = false;

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8 min-h-[calc(100vh-120px)]">
        {hasData && (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Answer 5 Interview Questions</CardTitle>
              <CardDescription>
                When you're done, review your answers and discover insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Button 
                className="w-full max-w-xs" 
                onClick={() => navigate('/behavioral/create')}
              >
                Start
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="w-full max-w-4xl mx-auto">
          {hasData && (
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Previous Practice Sessions
          </h2>
        )}
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="opacity-60 animate-pulse">
                  <CardHeader className="h-24 bg-gray-100"></CardHeader>
                  <CardContent className="h-20 mt-4 bg-gray-100 rounded"></CardContent>
                </Card>
              ))}
            </div>
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
          ) : hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interviews.map(interview => (
                <Link to={`/behavioralFeedback?id=${interview.id}`} key={interview.id}>
                  <Card className="h-full transition-all hover:shadow-md feature-card-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{interview.job_title}</CardTitle>
                          {interview.company_name && (
                            <CardDescription>{interview.company_name}</CardDescription>
                          )}
                        </div>
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-muted-foreground text-sm mb-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created on {formatDate(interview.created_at)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button variant="ghost" className="w-full" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Feedback
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg bg-gray-50">
              <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-1">No practice sessions yet</h3>
              <p className="text-gray-500 text-center mb-6">
                Create your first behavioral practice to receive personalized feedback
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/behavioral/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Practice
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Behavioral;
