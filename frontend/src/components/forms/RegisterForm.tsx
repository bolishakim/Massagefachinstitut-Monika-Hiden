import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { RegisterForm as RegisterFormType } from '@/types';

interface RegisterFormProps {
  onSuccess?: (emailVerificationToken?: string) => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState<RegisterFormType>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormType>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<string[]>([]);

  const validatePassword = (password: string): string[] => {
    const requirements = [];
    if (password.length >= 8) requirements.push('Mindestens 8 Zeichen');
    if (/[a-z]/.test(password)) requirements.push('Kleinbuchstabe');
    if (/[A-Z]/.test(password)) requirements.push('Großbuchstabe');
    if (/\d/.test(password)) requirements.push('Zahl');
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) requirements.push('Sonderzeichen');
    return requirements;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormType> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vorname ist erforderlich';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nachname ist erforderlich';
    }

    if (!formData.email) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    }

    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else {
      const strength = validatePassword(formData.password);
      if (strength.length < 5) {
        newErrors.password = 'Passwort erfüllt nicht alle Anforderungen';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    const result = await register(formData);

    if (result.success) {
      onSuccess?.(result.emailVerificationToken);
    } else {
      setSubmitError(result.error || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update password strength indicator
    if (name === 'password') {
      setPasswordStrength(validatePassword(value));
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormType]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  return (
    <Card className="w-full max-w-md glass">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center">Konto erstellen</CardTitle>
        <CardDescription className="text-center">
          Geben Sie Ihre Daten ein, um loszulegen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-10 h-4 w-4 text-muted-foreground" />
              <Input
                label="Vorname"
                name="firstName"
                placeholder="Max"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                className="pl-10"
                autoComplete="given-name"
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-10 h-4 w-4 text-muted-foreground" />
              <Input
                label="Nachname"
                name="lastName"
                placeholder="Mustermann"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                className="pl-10"
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-10 h-4 w-4 text-muted-foreground" />
            <Input
              label="E-Mail"
              name="email"
              type="email"
              placeholder="max@beispiel.com"
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
              placeholder="Erstellen Sie ein sicheres Passwort"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              className="pl-10 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {formData.password && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Passwort-Anforderungen:</p>
              <div className="grid grid-cols-1 gap-1 text-xs">
                {[
                  'Mindestens 8 Zeichen',
                  'Kleinbuchstabe',
                  'Großbuchstabe', 
                  'Zahl',
                  'Sonderzeichen'
                ].map((requirement) => (
                  <div key={requirement} className="flex items-center gap-2">
                    <CheckCircle2 
                      className={`h-3 w-3 ${
                        passwordStrength.includes(requirement) 
                          ? 'text-green-500' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                    <span className={
                      passwordStrength.includes(requirement)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                    }>
                      {requirement}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            {loading ? 'Konto wird erstellt...' : 'Konto erstellen'}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Sie haben bereits ein Konto?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
            >
              Anmelden
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}