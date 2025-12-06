import { User } from '@/types/session';
import { Users } from 'lucide-react';
import UserList from './UserList';

const UserPanel = ({ users, currentUserId }: { users: User[], currentUserId: string }) => {
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

      <UserList users={users} currentUserId={currentUserId} />
    </div>
  );
};

export default UserPanel;
