import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Session as SessionType, User, ExecutionResult } from '@/types/session';
import Header from '@/components/Header';
import CodeEditor from '@/components/CodeEditor';
import UserPanel from '@/components/UserPanel';
import TypingIndicator from '@/components/TypingIndicator';
import UsernameDialog from '@/components/UsernameDialog';
import OutputPanel from '@/components/OutputPanel';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Session = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState<SessionType | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        navigate('/');
        return;
      }

      const sessionData = await api.getSession(sessionId);

      if (!sessionData) {
        toast({
          title: 'Session not found',
          description: 'This session does not exist or has expired.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setSession(sessionData);
      setIsLoading(false);
      setShowUsernameDialog(true);
    };

    loadSession();
  }, [sessionId, navigate, toast]);

  // Subscribe to session updates
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = api.subscribe(sessionId, (updatedSession) => {
      setSession(updatedSession);
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId && currentUser) {
        api.leaveSession(sessionId, currentUser.id);
      }
    };
  }, [sessionId, currentUser]);

  const handleJoinSession = useCallback(async (username: string) => {
    if (!sessionId) return { success: false, error: 'Invalid session' };

    const result = await api.joinSession(sessionId, username);

    if ('error' in result) {
      return { success: false, error: result.error };
    }

    setCurrentUser(result.user);
    setSession(result.session);
    setShowUsernameDialog(false);

    toast({
      title: 'Welcome!',
      description: `You've joined the session as ${username}`,
    });

    return { success: true };
  }, [sessionId, toast]);

  const handleCodeChange = useCallback((code: string) => {
    if (!sessionId || !currentUser) return;

    api.updateCode(sessionId, code, currentUser.id);
  }, [sessionId, currentUser]);

  const handleLanguageChange = useCallback((language: string) => {
    if (!sessionId) return;
    api.updateLanguage(sessionId, language);
  }, [sessionId]);

  const handleTypingStart = useCallback(() => {
    if (!sessionId || !currentUser) return;

    api.setTypingStatus(sessionId, currentUser.id, true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [sessionId, currentUser]);

  const handleTypingEnd = useCallback(() => {
    if (!sessionId || !currentUser) return;

    // Set a small delay before marking as not typing
    typingTimeoutRef.current = setTimeout(() => {
      api.setTypingStatus(sessionId, currentUser.id, false);
    }, 500);
  }, [sessionId, currentUser]);

  const handleRunCode = useCallback(async () => {
    if (!session || !sessionId) return;

    setIsRunning(true);
    try {
      const result = await api.executeCodeInSession(sessionId, session.code, session.language);
      setExecutionResult(result);
    } catch (error) {
      console.error('Code execution error:', error);
      setExecutionResult({
        output: '',
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0
      });
    }
    setIsRunning(false);
  }, [session, sessionId]);

  const handleClearOutput = useCallback(() => {
    setExecutionResult(null);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        sessionId={sessionId}
        language={session?.language}
        onLanguageChange={handleLanguageChange}
        showControls={!!currentUser}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-4 gap-4">
          <div className="flex-1 min-h-0">
            <CodeEditor
              code={session?.code || ''}
              language={session?.language || 'javascript'}
              onChange={handleCodeChange}
              onTypingStart={handleTypingStart}
              onTypingEnd={handleTypingEnd}
            />
          </div>

          <div className="h-48">
            <OutputPanel
              result={executionResult}
              isRunning={isRunning}
              onRun={handleRunCode}
              onClear={handleClearOutput}
            />
          </div>
        </div>

        {currentUser && session && (
          <UserPanel
            users={session.users}
            currentUserId={currentUser.id}
            isCollapsed={isPanelCollapsed}
            onToggle={() => setIsPanelCollapsed(!isPanelCollapsed)}
          />
        )}
      </div>

      {currentUser && session && (
        <TypingIndicator
          users={session.users}
          currentUserId={currentUser.id}
        />
      )}

      {sessionId && (
        <UsernameDialog
          isOpen={showUsernameDialog}
          onSubmit={handleJoinSession}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default Session;
