
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

interface PasswordChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "The new password and confirmation password must match."
      });
      return;
    }
    
    if (passwords.new.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "The new password must be at least 6 characters long."
      });
      return;
    }
    
    try {
      setIsUpdatingPassword(true);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: passwords.current,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new
      });
      
      if (updateError) throw updateError;
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });
      
      setPasswords({ current: '', new: '', confirm: '' });
      onOpenChange(false);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating password",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleClose = () => {
    setPasswords({ current: '', new: '', confirm: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Current Password</Label>
            <Input 
              id="current"
              name="current"
              type="password"
              value={passwords.current}
              onChange={handlePasswordChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new">New Password</Label>
            <Input 
              id="new"
              name="new"
              type="password"
              value={passwords.new}
              onChange={handlePasswordChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm New Password</Label>
            <Input 
              id="confirm"
              name="confirm"
              type="password"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isUpdatingPassword}
              className="flex-1"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangeModal;
