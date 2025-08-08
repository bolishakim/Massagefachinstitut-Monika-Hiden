# AI Assistant Integration

This document describes the AI Assistant chatbot component that integrates with n8n workflows.

## Features

- **Full-page conversational UI** similar to Claude/ChatGPT
- **Multi-input support**: Text, voice recording, images, and PDF files
- **n8n webhook integration** for AI processing
- **Complete file metadata extraction**
- **User context integration** from auth system
- **Dark/light theme support**
- **Mobile-optimized** responsive design

## Setup

### 1. Environment Configuration

Copy the environment variables from `.env.example` and configure your n8n webhook:

```bash
# Required: Your n8n webhook URL
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/assistant

# Optional: File upload settings
VITE_MAX_FILE_SIZE=10485760  # 10MB
VITE_SUPPORTED_FILE_TYPES=.txt,.pdf,.jpg,.jpeg,.png,.mp3,.wav,.m4a

# Optional: Feature toggles
VITE_VOICE_ENABLED=true
VITE_FILE_UPLOAD_ENABLED=true
```

### 2. n8n Webhook Setup

Create an n8n workflow that accepts the following payload structure:

```typescript
{
  message: string;
  messageType: 'text' | 'voice' | 'file';
  files?: Array<{
    data: string; // base64 encoded file content
    metadata: {
      name: string;
      size: number;
      type: string;
      lastModified: number;
      checksum?: string;
      dimensions?: { width: number; height: number; };
      duration?: number;
      pageCount?: number;
    };
  }>;
  userContext: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    sessionId: string;
    timestamp: string;
  };
}
```

### 3. n8n Response Format

Your n8n workflow should return:

```typescript
{
  message: string;           // AI response text
  messageId?: string;        // Optional message ID
  suggestions?: string[];    // Optional quick reply suggestions
}
```

## Usage

### Access the Assistant

1. Navigate to `/assistant` or click "AI Assistant" in the sidebar
2. The assistant is available to all authenticated users
3. Each conversation gets a unique session ID

### Supported Input Types

- **Text**: Type messages with keyboard shortcuts (Shift+Enter for new line)
- **Voice**: Record voice messages with browser microphone
- **Files**: Upload images, PDFs, text files, and audio files via drag & drop or file picker
- **Mixed**: Combine text with file attachments

### File Support

The assistant automatically extracts metadata:

- **Images**: Dimensions, file size, format
- **PDFs**: Page count, file size
- **Audio**: Duration, file size, format
- **All files**: Checksum, MIME type, last modified

## Component Architecture

### Core Components

- `ChatInterface`: Main full-screen chat container
- `MessageBubble`: Individual message display
- `MessageInput`: Combined text/file/voice input
- `FileUploader`: Drag & drop file handling
- `VoiceRecorder`: Audio recording with visualization
- `TypingIndicator`: AI thinking animation

### Hooks

- `useAssistant`: Chat state management and API calls
- `useFileUpload`: File handling and validation
- `useVoiceRecording`: Audio recording logic

### Services

- `assistantService`: n8n webhook integration, file processing, metadata extraction

## Customization

### Theme Integration

The assistant automatically inherits your app's theme settings and supports:
- Light/dark mode switching
- Custom color schemes
- Responsive breakpoints

### User Context

The assistant automatically includes:
- Authenticated user information
- Session tracking
- Role-based context

### File Type Support

Modify supported file types in environment variables:

```bash
VITE_SUPPORTED_FILE_TYPES=.txt,.pdf,.jpg,.jpeg,.png,.mp3,.wav,.m4a,.doc,.docx
```

### Size Limits

Adjust maximum file size:

```bash
VITE_MAX_FILE_SIZE=20971520  # 20MB
```

## Troubleshooting

### Common Issues

1. **"Configuration Required" error**
   - Set `VITE_N8N_WEBHOOK_URL` in your environment

2. **File upload fails**
   - Check file size limits
   - Verify file type is supported
   - Check browser file API support

3. **Voice recording not working**
   - Ensure HTTPS (required for microphone access)
   - Check browser permissions
   - Verify microphone hardware

4. **AI responses not received**
   - Verify n8n webhook URL is accessible
   - Check network connectivity
   - Validate webhook response format

### Browser Compatibility

- **Voice recording**: Requires modern browsers with MediaRecorder API
- **File upload**: Works in all modern browsers
- **Drag & drop**: IE11+ support

### Performance Optimization

- Files are processed asynchronously
- Large files show upload progress
- Images are resized for preview
- Audio is compressed for transmission

## Security Considerations

- Files are base64 encoded for transmission
- User context includes only necessary information
- Session IDs are generated client-side
- No sensitive data is logged in browser console

## Future Enhancements

Potential improvements:

- Real-time message streaming
- Conversation history persistence
- Message search functionality
- Export chat conversations
- Quick action buttons
- Message reactions
- Conversation branching