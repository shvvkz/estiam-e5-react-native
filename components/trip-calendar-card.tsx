import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { IMAGES_SOURCES } from "@/app/(tabs)/index";

export default function TripCalendarCard({
  trip,
  onOpen,
}: {
  trip: any;
  onOpen: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onOpen}>
      <View style={styles.tripImageContainer}>
        <Image
          source={trip.image ? { uri: trip.image } : IMAGES_SOURCES.paris}
          style={styles.tripImage}
        />
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
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 3,
  },
  tripImageContainer: {
    height: 140,
  },
  tripImage: {
    width: "100%",
    height: "100%",
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
