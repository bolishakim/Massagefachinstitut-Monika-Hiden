import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PrivacyPolicy } from '@/components/gdpr/PrivacyPolicy';

export default function PrivacyPolicyPage() {
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              onClick={goBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
            <h1 className="text-xl font-semibold">Datenschutzerklärung</h1>
          </div>
        </div>
        
        <div className="p-4">
          <PrivacyPolicy />
        </div>
      </div>
    </div>
  );
}