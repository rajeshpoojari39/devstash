import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DevStashLogo({
  className,
  showText = true,
  size = "md",
}: LogoProps) {
  const sizeClasses = {
    sm: "h-7 w-7 rounded-md p-1.5",
    md: "h-8 w-8 rounded-lg p-1.5",
    lg: "h-10 w-10 rounded-xl p-2",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20",
          sizeClasses[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={iconSizes[size]}
        >
          <polygon
            points="12 2 2 7 12 12 22 7 12 2"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <polyline points="2 12 12 17 22 12" />
          <polyline points="2 17 12 22 22 17" />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight text-foreground select-none",
            textClasses[size]
          )}
        >
          DevStash
        </span>
      )}
    </div>
  );
}
