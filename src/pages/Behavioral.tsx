
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Briefcase, Calendar } from 'lucide-react';

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

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8 min-h-[calc(100vh-120px)]">
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

        <div className="w-full max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Previous Practice Sessions</h2>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : interviews && interviews.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {interview.job_title}
                        </div>
                      </TableCell>
                      <TableCell>{interview.company_name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(interview.created_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/behavioral/feedback?id=${interview.id}`)}
                        >
                          View Feedback
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No practice sessions yet. Click "Start" to begin your first behavioral interview practice.
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Behavioral;
