
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const NavBar = () => {
  const { isAuthenticated, logout, user } = useAuthContext();
  const navigate = useNavigate();

  // Add enhanced debugging to see the current auth state
  useEffect(() => {
    console.log('NavBar auth state:', { 
      isAuthenticated, 
      user,
      userExists: !!user
    });
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      navigate('/');
    }
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
