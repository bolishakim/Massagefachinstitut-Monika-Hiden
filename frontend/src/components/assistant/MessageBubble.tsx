import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  User, 
  Bot, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  File, 
  Image, 
  Music, 
  FileText 
} from 'lucide-react';
import { ChatMessage } from '@/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';
import { assistantService } from '@/services/assistant';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
  isLatest?: boolean;
}

export function MessageBubble({ message, onRetry, isLatest }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isError = message.status === 'error';
  const isSending = message.status === 'sending';

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('audio/')) return Music;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  // Check if content contains markdown formatting
  const hasMarkdown = (text: string) => {
    if (!text || typeof text !== 'string') return false;
    
    // Look for common markdown patterns
    const markdownPatterns = [
      /\*\*.*?\*\*/,         // Bold: **text**
      /\*[^*\s].*?[^*\s]\*/, // Italic: *text* (not just asterisks)
      /_[^_\s].*?[^_\s]_/,   // Italic: _text_
      /`[^`]+`/,             // Inline code: `code`
      /```[\s\S]*?```/,      // Code blocks: ```code```
      /^#{1,6}\s/m,          // Headers: # Header
      /^\*\s/m,              // Unordered lists: * item
      /^-\s/m,               // Unordered lists: - item  
      /^\d+\.\s/m,           // Ordered lists: 1. item
      /\[.*?\]\(.*?\)/,      // Links: [text](url)
      /^>/m,                 // Blockquotes: > text
      /\n#{1,6}\s/,          // Headers with newlines
      /\n\*\s/,              // Lists with newlines
      /\n-\s/,               // Lists with newlines
      /\n>/,                 // Blockquotes with newlines
    ];
    
    const hasMarkdownSyntax = markdownPatterns.some(pattern => pattern.test(text));
    
    // Also check for the word "markdown" followed by markdown content
    const hasMarkdownKeyword = /markdown/i.test(text) && 
                               (text.includes('#') || text.includes('**') || text.includes('```'));
    
    console.log('Markdown detection:', {
      text: text.substring(0, 100) + '...',
      hasMarkdownSyntax,
      hasMarkdownKeyword,
      patterns: markdownPatterns.map(p => ({ pattern: p.toString(), match: p.test(text) }))
    });
    
    return hasMarkdownSyntax || hasMarkdownKeyword;
  };

  // Custom markdown components with Tailwind styling
  const markdownComponents = {
    // Paragraphs
    p: ({ children }: any) => (
      <p className="mb-3 last:mb-0">{children}</p>
    ),
    // Headers
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>
    ),
    // Emphasis
    strong: ({ children }: any) => (
      <strong className="font-bold text-foreground">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic">{children}</em>
    ),
    // Code
    code: ({ children, className }: any) => {
      const isInline = !className;
      return isInline ? (
        <code className={clsx(
          'px-1.5 py-0.5 rounded text-xs font-mono',
          isUser 
            ? 'bg-primary-foreground/20 text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        )}>
          {children}
        </code>
      ) : (
        <code className={clsx(
          'block p-3 rounded-md text-xs font-mono overflow-x-auto',
          isUser
            ? 'bg-primary-foreground/20 text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}>
          {children}
        </code>
      );
    },
    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="ml-2">{children}</li>
    ),
    // Links
    a: ({ children, href }: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className={clsx(
          'underline hover:no-underline transition-colors',
          isUser
            ? 'text-primary-foreground hover:text-primary-foreground/80'
            : 'text-primary hover:text-primary/80'
        )}
      >
        {children}
      </a>
    ),
    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className={clsx(
        'border-l-4 pl-4 py-2 mb-3 italic',
        isUser
          ? 'border-primary-foreground/30'
          : 'border-border'
      )}>
        {children}
      </blockquote>
    ),
  };

  // Preprocess markdown text to fix common formatting issues
  const preprocessMarkdown = (text: string): string => {
    if (!text) return text;
    
    let processed = text;
    
    // Fix common issues with AI-generated markdown
    
    // 1. Handle the word "markdown" at the beginning and code blocks
    if (processed.toLowerCase().startsWith('markdown')) {
      processed = processed.replace(/^markdown\s*/i, '');
    }
    
    // 2. Convert common patterns that should have newlines
    processed = processed
      // Add newlines before headers
      .replace(/(\S)\s*(#{1,6}\s)/g, '$1\n\n$2')
      // Add newlines before lists
      .replace(/(\S)\s*(\*\s|-\s|\d+\.\s)/g, '$1\n$2')
      // Add newlines before code blocks
      .replace(/(\S)\s*(```)/g, '$1\n\n$2')
      .replace(/(```\w*\s[\s\S]*?```)\s*(\S)/g, '$1\n\n$2')
      // Add newlines before blockquotes
      .replace(/(\S)\s*(>\s)/g, '$1\n$2')
      // Add newlines after headers
      .replace(/(#{1,6}\s[^\n]*)\s*(\S)/g, '$1\n\n$2')
      // Fix double newlines that might be too many
      .replace(/\n{3,}/g, '\n\n')
      // Ensure proper spacing around code blocks
      .replace(/```(\w+)?\s*([\s\S]*?)\s*```/g, '\n```$1\n$2\n```\n')
      // Clean up extra spaces
      .replace(/[ ]{2,}/g, ' ')
      .trim();
    
    console.log('Preprocessed markdown:', {
      original: text.substring(0, 100) + '...',
      processed: processed.substring(0, 100) + '...',
      hasNewlines: processed.includes('\n'),
      newlineCount: (processed.match(/\n/g) || []).length
    });
    
    return processed;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'flex w-full gap-3 px-4 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className={clsx(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary text-secondary-foreground'
      )}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={clsx(
        'flex-1 max-w-3xl',
        isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
      )}>
        {/* Message Bubble */}
        <div className={clsx(
          'rounded-lg px-4 py-3 break-words',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
          isError && 'border border-destructive'
        )}>
          {/* System message styling */}
          {message.type === 'system' && (
            <div className="text-center text-sm opacity-75 italic">
              {message.content}
            </div>
          )}

          {/* Regular message content */}
          {message.type !== 'system' && (
            <>
              {message.content && (
                <div className="text-sm leading-relaxed">
                  {(() => {
                    const shouldRenderMarkdown = hasMarkdown(message.content);
                    const processedContent = preprocessMarkdown(message.content);
                    
                    // Force markdown rendering if content looks like it should be markdown
                    const forceMarkdown = !shouldRenderMarkdown && 
                                        (processedContent.includes('```') || 
                                         processedContent.includes('# ') ||
                                         processedContent.includes('**'));
                    
                    if (shouldRenderMarkdown || forceMarkdown) {
                      console.log('Rendering as markdown:', { shouldRenderMarkdown, forceMarkdown });
                      return (
                        <div className="markdown-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {processedContent}
                          </ReactMarkdown>
                        </div>
                      );
                    } else {
                      console.log('Rendering as plain text');
                      return <div className="whitespace-pre-wrap">{message.content}</div>;
                    }
                  })()}
                </div>
              )}

              {/* Files */}
              {message.files && message.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.files.map((file, index) => {
                    const FileIcon = getFileIcon(file.metadata.type);
                    
                    return (
                      <div key={index} className={clsx(
                        'flex items-center gap-2 p-2 rounded border',
                        isUser 
                          ? 'bg-primary-foreground/10 border-primary-foreground/20'
                          : 'bg-background border-border'
                      )}>
                        {/* File preview or icon */}
                        {file.preview ? (
                          <img 
                            src={file.preview} 
                            alt={file.metadata.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className={clsx(
                            'w-12 h-12 rounded flex items-center justify-center',
                            isUser
                              ? 'bg-primary-foreground/20'
                              : 'bg-muted'
                          )}>
                            <FileIcon className="h-6 w-6" />
                          </div>
                        )}

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.metadata.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs opacity-75">
                            <span>{assistantService.formatFileSize(file.metadata.size)}</span>
                            {file.metadata.dimensions && (
                              <span>
                                {file.metadata.dimensions.width}×{file.metadata.dimensions.height}
                              </span>
                            )}
                            {file.metadata.duration && (
                              <span>
                                {Math.floor(file.metadata.duration / 60)}:
                                {Math.floor(file.metadata.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                            {file.metadata.pageCount && (
                              <span>{file.metadata.pageCount} pages</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Message status and actions */}
        {message.type !== 'system' && (
          <div className={clsx(
            'flex items-center gap-2 mt-1 text-xs text-muted-foreground',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}>
            {/* Timestamp */}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimestamp(message.timestamp)}
            </span>

            {/* Status indicators */}
            {isSending && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                Sending
              </Badge>
            )}

            {isError && (
              <>
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
                {onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    className="h-6 px-2 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}