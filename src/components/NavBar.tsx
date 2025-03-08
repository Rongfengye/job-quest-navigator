
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NavBar = () => {
  const { isAuthenticated, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="w-full flex items-center justify-between py-4 px-6">
      <h1 className="text-xl font-bold text-interview-primary">Storyline</h1>
      
      {isAuthenticated && (
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      )}
    </div>
  );
};

export default NavBar;
