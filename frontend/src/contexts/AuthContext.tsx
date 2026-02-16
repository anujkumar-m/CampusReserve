import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      console.log('🔐 AuthContext: Initializing auth...');
      const token = authService.getToken();
      const storedUser = authService.getStoredUser();

      console.log('🔐 Token exists:', !!token);
      console.log('🔐 Stored user exists:', !!storedUser);

      if (token && storedUser) {
        console.log('🔐 Found token and user, verifying with backend...');
        try {
          // Verify token is still valid by fetching current user
          const currentUser = await authService.getCurrentUser();
          console.log('✅ Token verified, user authenticated:', currentUser.email);
          setUser(currentUser);
        } catch (error: any) {
          // Token is invalid, clear storage
          console.error('❌ Token verification failed:', error.response?.status, error.message);
          console.log('🧹 Clearing invalid token and user data');
          authService.logout();
          setUser(null);
        }
      } else {
        console.log('ℹ️ No token or user found, user not authenticated');
      }
      setIsLoading(false);
      console.log('🔐 AuthContext: Initialization complete');
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${response.user.name}!`,
      });
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const response = await authService.loginWithGoogle();
      setUser(response.user);
      toast({
        title: 'Login successful',
        description: `Welcome, ${response.user.name}!`,
      });
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.message || 'Google sign-in failed',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, isAuthenticated: !!user, isLoading }}>
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
