import { config } from '@/utils/env';
import * as SecureStore from 'expo-secure-store';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    roles: string[];
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData extends LoginCredentials {
    name: string;
}

export interface JWTPayload {
    exp: number;
    iat?: number;
    sub?: string;
    [key: string]: unknown;
}

const KEYS = {
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    USER_DATA: 'auth_user_data',
    TOKEN_EXPIRY: 'auth_token_expiry',
};

const log = __DEV__ ? console.log : () => {};
const warn = __DEV__ ? console.warn : () => {};

const secureStorage = {
    async set(key: string, value: string): Promise<void> {
        await SecureStore.setItemAsync(key, value);
    },
    async get(key: string): Promise<string | null> {
        return SecureStore.getItemAsync(key);
    },
    async remove(key: string): Promise<void> {
        await SecureStore.deleteItemAsync(key);
    },
};

/**
 * decodeJWT
 *
 * Decodes and validates a JSON Web Token payload.
 *
 * Behavior:
 * - Ensures the token format is valid
 * - Ensures the presence of an expiration claim
 * - Throws explicit errors on malformed tokens
 *
 * This function is intentionally strict to avoid
 * silently accepting invalid authentication states.
 */
export const decodeJWT = (token: string): JWTPayload => {
    if (!token) throw new Error('JWT missing');

    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');

    try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));

        if (typeof payload.exp !== 'number') {
            throw new Error('JWT exp missing');
        }

        return payload;
    } catch {
        throw new Error('Failed to decode JWT');
    }
};

/**
 * isTokenExpired
 *
 * Determines whether a JWT access token is expired or about to expire.
 *
 * A safety margin is applied to proactively refresh tokens
 * before actual expiration to avoid race conditions.
 *
 * Returns true if the token is invalid, malformed, or expired.
 */
export const isTokenExpired = (token: string): boolean => {
    try {
        const { exp } = decodeJWT(token);
        return Date.now() >= exp * 1000 - 60_000;
    } catch {
        return true;
    }
};

let refreshPromise: Promise<AuthTokens | null> | null = null;

/**
 * Auth Service
 *
 * Centralized authentication and session management service.
 *
 * Responsibilities:
 * - Handle login, registration, logout
 * - Persist authentication tokens securely
 * - Manage token expiration and refresh lifecycle
 * - Expose an authenticated fetch helper
 *
 * This service is designed to be stateless from the UI perspective
 * and acts as the single source of truth for authentication state.
 */
