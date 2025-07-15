
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface EmailConfirmationScreenProps {
  email: string;
  onBack: () => void;
}

const EmailConfirmationScreen: React.FC<EmailConfirmationScreenProps> = ({ email, onBack }) => {
  const [isResending, setIsResending] = useState(false);
  const { resendSignupConfirmation } = useAuth();
  const { toast } = useToast();

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const result = await resendSignupConfirmation(email);
      if (result.success) {
        toast({
          title: "Email sent",
          description: "We've sent another confirmation email to your inbox.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to resend email",
        description: "Please try again in a few moments.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Check your email</CardTitle>
        <CardDescription>
          We've sent a confirmation link to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-blue-800">
              Click the confirmation link in your email to activate your account
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-blue-800">
              The link will expire in 24 hours
            </span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or request a new one.
          </p>
          
          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend confirmation email'
            )}
          </Button>
          
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            Back to login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailConfirmationScreen;
