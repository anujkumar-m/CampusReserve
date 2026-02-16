import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import api from './api';
import { User, UserRole } from '@/types';

// Add console logging to debug
console.log('🔧 API Base URL:', import.meta.env.VITE_API_URL);

interface LoginResponse {
    success: boolean;
    token: string;
    user: User;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department?: string;
    clubName?: string;
}

export const authService = {
    // Login user (admin only - manual login)
    login: async (email: string, password: string): Promise<LoginResponse> => {
        console.log('🔐 authService.login called with:', { email, passwordLength: password.length });
        console.log('📡 Making request to:', '/auth/login');

        try {
            const response = await api.post('/auth/login', { email, password });
            console.log('✅ Login response:', response.data);

            if (response.data.success) {
                // Normalize: ensure id field exists (backend returns _id)
                if (response.data.user._id && !response.data.user.id) {
                    response.data.user.id = response.data.user._id;
                }
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error: any) {
            console.error('❌ Login error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            throw error;
        }
    },

    // Google Sign-In with Firebase
    loginWithGoogle: async (): Promise<LoginResponse> => {
        try {
            // Sign in with Google using Firebase
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;

            console.log('✅ Firebase Google sign-in successful:', firebaseUser.email);

            // Get Firebase ID token
            const idToken = await firebaseUser.getIdToken();

            // Send token to backend for verification and user creation
            const response = await api.post('/auth/google/verify', {
                idToken,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                googleId: firebaseUser.uid,
            });

            if (response.data.success) {
                // Normalize: ensure id field exists (backend returns _id)
                if (response.data.user._id && !response.data.user.id) {
                    response.data.user.id = response.data.user._id;
                }
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Google sign-in error:', error);
            throw error;
        }
    },

    // Register user
    register: async (data: RegisterData): Promise<LoginResponse> => {
        const response = await api.post('/auth/register', data);
        if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Get current user
    getCurrentUser: async (): Promise<User> => {
        const response = await api.get('/auth/me');
        const user = response.data.data;
        // Normalize: ensure id field exists (backend returns _id)
        if (user._id && !user.id) {
            user.id = user._id;
        }
        return user;
    },

    // Logout user
    logout: async () => {
        try {
            // Sign out from Firebase if user is signed in
            if (auth.currentUser) {
                await firebaseSignOut(auth);
            }
        } catch (error) {
            console.error('Firebase sign out error:', error);
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Get stored user
    getStoredUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Get stored token
    getToken: (): string | null => {
        return localStorage.getItem('token');
    },
};
