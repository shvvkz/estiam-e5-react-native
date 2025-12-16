/**
 * Configuration centralisée des variables d'environnement
 * 
 * Approche pro (Approach 2):
 * - Centralisée (une source de vérité)
 * - Typée (TypeScript IntelliSense)
 * - Avec fallbacks
 * - Scalable et maintenable
 * 
 * Recommandation Expo: https://docs.expo.dev/guides/environment-variables/
 */

export const config = {
  // Backend URLs
  mockBackendUrl: process.env.EXPO_PUBLIC_MOCK_BACKEND_URL || 'http://192.168.1.179:4000',
  jsonplaceholderUrl: process.env.EXPO_PUBLIC_JSONPLACEHOLDER_URL || 'https://jsonplaceholder.typicode.com',
  
  // Debug mode
  debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
} as const;

// Type pour l'autocomplétion
export type Config = typeof config;
