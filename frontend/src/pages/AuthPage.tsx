import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate, useLocation } from 'react-router-dom';
import { LoginForm } from '@/components/forms/LoginForm';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'login' | 'register' | 'forgot-password';

export function AuthPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [successMessage, setSuccessMessage] = useState('');

  const from = (location.state as any)?.from || '/dashboard';

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleLoginSuccess = () => {
    // Navigation will be handled by the AuthProvider
  };

  const handleRegisterSuccess = (emailVerificationToken?: string) => {
    if (emailVerificationToken) {
      setSuccessMessage(
        'Account created successfully! Please check your email to verify your account.'
      );
    }
  };

  const handleForgotPasswordSuccess = () => {
    setSuccessMessage(
      'Password reset instructions have been sent to your email.'
    );
    setMode('login');
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const formVariants = {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/50 to-primary/10 px-4">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-md space-y-6"
      >
        {/* Success message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-4 rounded-lg text-sm text-center"
            >
              {successMessage}
              <button
                onClick={() => setSuccessMessage('')}
                className="ml-2 text-green-600 hover:text-green-700 dark:text-green-300 dark:hover:text-green-200"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {mode === 'login' && (
              <LoginForm
                onSuccess={handleLoginSuccess}
                onSwitchToRegister={() => setMode('register')}
                onForgotPassword={() => setMode('forgot-password')}
              />
            )}

            {mode === 'register' && (
              <RegisterForm
                onSuccess={handleRegisterSuccess}
                onSwitchToLogin={() => setMode('login')}
              />
            )}

            {mode === 'forgot-password' && (
              <ForgotPasswordForm
                onSuccess={handleForgotPasswordSuccess}
                onBackToLogin={() => setMode('login')}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground"
        >
          <p>
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}