import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';


import { homeService } from '@/services/home';
import { Trip } from '@/models/trip';
import { HomeActivity } from '@/models/home-activity';
import { useAuth } from '@/contexts/auth-context';

export const IMAGES_SOURCES = {
  paris: require('@/assets/images/paris.jpeg'),
  tokyo: require('@/assets/images/tokyo.jpeg'),
  bali: require('@/assets/images/bali.jpeg'),
};

/**
 * HomeScreen
 *
 * Main dashboard screen of the application.
 * This screen provides a high-level overview of the user's travel activity
 * and acts as the primary entry point after authentication.
 *
 * Responsibilities:
 * - Fetch and display global statistics (trips, photos, countries)
 * - Display a list of upcoming trips
 * - Display recent user activities
 * - Provide quick navigation actions (add trip, add photo, explore trips)
 *
 * Data lifecycle:
 * - Data is refreshed every time the screen gains focus
 *   using useFocusEffect to ensure up-to-date information
 *
 * Navigation:
 * - Allows navigation to trip details
 * - Provides shortcuts to trips list, add-trip modal, add-photo modal
 * - Routes to the notifications screen
 *
 * This screen prioritizes fast access to key information
 * and recent user actions.
 */
export default function HomeScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    trips: 0,
    photos: 0,
    countries: 0,
  });

  const user = useAuth();
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);

  const [activities, setActivities] = useState<HomeActivity[]>([]);

  /**
  * loadHome
  *
  * Fetches and aggregates all data required for the Home screen.
  *
  * Responsibilities:
  * - Retrieve global statistics (trip count, photo count, country count)
  * - Retrieve upcoming trips
  * - Retrieve recent activity history
  *
  * Error handling:
  * - Displays a user-friendly error message if data loading fails
  * - Ensures loading state is always properly reset
  *
  * This function is intentionally called from useFocusEffect
  * to keep the Home screen data synchronized with user actions
  * performed elsewhere in the application.
  */
  const loadHome = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await homeService.getHomeData();

      setStats(data.stats);
      setUpcomingTrips(data.upcomingTrips);
      setActivities(data.activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load home');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadHome();
    }, [])
  );


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>
          Chargement...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40, color: 'red' }}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        {/* Header */}
        <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>Hello</Text>
              <Text style={styles.firstnameText}>{user.user?.name || "Utilisateur"}!</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => router.push('/notification')}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color="rgba(255, 255, 255, 0.8)"
              />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {[
              { label: 'Trips', value: stats.trips, icon: 'airplane-outline' },
              { label: 'Photos', value: stats.photos, icon: 'camera-outline' },
              { label: 'Countries', value: stats.countries, icon: 'globe-outline' },
            ].map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Ionicons name={stat.icon as keyof typeof Ionicons.glyphMap} color="#fff" style={styles.statIcon} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Upcoming trips */}
        <View style={styles.homeContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Trips</Text>
            <TouchableOpacity onPress={() => router.push('/trips')}>
              <Text style={styles.homeSeeAllBtn}>See All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {upcomingTrips.length === 0 && (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>
              No upcoming trips
            </Text>
          </View>
        )}

        {upcomingTrips.map((trip) => {

          const daysLeft = Math.max(
            0,
            Math.ceil(
              (new Date(trip.startDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
            )
          );

          return (
            <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={() => router.push(`/trips/${trip.id}`)}>
              <Image
                source={
                  trip.image
                    ? { uri: trip.image }
                    : IMAGES_SOURCES.paris
                }
                style={styles.tripImage}
              />
              <View style={styles.tripInfo}>
                <Text style={styles.tripTitle}>{trip.title}</Text>
                <View style={styles.tripDate}>
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  <Text style={styles.tripDateText}>
                    {new Date(trip.startDate).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}

                  </Text>
                </View>
                <View style={styles.tripBadge}>
                  <Text style={styles.tripBadgeText}>
                    In {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, paddingHorizontal: 24 }}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity onPress={() => router.push('/modal/add-trip')}>
              <LinearGradient
                colors={['#a855f7', '#ec4899']}
                style={styles.quickActionCard}
              >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.quickActionLabel}>New Trip</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/modal/add-photo')}>
              <LinearGradient
                colors={['#3b82f6', '#06b6d4']}
                style={styles.quickActionCard}
              >
                <Ionicons name="camera-outline" size={24} color="#fff" />
                <Text style={styles.quickActionLabel}>Add Photo</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/trips/map')}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.quickActionCard}
              >
                <Ionicons name="map-outline" size={24} color="#fff" />
                <Text style={styles.quickActionLabel}>Explore</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            {activities.length === 0 && (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>
                  No recent activity
                </Text>
              </View>
            )}

            {activities.map((activity, idx) => (
              <View style={styles.activityCard} key={idx}>
                <Ionicons
                  name={activity.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color="#6b7280"
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text style={styles.activityText}>{activity.text}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholder: {
    width: 40,
  },
  greetingText: { color: 'rgba(255,255,255,0.8)', fontSize: 24 },
  firstnameText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  homeContent: { padding: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  homeSeeAllBtn: { color: '#a855f7', fontWeight: 'bold' },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 12,
    marginHorizontal: 12,
    elevation: 2,
  },
  tripImage: { width: 80, height: 80, borderRadius: 12 },
  tripInfo: { flex: 1, marginLeft: 12 },
  tripTitle: { fontSize: 18, fontWeight: 'bold' },
  tripDate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripDateText: { color: '#6b7280' },
  tripBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tripBadgeText: { color: '#7c3aed', fontWeight: 'bold' },
  section: { marginBottom: 24 },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  quickActionCard: {
    width: 110,
    height: 110,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: { color: '#fff', fontWeight: '600' },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    marginTop: 8,
  },
  activityText: { color: '#111827' },
  activityTime: { color: '#9ca3af', fontSize: 12 },
  emptySection: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  emptySectionText: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
  },

});
