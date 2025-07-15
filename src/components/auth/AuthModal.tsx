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
import { Linkedin, Github, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import EmailConfirmationScreen from './EmailConfirmationScreen';

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
  const [resetEmail, setResetEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isLinkedinLoading, setIsLinkedinLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, signup, resetPassword, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      onClose();
      navigate('/behavioral');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      toast({
        variant: "destructive",
        title: "Password requirements not met",
        description: passwordErrors.join('. ')
      });
      return;
    }
    
    const result = await signup(email, password, firstName, lastName);
    if (result.success) {
      // Show email confirmation screen instead of closing modal
      setConfirmationEmail(email);
      setShowEmailConfirmation(true);
      // Clear form
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await resetPassword(resetEmail);
    if (result.success) {
      setShowForgotPassword(false);
      setResetEmail('');
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmail('');
  };

  const handleBackFromConfirmation = () => {
    setShowEmailConfirmation(false);
    setConfirmationEmail('');
    setActiveTab('login');
  };

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
        {showEmailConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle>Email Confirmation</DialogTitle>
              <DialogDescription>
                Please check your email to confirm your account
              </DialogDescription>
            </DialogHeader>
            <EmailConfirmationScreen 
              email={confirmationEmail} 
              onBack={handleBackFromConfirmation}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {showForgotPassword ? 'Reset Password' : 'Welcome to Storyline'}
              </DialogTitle>
              <DialogDescription>
                {showForgotPassword 
                  ? 'Enter your email to receive password reset instructions'
                  : 'Get started with your interview preparation'
                }
              </DialogDescription>
            </DialogHeader>
            
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBackToLogin}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Email'}
                  </Button>
                </div>
              </form>
            ) : (
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
                      <div className="relative">
                        <Input 
                          id="login-password" 
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <button
                        type="button"
                        className="text-sm text-interview-primary hover:underline"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                    
                    <div className="flex items-center gap-2 my-4">
                      <Separator className="flex-1" />
                      <span className="text-sm text-muted-foreground">or continue with</span>
                      <Separator className="flex-1" />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full flex items-center gap-2"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                      >
                        <Mail className="h-4 w-4" />
                        {isGoogleLoading ? 'Connecting...' : 'Google'}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full flex items-center gap-2"
                        onClick={handleLinkedInSignIn}
                        disabled={isLinkedinLoading}
                      >
                        <Linkedin className="h-4 w-4" />
                        {isLinkedinLoading ? 'Connecting...' : 'LinkedIn'}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full flex items-center gap-2"
                        onClick={handleGithubSignIn}
                        disabled={isGithubLoading}
                      >
                        <Github className="h-4 w-4" />
                        {isGithubLoading ? 'Connecting...' : 'GitHub'}
                      </Button>
                    </div>
                    
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
                      <div className="relative">
                        <Input 
                          id="signup-password" 
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="••••••••" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <p className="font-medium mb-1">Password requirements:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>At least 8 characters long</li>
                        <li>Contains uppercase and lowercase letters</li>
                        <li>Contains at least one number</li>
                      </ul>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Create account'}
                    </Button>
                    
                    <div className="flex items-center gap-2 my-4">
                      <Separator className="flex-1" />
                      <span className="text-sm text-muted-foreground">or continue with</span>
                      <Separator className="flex-1" />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full flex items-center gap-2"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                      >
                        <Mail className="h-4 w-4" />
                        {isGoogleLoading ? 'Connecting...' : 'Google'}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full flex items-center gap-2"
                        onClick={handleLinkedInSignIn}
                        disabled={isLinkedinLoading}
                      >
                        <Linkedin className="h-4 w-4" />
                        {isLinkedinLoading ? 'Connecting...' : 'LinkedIn'}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full flex items-center gap-2"
                        onClick={handleGithubSignIn}
                        disabled={isGithubLoading}
                      >
                        <Github className="h-4 w-4" />
                        {isGithubLoading ? 'Connecting...' : 'GitHub'}
                      </Button>
                    </div>
                    
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
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
