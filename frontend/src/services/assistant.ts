import { 
  AssistantWebhookPayload, 
  AssistantResponse, 
  FileMetadata, 
  MessageFile, 
  UserContext,
  AssistantSettings
} from '@/types';
import { apiService } from './api';

class AssistantService {
  private settings: AssistantSettings;

  constructor() {
    this.settings = {
      webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || '',
      maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
      supportedFileTypes: (import.meta.env.VITE_SUPPORTED_FILE_TYPES || '.txt,.pdf,.jpg,.jpeg,.png,.mp3,.wav,.m4a').split(','),
      voiceEnabled: import.meta.env.VITE_VOICE_ENABLED !== 'false',
      fileUploadEnabled: import.meta.env.VITE_FILE_UPLOAD_ENABLED !== 'false',
    };

    if (!this.settings.webhookUrl) {
      console.warn('VITE_N8N_WEBHOOK_URL not configured. Assistant will not function properly.');
    }
  }

  getSettings(): AssistantSettings {
    return { ...this.settings };
  }

  async sendMessage(
    message: string,
    messageType: 'text' | 'voice' | 'file',
    files?: MessageFile[],
    userContext?: UserContext
  ): Promise<AssistantResponse> {
    try {
      if (!this.settings.webhookUrl) {
        throw new Error('Webhook URL not configured');
      }

      console.log('Sending to n8n webhook:', {
        url: this.settings.webhookUrl,
        messageType,
        fileCount: files?.length || 0
      });

      // Use FormData for file uploads, JSON for text messages
      if (files && files.length > 0) {
        return this.sendMessageWithFiles(message, messageType, files, userContext);
      } else {
        return this.sendTextMessage(message, messageType, userContext);
      }
    } catch (error: any) {
      console.error('Assistant service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send message to assistant',
      };
    }
  }

  private async sendTextMessage(
    message: string,
    messageType: 'text' | 'voice' | 'file',
    userContext?: UserContext
  ): Promise<AssistantResponse> {
    const formData = new FormData();
    const userContextObj = userContext || this.generateDefaultUserContext();
    
    // Add basic message data
    formData.append('message', message);
    formData.append('messageType', messageType);
    
    // Add user context as separate fields
    formData.append('userId', userContextObj.userId || '');
    formData.append('userName', userContextObj.userName || '');
    formData.append('userEmail', userContextObj.userEmail || '');
    formData.append('userRole', userContextObj.userRole || '');
    formData.append('sessionId', userContextObj.sessionId || '');
    formData.append('timestamp', userContextObj.timestamp || '');

    const response = await fetch(this.settings.webhookUrl, {
      method: 'POST',
      // Don't set Content-Type header - let browser set it with boundary for multipart
      body: formData,
    });

    return this.processResponse(response);
  }

  private async sendMessageWithFiles(
    message: string,
    messageType: 'text' | 'voice' | 'file',
    files: MessageFile[],
    userContext?: UserContext
  ): Promise<AssistantResponse> {
    const formData = new FormData();
    const userContextObj = userContext || this.generateDefaultUserContext();
    
    // Add basic message data
    formData.append('message', message);
    formData.append('messageType', messageType);
    
    // Add user context as separate fields
    formData.append('userId', userContextObj.userId || '');
    formData.append('userName', userContextObj.userName || '');
    formData.append('userEmail', userContextObj.userEmail || '');
    formData.append('userRole', userContextObj.userRole || '');
    formData.append('sessionId', userContextObj.sessionId || '');
    formData.append('timestamp', userContextObj.timestamp || '');

    // Add file metadata as separate fields
    if (files.length > 0) {
      const fileMetadata = files[0].metadata;
      formData.append('fileName', fileMetadata.name || '');
      formData.append('fileSize', fileMetadata.size?.toString() || '0');
      formData.append('fileType', fileMetadata.type || '');
      formData.append('lastModified', fileMetadata.lastModified?.toString() || '');
      
      if (fileMetadata.duration) {
        formData.append('fileDuration', fileMetadata.duration.toString());
      }
      if (fileMetadata.checksum) {
        formData.append('fileChecksum', fileMetadata.checksum);
      }
      if (fileMetadata.dimensions) {
        formData.append('fileWidth', fileMetadata.dimensions.width?.toString() || '');
        formData.append('fileHeight', fileMetadata.dimensions.height?.toString() || '');
      }
    }

    // Add files as binary data
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      formData.append('data', file.data, file.metadata.name);
    }

