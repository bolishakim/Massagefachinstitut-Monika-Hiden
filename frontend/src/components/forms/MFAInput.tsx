import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface MFAInputProps {
  onSubmit: (code: string) => void;
  loading?: boolean;
  error?: string | null;
  onBack?: () => void;
  showBackupOption?: boolean;
  onUseBackupCode?: () => void;
  isBackupMode?: boolean;
  title?: string;
}

export function MFAInput({
  onSubmit,
  loading = false,
  error,
  onBack,
  showBackupOption = true,
  onUseBackupCode,
  isBackupMode = false,
  title = "Zwei-Faktor-Authentifizierung"
}: MFAInputProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0] && !isBackupMode) {
      inputRefs.current[0].focus();
    }
  }, [isBackupMode]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasteValue = value.slice(0, 6);
      const newCode = [...code];
      
      for (let i = 0; i < pasteValue.length && i < 6; i++) {
        if (/\d/.test(pasteValue[i])) {
          newCode[i] = pasteValue[i];
        }
      }
      
      setCode(newCode);
      
      // Focus last filled input or next empty one
      const nextIndex = Math.min(pasteValue.length, 5);
      inputRefs.current[nextIndex]?.focus();
      
      return;
    }

    if (!/\d/.test(value) && value !== '') return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isBackupMode) {
      if (backupCode.length >= 6) {
        onSubmit(backupCode.toUpperCase());
      }
    } else {
      const fullCode = code.join('');
      if (fullCode.length === 6) {
        onSubmit(fullCode);
      }
    }
  };

  const isSubmitDisabled = isBackupMode 
    ? backupCode.length < 6 
    : code.some(digit => digit === '') || loading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground">
          {isBackupMode 
            ? "Geben Sie einen Ihrer Backup-Codes ein"
            : "Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein"
          }
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}

      <div className="space-y-6">
        {isBackupMode ? (
          // Backup code input
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Backup-Code:
            </label>
            <input
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              placeholder="ABCD1234"
              className="w-full px-4 py-3 text-center text-lg font-mono tracking-wider border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              maxLength={8}
              autoComplete="off"
            />
          </div>
        ) : (
          // TOTP code input
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bestätigungscode:
            </label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-mono border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  autoComplete="off"
                />
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Wird verifiziert...
            </div>
          ) : (
            'Verifizieren'
          )}
        </Button>

        <div className="flex flex-col gap-2 text-center">
          {showBackupOption && !isBackupMode && onUseBackupCode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUseBackupCode}
              className="text-muted-foreground hover:text-foreground"
            >
              Backup-Code verwenden
            </Button>
          )}
          
          {isBackupMode && onUseBackupCode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUseBackupCode}
              className="text-muted-foreground hover:text-foreground"
            >
              Zurück zum Authenticator-Code
            </Button>
          )}

          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              Zurück zur Anmeldung
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}