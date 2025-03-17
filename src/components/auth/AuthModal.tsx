
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
import { Linkedin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isOauthLoading, setIsOauthLoading] = useState(false);
  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      onClose();
      navigate('/dashboard');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signup(email, password, firstName, lastName);
    if (result.success) {
      onClose();
      navigate('/dashboard');
    }
  };

  const handleLinkedInSignIn = async () => {
    setIsOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: window.location.origin,
        }
      });
      
      if (error) throw error;
      // The redirect will happen automatically, so we don't need to do anything here
    } catch (error) {
      console.error("LinkedIn sign in error:", error);
    } finally {
      setIsOauthLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Storyline</DialogTitle>
          <DialogDescription>
            Get started with your interview preparation
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input 
                  id="login-email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input 
                  id="login-password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              
              <div className="flex items-center gap-2 my-4">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">or continue with</span>
                <Separator className="flex-1" />
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={handleLinkedInSignIn}
                disabled={isOauthLoading}
              >
                <Linkedin className="h-4 w-4" />
                {isOauthLoading ? 'Connecting...' : 'LinkedIn'}
              </Button>
              
              <div className="text-center text-sm text-interview-text-light">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-interview-primary hover:underline"
                  onClick={() => setActiveTab('signup')}
                >
                  Sign up
                </button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input 
                    id="first-name" 
                    placeholder="John" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input 
                    id="last-name" 
                    placeholder="Doe" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input 
                  id="signup-email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input 
                  id="signup-password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
              
              <div className="flex items-center gap-2 my-4">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">or continue with</span>
                <Separator className="flex-1" />
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={handleLinkedInSignIn}
                disabled={isOauthLoading}
              >
                <Linkedin className="h-4 w-4" />
                {isOauthLoading ? 'Connecting...' : 'LinkedIn'}
              </Button>
              
              <div className="text-center text-sm text-interview-text-light">
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-interview-primary hover:underline"
                  onClick={() => setActiveTab('login')}
                >
                  Login
                </button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
