"use client";

import * as React from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import { Copy, Check } from "lucide-react";
import { normalizeMonacoLanguage } from "@/lib/item-utils";
import { cn } from "@/lib/utils";

export interface CodeEditorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  language?: string | null;
  readOnly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  placeholder?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  showLanguageBadge?: boolean;
}

export function CodeEditor({
  value,
  defaultValue = "",
  onChange,
  language = "typescript",
  readOnly = false,
  minHeight = 80,
  maxHeight = 400,
  className,
  showLineNumbers = true,
  showCopyButton = true,
  showLanguageBadge = true,
}: CodeEditorProps) {
  const [copied, setCopied] = React.useState(false);
  const [editorHeight, setEditorHeight] = React.useState<number>(minHeight);
  const editorRef = React.useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  );

  const monacoLanguage = normalizeMonacoLanguage(language);
  const displayLanguage = language?.trim() || "code";

  // Handle dark theme definition before Monaco mounts
  const handleBeforeMount = (monaco: Monaco) => {
    monaco.editor.defineTheme("devstash-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", background: "09090b", foreground: "e4e4e7" },
        { token: "comment", foreground: "71717a", fontStyle: "italic" },
        { token: "keyword", foreground: "60a5fa" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "f59e0b" },
        { token: "type", foreground: "a78bfa" },
        { token: "function", foreground: "38bdf8" },
      ],
      colors: {
        "editor.background": "#09090b",
        "editor.foreground": "#e4e4e7",
        "editorLineNumber.foreground": "#52525b",
        "editorLineNumber.activeForeground": "#a1a1aa",
        "editor.lineHighlightBackground": "#18181b50",
        "editorCursor.foreground": "#3b82f6",
        "editor.selectionBackground": "#27272a80",
        "editor.inactiveSelectionBackground": "#27272a40",
        "scrollbarSlider.background": "#27272a60",
        "scrollbarSlider.hoverBackground": "#3f3f4680",
        "scrollbarSlider.activeBackground": "#52525b",
      },
    });
  };

  // Adjust height fluidly up to maxHeight
  const updateEditorHeight = React.useCallback(
    (editor: monacoEditor.editor.IStandaloneCodeEditor) => {
      const contentHeight = editor.getContentHeight();
      const nextHeight = Math.min(
        Math.max(contentHeight + 4, minHeight),
        maxHeight,
      );
      setEditorHeight(nextHeight);
      editor.layout();
    },
    [minHeight, maxHeight],
  );

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.setTheme("devstash-dark");

    updateEditorHeight(editor);

    editor.onDidContentSizeChange(() => {
      updateEditorHeight(editor);
    });
  };

  React.useEffect(() => {
    if (editorRef.current) {
      updateEditorHeight(editorRef.current);
    }
  }, [value, updateEditorHeight]);

  const handleCopy = async () => {
    const textToCopy =
      value ?? editorRef.current?.getValue() ?? defaultValue;
    if (!textToCopy || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code content:", err);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-lg border border-border/80 bg-zinc-950 overflow-hidden shadow-xs text-foreground",
        className,
      )}
    >
      {/* macOS-style Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800/80 select-none shrink-0">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 shadow-xs" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 shadow-xs" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 shadow-xs" />
        </div>

        {/* Right Header: Language Badge & Copy Button */}
        <div className="flex items-center gap-2">
          {showLanguageBadge && (
            <span className="text-[11px] font-mono font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 uppercase tracking-wider">
              {displayLanguage}
            </span>
          )}

          {showCopyButton && (
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer select-none",
                copied
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent",
              )}
              title={copied ? "Copied to clipboard!" : "Copy code"}
              aria-label="Copy code"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        className="w-full relative transition-[height] duration-75 ease-out"
        style={{ height: `${editorHeight}px` }}
      >
        <Editor
          height="100%"
          language={monacoLanguage}
          value={value}
          defaultValue={defaultValue}
          theme="devstash-dark"
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          onChange={(val) => onChange?.(val ?? "")}
          options={{
            readOnly,
            domReadOnly: readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            fontSize: 13,
            lineHeight: 20,
            fontFamily:
              "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            tabSize: 2,
            lineNumbers: showLineNumbers ? "on" : "off",
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: showLineNumbers ? 10 : 0,
            lineNumbersMinChars: showLineNumbers ? 3 : 0,
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
            renderLineHighlight: readOnly ? "none" : "line",
            contextmenu: !readOnly,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
            },
          }}
          loading={
            <div
              className="flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs w-full"
              style={{ height: `${minHeight}px` }}
            >
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
}

