import { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, useFocusEffect } from "expo-router";

import { useAuth } from "@/contexts/auth-context";
import { API } from "@/services/api";
import { favoritesService } from "@/services/favorites";
import type { Trip } from "@/models/trip";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const [stats, setStats] = useState({
    trips: 0,
    photos: 0,
    favorites: 0,
  });

  const loadStats = async () => {
    try {
      const trips: Trip[] = await API.getTrips();
      const favorites = await favoritesService.getFavorites();

      setStats({
        trips: trips.length,
        photos: trips.reduce((sum, t) => sum + (t.photos?.length || 0), 0),
        favorites: favorites.length,
      });
    } catch (e) {
      console.warn("Erreur chargement stats profil", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const statsConfig = [
    {
      label: "Voyages",
      value: stats.trips,
      icon: "map-outline",
      colors: ["#a855f7", "#ec4899"] as const,
    },
    {
      label: "Photos",
      value: stats.photos,
      icon: "camera",
      colors: ["#3b82f6", "#06b6d4"] as const,
    },
    {
      label: "Favoris",
      value: stats.favorites,
      icon: "heart-outline",
      colors: ["#ef4444", "#f43f5e"] as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={["#a855f7", "#ec4899"]} style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>

          {/* Profile card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>😎</Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.name || "Utilisateur"}
                </Text>
                <Text style={styles.profileEmail}>
                  {user?.email || "—"}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              {statsConfig.map((stat, idx) => (
                <View key={idx} style={styles.statItem}>
                  <LinearGradient colors={stat.colors} style={styles.statIcon}>
                    <Ionicons name={stat.icon as any} size={24} color="white" />
                  </LinearGradient>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                "Déconnexion",
                "Êtes-vous sûr de vouloir vous déconnecter ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Déconnexion",
                    style: "destructive",
                    onPress: async () => {
                      await logout();
                      router.replace("/login");
                    },
                  },
                ]
              )
            }
          >
            <LinearGradient colors={["#ef4444", "#f43f5e"]} style={styles.menuItemIcon}>
              <Ionicons name="log-out-outline" size={24} color="white" />
            </LinearGradient>

            <View>
              <Text style={styles.menuItemTitle}>Déconnexion</Text>
              <Text style={styles.menuItemSubTitle}>
                Se déconnecter de votre compte
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb'
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 128,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 32
    },
    profileCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#faf5ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarEmoji: {
        fontSize: 40
    },
    profileInfo: {
        flex: 1
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4
    },
    profileEmail: {
        fontSize: 14,
        color: '#6b7280'
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12
    },
    statItem: {
        flex: 1,
        alignItems: 'center'
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280'
    },
    content: {
        padding: 24,
        marginTop: -80,
    },
    menuItem: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    menuItemIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight:'600',
        color: '#111827',
        marginBottom: 4
    },
    menuItemSubTitle: {
        fontSize: 16,
        color: '#6b7280'
    }


});