
// PASSWORD RESET MODAL - Currently not being used (OAuth-only flow)

/*
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Password reset form submitted');
    
    // Validate password strength
    const passwordErrors = validatePassword(passwords.new);
    if (passwordErrors.length > 0) {
      toast({
        variant: "destructive",
        title: "Password requirements not met",
        description: passwordErrors.join('. ')
      });
      return;
    }
    
    // Check if passwords match
    if (passwords.new !== passwords.confirm) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "The new password and confirmation password must match."
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      console.log('Updating password with Supabase...');
      
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });
      
      if (error) {
        console.error('Password update error:', error);
        throw error;
      }
      
      console.log('Password updated successfully');
      
      toast({
        title: "Password updated successfully",
        description: "Your password has been changed. You will now be redirected."
      });
      
      // Clear form
      setPasswords({ new: '', confirm: '' });
      
      // Close modal and notify parent
      onOpenChange(false);
      onSuccess();
      
    } catch (error) {
      console.error('Password update failed:', error);
      toast({
        variant: "destructive",
        title: "Failed to update password",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      setPasswords({ new: '', confirm: '' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => isUpdating && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Reset Your Password</DialogTitle>
          <DialogDescription>
            Please enter your new password below. Make sure it's secure and easy for you to remember.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new">New Password</Label>
            <div className="relative">
              <Input 
                id="new"
                name="new"
                type={showPassword ? "text" : "password"}
                value={passwords.new}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                required
                disabled={isUpdating}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isUpdating}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm New Password</Label>
            <div className="relative">
              <Input 
                id="confirm"
                name="confirm"
                type={showConfirmPassword ? "text" : "password"}
                value={passwords.confirm}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                required
                disabled={isUpdating}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isUpdating}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isUpdating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isUpdating || !passwords.new || !passwords.confirm}
              className="flex-1"
            >
              {isUpdating ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetModal;
*/
