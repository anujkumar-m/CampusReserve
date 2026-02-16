import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function GoogleCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const auth = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const userStr = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
            let errorMessage = 'Authentication failed';

            if (error === 'admin_must_use_manual_login') {
                errorMessage = 'Admin users must use manual login with email and password';
            } else if (error === 'auth_failed') {
                errorMessage = 'Google authentication failed. Please try again.';
            } else if (error === 'no_user') {
                errorMessage = 'Unable to retrieve user information';
            }

            toast({
                title: 'Login Failed',
                description: errorMessage,
                variant: 'destructive',
            });
            navigate('/login');
            return;
        }

        if (token && userStr) {
            try {
                const user = JSON.parse(decodeURIComponent(userStr));
                authService.handleGoogleCallback(token, user);

                toast({
                    title: 'Login successful',
                    description: `Welcome, ${user.name}!`,
                });

                navigate('/dashboard');
            } catch (error) {
                console.error('Error parsing user data:', error);
                toast({
                    title: 'Login Failed',
                    description: 'Error processing authentication data',
                    variant: 'destructive',
                });
                navigate('/login');
            }
        } else {
            toast({
                title: 'Login Failed',
                description: 'Missing authentication data',
                variant: 'destructive',
            });
            navigate('/login');
        }
    }, [searchParams, navigate, toast]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Completing sign in...</p>
            </div>
        </div>
    );
}
