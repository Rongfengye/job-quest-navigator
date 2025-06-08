
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { LogOut, User, Loader2, LogIn, Coins, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AuthModal from '@/components/auth/AuthModal';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const NavBar = () => {
  const { isAuthenticated, logout, user, isLoading } = useAuthContext();
  const { tokens, isLoading: tokensLoading, fetchTokens, subscribeToTokenUpdates } = useUserTokens();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [authProblemDetected, setAuthProblemDetected] = useState(false);
  const [authLoadingTime, setAuthLoadingTime] = useState(0);
  const { toast } = useToast();

  // Check browser storage access
  useEffect(() => {
    try {
      // Test if localStorage is accessible
      localStorage.setItem('auth_test', 'test');
      localStorage.removeItem('auth_test');
      
      // Test if sessionStorage is accessible
      sessionStorage.setItem('auth_test', 'test');
      sessionStorage.removeItem('auth_test');
      
      setStorageError(null);
    } catch (error) {
      console.error('Browser storage not accessible:', error);
      setStorageError('Browser storage is not accessible. This may prevent login from working.');
      setAuthProblemDetected(true);
      toast({
        variant: "destructive",
        title: "Browser storage issue detected",
        description: "Your browser may be blocking storage access, which is needed for authentication.",
      });
    }
  }, [toast]);

  // Debug current session state
  useEffect(() => {
    const checkSessionDebug = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('Current session debug:', {
          hasSession: !!data.session,
          sessionError: error,
          localStorage: typeof localStorage !== 'undefined',
          cookiesEnabled: navigator.cookieEnabled,
          isPrivateMode: !window.localStorage
        });
        
        if (error) {
          setAuthProblemDetected(true);
        }
      } catch (e) {
        console.error('Error checking session:', e);
        setAuthProblemDetected(true);
      }
    };
    
    checkSessionDebug();
  }, []);

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
      storageError,
      authProblemDetected
    });
  }, [isAuthenticated, user, isLoading, tokens, storageError, authProblemDetected]);

  // Track how long loading state has been active
  useEffect(() => {
    let interval: number | undefined;
    
    if (isLoading) {
      // Start a timer to track loading time
      const startTime = Date.now();
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setAuthLoadingTime(elapsed);
        
        // If loading takes more than 5 seconds, consider it a potential issue
        if (elapsed > 5) {
          setAuthProblemDetected(true);
        }
      }, 1000);
    } else {
      // Reset timer when loading completes
      setAuthLoadingTime(0);
      
      // Only reset the problem flag if we successfully loaded and authenticated
      // or we've clearly determined user is not authenticated
      if (isAuthenticated || (!isLoading && !isAuthenticated)) {
        setAuthProblemDetected(false);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, isAuthenticated]);

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
      // Clear any potentially corrupted state
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      navigate('/');
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out and local storage has been cleared.",
      });
    } else {
      console.error('NavBar: Logout failed');
      setAuthProblemDetected(true);
    }
  };

  const handleSignInClick = () => {
    setShowAuthModal(true);
  };

  const handleResetAuth = () => {
    // Clear all auth-related storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reload the page to reset all state
    window.location.reload();
    
    toast({
      title: "Auth storage reset",
      description: "All browser storage has been cleared. Please try logging in again.",
    });
  };

  return (
    <div className="w-full flex items-center justify-between py-4 px-6 border-b border-gray-200">
      <Link to="/" className="text-xl font-bold text-interview-primary hover:opacity-90 transition-opacity">
        Storyline
      </Link>
      
      <div className="flex items-center gap-4">
        {storageError && (
          <div className="flex items-center text-sm text-red-500 bg-red-50 p-2 rounded-md">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>{storageError}</span>
            {authProblemDetected && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetAuth}
                className="ml-2 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center text-sm text-interview-text-secondary">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Loading auth state{authLoadingTime > 0 ? ` (${authLoadingTime}s)` : ''}...</span>
            {authProblemDetected && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetAuth}
                className="ml-2 text-xs"
              >
                Reset Auth
              </Button>
            )}
          </div>
        ) : isAuthenticated ? (
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
          <>
            <Button
              variant="outline"
              onClick={handleSignInClick}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign up / Log in
            </Button>
            
            {authProblemDetected && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetAuth}
                className="text-xs"
              >
                Reset Auth
              </Button>
            )}
          </>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default NavBar;
