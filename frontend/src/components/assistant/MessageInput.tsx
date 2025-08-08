import React, { useState, useRef, useCallback } from 'react';
import { Send, Mic, Paperclip, X, Smile } from 'lucide-react';
import { Button } from '../ui/Button';
import { FileUploader } from './FileUploader';
import { VoiceRecorder } from './VoiceRecorder';
import { MessageFile } from '@/types';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
  onSendMessage: (content: string, files?: MessageFile[]) => void;
  onSendVoice: (audioBlob: Blob) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

type InputMode = 'text' | 'voice' | 'file';

export function MessageInput({ 
  onSendMessage, 
  onSendVoice,
  disabled = false,
  placeholder = "Type your message...",
  className 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<InputMode>('text');
  const [files, setFiles] = useState<MessageFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = (mode === 'text' && (message.trim() || files.length > 0)) || 
                  (mode === 'file' && files.length > 0);

  const handleSend = useCallback(() => {
    if (!canSend || disabled) return;

    if (mode === 'text' || mode === 'file') {
      onSendMessage(message.trim(), files.length > 0 ? files : undefined);
      setMessage('');
      setFiles([]);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Return to text mode after sending files
      if (mode === 'file') {
        setMode('text');
      }
    }
  }, [message, files, mode, canSend, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleVoiceSend = useCallback((audioBlob: Blob) => {
    onSendVoice(audioBlob);
    setMode('text');
  }, [onSendVoice]);

  const handleModeChange = (newMode: InputMode) => {
    if (disabled) return;
    setMode(newMode);
  };

  const handleFilesChange = useCallback((newFiles: MessageFile[]) => {
    setFiles(newFiles);
  }, []);

  return (
    <div className={clsx('bg-background border-t border-border', className)}>
      <div className="max-w-4xl mx-auto p-4">
        {/* Input Area - File/Voice appears ABOVE the input */}
        <div className="space-y-3">
          {/* File Upload Area - appears above input */}
          <AnimatePresence mode="wait">
            {mode === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-muted/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Voice Message</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode('text')}
                    className="p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <VoiceRecorder onSend={handleVoiceSend} disabled={disabled} />
              </motion.div>
            )}

            {mode === 'file' && (
              <motion.div
                key="file"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-muted/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">File Upload</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode('text')}
                    className="p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <FileUploader onFilesChange={handleFilesChange} disabled={disabled} />
                
                {files.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a caption (optional)..."
                        className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        disabled={disabled}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!canSend || disabled}
                        className="px-4"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={mode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('text')}
                disabled={disabled}
                className="text-xs"
              >
                Text
              </Button>
              <Button
                variant={mode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('voice')}
                disabled={disabled}
                className="text-xs"
              >
                <Mic className="h-3 w-3 mr-1" />
                Voice
              </Button>
              <Button
                variant={mode === 'file' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('file')}
                disabled={disabled}
                className="text-xs"
              >
                <Paperclip className="h-3 w-3 mr-1" />
                Files
              </Button>
            </div>
          </div>
        </div>

        {/* Text Input Area - always at bottom */}
        <AnimatePresence mode="wait">
          {mode === 'text' && (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* File Uploads (if any) */}
              {files.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <FileUploader onFilesChange={handleFilesChange} disabled={disabled} />
                </div>
              )}

              {/* Text Input */}
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full min-h-[44px] max-h-[120px] px-4 py-3 pr-12 text-sm bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
                    rows={1}
                  />
                  
                  {/* Quick Actions */}
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode('file')}
                      disabled={disabled}
                      className="p-1.5 h-auto"
                      aria-label="Add files"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={!canSend || disabled}
                  className="h-11 px-4"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Tips */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Press Shift+Enter for new line • Drag & drop files anywhere
        </div>
      </div>
    </div>
  );
}