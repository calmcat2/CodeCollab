import Editor, { OnMount } from '@monaco-editor/react';
import { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import randomColor from 'randomcolor';

interface CodeEditorProps {
  code: string; // Initial code (fallback)
  language: string;
  onChange: (value: string) => void;
  onTypingStart: () => void;
  onTypingEnd: () => void;
  username: string;
  userId: string;
  yDoc: Y.Doc | null;
  provider: WebsocketProvider | null;
}

const CodeEditor = ({ code: initialCode, language, onChange, onTypingStart, onTypingEnd, username, userId, yDoc, provider }: CodeEditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // User color for cursor
  const userColor = useRef(randomColor({ luminosity: 'dark' }));

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    // Set initial language
    const model = editor.getModel();
    if (model) {
      monacoInstance.editor.setModelLanguage(model, language);
    }

    editor.onDidFocusEditorText(() => {
      onTypingStart();
    });

    editor.onDidBlurEditorText(() => {
      onTypingEnd();
    });
  };

  // Bind Yjs when doc/provider are available and editor is mounted
  useEffect(() => {
    if (!yDoc || !provider || !editorRef.current || !monacoRef.current) return;

    // If already bound, skip
    if (bindingRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    const type = yDoc.getText('monaco');

    // Awareness (Cursors)
    provider.awareness.setLocalStateField('user', {
      name: username,
      color: userColor.current,
      id: userId
    });

    // Bind Yjs to Monaco
    const binding = new MonacoBinding(type, model!, new Set([editor]), provider.awareness);
    bindingRef.current = binding;

    // Hydration Logic:
    // If the document is empty (new session) AND we have initial code from DB, insert it.
    // Wait for sync via provider is handled by parent or we just check here?
    // Parent handles provider connection. We just check if type is empty.
    // Actually, 'sync' event is on provider. We can listen here or parent.
    // Listening here is safe if provider is stable.

    const initHandler = (isSynced: boolean) => {
      if (isSynced && type.toString().length === 0 && initialCode) {
        type.insert(0, initialCode);
      }
    }

    if (provider.synced) {
      initHandler(true);
    } else {
      provider.on('sync', initHandler);
    }

    // Sync back to DB (Persistence)
    type.observe(() => {
      const currentContent = type.toString();
      // Debounced update to DB via parent
      onChange(currentContent);
    });

    return () => {
      binding.destroy();
      provider.off('sync', initHandler);
      bindingRef.current = null;
    }
  }, [yDoc, provider, username, userId, initialCode, onChange]); // Re-run if doc/provider changes (should be stable)

  // Language update
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border relative">
      <Editor
        height="100%"
        language={language}
        // defaultValue={initialCode} // Managed by Yjs now
        onMount={handleEditorMount}
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
