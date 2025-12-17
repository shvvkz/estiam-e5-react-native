import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API } from "@/services/api";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Trip } from "@/models/trip";

/**
 * AddPhotoModal
 *
 * Modal screen allowing the user to add a photo to an existing trip.
 *
 * The screen supports two modes:
 * - Fixed trip mode: when a tripId is provided via route params,
 *   the photo is directly attached to that trip.
 * - Selection mode: when no tripId is provided, the user must
 *   select a trip before adding a photo.
 *
 * The user can choose to add a photo either from the gallery
 * or directly from the camera.
 *
 * After a successful upload, the modal automatically closes
 * and returns to the previous screen.
 */
export default function AddPhotoModal() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const isFixedTrip = Boolean(tripId);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Trips loading effect
   *
   * Loads the list of available trips when the modal is opened
   * in selection mode (no fixed tripId provided).
   *
   * This effect is skipped entirely when the modal is opened
   * for a specific trip in order to avoid unnecessary API calls.
   */
  useEffect(() => {
    if (isFixedTrip) return;

    API.getTrips().then(data => {
      setTrips(Array.isArray(data) ? data : []);
    });
  }, [isFixedTrip]);

  /**
   * addPhoto
   *
   * Handles the complete workflow of adding a photo to a trip.
   *
   * Responsibilities:
   * - Determine the target trip (fixed via route params or selected by the user)
   * - Request the appropriate permissions (camera or media library)
   * - Launch the image picker
   * - Upload the selected image to the backend
   * - Attach the uploaded image URL to the target trip
   *
   * @param fromCamera - If true, opens the device camera.
   *                     If false, opens the media library.
   */
  const addPhoto = async (fromCamera: boolean) => {
    const targetTripId = isFixedTrip ? tripId : selectedTrip?.id;

    if (!targetTripId) {
      Alert.alert("Erreur", "Sélectionne un voyage");
      return;
    }

    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert("Permission refusée");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 1 });

    if (result.canceled) return;

    try {
      setLoading(true);

      const uri = result.assets[0].uri;
      const uploadedUrl = await API.uploadImage(uri);
      await API.addPhotoToTrip(targetTripId, uploadedUrl);

      Alert.alert("Succès", "Photo ajoutée", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Erreur", "Impossible d’ajouter la photo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Add Photo</Text>

      {!isFixedTrip && trips.length === 0 && (
        <Text style={styles.emptyText}>Aucun voyage disponible</Text>
      )}

      {!isFixedTrip &&
        trips.map(trip => (
          <TouchableOpacity
            key={trip.id}
            style={[
              styles.tripItem,
              selectedTrip?.id === trip.id && styles.selected,
            ]}
            onPress={() => setSelectedTrip(trip)}
          >
            <Text style={styles.tripTitle}>{trip.title}</Text>
          </TouchableOpacity>
        ))}

      <TouchableOpacity
        style={[styles.button, loading && styles.disabled]}
        onPress={() => addPhoto(false)}
        disabled={loading}
      >
        <Ionicons name="image-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>Galerie</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.disabled]}
        onPress={() => addPhoto(true)}
        disabled={loading}
      >
        <Ionicons name="camera-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>Caméra</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    color: '#6b7280',
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 16,
    color: '#6b7280',
  },
  tripItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
  },
  selected: {
    backgroundColor: '#ede9fe',
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
