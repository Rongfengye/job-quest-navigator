
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Sparkles, Target, Users } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

const Welcome = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuthContext();

  useEffect(() => {
    // If not authenticated after loading, redirect to home
    if (!isLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGetStarted = () => {
    navigate('/behavioral');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interview-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-interview-text-primary mb-2">
              Welcome to Storyline, {user?.firstName}! 🎉
            </h1>
            <p className="text-lg text-interview-text-secondary">
              Your account has been confirmed and you're ready to start practicing interviews.
            </p>
          </div>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-interview-primary" />
              What you can do with Storyline
            </CardTitle>
            <CardDescription>
              Get ready to ace your next interview with our AI-powered practice tools
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-interview-text-primary">Behavioral Interview Practice</h3>
                  <p className="text-sm text-interview-text-secondary">
                    Practice with AI-generated questions tailored to your experience and target role.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-interview-text-primary">Personalized Feedback</h3>
                  <p className="text-sm text-interview-text-secondary">
                    Get detailed feedback on your responses to improve your interview skills.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <Button onClick={handleGetStarted} size="lg" className="px-8">
            Start Your First Practice Session
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <p className="text-sm text-interview-text-light">
            Ready to practice? Let's create your first behavioral interview session.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
