import type { ElementType } from "react";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
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

