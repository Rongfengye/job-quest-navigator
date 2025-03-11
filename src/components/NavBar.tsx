
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { LogOut, User, Loader2, LogIn, Coins } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AuthModal from '@/components/auth/AuthModal';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

const NavBar = () => {
  const { isAuthenticated, logout, user, isLoading } = useAuthContext();
  const { tokens, isLoading: tokensLoading, fetchTokens } = useUserTokens();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Add enhanced debugging to see the current auth state
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
      tokenCount: tokens
    });
  }, [isAuthenticated, user, isLoading, tokens]);

  // Refresh tokens when component mounts
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchTokens();
    }
  }, [isAuthenticated, user?.id, fetchTokens]);

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

  return (
    <div className="w-full flex items-center justify-between py-4 px-6 border-b border-gray-200">
      <Link to="/" className="text-xl font-bold text-interview-primary hover:opacity-90 transition-opacity">
        Storyline
      </Link>
      
      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="flex items-center text-sm text-interview-text-secondary">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Loading auth state...</span>
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
