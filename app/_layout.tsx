import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOffline } from '@/hooks/use-offline';
import { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useAuth, AuthProvider } from '@/contexts/auth-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * RootLayoutContent
 *
 * Core layout component responsible for:
 * - Applying the global navigation theme (light / dark)
 * - Handling authentication-based routing guards
 * - Displaying offline and synchronization status banners
 * - Defining the main navigation stack
 *
 * Authentication flow:
 * - Redirects unauthenticated users to the login screen
 * - Prevents authenticated users from accessing the login screen
 *
 * Offline handling:
 * - Displays an offline banner when the device is disconnected
 * - Displays a synchronization banner when pending actions exist
 *
 * This component contains all runtime logic related to
 * navigation state and application connectivity.
 */
function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const { isAuthenticated, isLoading, refreshAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();


  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && segments[0] !== 'login') {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && segments[0] === 'login') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);


  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/*Banner Offline*/}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name='cloud-offline-outline' size={16} color='#fff' />
          <Text style={styles.bannerText}>
            Hors ligne {pendingCount > 0 && `• ${pendingCount} en attente`}
          </Text>
        </View>
      )}

      {/*Banner Sync */}

      {isOnline && pendingCount > 0 && (
        <TouchableOpacity>
          <Ionicons
            name={isSyncing ? "sync" : "sync-outline"}
            size={16}
            color="#fff"
          />
          <Text style={styles.bannerText}>
            {isSyncing
              ? 'Synchronisation...'
              : `Synchroniser ${pendingCount} action(s)`}
          </Text>
        </TouchableOpacity>
      )}

      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}



const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingTop: 50,
    gap: 8,
  },
  syncBanner: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingTop: 50,
    gap: 8,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});


export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );

}
