
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { LogOut, User, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const NavBar = () => {
  const { isAuthenticated, logout, user, isLoading } = useAuthContext();
  const navigate = useNavigate();

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
      userExists: !!user
    });
  }, [isAuthenticated, user, isLoading]);

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
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            Sign in
          </Button>
        )}
      </div>
    </div>
  );
};

export default NavBar;
