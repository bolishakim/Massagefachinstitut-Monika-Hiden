import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';
import { useAssistant } from '@/hooks/useAssistant';
import { MessageFile } from '@/types';
import { Button } from '../ui/Button';
import { RefreshCw, Trash2, AlertCircle, Bot } from 'lucide-react';
import { clsx } from 'clsx';

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    clearError,
    retryLastMessage,
    sessionId,
    settings,
  } = useAssistant();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string, files?: MessageFile[]) => {
    await sendMessage(content, files ? 'file' : 'text', files);
  };

  const handleSendVoice = async (audioBlob: Blob) => {
    // Determine file extension based on blob type
    const getAudioExtension = (mimeType: string): string => {
      const typeMap: { [key: string]: string } = {
        'audio/webm': 'webm',
        'audio/webm;codecs=opus': 'webm', 
        'audio/mp4': 'mp4',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'audio/flac': 'flac',
        'audio/m4a': 'm4a',
      };
      
      // Always use webm for webm audio to match your supported formats
      if (mimeType.startsWith('audio/webm')) {
        return 'webm';
      }
      
      return typeMap[mimeType] || 'webm'; // Default to webm if unknown
    };

    // Force webm extension and ensure proper MIME type
    const filename = 'voice_message.webm';
    const mimeType = audioBlob.type.startsWith('audio/webm') ? audioBlob.type : 'audio/webm';
    
    // Convert audio blob to file for processing
    const audioFile = new File([audioBlob], filename, {
      type: mimeType,
    });

    // Create MessageFile with metadata
    const messageFile: MessageFile = {
      data: audioFile,
      metadata: {
        name: 'Voice Message',
        size: audioFile.size,
        type: audioFile.type,
        lastModified: Date.now(),
        duration: 0, // Will be calculated by service
      },
    };

    await sendMessage('🎤 Voice message', 'voice', [messageFile]);
  };

  const handleRetry = () => {
    if (error) {
      clearError();
      retryLastMessage();
    }
  };

  // Configuration warning
  if (!settings.webhookUrl) {
    return (
      <div className={clsx('flex items-center justify-center h-full', className)}>
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Configuration Required</h3>
          <p className="text-muted-foreground mb-4">
            AI Assistant requires n8n webhook configuration. Please set the VITE_N8N_WEBHOOK_URL environment variable.
          </p>
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md text-left">
            <code>VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/assistant</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('relative h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              Session: {sessionId.split('_').pop()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Chat
            </Button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="h-full overflow-y-auto scroll-smooth pb-32"
        style={{ paddingBottom: '8rem' }}
      >
        <div className="max-w-4xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
              >
                <MessageBubble
                  message={message}
                  onRetry={message.status === 'error' ? handleRetry : undefined}
                  isLatest={index === messages.length - 1}
                />
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Global Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl px-4"
          >
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="text-destructive hover:text-destructive"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="text-destructive hover:text-destructive p-1"
                >
                  ×
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Centered Message Input at Bottom */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-4xl">
        <MessageInput
          onSendMessage={handleSendMessage}
          onSendVoice={handleSendVoice}
          disabled={isLoading}
          placeholder={
            settings.fileUploadEnabled && settings.voiceEnabled
              ? "Type a message, upload files, or record voice..."
              : settings.fileUploadEnabled
              ? "Type a message or upload files..."
              : settings.voiceEnabled
              ? "Type a message or record voice..."
              : "Type a message..."
          }
        />
      </div>
    </div>
  );
}