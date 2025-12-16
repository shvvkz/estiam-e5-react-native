import { auth, LoginCredentials, RegisterData, User } from "@/services/auth";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<{ user: User, tokens: any }>;
    register: (data: RegisterData) => Promise<{ user: User, tokens: any }>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const checkAuth = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const state = await auth.getAuthState();
            setUser(state.user);
            setIsAuthenticated(state.isAuthenticated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Auth check failed');
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        try {
            setIsLoading(true);
            setError(null);
            const { user, tokens } = await auth.login(credentials);
            await new Promise(resolve => setTimeout(resolve, 100));
            const state = await auth.getAuthState();

            setUser(state.user);
            setIsAuthenticated(state.isAuthenticated);

            return { user, tokens };

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            setIsAuthenticated(false);
            setUser(null);
            throw err;
        } finally {
            setIsLoading(false);
        }

    }, []);

    const register = useCallback(async (data: RegisterData) => {
        try {
            setIsLoading(true);
            setError(null);
            const { user, tokens } = await auth.register(data);
            // Attendre un peu pour que SecureStore sauvegarde
            await new Promise(resolve => setTimeout(resolve, 100));
            // Vérifier l'état après sauvegarde
            const state = await auth.getAuthState();
            setUser(state.user);
            setIsAuthenticated(state.isAuthenticated);
            console.log('✅ [useAuth] Register completed, auth state:', state.isAuthenticated);
            return { user, tokens };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            setError(message);
            setIsAuthenticated(false);
            setUser(null);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            await auth.logout();
            setUser(null);
            setIsAuthenticated(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Logout failed';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshAuth = useCallback(async () => {
        await checkAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated,
                error,
                login,
                register,
                logout,
                refreshAuth
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}