import { useState, useCallback, useRef } from 'react';
import { MessageFile, FileMetadata } from '@/types';
import { assistantService } from '@/services/assistant';

interface UseFileUploadReturn {
  files: MessageFile[];
  isDragOver: boolean;
  isProcessing: boolean;
  error: string | null;
  addFiles: (fileList: FileList | File[]) => Promise<void>;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  clearError: () => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [files, setFiles] = useState<MessageFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList);
    
    if (newFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const processedFiles: MessageFile[] = [];

      for (const file of newFiles) {
        // Validate file
        const validation = assistantService.validateFile(file);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          continue;
        }

        // Extract metadata
        const metadata = await assistantService.extractFileMetadata(file);

        // Create preview if it's an image
        const preview = await assistantService.createFilePreview(file);

        processedFiles.push({
          data: file,
          metadata,
          preview: preview || undefined,
        });
      }

      if (processedFiles.length > 0) {
        setFiles(prev => [...prev, ...processedFiles]);
      }
    } catch (error: any) {
      console.error('Error processing files:', error);
      setError(error.message || 'Failed to process files');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      await addFiles(droppedFiles);
    }
  }, [addFiles]);

  return {
    files,
    isDragOver,
    isProcessing,
    error,
    addFiles,
    removeFile,
    clearFiles,
    clearError,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}