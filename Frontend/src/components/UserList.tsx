import { User } from '@/types/session';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserListProps {
    users: User[];
    currentUserId: string;
    onlineUserIds: Set<string>;
}

const UserList = ({ users, currentUserId, onlineUserIds }: UserListProps) => {
    const sortedUsers = [...users].sort((a, b) => a.username.localeCompare(b.username));

    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sortedUsers.map((user) => (
                <div
                    key={user.id}
                    className={cn(
                        'flex items-center gap-3 p-2 rounded-lg transition-colors',
                        user.id === currentUserId ? 'bg-primary/10' : 'hover:bg-muted/50'
                    )}
                >
                    <div className="relative">
                        <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold select-none"
                            style={{
                                backgroundColor: `${user.color}20`,
                                color: user.color
                            }}
                        >
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <Circle
                            className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-current",
                                onlineUserIds.has(user.id) ? "text-green-500" : "text-muted-foreground/30"
                            )}
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
    );
};

export default UserList;
