import { User } from '@/types/session';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserPanelProps {
  users: User[];
  currentUserId: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

const UserPanel = ({ users, currentUserId, isCollapsed, onToggle }: UserPanelProps) => {
  return (
    <div
      className={cn(
        'h-full bg-card border-l border-border transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-12' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Participants</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {users.length}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                user.id === currentUserId ? 'bg-primary/10' : 'hover:bg-muted/50'
              )}
            >
              <div className="relative">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ 
                    backgroundColor: `${user.color}20`,
                    color: user.color 
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <Circle
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.username}
                  {user.id === currentUserId && (
                    <span className="text-xs text-muted-foreground ml-1">(you)</span>
                  )}
                </p>
                {user.isTyping && (
                  <p className="text-xs text-primary animate-pulse">typing...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center pt-3 gap-2">
          {users.slice(0, 5).map((user) => (
            <div
              key={user.id}
              className="relative group"
              title={user.username}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ 
                  backgroundColor: `${user.color}20`,
                  color: user.color 
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              {user.isTyping && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full animate-pulse" />
              )}
            </div>
          ))}
          {users.length > 5 && (
            <span className="text-xs text-muted-foreground">+{users.length - 5}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPanel;
