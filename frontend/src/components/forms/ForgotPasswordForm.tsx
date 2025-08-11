import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { authService } from '@/services/auth';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

export function ForgotPasswordForm({ onSuccess, onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('E-Mail ist erforderlich');
      return;
    }

    if (!validateEmail(email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        setSent(true);
        onSuccess?.();
      } else {
        setError(response.error || 'Fehler beim Senden der Reset-E-Mail');
      }
    } catch (error: any) {
      setError(error.error || error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md glass">
        <CardHeader className="space-y-1 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4"
          >
            <Mail className="h-8 w-8 text-green-600" />
          </motion.div>
          <CardTitle>Überprüfen Sie Ihre E-Mails</CardTitle>
          <CardDescription>
            Wir haben einen Link zum Zurücksetzen des Passworts an {email} gesendet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              E-Mail nicht erhalten? Überprüfen Sie Ihren Spam-Ordner oder versuchen Sie es erneut.
            </p>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSent(false)}
            >
              Andere E-Mail-Adresse verwenden
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Zurück zur Anmeldung
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md glass">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center">Passwort vergessen?</CardTitle>
        <CardDescription className="text-center">
          Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen des Passworts
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
              value={email}
              onChange={handleChange}
              error={error}
              className="pl-10"
              autoComplete="email"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
            >
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Zurück zur Anmeldung
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}