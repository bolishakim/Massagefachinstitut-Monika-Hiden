import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ChatMessage, 
  MessageFile, 
  UserContext, 
  MessageType,
  AssistantSettings
} from '@/types';
import { assistantService } from '@/services/assistant';
import { useAuth } from './useAuth';

interface UseAssistantReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
  settings: AssistantSettings;
  sendMessage: (content: string, type?: MessageType, files?: MessageFile[]) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  retryLastMessage: () => Promise<void>;
}

export function useAssistant(): UseAssistantReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(assistantService.generateSessionId());
  const lastMessageRef = useRef<{
    content: string;
    type: MessageType;
    files?: MessageFile[];
  } | null>(null);

  const settings = assistantService.getSettings();

  const generateUserContext = useCallback((): UserContext => {
    return {
      userId: user?.id || 'anonymous',
      userName: user ? `${user.firstName} ${user.lastName}` : 'Anonymous User',
      userEmail: user?.email || '',
      userRole: user?.role || 'USER',
      sessionId: sessionIdRef.current,
      timestamp: new Date().toISOString(),
    };
  }, [user]);

  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const sendMessage = useCallback(async (
    content: string, 
    type: MessageType = 'text', 
    files?: MessageFile[]
  ) => {
    if (!content.trim() && (!files || files.length === 0)) {
      return;
    }

    setError(null);
    setIsLoading(true);

    // Store for retry functionality
    lastMessageRef.current = { content, type, files };

    const userMessageId = generateMessageId();
    const userMessage: ChatMessage = {
      id: userMessageId,
      type,
      content,
      files,
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending',
      sessionId: sessionIdRef.current,
    };

    addMessage(userMessage);

    try {
      // Update user message status to sent
      updateMessage(userMessageId, { status: 'sent' });

      // Send to assistant service
      const response = await assistantService.sendMessage(
        content,
        type,
        files,
        generateUserContext()
      );

      if (response.success && response.data) {
        const assistantMessageId = generateMessageId();
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          type: 'text',
          content: response.data.message,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          status: 'sent',
          sessionId: sessionIdRef.current,
        };

        addMessage(assistantMessage);
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setError(error.message || 'Failed to send message');
      updateMessage(userMessageId, { status: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, updateMessage, generateMessageId, generateUserContext]);

  const retryLastMessage = useCallback(async () => {
    if (lastMessageRef.current) {
      const { content, type, files } = lastMessageRef.current;
      await sendMessage(content, type, files);
    }
  }, [sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = assistantService.generateSessionId();
    setError(null);
    lastMessageRef.current = null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Add welcome message on first load
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: generateMessageId(),
      type: 'system',
      content: `Hallo${user ? ` ${user.firstName}` : ''}! Ich bin Ihr KI-Assistent. Ich kann Ihnen bei Text-, Sprachnachrichten, Bildern und Dokumenten helfen. Wie kann ich Ihnen heute behilflich sein?`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      status: 'sent',
      sessionId: sessionIdRef.current,
    };
    setMessages([welcomeMessage]);
  }, []); // Empty dependency array - runs only once on mount

  return {
    messages,
    isLoading,
    error,
    sessionId: sessionIdRef.current,
    settings,
    sendMessage,
    clearMessages,
    clearError,
    retryLastMessage,
  };
}