import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { Linkedin, Github, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
// import EmailConfirmationScreen from './EmailConfirmationScreen'; // Commented out for OAuth-only flow

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLinkedinLoading, setIsLinkedinLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Manual authentication handlers commented out - OAuth only flow

  const handleLinkedInSignIn = async () => {
    setIsLinkedinLoading(true);
    try {
      // Use welcome page as redirect for OAuth
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log('🔗 LinkedIn OAuth initiated with callback URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl,
          scopes: 'openid profile email',
        }
      });
      
      if (error) {
        console.error("❌ LinkedIn sign in error:", error);
        toast({
          variant: "destructive",
          title: "LinkedIn sign in failed",
          description: error.message,
        });
        throw error;
      }
      
      console.log("✅ LinkedIn OAuth response:", data);
    } catch (error) {
      console.error("❌ LinkedIn sign in error:", error);
      toast({
        variant: "destructive",
        title: "LinkedIn sign in failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLinkedinLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsGithubLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log('🔗 Github OAuth initiated with callback URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          scopes: 'read:user user:email',
        }
      });
      
      if (error) {
        console.error("❌ Github sign in error:", error);
        toast({
          variant: "destructive",
          title: "Github sign in failed",
          description: error.message,
        });
        throw error;
      }
      
      console.log("✅ Github OAuth response:", data);
    } catch (error) {
      console.error("❌ Github sign in error:", error);
      toast({
        variant: "destructive",
        title: "Github sign in failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsGithubLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log('🔗 Google OAuth initiated with callback URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: 'profile email',
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });
      
      if (error) {
        console.error("❌ Google sign in error:", error);
        toast({
          variant: "destructive",
          title: "Google sign in failed",
          description: error.message,
        });
        throw error;
      }
      
      console.log("✅ Google OAuth response:", data);
    } catch (error) {
      console.error("❌ Google sign in error:", error);
      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Storyline</DialogTitle>
          <DialogDescription>
            Sign in with your preferred platform to get started with your interview preparation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="flex flex-col gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center gap-2 h-12"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              <Mail className="h-5 w-5" />
              {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center gap-2 h-12"
              onClick={handleLinkedInSignIn}
              disabled={isLinkedinLoading}
            >
              <Linkedin className="h-5 w-5" />
              {isLinkedinLoading ? 'Connecting...' : 'Continue with LinkedIn'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center gap-2 h-12"
              onClick={handleGithubSignIn}
              disabled={isGithubLoading}
            >
              <Github className="h-5 w-5" />
              {isGithubLoading ? 'Connecting...' : 'Continue with GitHub'}
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-600 pt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