    const response = await fetch(this.settings.webhookUrl, {
      method: 'POST',
      // Don't set Content-Type header - let browser set it with boundary for multipart
      body: formData,
    });

    return this.processResponse(response);
  }

  private async processResponse(response: Response): Promise<AssistantResponse> {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    let data: any = {};

    console.log('Response content-type:', contentType);

    // n8n sometimes returns HTML instead of JSON, handle both cases
    const responseText = await response.text();
    console.log('Raw response text (length: ' + responseText.length + '):', responseText.substring(0, 200) + '...');

    if (contentType && contentType.includes('application/json')) {
      // Handle JSON responses
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
          console.log('Parsed JSON data:', data);
        } catch (parseError) {
          console.warn('Failed to parse JSON response:', responseText, parseError);
          data = { message: responseText };
        }
      } else {
        console.warn('Empty JSON response from n8n webhook');
        data = { message: 'Request processed successfully (no response content)' };
      }
    } else if (contentType && contentType.includes('text/html')) {
      // Handle HTML responses (common issue with n8n)
      console.warn('⚠️ n8n returned HTML instead of JSON - this may indicate a workflow configuration issue');
      
      // Try to extract meaningful content from HTML response
      if (responseText.trim()) {
        // Look for iframe content or just use the HTML as-is
        data = { message: responseText };
      } else {
        data = { message: 'HTML response received but was empty' };
      }
    } else {
      // Handle other response types (plain text, etc.)
      console.log('Non-standard response type:', contentType);
      data = { message: responseText || 'Request processed successfully' };
    }

    console.log('n8n webhook response:', { 
      status: response.status, 
      contentType, 
      data: data 
    });

    // Handle different n8n response formats
    let responseMessage = '';
    let messageId = '';
    let suggestions = [];

    // Check for common n8n response structures
    if (typeof data === 'string') {
      responseMessage = data;
    } else if (data && typeof data === 'object') {
      // Check for direct message fields
      responseMessage = data.message || data.response || data.output || data.result;
      
      // Check for nested data (common in n8n)
      if (!responseMessage && data.data) {
        responseMessage = data.data.message || data.data.response || data.data.output;
      }
      
      // Check for array response (n8n sometimes returns arrays)
      if (!responseMessage && Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        responseMessage = firstItem.message || firstItem.response || firstItem.output || firstItem.result;
      }
      
      // Check for body field (common in HTTP nodes)
      if (!responseMessage && data.body) {
        if (typeof data.body === 'string') {
          responseMessage = data.body;
        } else {
          responseMessage = data.body.message || data.body.response || data.body.output;
        }
      }

      // Handle n8n webhook test response format (where message is the key)
      if (!responseMessage) {
        const keys = Object.keys(data);
        if (keys.length > 0) {
          // Check if this looks like a webhook test response
          const firstKey = keys[0];
          const firstValue = data[firstKey];
          
          if (firstValue && typeof firstValue === 'object' && firstValue.body) {
            // This is likely n8n webhook test data - extract original message
            const originalMessage = firstValue.body?.message;
            if (originalMessage) {
              responseMessage = `Echo: ${originalMessage}`;
              console.log('Detected n8n webhook test format, echoing message');
            }
          } else if (typeof firstValue === 'string') {
            responseMessage = firstValue;
          }
        }
      }

      messageId = data.messageId || data.id || '';
      suggestions = data.suggestions || data.options || [];
    }

    // If still no message, provide a fallback
    if (!responseMessage) {
      responseMessage = 'Message received and processed successfully';
      console.log('No message content found in response, using fallback. Full data:', data);
    }

    // Clean and sanitize the response message
    responseMessage = this.sanitizeResponse(responseMessage);

    return {
      success: true,
      data: {
        message: responseMessage,
        messageId: messageId,
        suggestions: Array.isArray(suggestions) ? suggestions : [],
      },
    };
  }

  async extractFileMetadata(file: File): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };

    // Generate checksum
    try {
      metadata.checksum = await this.generateFileChecksum(file);
    } catch (error) {
      console.warn('Failed to generate file checksum:', error);
    }

    // Extract dimensions for images
    if (file.type.startsWith('image/')) {
      try {
        metadata.dimensions = await this.getImageDimensions(file);
      } catch (error) {
        console.warn('Failed to extract image dimensions:', error);
      }
    }

    // Extract duration for audio files
    if (file.type.startsWith('audio/')) {
      try {
        metadata.duration = await this.getAudioDuration(file);
      } catch (error) {
        console.warn('Failed to extract audio duration:', error);
      }
    }

    // Extract page count for PDFs
    if (file.type === 'application/pdf') {
      try {
        metadata.pageCount = await this.getPDFPageCount(file);
      } catch (error) {
        console.warn('Failed to extract PDF page count:', error);
      }
    }

    return metadata;
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.settings.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds limit of ${this.formatFileSize(this.settings.maxFileSize)}`,
      };
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.settings.supportedFileTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type not supported. Allowed types: ${this.settings.supportedFileTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  private async generateFileChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  private getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio'));
      };
      
      audio.src = url;
    });
  }

  private async getPDFPageCount(file: File): Promise<number> {
    try {
      // Simple PDF page count estimation by counting page objects
      const text = await file.text();
      const pageMatches = text.match(/\/Type\s*\/Page\s/g);
      return pageMatches ? pageMatches.length : 1;
    } catch (error) {
      console.warn('Failed to count PDF pages:', error);
      return 1;
    }
  }

  private generateDefaultUserContext(): UserContext {
    return {
      userId: 'anonymous',
      userName: 'Anonymous User',
      userEmail: '',
      userRole: 'user',
      sessionId: this.generateSessionId(),
      timestamp: new Date().toISOString(),
    };
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeResponse(message: string): string {
    if (!message || typeof message !== 'string') {
      return 'Invalid response format';
    }

    // Check if the response contains HTML/iframe content
    const htmlPattern = /<[^>]*>/g;
    const markdownPattern = /(\*\*.*?\*\*|\*.*?\*|`.*?`|^#{1,6}\s|^\*\s|^\d+\.\s)/gm;

    // Log content types detected
    if (htmlPattern.test(message)) {
      console.warn('Detected HTML content in AI response, sanitizing...');
      console.log('Original response:', message);
    } else if (markdownPattern.test(message)) {
      console.log('✨ Detected Markdown formatting in AI response - will render with formatting');
    }

    let cleanMessage = message;

    // Extract text from iframe srcdoc attribute if present
    const iframeMatch = cleanMessage.match(/srcdoc="([^"]*)"/);
    if (iframeMatch && iframeMatch[1]) {
      console.log('Extracting text from iframe srcdoc');
      cleanMessage = iframeMatch[1];
      
      // Decode HTML entities in the extracted content
      cleanMessage = cleanMessage
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&'); // This should be last
    }

    // Remove all HTML tags
    cleanMessage = cleanMessage.replace(htmlPattern, '');

    // Decode HTML entities
    cleanMessage = cleanMessage
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ');

    // Clean up extra whitespace
    cleanMessage = cleanMessage
      .replace(/\s+/g, ' ')
      .trim();

    // If the message is empty after sanitization, provide a fallback
    if (!cleanMessage) {
      cleanMessage = 'AI response received but content could not be processed properly.';
    }

    console.log('Sanitized response:', cleanMessage);
    return cleanMessage;
  }

  createFilePreview(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    });
  }
}

export const assistantService = new AssistantService();
export default assistantService;