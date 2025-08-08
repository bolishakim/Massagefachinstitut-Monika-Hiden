import React from 'react';
import { ChatInterface } from '../components/assistant/ChatInterface';
import { H2, TextMD } from '../components/ui/Typography';

export function AssistantPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Page Header - Hidden on mobile to maximize chat space */}
      <div className="hidden md:block px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <H2>AI Assistant</H2>
          <TextMD className="text-muted-foreground mt-1">
            Chat with AI using text, voice, images, and documents. Your conversations are powered by advanced AI through n8n workflows.
          </TextMD>
        </div>
      </div>

      {/* Chat Interface - Takes full remaining height */}
      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
}