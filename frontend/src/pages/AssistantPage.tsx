import React from 'react';
import { ChatInterface } from '../components/assistant/ChatInterface';
import { H2, TextMD } from '../components/ui/Typography';

export function AssistantPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Page Header - Hidden on mobile to maximize chat space */}
      <div className="hidden md:block px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <H2>KI-Assistent</H2>
          <TextMD className="text-muted-foreground mt-1">
            Chatten Sie mit der KI über Text, Sprache, Bilder und Dokumente. Ihre Gespräche werden von fortschrittlicher KI über n8n-Workflows betrieben.
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