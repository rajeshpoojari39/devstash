"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { formatFileSize } from "@/lib/item-utils";
import { FILE_CONSTRAINTS, validateFile, FileCategory } from "@/lib/storage/r2";

export interface UploadedFileData {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export interface FileUploadProps {
  category: FileCategory;
  value?: UploadedFileData | null;
  onChange: (data: UploadedFileData | null) => void;
  disabled?: boolean;
}

export function FileUpload({
  category,
  value,
  onChange,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = FILE_CONSTRAINTS[category];

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        await processFile(file);
      }
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        await processFile(file);
      }
    }
    // Reset file input value so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // 1. Client-side validation
    const validation = validateFile(
      {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      category,
    );

    if (!validation.valid) {
      setErrorMessage(validation.error || "Invalid file selection.");
      return;
    }

    // 2. Upload to /api/upload
    setIsUploading(true);
    setUploadProgress(15);

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return 85;
          }
          return prev + 15;
        });
      }, 150);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", category);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload file.");
      }

      onChange({
        fileUrl: result.data.fileUrl,
        fileName: result.data.fileName,
        fileSize: result.data.fileSize,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setErrorMessage(null);
  };

  const allowedExtsList = config.extensions.join(", ");
  const isImage = category === "image";

  return (
    <div className="w-full space-y-2">
      {/* Uploaded File Preview Card */}
      {value?.fileUrl ? (
        <div className="relative flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-border/80 bg-card/90 p-3.5 sm:p-4">
          {isImage ? (
            <div className="relative w-36 sm:w-44 aspect-video shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/20 [isolation:isolate] [transform:translateZ(0)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value.fileUrl}
                alt={value.fileName || "Uploaded image"}
                className="h-full w-full object-cover transform-gpu will-change-transform [backface-visibility:hidden] [transform:translateZ(0)]"
                decoding="async"
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/50 text-foreground">
              <FileText className="h-7 w-7 text-primary" />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="truncate text-sm font-medium text-foreground">
                {value.fileName || "Uploaded file"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(value.fileSize)} • Storage Ready
            </p>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="shrink-0 rounded-lg border border-border/80 bg-muted/60 p-2 text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
            title="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Empty Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10 scale-[1.005]"
              : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700 hover:bg-neutral-900/50"
          } ${disabled || isUploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={isImage ? "image/*" : config.extensions.join(",")}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3 py-3 w-full max-w-xs">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <div className="w-full space-y-1.5">
                <div className="flex justify-between text-xs text-neutral-400 font-mono">
                  <span>Uploading to R2...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-800/50 text-neutral-400">
                {isImage ? (
                  <ImageIcon className="h-6 w-6 text-indigo-400" />
                ) : (
                  <UploadCloud className="h-6 w-6 text-indigo-400" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-neutral-200">
                  <span className="text-indigo-400 underline underline-offset-2">
                    Click to browse
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-neutral-500">
                  Max size: {config.maxSizeLabel} ({allowedExtsList})
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

