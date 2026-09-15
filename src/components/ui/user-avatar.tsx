"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
  fallbackClassName?: string;
}

/**
 * Extracts initials from a user's name or email.
 * Examples:
 * - "Rajesh Poojari" -> "RP"
 * - "John" -> "J"
 * - "demo@devstash.io" -> "D"
 * - null -> "U"
 */
export function getInitials(
  name?: string | null,
  email?: string | null,
): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
  }

  if (email && email.trim().length > 0) {
    const cleaned = email.trim();
    return cleaned[0].toUpperCase();
  }

  return "U";
}

export function UserAvatar({
  name,
  email,
  image,
  size = "default",
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const initials = getInitials(name, email);
  const displayName = name || email || "User";

  return (
    <Avatar
      size={size}
      className={cn(
        "bg-neutral-100 dark:bg-neutral-800 ring-1 ring-border/50",
        className,
      )}
    >
      {image ? <AvatarImage src={image} alt={displayName} /> : null}
      <AvatarFallback
        className={cn(
          "bg-neutral-200 font-semibold text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200",
          size === "sm" && "text-[10px]",
          size === "default" && "text-xs",
          size === "lg" && "text-sm",
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
