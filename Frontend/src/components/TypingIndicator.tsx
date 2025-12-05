import { User } from '@/types/session';

interface TypingIndicatorProps {
  users: User[];
  currentUserId: string;
}

const TypingIndicator = ({ users, currentUserId }: TypingIndicatorProps) => {
  const typingUsers = users.filter(u => u.isTyping && u.id !== currentUserId);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing`;
    } else {
      return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border py-2 px-4 flex items-center gap-2 z-50">
      <div className="flex gap-1">
        <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-muted-foreground">{getTypingText()}</span>
    </div>
  );
};

export default TypingIndicator;
