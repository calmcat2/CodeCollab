import { Session, User, ExecutionResult } from '@/types/session';

// API Configuration
// API Configuration
// Use ?? to allow empty string (relative path) for production/docker
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// For WebSocket, if API_BASE_URL is relative (empty), construct WS URL from window.location
let defaultWsUrl = 'ws://localhost:8000';
if (API_BASE_URL === '') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    defaultWsUrl = `${protocol}//${window.location.host}`;
}
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? defaultWsUrl;

const API_PREFIX = '/api/v1';

// Helper function for API requests
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || error.detail || `HTTP ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return null as T;
    }

    return response.json();
}

// WebSocket connection manager
class WebSocketManager {
    private ws: WebSocket | null = null;
    private listeners: Set<(session: Session) => void> = new Set();
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private sessionId: string | null = null;

    connect(sessionId: string, callback: (session: Session) => void): () => void {
        this.sessionId = sessionId;
        this.listeners.add(callback);

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.createConnection(sessionId);
        }

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
            if (this.listeners.size === 0) {
                this.disconnect();
            }
        };
    }

    private createConnection(sessionId: string) {
        const wsUrl = `${WS_BASE_URL}${API_PREFIX}/ws/sessions/${sessionId}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.event === 'session_update' && data.data) {
                    // Notify all listeners
                    this.listeners.forEach(listener => {
                        listener(data.data as Session);
                    });
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');

            // Attempt to reconnect if there are still listeners
            if (this.listeners.size > 0 && this.sessionId) {
                this.reconnectTimeout = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    this.createConnection(this.sessionId!);
                }, 3000);
            }
        };
    }

    private disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.sessionId = null;
    }

    sendPing() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
        }
    }
}

const wsManager = new WebSocketManager();

// Keep-alive ping every 30 seconds
setInterval(() => {
    wsManager.sendPing();
}, 30000);

// API Methods
export const api = {
    // Create a new session
    async createSession(): Promise<Session> {
        return apiRequest<Session>('/sessions', {
            method: 'POST',
        });
    },

    // Get session by ID
    async getSession(sessionId: string): Promise<Session | null> {
        try {
            return await apiRequest<Session>(`/sessions/${sessionId}`);
        } catch (error) {
            console.error('Get session error:', error);
            return null;
        }
    },

    // Join a session with a username
    async joinSession(
        sessionId: string,
        username: string
    ): Promise<{ user: User; session: Session } | { error: string }> {
        try {
            const result = await apiRequest<{ user: User; session: Session }>(
                `/sessions/${sessionId}/join`,
                {
                    method: 'POST',
                    body: JSON.stringify({ username }),
                }
            );
            return result;
        } catch (error) {
            return { error: error instanceof Error ? error.message : 'Failed to join session' };
        }
    },

    // Leave a session
    async leaveSession(sessionId: string, userId: string): Promise<void> {
        await apiRequest(`/sessions/${sessionId}/leave`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
    },

    // Update code in session
    async updateCode(sessionId: string, code: string, userId: string): Promise<void> {
        await apiRequest(`/sessions/${sessionId}/code`, {
            method: 'PUT',
            body: JSON.stringify({ code, userId }),
        });
    },

    // Update language in session
    async updateLanguage(sessionId: string, language: string): Promise<void> {
        await apiRequest(`/sessions/${sessionId}/language`, {
            method: 'PUT',
            body: JSON.stringify({ language }),
        });
    },

    // Set user typing status
    async setTypingStatus(
        sessionId: string,
        userId: string,
        isTyping: boolean
    ): Promise<void> {
        await apiRequest(`/sessions/${sessionId}/typing`, {
            method: 'PUT',
            body: JSON.stringify({ userId, isTyping }),
        });
    },



    // Subscribe to session updates via WebSocket
    subscribe(sessionId: string, callback: (session: Session) => void): () => void {
        return wsManager.connect(sessionId, callback);
    },

    // Check if username is available
    async checkUsername(sessionId: string, username: string): Promise<boolean> {
        try {
            const result = await apiRequest<{ available: boolean }>(
                `/sessions/${sessionId}/username/check?username=${encodeURIComponent(username)}`
            );
            return result.available;
        } catch (error) {
            console.error('Check username error:', error);
            return false;
        }
    },
};
