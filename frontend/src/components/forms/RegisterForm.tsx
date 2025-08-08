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
    if (password.length >= 8) requirements.push('At least 8 characters');
    if (/[a-z]/.test(password)) requirements.push('Lowercase letter');
    if (/[A-Z]/.test(password)) requirements.push('Uppercase letter');
    if (/\d/.test(password)) requirements.push('Number');
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) requirements.push('Special character');
    return requirements;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormType> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const strength = validatePassword(formData.password);
      if (strength.length < 5) {
        newErrors.password = 'Password does not meet all requirements';
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
      setSubmitError(result.error || 'Registration failed. Please try again.');
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
        <CardTitle className="text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Enter your details to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-10 h-4 w-4 text-muted-foreground" />
              <Input
                label="First name"
                name="firstName"
                placeholder="John"
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
                label="Last name"
                name="lastName"
                placeholder="Doe"
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
              label="Email"
              name="email"
              type="email"
              placeholder="john@example.com"
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
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
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
              <p className="text-xs text-muted-foreground">Password requirements:</p>
              <div className="grid grid-cols-1 gap-1 text-xs">
                {[
                  'At least 8 characters',
                  'Lowercase letter',
                  'Uppercase letter', 
                  'Number',
                  'Special character'
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
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}