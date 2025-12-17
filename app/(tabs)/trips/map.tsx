import { useCallback, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { API } from "@/services/api";
import TripMapCard from "@/components/trip-map-card";
import { Trip } from "@/models/trip";

/**
 * TripsMapScreen
 *
 * Displays all user trips on a world map using geographic coordinates.
 * Each trip that contains valid latitude and longitude data is represented
 * by a marker on the map.
 *
 * Responsibilities:
 * - Fetch the list of trips when the screen becomes focused
 * - Render map markers for trips that have valid location data
 * - Handle marker selection to preview a trip
 * - Display a contextual card for the selected trip
 * - Navigate to the trip detail screen when the user chooses to open a trip
 *
 * Navigation behavior:
 * - When opening a trip from this screen, a "from=map" parameter is passed
 *   to the trip detail screen in order to customize back navigation behavior.
 *
 * This screen acts as a visual exploration entry point for trips and complements
 * the list-based Trips screen.
 */
export default function TripsMapScreen() {
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  /**
   * Loads trips whenever the screen gains focus.
   *
   * Using useFocusEffect ensures that the map is refreshed
   * when navigating back from other screens (e.g. trip details),
   * keeping markers in sync with the latest data.
   */
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadTrips = async () => {
        const data = await API.getTrips();
        if (active) {
          setTrips(data);
        }
      };

      loadTrips();

      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace("/trips")} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: 20,
          longitude: 0,
          latitudeDelta: 100,
          longitudeDelta: 100,
        }}
      >
        {trips
          .filter(
            (trip) => trip.location?.lat && trip.location?.lng
          )
          .map((trip) => (
            <Marker
              key={trip.id}
              coordinate={{
                latitude: trip.location.lat,
                longitude: trip.location.lng,
              }}
              onPress={() => setSelectedTrip(trip)}
            />
          ))}
      </MapView>

      {selectedTrip && (
        <TripMapCard
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onOpen={() =>
            router.push({
              pathname: "/trips/[id]",
              params: { id: selectedTrip.id, from: "map" },
            })
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10
  },
});
