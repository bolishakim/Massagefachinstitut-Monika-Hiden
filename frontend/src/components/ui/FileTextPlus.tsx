import React from 'react';
import { FileText, Plus } from 'lucide-react';

interface FileTextPlusProps {
  className?: string;
}

export function FileTextPlus({ className = "h-4 w-4" }: FileTextPlusProps) {
  return (
    <div className={`relative inline-flex ${className}`}>
      <FileText className="w-full h-full" />
      <Plus className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary text-primary-foreground rounded-full p-0.5" />
    </div>
  );
}