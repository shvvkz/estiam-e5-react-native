import { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";


import { API } from "@/services/api";
import TripMapCard from "@/components/trip-map-card";


export default function TripsMapScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

  useEffect(() => {
    API.getTrips().then(setTrips);
  }, []);

  return (
    <View style={styles.container}>
        <TouchableOpacity
            onPress={() => router.replace("/trips")}
            style={{ position: "absolute", top: 40, left: 20, zIndex: 10 }}
        >
            <Ionicons name="arrow-back" size={24} />
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
          .filter(t => t.location?.lat && t.location?.lng)
          .map(trip => (
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
});
