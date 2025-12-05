import Editor from '@monaco-editor/react';
import { useCallback } from 'react';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  onTypingStart: () => void;
  onTypingEnd: () => void;
}

const CodeEditor = ({ code, language, onChange, onTypingStart, onTypingEnd }: CodeEditorProps) => {
  const handleChange = useCallback((value: string | undefined) => {
    onChange(value || '');
  }, [onChange]);

  const handleFocus = useCallback(() => {
    onTypingStart();
  }, [onTypingStart]);

  const handleBlur = useCallback(() => {
    onTypingEnd();
  }, [onTypingEnd]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border">
      <Editor
        height="100%"
        language={language}
        value={code}
        onChange={handleChange}
        onMount={(editor) => {
          editor.onDidFocusEditorText(handleFocus);
          editor.onDidBlurEditorText(handleBlur);
        }}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
          padding: { top: 16 },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;
