import React, { useRef } from 'react';
import { Upload, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FilePreview } from './FilePreview';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  onFilesChange: (files: any[]) => void;
  disabled?: boolean;
  className?: string;
}

export function FileUploader({ onFilesChange, disabled, className }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
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
  } = useFileUpload();

  // Notify parent of file changes
  React.useEffect(() => {
    onFilesChange(files);
  }, [files, onFilesChange]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      await addFiles(selectedFiles);
    }
    // Reset input
    event.target.value = '';
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={clsx('space-y-3', className)}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".txt,.pdf,.jpg,.jpeg,.png,.mp3,.wav,.m4a"
        disabled={disabled}
      />

      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={disabled || isProcessing}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verarbeitung...
            </>
          ) : (
            <>
              <Paperclip className="h-4 w-4" />
              Dateien hinzufügen
            </>
          )}
        </Button>

        {files.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFiles}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground"
          >
            Alle löschen
          </Button>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/30',
          disabled && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-lg flex items-center justify-center"
            >
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-primary">
                  Dateien hier ablegen zum Hochladen
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">
              Dateien hier ablegen oder{' '}
              <button
                onClick={openFileDialog}
                className="text-primary hover:underline"
                disabled={disabled}
              >
                durchsuchen
              </button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Unterstützt: Bilder, PDFs, Textdateien, Audio (Max. 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-center justify-between"
          >
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="p-1 h-auto text-destructive hover:text-destructive"
            >
              ×
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Previews */}
      <FilePreview
        files={files}
        onRemove={removeFile}
      />
    </div>
  );
}