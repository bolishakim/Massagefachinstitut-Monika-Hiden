import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm as LoginFormType } from '@/types';
import { MFAInput } from './MFAInput';
import { apiService } from '@/services/api';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword }: LoginFormProps) {
  const { login, loading, refreshUser } = useAuth();
  const [formData, setFormData] = useState<LoginFormType>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormType>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [showBackupMode, setShowBackupMode] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormType> = {};

    if (!formData.email) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    }

    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    const result = await login(formData);

    if (result.success) {
      if (result.requiresMFA) {
        // MFA is required
        setMfaRequired(true);
        setTempToken(result.tempToken);
      } else {
        // Login successful without MFA
        onSuccess?.();
      }
    } else {
      setSubmitError(result.error || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  };

  const handleMFASubmit = async (mfaToken: string) => {
    try {
      setMfaLoading(true);
      setMfaError(null);

      const response = await apiService.post('/auth/login-mfa', {
        tempToken,
        mfaToken,
      });
      
      if (response.success) {
        // Store token and refresh user context
        localStorage.setItem('accessToken', response.data.accessToken);
        await refreshUser();
        onSuccess?.();
      } else {
        setMfaError(response.error || 'Ungültiger Verifikationscode');
      }
    } catch (err: any) {
      setMfaError(err.error || 'Netzwerkfehler aufgetreten');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMFABack = () => {
    setMfaRequired(false);
    setTempToken(null);
    setMfaError(null);
    setShowBackupMode(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormType]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  // Show MFA input if required
  if (mfaRequired) {
    return (
      <Card className="w-full max-w-md glass">
        <CardContent className="p-6">
          <MFAInput
            onSubmit={handleMFASubmit}
            loading={mfaLoading}
            error={mfaError}
            onBack={handleMFABack}
            showBackupOption={true}
            onUseBackupCode={() => setShowBackupMode(!showBackupMode)}
            isBackupMode={showBackupMode}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md glass">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center">Willkommen zurück</CardTitle>
        <CardDescription className="text-center">
          Melden Sie sich bei Ihrem Konto an, um fortzufahren
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-10 h-4 w-4 text-muted-foreground" />
            <Input
              label="E-Mail"
              name="email"
              type="email"
              placeholder="Geben Sie Ihre E-Mail-Adresse ein"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              className="pl-10"
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-10 h-4 w-4 text-muted-foreground" />
            <Input
              label="Passwort"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Geben Sie Ihr Passwort ein"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              className="pl-10 pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
            >
              {submitError}
            </motion.div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Anmelden...' : 'Anmelden'}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>

          <div className="space-y-4">
            <div className="text-center">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-primary hover:underline"
              >
                Passwort vergessen?
              </button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Noch kein Konto?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-primary hover:underline font-medium"
              >
                Registrieren
              </button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}