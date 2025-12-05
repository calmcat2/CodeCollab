import { v4 as uuidv4 } from 'uuid';
import { Session, User, ExecutionResult } from '@/types/session';

// In-memory storage for mock data
const sessions: Map<string, Session> = new Map();
const userColors = [
  'hsl(37, 92%, 50%)', // Primary orange
  'hsl(200, 70%, 50%)', // Blue
  'hsl(150, 60%, 45%)', // Green
  'hsl(280, 60%, 55%)', // Purple
  'hsl(350, 70%, 55%)', // Red
  'hsl(180, 60%, 45%)', // Teal
];

// Event listeners for real-time updates simulation
type Listener = (session: Session) => void;
const listeners: Map<string, Set<Listener>> = new Map();

// Simulated delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a random color for a user
const getRandomColor = (existingColors: string[]): string => {
  const availableColors = userColors.filter(c => !existingColors.includes(c));
  if (availableColors.length === 0) {
    return `hsl(${Math.random() * 360}, 60%, 50%)`;
  }
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

// Notify all listeners of a session update
const notifyListeners = (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (session) {
    const sessionListeners = listeners.get(sessionId);
    sessionListeners?.forEach(listener => listener({ ...session }));
  }
};

// API Methods
export const api = {
  // Create a new session
  async createSession(): Promise<Session> {
    await delay(200);
    const session: Session = {
      id: uuidv4().slice(0, 8),
      code: '// Start coding here\nconsole.log("Hello, World!");\n',
      language: 'javascript',
      users: [],
      createdAt: Date.now(),
    };
    sessions.set(session.id, session);
    return { ...session };
  },

  // Get session by ID
  async getSession(sessionId: string): Promise<Session | null> {
    await delay(100);
    const session = sessions.get(sessionId);
    return session ? { ...session } : null;
  },

  // Join a session with a username
  async joinSession(sessionId: string, username: string): Promise<{ user: User; session: Session } | { error: string }> {
    await delay(150);
    const session = sessions.get(sessionId);
    
    if (!session) {
      return { error: 'Session not found' };
    }

    // Check if username is taken
    if (session.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { error: 'Username is already taken' };
    }

    const existingColors = session.users.map(u => u.color);
    const user: User = {
      id: uuidv4(),
      username,
      color: getRandomColor(existingColors),
      isTyping: false,
      lastActivity: Date.now(),
    };

    session.users.push(user);
    notifyListeners(sessionId);
    
    return { user, session: { ...session } };
  },

  // Leave a session
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    await delay(100);
    const session = sessions.get(sessionId);
    if (session) {
      session.users = session.users.filter(u => u.id !== userId);
      notifyListeners(sessionId);
    }
  },

  // Update code in session
  async updateCode(sessionId: string, code: string, userId: string): Promise<void> {
    await delay(50);
    const session = sessions.get(sessionId);
    if (session) {
      session.code = code;
      const user = session.users.find(u => u.id === userId);
      if (user) {
        user.lastActivity = Date.now();
      }
      notifyListeners(sessionId);
    }
  },

  // Update language in session
  async updateLanguage(sessionId: string, language: string): Promise<void> {
    await delay(50);
    const session = sessions.get(sessionId);
    if (session) {
      session.language = language;
      notifyListeners(sessionId);
    }
  },

  // Set user typing status
  async setTypingStatus(sessionId: string, userId: string, isTyping: boolean): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      const user = session.users.find(u => u.id === userId);
      if (user) {
        user.isTyping = isTyping;
        notifyListeners(sessionId);
      }
    }
  },

  // Execute code (mock execution)
  async executeCode(code: string, language: string): Promise<ExecutionResult> {
    await delay(500);
    
    const startTime = Date.now();
    let output = '';
    let error: string | undefined;

    try {
      if (language === 'javascript' || language === 'typescript') {
        // Capture console.log output
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        };

        try {
          // eslint-disable-next-line no-new-func
          const result = new Function(code)();
          if (result !== undefined) {
            logs.push(`=> ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`);
          }
        } finally {
          console.log = originalLog;
        }
        
        output = logs.join('\n');
      } else if (language === 'python') {
        output = `[Mock Python Output]\nPython execution is simulated.\nCode received:\n${code.slice(0, 100)}...`;
      } else {
        output = `[Mock ${language} Output]\nExecution for ${language} is simulated.`;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error occurred';
    }

    return {
      output: output || 'No output',
      error,
      executionTime: Date.now() - startTime,
    };
  },

  // Subscribe to session updates
  subscribe(sessionId: string, callback: Listener): () => void {
    if (!listeners.has(sessionId)) {
      listeners.set(sessionId, new Set());
    }
    listeners.get(sessionId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const sessionListeners = listeners.get(sessionId);
      sessionListeners?.delete(callback);
    };
  },

  // Check if username is available
  async checkUsername(sessionId: string, username: string): Promise<boolean> {
    await delay(100);
    const session = sessions.get(sessionId);
    if (!session) return false;
    return !session.users.some(u => u.username.toLowerCase() === username.toLowerCase());
  },
};
