import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, User } from 'lucide-react';

interface UsernameDialogProps {
  isOpen: boolean;
  onSubmit: (username: string) => Promise<{ success: boolean; error?: string }>;
  sessionId: string;
}

const UsernameDialog = ({ isOpen, onSubmit, sessionId }: UsernameDialogProps) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    if (trimmedUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    if (trimmedUsername.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, underscores, and dashes');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await onSubmit(trimmedUsername);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to join session');
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Join Session
          </DialogTitle>
          <DialogDescription>
            Enter a username to join the coding session. Your username will be visible to other participants.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                autoFocus
                className="w-full"
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Session ID: <code className="bg-muted px-1 py-0.5 rounded">{sessionId}</code>
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading || !username.trim()} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Session'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameDialog;
