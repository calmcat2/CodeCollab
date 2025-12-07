import { ExecutionResult } from '@/types/session';

declare global {
    interface Window {
        loadPyodide: any;
    }
}

class CodeExecutionService {
    private pyodide: any = null;
    private pyodideLoadingPromise: Promise<void> | null = null;

    async initializePyodide() {
        if (this.pyodide) return;
        if (this.pyodideLoadingPromise) return this.pyodideLoadingPromise;

        this.pyodideLoadingPromise = (async () => {
            try {
                if (!window.loadPyodide) {
                    throw new Error("Pyodide script not loaded");
                }
                this.pyodide = await window.loadPyodide();
                // Capture stdout
                await this.pyodide.runPythonAsync(`
            import sys
            import io
            sys.stdout = io.StringIO()
            sys.stderr = io.StringIO()
        `);
            } catch (error) {
                console.error("Failed to load Pyodide:", error);
                this.pyodideLoadingPromise = null;
                throw error;
            }
        })();
        return this.pyodideLoadingPromise;
    }

    async execute(code: string, language: string): Promise<ExecutionResult> {
        const startTime = performance.now();
        let output = "";
        let error: string | undefined = undefined;

        try {
            if (language === 'python') {
                await this.initializePyodide();

                // Reset stdout buffer
                await this.pyodide.runPythonAsync(`
            import sys
            sys.stdout.truncate(0)
            sys.stdout.seek(0)
            sys.stderr.truncate(0)
            sys.stderr.seek(0)
        `);

                // Execute code
                // We use runPythonAsync which handles top-level await.
                // However, we wrap in a try/catch block inside Python to ensure we catch runtime errors gracefully?
                // No, catch in JS.

                // Fix for "await CodeRunner": Ensure code is string and simple
                // Using loadPackagesFromImports might be needed if user imports things? Not for 'math'.

                try {
                    await this.pyodide.runPythonAsync(code);
                } catch (innerErr) {
                    // Fallback: try synchronous runPython if async fails for some weird internal reason
                    // or just rethrow
                    console.warn("Async run failed, trying sync:", innerErr);
                    this.pyodide.runPython(code);
                }

                // Read stdout
                output = this.pyodide.runPython("sys.stdout.getvalue()");
                const errOutput = this.pyodide.runPython("sys.stderr.getvalue()");

                if (errOutput) {
                    error = errOutput;
                }
            } else if (language === 'javascript' || language === 'typescript') {
                // Simple JS capture
                const originalLog = console.log;
                const logs: string[] = [];
                console.log = (...args) => {
                    logs.push(args.map(a => String(a)).join(' '));
                    // originalLog(...args); // Optional: assume user wants to see it in devtools too
                };

                try {
                    // New Function is safer than eval but still has access to global window.
                    // Shadow 'print' to prevent window.print() and redirect to console.log
                    // We can also pass other globals if needed.
                    const runner = new Function('print', code);
                    runner((...args: any[]) => console.log(...args));
                } finally {
                    console.log = originalLog;
                }
                output = logs.join('\n');
            } else {
                output = `Execution for ${language} is not supported in browser yet.`;
            }
        } catch (e: any) {
            error = e.toString();
            // Pyodide PythonError
            if (e.message) error = e.message;
        }

        const duration = performance.now() - startTime;
        return {
            output: output || (error ? "" : "No output"),
            error: error,
            executionTime: Math.round(duration)
        };
    }
}

export const codeExecutionService = new CodeExecutionService();
