import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginForm, RegisterForm } from '@/types';
import { authService, AuthResponse, RegisterResponse } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginForm) => Promise<{ success: boolean; error?: string; requiresMFA?: boolean; tempToken?: string }>;
  register: (userData: RegisterForm) => Promise<{ success: boolean; error?: string; emailVerificationToken?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && authService.isAuthenticated();

  // Load user on mount with development mode protection
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      if (!isMounted) return; // Prevent race conditions during hot reload
      await initializeAuth();
    };
    
    initAuth();
    
    // Cleanup function to prevent effects after component unmount
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

  const initializeAuth = async () => {
    try {
      // Check if we have a token before trying to load user
      const token = authService.getAccessToken();
      if (token && authService.isAuthenticated()) {
        await loadUser();
      } else {
        // No token or invalid token, just set loading to false
        setUser(null);
        if (token) {
          // Clear invalid token
          authService.clearAuth();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      authService.clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || 'Failed to load user');
      }
    } catch (error: any) {
      console.error('Failed to load user:', error);
      authService.clearAuth();
      setUser(null);
      throw error;
    }
  };

  const login = async (credentials: LoginForm) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        if (response.requiresMFA) {
          // MFA required - return temp token but don't set user yet
          return { 
            success: true, 
            requiresMFA: true, 
            tempToken: response.data.tempToken 
          };
        } else {
          // Normal login - set user and return success
          setUser(response.data.user);
          return { success: true };
        }
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.error || error.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterForm) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return { 
          success: true, 
          emailVerificationToken: response.data.emailVerificationToken 
        };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.error || error.message || 'Registration failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await authService.updateProfile(data);
      
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Profile update failed' };
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: error.error || error.message || 'Profile update failed' 
      };
    }
  };

  const refreshUser = async () => {
    if (authService.isAuthenticated()) {
      await loadUser();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}