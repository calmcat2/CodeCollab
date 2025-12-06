export interface User {
  id: string;
  username: string;
  color: string;
  isTyping: boolean;
  lastActivity: number;
}

export interface Session {
  id: string;
  code: string;
  language: string;
  users: User[];
  createdAt: number;
  lastModifiedBy?: string;
}

export interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
}
