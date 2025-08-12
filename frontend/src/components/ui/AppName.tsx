import React, { useState } from 'react';
import { clsx } from 'clsx';

interface AppNameProps {
  className?: string;
  variant?: 'elegant' | 'script';
  showToggle?: boolean;
}

export function AppName({ className, variant = 'elegant', showToggle = false }: AppNameProps) {
  return (
    <div className="app-name-container">
      <img 
        src="/assets/logo.png" 
        alt="Massagefachinstitut - Monika Hiden, Heilmasseurin"
        className={clsx("h-auto max-w-full object-contain", className)}
        style={{ maxHeight: "161px", width: "auto" }}
        title="Massagefachinstitut - Monika Hiden, Heilmasseurin"
      />
    </div>
  );
}

// Alternative shorter name component
export function AppNameShort({ className }: { className?: string }) {
  return (
    <div className="app-name-container">
      <img 
        src="/assets/logo.png" 
        alt="Massagefachinstitut - Monika Hiden"
        className={clsx("h-auto max-w-full object-contain", className)}
        style={{ maxHeight: "107px", width: "auto" }}
        title="Massagefachinstitut - Monika Hiden, Heilmasseurin"
      />
    </div>
  );
}