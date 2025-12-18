import { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";

import { API } from "@/services/api";
import { favoritesService } from "@/services/favorites";
import { IMAGES_SOURCES } from "@/app/(tabs)/index";
import { Trip } from "@/models/trip";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Easing } from "react-native";

const tabs = ["All", "Upcoming", "Past", "Favorites"] as const;
type Tab = (typeof tabs)[number];

/**
 * TripsScreen
 *
 * Displays the list of user trips with filtering and search capabilities.
 *
 * Features:
 * - Fetches trips from the API on screen focus
 * - Supports filtering by:
 *   - All
 *   - Upcoming
 *   - Past
 *   - Favorites
 * - Allows searching trips by title or destination
 * - Allows toggling favorites directly from the list
 *
 * Navigation:
 * - Opens trip details when selecting a trip
 * - Provides quick access to:
 *   - Map view
 *   - Add trip modal
 *
 * Data is refreshed using `useFocusEffect` to ensure consistency
 * after navigation or modal actions.
 */
export default function TripsScreen() {
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");

  /**
  * Loads trips and favorite IDs whenever the screen gains focus.
  *
  * Why:
  * - Ensures favorites and trip data stay in sync
  *   after navigating back from details, map, or modals.
  * - Prevents stale UI state.
  *
  * Implementation:
  * - Uses a mounted flag to avoid state updates
  *   if the component unmounts during async operations.
  */
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const load = async () => {
        try {
          const data = await API.getTrips();
          const favs = await favoritesService.getFavorites();

          if (!mounted) return;

          setTrips(data);
          setFavorites(favs);
        } catch (e) {
          console.error("Failed to load trips", e);
        }
      };

      load();
      return () => {
        mounted = false;
      };
    }, [])
  );

  /**
  * Toggles the favorite state of a trip
  * and updates local favorites state accordingly.
  */
  const toggleFavorite = async (tripId: string) => {
    const value = await favoritesService.toggleFavorite(tripId);
    setFavorites((prev) =>
      value ? [...prev, tripId] : prev.filter((id) => id !== tripId)
    );
  };

  /**
  * Computes the visible trips list based on:
  * - Selected tab (All / Upcoming / Past / Favorites)
  * - Search query (title + destination)
  *
  * Memoized to avoid unnecessary recalculations
  * when unrelated state changes.
  */
  const filteredTrips = useMemo(() => {
    const now = Date.now();

    return trips
      .filter((trip) => {
        if (selectedTab === "Upcoming") {
          return new Date(trip.startDate).getTime() > now;
        }
        if (selectedTab === "Past") {
          return new Date(trip.endDate).getTime() < now;
        }
        if (selectedTab === "Favorites") {
          return favorites.includes(trip.id);
        }
        return true;
      })
      .filter((trip) =>
        `${trip.title} ${trip.destination}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
  }, [trips, favorites, selectedTab, search]);

  const [fabOpen, setFabOpen] = useState(false);
  const fabAnim = useState(new Animated.Value(0))[0];

  const toggleFab = () => {
    Animated.timing(fabAnim, {
      toValue: fabOpen ? 0 : 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    setFabOpen(!fabOpen);
  };

  const mapFabStyle = {
    transform: [
      {
        translateY: fabAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -70],
        }),
      },
      {
        scale: fabAnim,
      },
    ],
    opacity: fabAnim,
  };

  const calendarFabStyle = {
    transform: [
      {
        translateY: fabAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -140],
        }),
      },
      {
        scale: fabAnim,
      },
    ],
    opacity: fabAnim,
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.placeholder}></Text>
          <Text style={styles.headerTitle}>My Trips</Text>
          <Text style={styles.placeholder}></Text>
        </View>
      </LinearGradient>
      <View style={styles.header}>
        {/* Search */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search trips"
              placeholderTextColor="#6b7280"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && styles.tabActive,
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Trips */}
        <View style={styles.tripsList}>
          {filteredTrips.map((trip) => {
            const isFavorite = favorites.includes(trip.id);

            return (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                onPress={() =>
                  router.push({
                    pathname: "/trips/[id]",
                    params: { id: trip.id, from: "trips" },
                  })
                }
              >
                {/* Image */}
                <View style={styles.tripImageContainer}>
                  <Image
                    source={
                      trip.image
                        ? { uri: trip.image }
                        : IMAGES_SOURCES.paris
                    }
                    style={styles.tripImage}
                  />

                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => toggleFavorite(trip.id)}
                  >
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={22}
                      color={isFavorite ? "#ef4444" : "white"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Info */}
                <View style={styles.tripInfo}>
                  <Text style={styles.tripTitle}>{trip.title}</Text>
                  <Text style={styles.tripDestination}>
                    {trip.destination}
                  </Text>

                  <Text style={styles.tripDate}>
                    {new Date(trip.startDate).toLocaleDateString()} →{" "}
                    {new Date(trip.endDate).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredTrips.length === 0 && (
            <Text style={styles.emptyText}>Aucun voyage</Text>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <Animated.View style={[styles.fabWrapper, calendarFabStyle]}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => {
              toggleFab();
              router.push("/trips/calendar");
            }}
          >
            <Ionicons name="calendar-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.fabWrapper, mapFabStyle]}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => {
              toggleFab();
              router.push("/trips/map");
            }}
          >
            <Ionicons name="map-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[styles.fabButton, styles.mainFab]}
          onPress={toggleFab}
          activeOpacity={0.9}
        >
          <Ionicons
            name={fabOpen ? "close" : "apps"}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },

  searchBarContainer: { flexDirection: "row" },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 16 },

  tabContainer: { paddingHorizontal: 24, paddingVertical: 16 },
  tabsContent: { gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
  },
  tabActive: { backgroundColor: "#a855f7" },
  tabText: { color: "#6b7280", fontWeight: "600" },
  tabTextActive: { color: "white" },

  tripsList: { paddingHorizontal: 24, gap: 16 },

  tripCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
  },
  tripImageContainer: { position: "relative", height: 180 },
  tripImage: { width: "100%", height: "100%" },

  heartBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    padding: 6,
  },

  tripInfo: { padding: 16 },
  tripTitle: { fontSize: 18, fontWeight: "bold" },
  tripDestination: { color: "#6b7280", marginVertical: 4 },
  tripDate: { color: "#374151", fontSize: 14 },

  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 40,
  },

  fabButton: {
    width: 56,
    height: 56,
    backgroundColor: "#a855f7",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  fabContainer: {
    position: "absolute",
    right: 24,
    bottom: 24,
    alignItems: "center",
  },

  fabWrapper: {
    position: "absolute",
    bottom: 0,
  },

  mainFab: {
    backgroundColor: "#a855f7",
  },

});
