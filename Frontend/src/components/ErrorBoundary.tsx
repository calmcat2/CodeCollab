import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
                    <div className="max-w-md text-center space-y-4">
                        <div className="flex justify-center">
                            <AlertTriangle className="h-12 w-12 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold">Something went wrong</h1>
                        <div className="bg-destructive/10 p-4 rounded-md text-left text-sm font-mono overflow-auto max-h-48">
                            {this.state.error?.message || 'Unknown error'}
                        </div>
                        <Button onClick={() => window.location.reload()}>
                            Reload Page
                        </Button>
                        <Button variant="outline" onClick={() => window.location.href = '/'}>
                            Go Home
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
