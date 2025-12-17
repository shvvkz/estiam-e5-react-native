import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList } from "react-native";

import { API } from "@/services/api";
import { favoritesService } from "@/services/favorites";
import { Trip } from "@/models/trip";
const { width, height } = Dimensions.get("window");

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadTrip = async () => {
        try {
          setLoading(true);
          setError(null);

          const trips = await API.getTrips();
          const found = trips.find((t: Trip) => t.id === id);

          if (!found) throw new Error("Voyage introuvable");

          if (!active) return;

          setTrip(found);

          const fav = await favoritesService.isFavorite(found.id);
          setIsFavorite(fav);
        } catch (err) {
          if (active) {
            setError(err instanceof Error ? err.message : "Erreur chargement");
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      loadTrip();

      return () => {
        active = false;
      };
    }, [id])
  );


  const toggleFavorite = async () => {
    if (!trip) return;
    const value = await favoritesService.toggleFavorite(trip.id);
    setIsFavorite(value);
  };

  const { from } = useLocalSearchParams();

  const goBack = () => {
    if (from === "trips") {
      router.replace({ pathname: "/(tabs)/trips" });
    } else if (from === "map") {
      router.replace({ pathname: "/(tabs)/trips/map" });
    } else {
      router.replace({ pathname: "/" });
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#a855f7" />
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error ?? "Erreur inconnue"}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header + Cover */}
        <View style={styles.headerContainer}>
          <LinearGradient colors={["#a855f7", "#ec4899"]} style={styles.header}>
            <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>


            <TouchableOpacity
              onPress={toggleFavorite}
              style={styles.favoriteBtn}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={26}
                color={isFavorite ? "#ef4444" : "#fff"}
              />
            </TouchableOpacity>

            <Text style={styles.title}>{trip.title}</Text>
            <Text style={styles.subtitle}>{trip.destination}</Text>
          </LinearGradient>

          {trip.image && (
            <Image source={{ uri: trip.image }} style={styles.coverImage} />
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={18} color="#6b7280" />
            <Text style={styles.dateText}>
              {new Date(trip.startDate).toLocaleDateString()} →{" "}
              {new Date(trip.endDate).toLocaleDateString()}
            </Text>
          </View>

          {!!trip.description && (
            <Text style={styles.description}>{trip.description}</Text>
          )}

          {/* Photos header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/modal/add-photo",
                  params: { tripId: trip.id },
                })
              }
            >
              <Text style={styles.addPhoto}>+ Add photo</Text>
            </TouchableOpacity>
          </View>

          {/* Photos grid */}
          <View style={styles.photosGrid}>
            {(trip.photos ?? []).map((photo, idx) => (
              <TouchableOpacity
                key={`${photo}-${idx}`}
                onPress={() => {
                  setInitialIndex(idx);
                  setGalleryOpen(true);
                }}
              >
                <Image source={{ uri: photo }} style={styles.photo} />
              </TouchableOpacity>
            ))}

            {(trip.photos?.length ?? 0) === 0 && (
              <Text style={styles.emptyText}>Aucune photo</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Gallery Modal */}
      <Modal visible={galleryOpen} transparent animationType="fade">
        <View style={styles.galleryContainer}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setGalleryOpen(false)}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>

          <FlatList
            data={trip.photos ?? []}
            keyExtractor={(item, index) => `${item}-${index}`}
            horizontal
            pagingEnabled
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={styles.galleryItem}>
                <Image source={{ uri: item }} style={styles.galleryImage} />
              </View>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerContainer: {
    position: "relative",
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  backBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
  },
  favoriteBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 20,
    padding: 6,
  },

  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginTop: 40 },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  coverImage: { width: "100%", height: 220 },

  content: { padding: 20 },
  dateRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  dateText: { color: "#374151", fontSize: 14 },
  description: { fontSize: 14, color: "#111827", marginBottom: 16 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold" },
  addPhoto: { color: "#a855f7", fontWeight: "600" },

  photosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  photo: { width: 100, height: 100, borderRadius: 12 },
  emptyText: { color: "#9ca3af", fontSize: 14 },

  errorText: { color: "#ef4444", fontSize: 16, marginBottom: 12 },
  backText: { color: "#6366f1", fontWeight: "600" },

  galleryContainer: { flex: 1, backgroundColor: "black" },
  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  galleryItem: {
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
  },
  galleryImage: {
    width,
    height,
    resizeMode: "contain",
  },
});
