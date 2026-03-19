"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { taskService } from "@/services/task.service";
import {
  TaskAttachment,
  taskAttachmentService,
} from "@/services/task-attachment.service";

interface TaskAttachmentsSectionProps {
  workspaceId: string;
  projectId: string;
  taskId: string;
  initialAttachments?: TaskAttachment[];
  onRefresh?: () => Promise<void> | void;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "Unknown size";
  const sizes = ["B", "KB", "MB", "GB"];
  let i = 0;
  let value = bytes;

  while (value >= 1024 && i < sizes.length - 1) {
    value /= 1024;
    i++;
  }

  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function getAttachmentName(attachment: TaskAttachment) {
  return attachment.fileName || attachment.originalname || "Untitled file";
}

function getAttachmentType(attachment: TaskAttachment) {
  return attachment.fileType || attachment.mimetype || "";
}

function getFileIcon(fileType?: string, fileName?: string) {
  const lowerType = fileType?.toLowerCase() || "";
  const lowerName = fileName?.toLowerCase() || "";

  if (lowerType.startsWith("image/")) {
    return <FileImage className="h-5 w-5 text-cyan-400" />;
  }

  if (
    lowerType.includes("pdf") ||
    lowerType.includes("document") ||
    lowerName.endsWith(".pdf") ||
    lowerName.endsWith(".doc") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".txt")
  ) {
    return <FileText className="h-5 w-5 text-cyan-400" />;
  }

  return <File className="h-5 w-5 text-cyan-400" />;
}

function isPreviewable(fileType?: string, fileName?: string) {
  const lowerType = fileType?.toLowerCase() || "";
  const lowerName = fileName?.toLowerCase() || "";

  return (
    lowerType.startsWith("image/") ||
    lowerType.includes("pdf") ||
    lowerName.endsWith(".pdf")
  );
}

export default function TaskAttachmentsSection({
  workspaceId,
  projectId,
  taskId,
  initialAttachments = [],
  onRefresh,
}: TaskAttachmentsSectionProps) {
  const [attachments, setAttachments] =
    useState<TaskAttachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  const sortedAttachments = useMemo(() => {
    return [...attachments].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [attachments]);

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("attachments", file);

      await taskService.updateTask(workspaceId, projectId, taskId, formData);

      toast.success("Attachment uploaded successfully");

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to upload attachment",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      setDeletingId(attachmentId);

      await taskAttachmentService.deleteAttachment(
        workspaceId,
        projectId,
        taskId,
        attachmentId,
      );

      toast.success("Attachment deleted");

      if (onRefresh) {
        await onRefresh();
      } else {
        setAttachments((prev) =>
          prev.filter((item) => item._id !== attachmentId),
        );
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete attachment",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Paperclip className="h-5 w-5 text-cyan-400" />
            Attachments
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            Upload files related to this task.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />

          <button
            type="button"
            onClick={handleFilePick}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload File
              </>
            )}
          </button>
        </div>
      </div>

      {sortedAttachments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-10 text-center">
          <p className="text-sm text-zinc-400">
            No attachments yet. Upload the first file for this task.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAttachments.map((attachment) => (
            <div
              key={attachment._id}
              className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-xl bg-zinc-900 p-3">
                  {getFileIcon(
                    getAttachmentType(attachment),
                    getAttachmentName(attachment),
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {getAttachmentName(attachment)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span>{formatFileSize(attachment.size)}</span>
                    {getAttachmentType(attachment) && (
                      <span>• {getAttachmentType(attachment)}</span>
                    )}
                    {attachment.uploadedBy?.fullName && (
                      <span>• by {attachment.uploadedBy.fullName}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPreviewable(
                  getAttachmentType(attachment),
                  getAttachmentName(attachment),
                ) && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:border-cyan-500 hover:text-cyan-400"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </a>
                )}

                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:border-cyan-500 hover:text-cyan-400"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>

                <button
                  type="button"
                  onClick={() => handleDelete(attachment._id)}
                  disabled={deletingId === attachment._id}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === attachment._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
