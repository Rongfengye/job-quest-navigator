
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { LogOut, User, Loader2, LogIn, Coins } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AuthModal from '@/components/auth/AuthModal';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

const NavBar = () => {
  const { isAuthenticated, logout, user, isLoading } = useAuthContext();
  const { tokens, isLoading: tokensLoading, fetchTokens, subscribeToTokenUpdates } = useUserTokens();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoadingTimeout, setAuthLoadingTimeout] = useState(false);
  const { toast } = useToast();

  // Add timeout to prevent infinite loading state
  useEffect(() => {
    if (isLoading) {
      // If loading takes more than 5 seconds, assume there's an issue
      const timeoutId = setTimeout(() => {
        setAuthLoadingTimeout(true);
        console.error('Auth loading timeout reached - displaying fallback UI');
        toast({
          variant: "destructive",
          title: "Authentication issue",
          description: "There was a problem connecting to the authentication service. Using fallback mode.",
        });
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, toast]);

  // Add enhanced debugging to see the current auth state, but limit logging to prevent infinite loops
  useEffect(() => {
    console.log('NavBar rendering with auth state:', { 
      isAuthenticated, 
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      } : null,
      isLoading,
      userExists: !!user,
      tokenCount: tokens,
      authLoadingTimeout
    });
  }, [isAuthenticated, user, isLoading, tokens, authLoadingTimeout]);

  // Refresh tokens when component mounts and subscribe to token updates
  // Only do this if authentication is complete and user exists
  useEffect(() => {
    if (isAuthenticated && user?.id && !isLoading) {
      console.log('NavBar: Initial token fetch and subscribing to updates');
      fetchTokens();
      
      // Subscribe to token updates
      const unsubscribe = subscribeToTokenUpdates();
      
      // Clean up subscription when component unmounts
      return () => {
        console.log('NavBar: Cleaning up token subscription');
        unsubscribe();
      };
    }
  }, [isAuthenticated, user?.id, fetchTokens, subscribeToTokenUpdates, isLoading]);

  const handleLogout = async () => {
    console.log('NavBar: Logout button clicked');
    const { success } = await logout();
    if (success) {
      console.log('NavBar: Logout successful, navigating to home');
      navigate('/');
    } else {
      console.error('NavBar: Logout failed');
    }
  };

  const handleSignInClick = () => {
    setShowAuthModal(true);
  };

  // If loading has timed out, display as not authenticated
  const displayAsAuthenticated = isAuthenticated && !authLoadingTimeout;
  const displayLoading = isLoading && !authLoadingTimeout;

  return (
    <div className="w-full flex items-center justify-between py-4 px-6 border-b border-gray-200">
      <Link to="/" className="text-xl font-bold text-interview-primary hover:opacity-90 transition-opacity">
        Storyline
      </Link>
      
      <div className="flex items-center gap-4">
        {displayLoading ? (
          <div className="flex items-center text-sm text-interview-text-secondary">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Loading auth state...</span>
          </div>
        ) : displayAsAuthenticated ? (
          <>
            <div className="flex items-center text-sm text-interview-text-secondary">
              <User className="h-4 w-4 mr-2" />
              <span>
                Logged in as {user?.firstName || 'User'} {user?.lastName || ''}
              </span>
              
              {tokensLoading ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <div className="flex items-center">
                    <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                    <span className="font-medium">{tokens ?? '—'} tokens</span>
                  </div>
                </>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={handleSignInClick}
            className="flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Sign up / Log in
          </Button>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default NavBar;
