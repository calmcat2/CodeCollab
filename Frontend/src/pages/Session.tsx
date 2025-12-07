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
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { LANGUAGE_DEFAULTS } from '@/utils/languageDefaults';
import UserList from '@/components/UserList';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const STORAGE_KEY_USERNAME = 'codecollab_username';

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
  const [isMobileUsersOpen, setIsMobileUsersOpen] = useState(false);

  // Yjs State
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');
  const [isSynced, setIsSynced] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Yjs
  useEffect(() => {
    if (!sessionId) return;

    const doc = new Y.Doc();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/yjs-ws`;
    const wsProvider = new WebsocketProvider(wsUrl, sessionId, doc);

    wsProvider.on('connection-error', (event: any) => {
      console.error("Yjs Connection Error:", event);
      setConnectionError("Connection Failed");
    });

    wsProvider.on('connection-close', (event: any) => {
      setConnectionError("Disconnected");
    });

    wsProvider.on('status', (event: any) => {
      if (event.status === 'connected') {
        setConnectionError('');
        setIsSynced(true);
      } else {
        setIsSynced(false);
      }
    });

    // Execution Result Sync
    const executionMap = doc.getMap('execution');
    executionMap.observe(() => {
      const latest = executionMap.get('latest') as any;
      if (latest) {
        setExecutionResult(latest.result);
      }
    });


    // Awareness / Online Status
    const awareness = wsProvider.awareness;
    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const onlineIds = new Set<string>();
      states.forEach((state: any) => {
        if (state.user && state.user.id) {
          onlineIds.add(state.user.id);
        }
      });
      setOnlineUserIds(onlineIds);
    };

    awareness.on('change', handleAwarenessChange);

    setYDoc(doc);
    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
      doc.destroy();
      awareness.off('change', handleAwarenessChange);
    }
  }, [sessionId]);

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
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
        // Only show dialog if not joined yet? Actually logic was fine.
        setShowUsernameDialog(true);
      } catch (error) {
        console.error("Failed to load session", error);
        toast({
          title: 'Error loading session',
          description: 'Please reload the page.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId, navigate, toast]);

  // Auto-join if username exists in storage
  useEffect(() => {
    if (!sessionId || currentUser || isLoading) return;

    const storedUsername = localStorage.getItem(STORAGE_KEY_USERNAME);
    if (storedUsername) {
      // Small delay to ensure session is loaded? 
      // Actually loadSession sets isLoading=false. 
      // We can trigger join immediately.
      api.joinSession(sessionId, storedUsername).then(result => {
        if ('error' in result) {
          // If failed (e.g. taken), prompt user manually
          setShowUsernameDialog(true);
        } else {
          setCurrentUser(result.user);
          setSession(result.session);
          toast({
            title: 'Welcome back!',
            description: `Rejoined as ${storedUsername}`,
          });
          setShowUsernameDialog(false);
        }
      });
    }
  }, [sessionId, currentUser, isLoading, toast]);

  // Subscribe to session updates
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = api.subscribe(sessionId, (updatedSession) => {
      if (currentUser && updatedSession.lastModifiedBy === currentUser.id) {
        setSession((prev) => {
          if (!prev) return updatedSession;
          return {
            ...updatedSession,
            code: prev.code
          };
        });
      } else {
        setSession(updatedSession);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, currentUser]);

  // Warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentUser) {
        e.preventDefault();
        e.returnValue = ''; // Trigger browser warning
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);

  // Cleanup on unmount - REMOVED automatic leaveSession to allow "offline" status persistence
  // Only explicitly signing out removes the user.
  /*
  useEffect(() => {
    return () => {
      if (sessionId && currentUser) {
        api.leaveSession(sessionId, currentUser.id);
      }
    };
  }, [sessionId, currentUser]);
  */

  const handleJoinSession = useCallback(async (username: string) => {
    if (!sessionId) return { success: false, error: 'Invalid session' };

    const result = await api.joinSession(sessionId, username);

    if ('error' in result) {
      return { success: false, error: result.error };
    }

    setCurrentUser(result.user);
    setSession(result.session);
    setShowUsernameDialog(false);

    localStorage.setItem(STORAGE_KEY_USERNAME, username);

    toast({
      title: 'Welcome!',
      description: `You've joined the session as ${username}`,
    });

    return { success: true };
  }, [sessionId, toast]);

  const codeRef = useRef(session?.code || '');

  // Keep codeRef in sync
  useEffect(() => {
    if (session?.code) {
      codeRef.current = session.code;
    }
  }, [session?.code]);

  const handleCodeChange = useCallback((code: string) => {
    if (!sessionId || !currentUser) return;
    setSession(prev => prev ? ({ ...prev, code }) : null);
    api.updateCode(sessionId, code, currentUser.id);
  }, [sessionId, currentUser]);

  const handleLanguageChange = useCallback((language: string) => {
    if (!sessionId) return;

    setSession(prev => prev ? ({ ...prev, language }) : null);
    api.updateLanguage(sessionId, language);
  }, [sessionId]);

  const handleTypingStart = useCallback(() => {
    if (!sessionId || !currentUser) return;
    api.setTypingStatus(sessionId, currentUser.id, true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [sessionId, currentUser]);

  const handleTypingEnd = useCallback(() => {
    if (!sessionId || !currentUser) return;
    typingTimeoutRef.current = setTimeout(() => {
      api.setTypingStatus(sessionId, currentUser.id, false);
    }, 500);
  }, [sessionId, currentUser]);

  const handleRunCode = useCallback(async () => {
    if (!session || !sessionId || !yDoc) return;

    setIsRunning(true);
    try {
      const { codeExecutionService } = await import('@/services/codeExecution');

      const yText = yDoc.getText('monaco');
      const codeToRun = yText.toString() || codeRef.current;

      const result = await codeExecutionService.execute(codeToRun, session.language);

      const payload = {
        result: result,
        user: currentUser?.username,
        timestamp: Date.now()
      };

      yDoc.getMap('execution').set('latest', payload);
      setExecutionResult(result);

    } catch (error) {
      console.error('Code execution error:', error);
      const errorResult = {
        output: '',
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0
      };
      setExecutionResult(errorResult);

      const payload = {
        result: errorResult,
        user: currentUser?.username,
        timestamp: Date.now()
      };
      yDoc.getMap('execution').set('latest', payload);
    }
    setIsRunning(false);
  }, [session, sessionId, yDoc, currentUser]);

  const handleClearOutput = useCallback(() => {
    setExecutionResult(null);
  }, []);

  const handleUsersClick = useCallback(() => {
    // Check if mobile
    if (window.innerWidth < 768) {
      setIsMobileUsersOpen(true);
    } else {
      // Desktop toggle - functional update prevents stale closures
      setIsPanelCollapsed(prev => !prev);
    }
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
    <div className="h-screen flex flex-col bg-background relative">
      <Header
        sessionId={sessionId}
        language={session?.language}
        onLanguageChange={handleLanguageChange}
        showControls={!!currentUser}
        onUsersClick={handleUsersClick}
      />

      {!isSynced && provider && (
        <div className="absolute top-[64px] right-0 z-50 bg-yellow-500 text-black text-xs px-2 py-1 rounded-bl shadow-md">
          {connectionError ? `Sync Error: ${connectionError}` : 'Connecting to Room...'}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-4 gap-4 min-w-0">
          <div className="flex-1 min-h-0">
            <CodeEditor
              code={session?.code || ''}
              language={session?.language || 'python'}
              onChange={handleCodeChange}
              onTypingStart={handleTypingStart}
              onTypingEnd={handleTypingEnd}
              username={currentUser?.username || 'Anonymous'}
              userId={currentUser?.id || ''}
              yDoc={yDoc}
              provider={provider}
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

        <div
          className={`hidden md:flex flex-col shrink-0 min-w-0 border-r-0 bg-card transition-all duration-300 ease-in-out ${isPanelCollapsed ? 'w-0 opacity-0 overflow-hidden border-none' : 'w-64 opacity-100 border-l border-border'
            }`}
        >
          <div className="w-64 h-full">
            {session && (
              <UserPanel
                users={session.users}
                currentUserId={currentUser?.id}
                onlineUserIds={onlineUserIds}
                onLeave={async () => {
                  if (sessionId && currentUser) {
                    await api.leaveSession(sessionId, currentUser.id);
                  }
                  localStorage.removeItem(STORAGE_KEY_USERNAME);
                  navigate('/');
                }}
              />
            )}
          </div>
        </div>
      </div>

      <Sheet open={isMobileUsersOpen} onOpenChange={setIsMobileUsersOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Participants ({session?.users.length || 0})</SheetTitle>
          </SheetHeader>
          <div className="mt-4 h-full">
            {currentUser && session && (
              <UserList users={session.users} currentUserId={currentUser.id} onlineUserIds={onlineUserIds} />
            )}
          </div>
        </SheetContent>
      </Sheet>

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

import ErrorBoundary from '@/components/ErrorBoundary';

const SessionWithErrorBoundary = () => (
  <ErrorBoundary>
    <Session />
  </ErrorBoundary>
);

export default SessionWithErrorBoundary;
