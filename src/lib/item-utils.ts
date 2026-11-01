import type { ElementType } from "react";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  FileText,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  FileImage,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";

export interface ItemTypeInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const itemTypeIconMap: Record<string, ElementType> = {
  Code: Code,
  Sparkles: Sparkles,
  Terminal: Terminal,
  StickyNote: StickyNote,
  File: File,
  Image: ImageIcon,
  Link: LinkIcon,
  snippet: Code,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: ImageIcon,
  link: LinkIcon,
};

/**
 * Normalizes an item type slug (e.g. 'snippets' -> 'snippet').
 */
export function normalizeItemTypeSlug(slug: string): string {
  const clean = slug.trim().toLowerCase();
  const pluralMap: Record<string, string> = {
    snippets: "snippet",
    prompts: "prompt",
    commands: "command",
    notes: "note",
    files: "file",
    images: "image",
    links: "link",
  };
  return pluralMap[clean] || clean;
}

/**
 * Formats an item type name into a human-readable title (e.g. 'snippet' -> 'Snippets').
 */
export function formatItemTypeTitle(name: string): string {
  const map: Record<string, string> = {
    snippet: "Snippets",
    prompt: "Prompts",
    command: "Commands",
    note: "Notes",
    file: "Files",
    image: "Images",
    link: "Links",
  };
  return (
    map[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1)
  );
}

/**
 * Provides a short descriptive subtitle for each item type.
 */
export function getItemTypeDescription(name: string): string {
  const map: Record<string, string> = {
    snippet:
      "Reusable code snippets and boilerplates across programming languages",
    prompt: "System prompts, ChatGPT instructions, and AI workflow templates",
    command:
      "CLI commands, terminal one-liners, shell scripts, and cheat codes",
    note: "Quick developer notes, architectural thoughts, and scratchpad memos",
    file: "Configurations, project templates, environment files, and assets",
    image: "Screenshots, UI diagrams, architectural schemas, and graphics",
    link: "Curated web links, documentation references, and developer resources",
  };
  return (
    map[name.toLowerCase()] || `Manage and browse all saved ${name} resources.`
  );
}

/**
 * Checks whether an item type is designated as PRO only.
 */
export function isProType(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower === "file" ||
    lower === "files" ||
    lower === "image" ||
    lower === "images"
  );
}

/**
 * Formats a date into a long human-readable format (e.g. 'January 15, 2024').
 */
export function formatLongDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Normalizes a programming or shell language identifier to a Monaco-supported language.
 */
export function normalizeMonacoLanguage(lang?: string | null): string {
  if (!lang || !lang.trim()) return "plaintext";
  const clean = lang.trim().toLowerCase();
  const aliasMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    python3: "python",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    shell: "shell",
    cmd: "bat",
    batch: "bat",
    ps1: "powershell",
    powershell: "powershell",
    cs: "csharp",
    "c#": "csharp",
    "c++": "cpp",
    cpp: "cpp",
    c: "c",
    yml: "yaml",
    md: "markdown",
    docker: "dockerfile",
    golang: "go",
    rb: "ruby",
    rs: "rust",
    htm: "html",
  };
  return aliasMap[clean] || clean;
}

/**
 * Checks whether an item type name/slug is a code-oriented type (e.g. snippet, command).
 */
export function isCodeItemType(type?: string | null): boolean {
  if (!type) return false;
  const clean = normalizeItemTypeSlug(type);
  return ["snippet", "command", "code", "terminal"].includes(clean);
}

/**
 * Checks whether an item type name/slug is a markdown-oriented type (e.g. note, prompt).
 */
export function isMarkdownItemType(type?: string | null): boolean {
  if (!type) return false;
  const clean = normalizeItemTypeSlug(type);
  return ["note", "prompt", "stickynote", "sparkles"].includes(clean);
}

/**
 * Checks whether an item type name/slug is a file type.
 */
export function isFileItemType(type?: string | null): boolean {
  if (!type) return false;
  const clean = normalizeItemTypeSlug(type);
  return clean === "file";
}

/**
 * Checks whether an item type name/slug is an image type.
 */
export function isImageItemType(type?: string | null): boolean {
  if (!type) return false;
  const clean = normalizeItemTypeSlug(type);
  return clean === "image";
}

/**
 * Formats byte count into a human-readable string (e.g. '1.5 MB').
 */
