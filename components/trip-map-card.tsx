import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";

import { IMAGES_SOURCES } from "@/app/(tabs)/index";

export default function TripMapCard({
  trip,
  onClose,
  onOpen,
}: {
  trip: any;
  onClose: () => void;
  onOpen: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onOpen}>
      <View style={styles.tripImageContainer}>
        <Image
          source={trip.image ? { uri: trip.image } : IMAGES_SOURCES.paris}
          style={styles.tripImage}
        />

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.tripInfo}>
        <Text style={styles.tripTitle}>{trip.title}</Text>
        <Text style={styles.tripDestination}>{trip.destination}</Text>
        <Text style={styles.tripDate}>
          {new Date(trip.startDate).toLocaleDateString()} →{" "}
          {new Date(trip.endDate).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 6,
  },
  tripImageContainer: {
    height: 160,
    position: "relative",
  },
  tripImage: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 20,
  },
  tripInfo: {
    padding: 16,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  tripDestination: {
    color: "#6b7280",
    marginTop: 2,
  },
  tripDate: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 13,
  },
});