export const auth = {

    async saveTokens(tokens: AuthTokens): Promise<void> {
        await Promise.all([
            secureStorage.set(KEYS.ACCESS_TOKEN, tokens.accessToken),
            secureStorage.set(KEYS.REFRESH_TOKEN, tokens.refreshToken),
            secureStorage.set(KEYS.TOKEN_EXPIRY, tokens.expiresAt.toString()),
        ]);
    },

    async getTokens(): Promise<AuthTokens | null> {
        const [accessToken, refreshToken, expiresAt] = await Promise.all([
            secureStorage.get(KEYS.ACCESS_TOKEN),
            secureStorage.get(KEYS.REFRESH_TOKEN),
            secureStorage.get(KEYS.TOKEN_EXPIRY),
        ]);

        if (!accessToken || !refreshToken) return null;

        return {
            accessToken,
            refreshToken,
            expiresAt: expiresAt ? parseInt(expiresAt, 10) : 0,
        };
    },

    async clearTokens(): Promise<void> {
        await Promise.all([
            secureStorage.remove(KEYS.ACCESS_TOKEN),
            secureStorage.remove(KEYS.REFRESH_TOKEN),
            secureStorage.remove(KEYS.TOKEN_EXPIRY),
        ]);
    },

    async saveUser(user: User): Promise<void> {
        await secureStorage.set(KEYS.USER_DATA, JSON.stringify(user));
    },

    async getUser(): Promise<User | null> {
        const data = await secureStorage.get(KEYS.USER_DATA);
        return data ? JSON.parse(data) : null;
    },

    async clearUser(): Promise<void> {
        await secureStorage.remove(KEYS.USER_DATA);
    },

    async login(
        credentials: LoginCredentials
    ): Promise<{ user: User; tokens: AuthTokens }> {
        const response = await fetch(`${config.mockBackendUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || err.message || 'Login failed');
        }

        const data = await response.json();

        const tokens: AuthTokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken || data.accessToken,
            expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
        };

        await this.saveTokens(tokens);
        await this.saveUser(data.user);

        return { user: data.user, tokens };
    },

    async register(
        data: RegisterData
    ): Promise<{ user: User; tokens: AuthTokens }> {
        const response = await fetch(`${config.mockBackendUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || err.message || 'Register failed');
        }

        const res = await response.json();

        const tokens: AuthTokens = {
            accessToken: res.accessToken,
            refreshToken: res.refreshToken || res.accessToken,
            expiresAt: Date.now() + (res.expiresIn || 3600) * 1000,
        };

        await this.saveTokens(tokens);
        await this.saveUser(res.user);

        return { user: res.user, tokens };
    },

    async logout(): Promise<void> {
        try {
            const tokens = await this.getTokens();
            if (tokens) {
                await fetch(`${config.mockBackendUrl}/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${tokens.accessToken}` },
                });
            }
        } catch {
            warn('[AUTH] Logout API failed');
        }

        await Promise.all([this.clearTokens(), this.clearUser()]);
    },

    /**
     * refreshTokens
     *
     * Refreshes authentication tokens using the refresh token.
     *
     * Concurrency control:
     * - Ensures only one refresh request is executed at a time
     * - Subsequent calls reuse the same in-flight promise
     *
     * Returns null if refresh fails and clears local authentication state.
     */
    async refreshTokens(): Promise<AuthTokens | null> {
        if (refreshPromise) return refreshPromise;
        refreshPromise = this._doRefresh().catch(() => null);

        try {
            return await refreshPromise;
        } finally {
            refreshPromise = null;
        }
    },

    async _doRefresh(): Promise<AuthTokens> {
        const tokens = await this.getTokens();
        if (!tokens?.refreshToken) throw new Error('No refresh token');

        const response = await fetch(`${config.mockBackendUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });

        if (!response.ok) {
            await this.clearTokens();
            await this.clearUser();
            throw new Error('Refresh failed');
        }

        const data = await response.json();

        const newTokens: AuthTokens = {
            accessToken: data.accessToken || data.token,
            refreshToken: data.refreshToken || tokens.refreshToken,
            expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
        };

        await this.saveTokens(newTokens);
        return newTokens;
    },


    async getAuthState(): Promise<{
        user: User | null;
        tokens: AuthTokens | null;
        isAuthenticated: boolean;
    }> {
        try {
            const [user, tokens] = await Promise.all([
                this.getUser(),
                this.getTokens(),
            ]);

            if (!user || !tokens) {
                return { user: null, tokens: null, isAuthenticated: false };
            }

            if (isTokenExpired(tokens.accessToken)) {
                const refreshed = await this.refreshTokens();
                if (!refreshed) {
                    await this.clearTokens();
                    await this.clearUser();
                    return { user: null, tokens: null, isAuthenticated: false };
                }
                return { user, tokens: refreshed, isAuthenticated: true };
            }

            return { user, tokens, isAuthenticated: true };
        } catch {
            return { user: null, tokens: null, isAuthenticated: false };
        }
    },

    /**
     * fetch
     *
     * Authenticated wrapper around the native fetch API.
     *
     * Responsibilities:
     * - Automatically attach Authorization headers
     * - Refresh access tokens when expired
     * - Retry once on HTTP 401 responses
     *
     * Throws an error if authentication cannot be restored.
     */
    async fetch(url: string, options: RequestInit = {}): Promise<Response> {
        let tokens = await this.getTokens();
        if (!tokens) throw new Error('Not authenticated');

        if (isTokenExpired(tokens.accessToken)) {
            const refreshed = await this.refreshTokens();
            if (!refreshed) throw new Error('Session expired');
            tokens = refreshed;
        }

        let response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${tokens.accessToken}`,
            },
        });

        if (response.status === 401) {
            const refreshed = await this.refreshTokens();
            if (!refreshed) throw new Error('Session expired');

            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${refreshed.accessToken}`,
                },
            });
        }

        return response;
    },
};
