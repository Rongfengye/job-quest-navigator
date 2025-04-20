
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Behavioral = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <Card className="w-full max-w-md">
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
      </div>
    </DashboardLayout>
  );
};

export default Behavioral;
