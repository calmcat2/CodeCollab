import { Link } from 'react-router-dom';
import { Code2, Users } from 'lucide-react';
import ShareDialog from './ShareDialog';
import LanguageSelector from './LanguageSelector';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  sessionId?: string;
  language?: string;
  onLanguageChange?: (language: string) => void;
  showControls?: boolean;
  onUsersClick?: () => void;
}

const Header = ({ sessionId, language, onLanguageChange, showControls = false, onUsersClick }: HeaderProps) => {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Code2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg">CodeCollab</span>
      </Link>

      {showControls && sessionId && (
        <div className="flex items-center gap-3">
          {language && onLanguageChange && (
            <LanguageSelector language={language} onChange={onLanguageChange} />
          )}
          <ShareDialog sessionId={sessionId} />

          {onUsersClick && (
            <Button
              variant="outline"
              size="icon"
              onClick={onUsersClick}
            >
              <Users className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
