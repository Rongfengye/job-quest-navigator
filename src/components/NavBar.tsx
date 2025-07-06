
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { LogOut, User, Loader2, LogIn, Crown, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AuthModal from '@/components/auth/AuthModal';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const NavBar = () => {
  const { isAuthenticated, logout, user, isLoading } = useAuthContext();
  const { tokens, isPremium, isBasic, isLoading: tokensLoading, fetchUserStatus } = useUserTokens();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [authProblemDetected, setAuthProblemDetected] = useState(false);
  const [authLoadingTime, setAuthLoadingTime] = useState(0);
  const { toast } = useToast();

  // Check browser storage access
  useEffect(() => {
    try {
      localStorage.setItem('auth_test', 'test');
      localStorage.removeItem('auth_test');
      
      sessionStorage.setItem('auth_test', 'test');
      sessionStorage.removeItem('auth_test');
      
      setStorageError(null);
    } catch (error) {
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
        
        if (error) {
          setAuthProblemDetected(true);
        }
      } catch (e) {
        setAuthProblemDetected(true);
      }
    };
    
    checkSessionDebug();
  }, []);

  // Track how long loading state has been active
  useEffect(() => {
    let interval: number | undefined;
    
    if (isLoading) {
      const startTime = Date.now();
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setAuthLoadingTime(elapsed);
        
        if (elapsed > 5) {
          setAuthProblemDetected(true);
        }
      }, 1000);
    } else {
      setAuthLoadingTime(0);
      
      if (isAuthenticated || (!isLoading && !isAuthenticated)) {
        setAuthProblemDetected(false);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, isAuthenticated]);

  // Simplified token refresh - no more manual WebSocket subscription needed
  // The context handles all WebSocket management automatically
  useEffect(() => {
    if (isAuthenticated && user?.id && !isLoading) {
      fetchUserStatus();
    }
  }, [isAuthenticated, user?.id, fetchUserStatus, isLoading]);

  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      navigate('/');
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out and local storage has been cleared.",
      });
    } else {
      setAuthProblemDetected(true);
    }
  };

  const handleSignInClick = () => {
    setShowAuthModal(true);
  };

  const handleResetAuth = () => {
    localStorage.clear();
    sessionStorage.clear();
    
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
                    {isPremium ? (
                      <>
                        <Crown className="h-4 w-4 mr-1 text-yellow-500" />
                        <span className="font-medium text-yellow-600">Premium Plan</span>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 mr-1 rounded-full bg-gray-400" />
                        <span className="font-medium text-gray-600">Free Plan</span>
                      </>
                    )}
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
