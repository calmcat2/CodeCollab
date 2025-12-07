import { ExecutionResult } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Terminal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutputPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onRun: () => void;
  onClear: () => void;
}

const OutputPanel = ({ result, isRunning, onRun, onClear }: OutputPanelProps) => {
  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Output</span>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <Button variant="ghost" size="sm" onClick={onClear} className="h-7 px-2">
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            onClick={(e) => {
              e.preventDefault();
              onRun();
            }}
            size="sm"
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {result ? (
          <div className="space-y-2">
            {result.error ? (
              <pre className="text-destructive whitespace-pre-wrap">{result.error}</pre>
            ) : (
              <pre className="text-foreground whitespace-pre-wrap">{result.output}</pre>
            )}
            <p className="text-xs text-muted-foreground border-t border-border pt-2">
              Execution time: {result.executionTime}ms
            </p>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>Click "Run" to execute the code</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
