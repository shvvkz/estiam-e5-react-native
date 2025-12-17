import { useCallback, useMemo, useState } from "react";
import {
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { useRouter, useFocusEffect } from "expo-router";

import { API } from "@/services/api";
import TripCalendarCard from "@/components/trip-calendar-card";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Trip } from "@/models/trip";

/**
 * Maps trips by ISO date (YYYY-MM-DD)
 */
const mapTripsByDate = (trips: Trip[]) => {
  const map: Record<string, Trip[]> = {};

  trips.forEach((trip) => {
    let current = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    while (current <= end) {
      const dateKey = current.toISOString().split("T")[0];
      map[dateKey] = map[dateKey]
        ? [...map[dateKey], trip]
        : [trip];
      current.setDate(current.getDate() + 1);
    }
  });

  return map;
};

export default function TripsCalendarScreen() {
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadTrips = async () => {
        try {
          const data = await API.getTrips();
          if (active) {
            setTrips(Array.isArray(data) ? data : []);
          }
        } catch (e) {
          console.warn("Failed to load trips calendar", e);
        }
      };

      loadTrips();

      return () => {
        active = false;
      };
    }, [])
  );

  const tripsByDate = useMemo(
    () => mapTripsByDate(trips),
    [trips]
  );

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    Object.keys(tripsByDate).forEach((date) => {
      marks[date] = {
        marked: true,
        dotColor: "#7c3aed",
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: "#a855f7",
      };
    }

    return marks;
  }, [tripsByDate, selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#a855f7", "#ec4899"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.replace("/trips")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Trips Calendar</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <Calendar
        markingType="dot"
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        theme={{
          todayTextColor: "#7c3aed",
          arrowColor: "#7c3aed",
          monthTextColor: "#111827",
        }}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {!selectedDate && (
          <Text style={styles.empty}>
            Sélectionne une date pour voir les voyages
          </Text>
        )}

        {selectedDate &&
          tripsByDate[selectedDate]?.map((trip) => (
            <TripCalendarCard
              key={`${trip.id}-${selectedDate}`}
              trip={trip}
              onOpen={() => router.push({
                pathname: "/trips/[id]",
                params: { id: trip.id, from: "calendar" },
              })}
            />
          ))}

        {selectedDate && !tripsByDate[selectedDate] && (
          <Text style={styles.empty}>Aucun voyage ce jour</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  list: {
    padding: 16,
  },
  empty: {
    textAlign: "center",
    marginTop: 24,
    color: "#6b7280",
  },
});
