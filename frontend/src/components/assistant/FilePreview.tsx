import React from 'react';
import { X, File, Image, Music, FileText } from 'lucide-react';
import { MessageFile } from '@/types';
import { Button } from '../ui/Button';
import { assistantService } from '@/services/assistant';
import { clsx } from 'clsx';

interface FilePreviewProps {
  files: MessageFile[];
  onRemove: (index: number) => void;
  className?: string;
}

export function FilePreview({ files, onRemove, className }: FilePreviewProps) {
  if (files.length === 0) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('audio/')) return Music;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="text-sm font-medium text-muted-foreground">
        Attachments ({files.length})
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {files.map((file, index) => {
          const FileIcon = getFileIcon(file.metadata.type);
          
          return (
            <div
              key={index}
              className="relative group flex items-center gap-3 p-3 border border-border rounded-lg bg-background hover:bg-accent transition-colors"
            >
              {/* Remove button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Remove file"
              >
                <X className="h-3 w-3" />
              </Button>

              {/* File preview or icon */}
              {file.preview ? (
                <img 
                  src={file.preview} 
                  alt={file.metadata.name}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={file.metadata.name}>
                  {file.metadata.name}
                </p>
                
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <span>{assistantService.formatFileSize(file.metadata.size)}</span>
                  
                  {/* Additional metadata */}
                  {file.metadata.dimensions && (
                    <span className="text-xs">
                      {file.metadata.dimensions.width}×{file.metadata.dimensions.height}
                    </span>
                  )}
                  
                  {file.metadata.duration && (
                    <span className="text-xs">
                      {Math.floor(file.metadata.duration / 60)}:
                      {Math.floor(file.metadata.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  
                  {file.metadata.pageCount && (
                    <span className="text-xs">{file.metadata.pageCount} pages</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}