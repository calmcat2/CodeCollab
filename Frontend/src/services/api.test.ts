import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { api } from './api';

// Mock fetch
global.fetch = vi.fn();

describe('API Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createSession', () => {
        it('should create a new session', async () => {
            const mockSession = {
                id: 'test123',
                code: '// Start coding here\nconsole.log("Hello, World!");\n',
                language: 'javascript',
                users: [],
                createdAt: Date.now(),
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => mockSession,
            });

            const result = await api.createSession();

            expect(result).toEqual(mockSession);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/v1/sessions',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });
    });

    describe('getSession', () => {
        it('should get a session by ID', async () => {
            const mockSession = {
                id: 'test123',
                code: 'console.log("test");',
                language: 'javascript',
                users: [],
                createdAt: Date.now(),
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSession,
            });

            const result = await api.getSession('test123');

            expect(result).toEqual(mockSession);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/v1/sessions/test123',
                expect.any(Object)
            );
        });

        it('should return null for non-existent session', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ error: 'Session not found' }),
            });

            const result = await api.getSession('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('joinSession', () => {
        it('should join a session successfully', async () => {
            const mockResponse = {
                user: {
                    id: 'user123',
                    username: 'testuser',
                    color: 'hsl(37, 92%, 50%)',
                    isTyping: false,
                    lastActivity: Date.now(),
                },
                session: {
                    id: 'test123',
                    code: 'console.log("test");',
                    language: 'javascript',
                    users: [],
                    createdAt: Date.now(),
                },
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            const result = await api.joinSession('test123', 'testuser');

            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/v1/sessions/test123/join',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ username: 'testuser' }),
                })
            );
        });

        it('should return error for duplicate username', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Username is already taken' }),
            });

            const result = await api.joinSession('test123', 'duplicate');

            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('already taken');
        });
    });

    describe('updateCode', () => {
        it('should update code in session', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 204,
            });

            await api.updateCode('test123', 'console.log("updated");', 'user123');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/v1/sessions/test123/code',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({
                        code: 'console.log("updated");',
                        userId: 'user123',
                    }),
                })
            );
        });
    });

    describe('executeCodeInSession', () => {
        it('should execute code and return result', async () => {
            const mockResult = {
                output: 'Hello, World!',
                executionTime: 45,
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResult,
            });

            const result = await api.executeCodeInSession(
                'test123',
                'print("Hello, World!")',
                'python'
            );

            expect(result).toEqual(mockResult);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/v1/sessions/test123/execute',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('should return error on execution failure', async () => {
            const mockResult = {
                output: '',
                error: 'NameError: name "x" is not defined',
                executionTime: 10,
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResult,
            });

            const result = await api.executeCodeInSession(
                'test123',
                'print(x)',
                'python'
            );

            expect(result.error).toBeDefined();
            expect(result.error).toContain('NameError');
        });
    });

    describe('checkUsername', () => {
        it('should return true for available username', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ available: true }),
            });

            const result = await api.checkUsername('test123', 'newuser');

            expect(result).toBe(true);
        });

        it('should return false for taken username', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ available: false }),
            });

            const result = await api.checkUsername('test123', 'takenuser');

            expect(result).toBe(false);
        });
    });
});
