import { config } from '@/utils/env';
import * as SecureStore from 'expo-secure-store'
import { use } from 'react';

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
    password: string
}

export interface RegisterData extends LoginCredentials {
    name: string
}

const KEYS = {
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    USER_DATA: 'auth_user_data',
    TOKEN_EXPIRY: 'auth_token_expiry'
}

const secureStorage = {
    async set(key: string, value: string): Promise<void> {
        await SecureStore.setItemAsync(key, value);
    },
    async get(key: string): Promise<string | null> {
        return SecureStore.getItemAsync(key);
    },
    async remove(key: string): Promise<void> {
        await SecureStore.deleteItemAsync(key);
    }
}


export const decodeJWT = (token: string): any => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
};

export const isTokenExpired = (token: string): boolean => {
    if (!token || typeof token !== 'string') {
        return true;
    }

    const decoded = decodeJWT(token);

    if (!decoded) {
        return true;
    }

    if (!decoded.exp) {
        return true;
    }

    const isExpired = Date.now() >= decoded.exp * 1000 - 60000; // 60s margin
    if (isExpired) {
        console.log('[AUTH] Token expired', {
            exp: decoded.exp,
            expDate: new Date(decoded.exp * 1000).toISOString(),
            now: new Date().toISOString()
        })
    }
    return isExpired;
}

let refreshPromise: Promise<AuthTokens | null> | null = null;


// Auth service 
export const auth = {
    async saveTokens(tokens: AuthTokens): Promise<void> {
        await Promise.all([
            secureStorage.set(KEYS.ACCESS_TOKEN, tokens.accessToken),
            secureStorage.set(KEYS.REFRESH_TOKEN, tokens.refreshToken),
            secureStorage.set(KEYS.TOKEN_EXPIRY, tokens.expiresAt.toString()),
        ])
    },
    async getTokens(): Promise<AuthTokens | null> {
        const [accessToken, refreshToken, expiresAt] = await Promise.all([
            secureStorage.get(KEYS.ACCESS_TOKEN),
            secureStorage.get(KEYS.REFRESH_TOKEN),
            secureStorage.get(KEYS.TOKEN_EXPIRY)
        ]);

        console.log('[AUTH] Getting tokens :', {
            accessToken: accessToken,
            hasAccessToken: !!accessToken,
            hasRefreshtoken: !!refreshToken,
            expiresAt: expiresAt ? new Date(parseInt(expiresAt, 10)).toISOString() : 'none'
        })

        if (!accessToken || !refreshToken) {
            console.log('[AUTH] Missing tokens')
            return null;
        }


        if (accessToken === 'SIMULATOR_MOCK_TOKEN' || accessToken.startsWith('mock-')) {
            console.log('[AUTH] Found mock/invalid token, clearing...');
            await this.clearTokens();
            return null;
        }


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
            secureStorage.remove(KEYS.TOKEN_EXPIRY)
        ]);
    },

    // User

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


    // Auth operations

    async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
        const url = `${config.mockBackendUrl}/auth/login`;

        try {

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            console.log('Response status: ', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.json().catch(() => {
                    return {};
                });

                const errorMessage = errorData.error || errorData.message || `Login failed (${response.status})`;

                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (!data.accessToken || !data.user) {
                throw new Error('Invalid response from server');
            }

            const tokens: AuthTokens = {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken || data.accessToken,
                expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
            };

            const user: User = data.user;

            await this.saveTokens(tokens);
            await this.saveUser(user);

            return {
                user,
                tokens
            };

        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Network error: could not connect to server');
        }
    },
    async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
        const url = `${config.mockBackendUrl}/auth/register`;
        try {

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch((err) => {
                    console.error('❌ [AUTH] Failed to parse error response:', err);
                    return {};
                }); const errorMessage = errorData.error || errorData.message || `Registration failed (${response.status})`;
                throw new Error(errorMessage);
            }

            const responseData = await response.json();
            if (!responseData.accessToken || !responseData.user) {
                console.error('❌ [AUTH] Invalid response structure:', responseData);
                throw new Error('Invalid response from server');
            }

            const tokens: AuthTokens = {
                accessToken: responseData.accessToken,
                refreshToken: responseData.refreshToken || responseData.accessToken,
                expiresAt: Date.now() + (responseData.expiresIn || 3600) * 1000,
            };

            const user: User = responseData.user;

            await this.saveTokens(tokens);
            await this.saveUser(user);
            console.log('💾 [AUTH] Tokens and user saved successfully');

            return { user, tokens };


        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('❌ [AUTH] Network error - Backend might be down or URL incorrect');
                throw new Error(`Cannot connect to server at ${url}. Make sure the backend is running.`);
            }
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Network error: Could not connect to server');
        }

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
        } catch (error) {
            console.warn('Logout API Failed');
        }

        await Promise.all([this.clearTokens, this.clearUser()]);

    },
    async refreshTokens(): Promise<AuthTokens | null> {
        if (refreshPromise) return refreshPromise;
        refreshPromise = this._doRefresh();

        try {
            return await refreshPromise;
        } finally {
            refreshPromise = null;
        }
    },
    async _doRefresh(): Promise<AuthTokens | null> {

        const tokens = await this.getTokens();

        if (!tokens?.refreshToken) return null;
        try {
            const response = await fetch(`${config.mockBackendUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: tokens.refreshToken }),
            });

            if (!response.ok) {
                await this.logout();
                return null;
            }

            const data = await response.json();

            const newTokens: AuthTokens = {
                accessToken: data.accessToken || data.token,
                refreshToken: data.refreshToken || tokens.refreshToken,
                expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
            }

            await this.saveTokens(newTokens);
            return newTokens;

        } catch (error) {
            return null;
        }
    },
    async getAuthState(): Promise<{ user: User | null; tokens: AuthTokens | null; isAuthenticated: boolean }> {

        try {
            const [user, tokens] = await Promise.all([this.getUser(), this.getTokens()]);

            if (!user || !tokens || !tokens.accessToken) {
                return { user: null, tokens: null, isAuthenticated: false };
            }

            const expired = isTokenExpired(tokens.accessToken);

            if (expired) {
                const newTokens = await this.refreshTokens();
                if (!newTokens) {
                    await this.clearTokens();
                    await this.clearUser();
                    return { user: null, tokens: null, isAuthenticated: false };
                }

                return { user, tokens: newTokens, isAuthenticated: true };

            }

            return { user, tokens, isAuthenticated: true };

        } catch (error) {
            return { user: null, tokens: null, isAuthenticated: false };

        }
    },
    async isAuthenticated(): Promise<boolean> {
        const tokens = await this.getTokens();
        if (!tokens || !tokens.accessToken) {
            return false;
        }

        if (isTokenExpired(tokens.accessToken)) {
            const newTokens = await this.refreshTokens();
            if (!newTokens) {
                await this.clearTokens();
                await this.clearUser();
                return false;
            }
            return true;
        }

        return true;
    },

    async fetch(url: string, options: RequestInit = {}): Promise<Response> {
        let tokens = await this.getTokens();
        if (!tokens) throw new Error('Not authenticated');

        if (isTokenExpired(tokens.accessToken)) {
            const refreshed = await this.refreshTokens();
            if (!refreshed) {
                await this.clearTokens();
                await this.clearUser();
                throw new Error('Session expired');
            }
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
            if (!refreshed) {
                await this.clearTokens();
                await this.clearUser();
                throw new Error('Session expired');
            }

            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${refreshed.accessToken}`,
                },
            });
        }

        return response;
    }

}