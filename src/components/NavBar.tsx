
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const NavBar = () => {
  const { isAuthenticated, logout, user } = useAuthContext();
  const navigate = useNavigate();
  const [renderCount, setRenderCount] = useState(0);

  // Add enhanced debugging to see the current auth state
  useEffect(() => {
    console.log(`NavBar render #${renderCount}: auth state:`, { 
      isAuthenticated, 
      user,
      userExists: !!user,
      userDetails: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      } : 'No user'
    });
    
    setRenderCount(prev => prev + 1);
  }, [isAuthenticated, user, renderCount]);

  const handleLogout = async () => {
    console.log('Logout button clicked');
    const { success } = await logout();
    if (success) {
      console.log('Logout successful, navigating to home');
      navigate('/');
    } else {
      console.error('Logout failed');
    }
  };

  // Add fallback in case user state isn't properly synchronized 
  const getDisplayName = () => {
    if (user?.firstName) return `${user.firstName} ${user.lastName || ''}`;
    return 'User';
  };

  return (
    <div className="w-full flex items-center justify-between py-4 px-6 border-b border-gray-200">
      <Link to="/" className="text-xl font-bold text-interview-primary hover:opacity-90 transition-opacity">
        Storyline
      </Link>
      
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <div className="flex items-center text-sm text-interview-text-secondary">
              <User className="h-4 w-4 mr-2" />
              <span>
                Logged in as {getDisplayName()}
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
