import { User } from '@/types/session';
import { Users } from 'lucide-react';
import UserList from './UserList';

const UserPanel = ({ users, currentUserId, onLeave, onlineUserIds }: { users: User[], currentUserId?: string, onLeave?: () => void, onlineUserIds: Set<string> }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Participants</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {users.length}
          </span>
        </div>
      </div>

      <UserList users={users} currentUserId={currentUserId || ''} onlineUserIds={onlineUserIds} />

      {currentUserId && onLeave && (
        <div className="p-3 border-t border-border mt-auto">
          <button
            onClick={onLeave}
            className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors text-center p-2 rounded-md hover:bg-muted"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserPanel;
