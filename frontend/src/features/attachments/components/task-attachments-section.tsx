'use client';

import { useEffect, useRef, useState } from 'react';
import { attachmentContentUrl } from '../api';
import {
  useAttachmentsQuery,
  useDeleteAttachmentMutation,
  useUploadAttachmentMutation,
} from '../hooks';
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_BYTES, type TaskAttachment } from '../types';

export function TaskAttachmentsSection({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: attachments = [], isLoading } = useAttachmentsQuery(workspaceId, taskId);
  const uploadMutation = useUploadAttachmentMutation(workspaceId, taskId);
  const deleteMutation = useDeleteAttachmentMutation(workspaceId, taskId);
  const [error, setError] = useState('');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    const loadThumbs = async () => {
      const images = attachments.filter((item) => item.isImage);
      const next: Record<string, string> = {};

      await Promise.all(
        images.map(async (attachment) => {
          try {
            const response = await fetch(attachmentContentUrl(workspaceId, taskId, attachment.id), {
              credentials: 'include',
            });
            if (!response.ok) return;
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            objectUrls.push(url);
            next[attachment.id] = url;
          } catch {
            // preview optional
          }
        }),
      );

      if (!cancelled) setThumbnails(next);
    };

    void loadThumbs();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments, taskId, workspaceId]);

  const openContent = (attachment: TaskAttachment) => {
    window.open(attachmentContentUrl(workspaceId, taskId, attachment.id), '_blank', 'noopener');
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    const file = files[0];
    if (file.size > ATTACHMENT_MAX_BYTES) {
      setError('Максимальный размер файла — 5 МБ');
      return;
    }
    try {
      await uploadMutation.mutateAsync(file);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить файл');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section className="task-subtasks task-attachments" aria-labelledby="task-attachments-title">
      <div className="task-subtasks__header">
        <h3 id="task-attachments-title">Вложения</h3>
        <span>{attachments.length}</span>
      </div>

      {isLoading ? <p role="status">Загрузка вложений...</p> : null}

      {attachments.length === 0 && !isLoading ? (
        <p className="task-tags__empty">Пока нет файлов</p>
      ) : (
        <ul className="task-attachments__list" role="list">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              {attachment.isImage && thumbnails[attachment.id] ? (
                <button
                  type="button"
                  className="task-attachments__thumb"
                  onClick={() => openContent(attachment)}
                  aria-label={`Открыть ${attachment.originalName}`}
                >
                  <img src={thumbnails[attachment.id]} alt="" />
                </button>
              ) : (
                <button
                  type="button"
                  className="task-attachments__file"
                  onClick={() => openContent(attachment)}
                >
                  <span aria-hidden="true">
                    {attachment.isImage ? 'IMG' : attachment.isPdf ? 'PDF' : 'TXT'}
                  </span>
                  <span>{attachment.originalName}</span>
                </button>
              )}
              <button
                type="button"
                aria-label={`Удалить ${attachment.originalName}`}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(attachment.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="task-subtasks__create">
        <input
          ref={inputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          className="sr-only"
          id={`task-attachment-upload-${taskId}`}
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <label htmlFor={`task-attachment-upload-${taskId}`} className="task-attachments__upload">
          {uploadMutation.isPending ? 'Загрузка…' : 'Загрузить файл'}
        </label>
      </div>

      {error || uploadMutation.error || deleteMutation.error ? (
        <p className="text-sm text-red-400" role="alert">
          {error ||
            uploadMutation.error?.message ||
            deleteMutation.error?.message ||
            'Ошибка вложений'}
        </p>
      ) : null}
      <p className="task-attachments__hint">Изображения, PDF или TXT до 5 МБ</p>
    </section>
  );
}