export function formatFileSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const formatted = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${formatted} ${units[i]}`;
}

export interface FileIconInfo {
  icon: ElementType;
  colorClass: string;
  bgClass: string;
  category: string;
  extension: string;
}

/**
 * Extracts the file extension (in lowercase, without dot) from a filename, url, or path.
 */
export function getFileExtension(filename?: string | null): string {
  if (!filename || typeof filename !== "string") return "";
  // Strip url query parameters and hash
  const cleanPath = filename.split("?")[0].split("#")[0].trim();
  const basename = cleanPath.split("/").pop()?.split("\\").pop() || "";

  // Special dotfiles handling (e.g. .env, .gitignore)
  if (basename.startsWith(".") && !basename.slice(1).includes(".")) {
    return basename.slice(1).toLowerCase();
  }

  const lastDotIndex = basename.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === basename.length - 1) {
    return "";
  }
  return basename.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * Returns icon, color classes, and category metadata for a given file name or extension.
 */
export function getFileIconInfo(filename?: string | null): FileIconInfo {
  const ext = getFileExtension(filename);

  // PDF
  if (ext === "pdf") {
    return {
      icon: FileText,
      colorClass: "text-red-400",
      bgClass: "bg-red-500/10 border-red-500/20",
      category: "PDF Document",
      extension: ext,
    };
  }

  // Code & Config
  const codeExtensions = new Set([
    "js",
    "jsx",
    "ts",
    "tsx",
    "mjs",
    "cjs",
    "py",
    "java",
    "c",
    "cpp",
    "cs",
    "go",
    "rs",
    "php",
    "rb",
    "swift",
    "kt",
    "scala",
    "html",
    "htm",
    "css",
    "scss",
    "sass",
    "less",
    "json",
    "yaml",
    "yml",
    "xml",
    "sql",
    "graphql",
    "sh",
    "bash",
    "zsh",
    "bat",
    "ps1",
    "cmd",
    "dockerfile",
    "toml",
    "env",
    "gitignore",
    "prisma",
    "config",
  ]);
  if (codeExtensions.has(ext)) {
    return {
      icon: FileCode,
      colorClass: "text-sky-400",
      bgClass: "bg-sky-500/10 border-sky-500/20",
      category: "Code & Config",
      extension: ext,
    };
  }

  // Archives
  const archiveExtensions = new Set([
    "zip",
    "tar",
    "gz",
    "7z",
    "rar",
    "bz2",
    "xz",
    "tgz",
    "iso",
  ]);
  if (archiveExtensions.has(ext)) {
    return {
      icon: FileArchive,
      colorClass: "text-amber-400",
      bgClass: "bg-amber-500/10 border-amber-500/20",
      category: "Archive",
      extension: ext,
    };
  }

  // Spreadsheets & Data
  const spreadsheetExtensions = new Set([
    "csv",
    "xlsx",
    "xls",
    "tsv",
    "ods",
    "parquet",
  ]);
  if (spreadsheetExtensions.has(ext)) {
    return {
      icon: FileSpreadsheet,
      colorClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10 border-emerald-500/20",
      category: "Spreadsheet",
      extension: ext,
    };
  }

  // Documents & Notes
  const docExtensions = new Set([
    "doc",
    "docx",
    "txt",
    "rtf",
    "odt",
    "pages",
    "md",
    "markdown",
  ]);
  if (docExtensions.has(ext)) {
    return {
      icon: FileText,
      colorClass: "text-blue-400",
      bgClass: "bg-blue-500/10 border-blue-500/20",
      category: "Document",
      extension: ext,
    };
  }

  // Images
  const imageExtensions = new Set([
    "png",
    "jpg",
    "jpeg",
    "gif",
    "svg",
    "webp",
    "bmp",
    "ico",
    "avif",
    "tiff",
  ]);
  if (imageExtensions.has(ext)) {
    return {
      icon: FileImage,
      colorClass: "text-pink-400",
      bgClass: "bg-pink-500/10 border-pink-500/20",
      category: "Image",
      extension: ext,
    };
  }

  // Audio
  const audioExtensions = new Set([
    "mp3",
    "wav",
    "ogg",
    "flac",
    "aac",
    "m4a",
    "wma",
  ]);
  if (audioExtensions.has(ext)) {
    return {
      icon: FileAudio,
      colorClass: "text-purple-400",
      bgClass: "bg-purple-500/10 border-purple-500/20",
      category: "Audio",
      extension: ext,
    };
  }

  // Video
  const videoExtensions = new Set([
    "mp4",
    "mov",
    "avi",
    "mkv",
    "webm",
    "wmv",
    "flv",
    "m4v",
  ]);
  if (videoExtensions.has(ext)) {
    return {
      icon: FileVideo,
      colorClass: "text-rose-400",
      bgClass: "bg-rose-500/10 border-rose-500/20",
      category: "Video",
      extension: ext,
    };
  }

  // Default fallback
  return {
    icon: File,
    colorClass: "text-indigo-400",
    bgClass: "bg-indigo-500/10 border-indigo-500/20",
    category: "File",
    extension: ext,
  };
}
