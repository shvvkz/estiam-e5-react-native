import {
    auth,
    LoginCredentials,
    RegisterData,
    User,
    AuthTokens,
} from '@/services/auth';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

/**
 * AuthContextType
 *
 * Defines the shape of the authentication context.
 *
 * This interface describes all authentication-related data
 * and actions exposed to the application through the AuthContext.
 *
 * It centralizes user identity, authentication state,
 * loading indicators, and auth lifecycle methods.
 */
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<{ user: User; tokens: AuthTokens }>;
    register: (data: RegisterData) => Promise<{ user: User; tokens: AuthTokens }>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider
 *
 * Global authentication provider responsible for:
 * - Managing the authenticated user state
 * - Persisting and restoring authentication on app startup
 * - Exposing login, registration, logout, and refresh actions
 *
 * This provider must wrap the entire application
 * to allow access to authentication state via the useAuth hook.
 *
 * Navigation decisions based on authentication state
 * are intentionally handled outside of this provider.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkAuth = useCallback(async () => {
        try {
            setIsLoading(true);
            const state = await auth.getAuthState();
            setUser(state.user);
            setIsAuthenticated(state.isAuthenticated);
        } catch (err) {
            setUser(null);
            setIsAuthenticated(false);
            setError(err instanceof Error ? err.message : 'Auth error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = useCallback(async (credentials: LoginCredentials) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await auth.login(credentials);
            await checkAuth();
            return result;
        } catch (err) {
            setUser(null);
            setIsAuthenticated(false);
            setError(err instanceof Error ? err.message : 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [checkAuth]);

    const register = useCallback(async (data: RegisterData) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await auth.register(data);
            await checkAuth();
            return result;
        } catch (err) {
            setUser(null);
            setIsAuthenticated(false);
            setError(err instanceof Error ? err.message : 'Register failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [checkAuth]);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await auth.logout();
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshAuth = useCallback(async () => {
        await checkAuth();
    }, [checkAuth]);

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
                refreshAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth
 *
 * Public hook used to access authentication state and actions.
 *
 * Must be called within an AuthProvider.
 * Throws a runtime error if used outside of the provider scope.
 *
 * This hook is the only supported way for screens and components
 * to interact with authentication logic.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
