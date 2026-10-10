"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, PenLine, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarkdownEditorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  placeholder?: string;
  showCopyButton?: boolean;
  defaultTab?: "write" | "preview";
}

export function MarkdownEditor({
  value,
  defaultValue = "",
  onChange,
  readOnly = false,
  minHeight = 180,
  maxHeight = 400,
  className,
  placeholder = "Write your markdown content here...",
  showCopyButton = true,
  defaultTab,
}: MarkdownEditorProps) {
  const [tabState, setTabState] = React.useState<"write" | "preview">(
    defaultTab ?? "write",
  );
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(
    defaultValue,
  );
  const [copied, setCopied] = React.useState(false);

  const activeTab = readOnly ? "preview" : tabState;
  const currentContent = value !== undefined ? value : uncontrolledValue;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    if (value === undefined) {
      setUncontrolledValue(nextVal);
    }
    onChange?.(nextVal);
  };

  const handleCopy = async () => {
    const textToCopy = currentContent;
    if (!textToCopy || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy markdown content:", err);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-lg border border-border/80 bg-[#1e1e1e] overflow-hidden shadow-xs text-foreground",
        className,
      )}
    >
      {/* macOS-style Header with Tabs */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#2d2d2d] border-b border-zinc-800/90 select-none shrink-0">
        {/* Left Side: macOS Window Dots + Tabs */}
        <div className="flex items-center gap-3">
          {/* macOS Window Controls */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 shadow-xs" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 shadow-xs" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 shadow-xs" />
          </div>

          {/* Mode Tabs */}
          {!readOnly ? (
            <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-md border border-zinc-700/60">
              <button
                type="button"
                onClick={() => setTabState("write")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded transition-all cursor-pointer select-none",
                  activeTab === "write"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40",
                )}
                aria-label="Write tab"
              >
                <PenLine className="h-3 w-3" />
                <span>Write</span>
              </button>
              <button
                type="button"
                onClick={() => setTabState("preview")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded transition-all cursor-pointer select-none",
                  activeTab === "preview"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40",
                )}
                aria-label="Preview tab"
              >
                <Eye className="h-3 w-3" />
                <span>Preview</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium font-mono text-zinc-400 bg-zinc-800/80 rounded border border-zinc-700/60 uppercase tracking-wider">
              <Eye className="h-3 w-3 text-zinc-400" />
              <span>Preview</span>
            </div>
          )}
        </div>

        {/* Right Header: Copy Button */}
        <div className="flex items-center gap-2">
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
              title={copied ? "Copied to clipboard!" : "Copy markdown"}
              aria-label="Copy markdown"
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

      {/* Editor / Preview Content Body */}
      <div
        className="w-full relative flex flex-col"
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        }}
      >
        {activeTab === "write" && !readOnly ? (
          <textarea
            value={currentContent}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full flex-1 p-3.5 bg-[#1e1e1e] text-zinc-100 placeholder:text-zinc-500 font-mono text-xs sm:text-sm leading-relaxed border-0 outline-none focus:ring-0 focus:outline-none resize-none overflow-y-auto"
            style={{ minHeight: `${minHeight}px`, height: "100%" }}
            rows={Math.max(4, Math.floor(minHeight / 24))}
          />
        ) : (
          <div
            className="w-full flex-1 overflow-y-auto p-4 bg-[#1e1e1e] text-zinc-200 text-xs sm:text-sm leading-relaxed markdown-preview selection:bg-zinc-700 selection:text-white"
            style={{ minHeight: `${minHeight}px` }}
          >
            {currentContent.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 border-b border-zinc-800 pb-2 mt-4 mb-3 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-100 border-b border-zinc-800/70 pb-1.5 mt-4 mb-2.5 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-200 mt-3 mb-2 first:mt-0">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-sm sm:text-base font-semibold text-zinc-200 mt-2.5 mb-1.5 first:mt-0">
                      {children}
                    </h4>
                  ),
                  h5: ({ children }) => (
                    <h5 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-400 mt-2 mb-1 first:mt-0">
                      {children}
                    </h5>
                  ),
                  h6: ({ children }) => (
                    <h6 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mt-2 mb-1 first:mt-0">
                      {children}
                    </h6>
                  ),
                  p: ({ children }) => (
                    <p className="my-2 leading-relaxed text-zinc-300 last:mb-0">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-zinc-100">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-zinc-200">{children}</em>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors font-medium"
                    >
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 my-2.5 space-y-1 text-zinc-300">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 my-2.5 space-y-1 text-zinc-300">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500/60 bg-zinc-900/60 pl-3.5 py-1.5 my-3 italic text-zinc-300 rounded-r">
                      {children}
                    </blockquote>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className && typeof children === "string" && !children.includes("\n");
                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-amber-300 font-mono text-[12px]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code
                        className={cn(
                          "block font-mono text-xs text-zinc-200 overflow-x-auto",
                          className,
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="p-3.5 my-3 rounded-md bg-zinc-950/90 border border-zinc-800/80 overflow-x-auto text-zinc-200 font-mono text-xs leading-relaxed">
                      {children}
                    </pre>
                  ),
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto rounded-lg border border-zinc-800">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-200 font-medium">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-zinc-900/40 transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 font-semibold text-zinc-200">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 align-top">{children}</td>
                  ),
                  hr: () => <hr className="my-4 border-zinc-800" />,
                  input: ({ type, checked, disabled, ...props }) => {
                    if (type === "checkbox") {
                      return (
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled ?? true}
                          className="mr-2 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0 cursor-default align-middle"
                          {...props}
                        />
                      );
                    }
                    return <input type={type} {...props} />;
                  },
                }}
              >
                {currentContent}
              </ReactMarkdown>
            ) : (
              <p className="text-zinc-500 italic font-mono text-xs">
                No markdown content to preview.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
